const User = require("../models/User");
const Drive = require("../models/Drive");
const Application = require("../models/Application");
const { escapeRegex, httpError } = require("../utils/helpers");
const { removeFile } = require("./profileController");

exports.listUsers = async (req, res) => {
  const { role, status, q, department } = req.query;
  if (!["student", "company"].includes(role)) throw httpError(400, "role must be student or company");
  const filter = { role };
  if (status) filter.status = status;
  if (department && role === "student") filter["student.department"] = department;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: rx }, { email: rx }, { "student.rollNo": rx }, { "company.companyName": rx }];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).lean();

  if (role === "student") {
    const hires = await Application.find({ status: "selected", student: { $in: users.map((u) => u._id) } })
      .populate("company", "company")
      .lean();
    const placed = {};
    hires.forEach((h) => (placed[String(h.student)] = h.company && h.company.company && h.company.company.companyName));
    users.forEach((u) => (u.placedAt = placed[String(u._id)] || null));
  } else {
    const counts = await Drive.aggregate([{ $group: { _id: "$company", count: { $sum: 1 } } }]);
    const byCompany = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    users.forEach((u) => (u.driveCount = byCompany[String(u._id)] || 0));
  }
  res.json({ users });
};

exports.setUserStatus = async (req, res) => {
  const { status } = req.body;
  const user = await User.findById(req.params.id);
  if (!user || user.role === "admin") throw httpError(404, "User not found");
  const allowed = user.role === "company" ? ["pending", "approved", "rejected", "blocked"] : ["approved", "blocked"];
  if (!allowed.includes(status)) throw httpError(400, "Invalid status for this user");
  user.status = status;
  await user.save();
  res.json({ user });
};

exports.deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role === "admin") throw httpError(404, "User not found");
  if (user.role === "student") {
    removeFile(user.student.resume && user.student.resume.url);
    await Application.deleteMany({ student: user._id });
  } else {
    await Application.deleteMany({ company: user._id });
    await Drive.deleteMany({ company: user._id });
  }
  await user.deleteOne();
  res.json({ message: "User deleted" });
};

exports.report = async (req, res) => {
  const hires = await Application.find({ status: "selected" })
    .populate("student", "name email student")
    .populate("company", "company")
    .populate("drive", "title ctc")
    .sort({ updatedAt: -1 })
    .lean();

  const placements = hires
    .filter((h) => h.student && h.drive)
    .map((h) => ({
      name: h.student.name,
      email: h.student.email,
      rollNo: h.student.student.rollNo,
      department: h.student.student.department,
      cgpa: h.student.student.cgpa,
      company: h.company && h.company.company ? h.company.company.companyName : "-",
      role: h.drive.title,
      ctc: h.drive.ctc,
    }));

  const students = await User.find({ role: "student" }).select("student.department").lean();
  const placedSet = new Set(hires.filter((h) => h.student).map((h) => String(h.student._id)));
  const deptMap = {};
  students.forEach((s) => {
    const d = (s.student && s.student.department) || "Other";
    deptMap[d] = deptMap[d] || { department: d, students: 0, placed: 0 };
    deptMap[d].students += 1;
    if (placedSet.has(String(s._id))) deptMap[d].placed += 1;
  });
  const departments = Object.values(deptMap).map((d) => ({
    ...d,
    rate: d.students ? Math.round((d.placed / d.students) * 100) : 0,
  }));

  const companyMap = {};
  placements.forEach((p) => {
    const c = (companyMap[p.company] = companyMap[p.company] || { company: p.company, hires: 0, total: 0 });
    c.hires += 1;
    c.total += p.ctc;
  });
  const companies = Object.values(companyMap).map((c) => ({ company: c.company, hires: c.hires, avgCtc: +(c.total / c.hires).toFixed(2) }));

  const ctcs = placements.map((p) => p.ctc);
  const summary = {
    placed: placedSet.size,
    totalStudents: students.length,
    highestCtc: ctcs.length ? Math.max(...ctcs) : 0,
    averageCtc: ctcs.length ? +(ctcs.reduce((a, b) => a + b, 0) / ctcs.length).toFixed(2) : 0,
  };
  res.json({ summary, departments, companies, placements });
};
