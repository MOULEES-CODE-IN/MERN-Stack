const User = require("../models/User");
const Drive = require("../models/Drive");
const Application = require("../models/Application");
const { checkEligibility } = require("../utils/eligibility");

const STATUS_ORDER = ["applied", "shortlisted", "interview", "selected", "rejected"];
const statusChart = (apps) => STATUS_ORDER.map((s) => ({ name: s, value: apps.filter((a) => a.status === s).length }));

const studentStats = async (user) => {
  const apps = await Application.find({ student: user._id })
    .populate("drive", "title ctc")
    .populate("company", "name company")
    .sort({ createdAt: -1 })
    .lean();
  const open = await Drive.find({ status: "approved", deadline: { $gte: new Date() } })
    .populate("company", "name company")
    .sort({ deadline: 1 })
    .lean();
  const applied = new Set(apps.map((a) => a.drive && String(a.drive._id)));
  const eligible = open.filter((d) => checkEligibility(user, d).eligible);
  const recommended = eligible.filter((d) => !applied.has(String(d._id))).slice(0, 4);
  const count = (s) => apps.filter((a) => a.status === s).length;

  return {
    stats: {
      applied: apps.length,
      shortlisted: count("shortlisted"),
      interview: count("interview"),
      selected: count("selected"),
      rejected: count("rejected"),
      openDrives: open.length,
      eligibleDrives: eligible.length,
    },
    chart: statusChart(apps),
    recent: apps.slice(0, 5),
    recommended: recommended.map((d) => ({ ...d, eligibility: { eligible: true, reasons: [] } })),
  };
};

const companyStats = async (user) => {
  const drives = await Drive.find({ company: user._id }).lean();
  const apps = await Application.find({ company: user._id })
    .populate("student", "name student")
    .populate("drive", "title")
    .sort({ createdAt: -1 })
    .lean();
  const count = (s) => apps.filter((a) => a.status === s).length;
  const now = new Date();

  return {
    stats: {
      totalDrives: drives.length,
      activeDrives: drives.filter((d) => d.status === "approved" && d.deadline >= now).length,
      pendingDrives: drives.filter((d) => d.status === "pending").length,
      applicants: apps.length,
      shortlisted: count("shortlisted"),
      interview: count("interview"),
      selected: count("selected"),
    },
    chart: statusChart(apps),
    perDrive: drives.map((d) => ({
      name: d.title.length > 18 ? `${d.title.slice(0, 17)}…` : d.title,
      applicants: apps.filter((a) => a.drive && String(a.drive._id) === String(d._id)).length,
    })),
    recent: apps.slice(0, 6),
  };
};

const adminStats = async () => {
  const [students, companies, pendingCompanyCount, activeDrives, pendingDriveCount, apps, pendingCompanies, pendingDrives] =
    await Promise.all([
      User.find({ role: "student" }).select("student.department").lean(),
      User.countDocuments({ role: "company", status: "approved" }),
      User.countDocuments({ role: "company", status: "pending" }),
      Drive.countDocuments({ status: "approved", deadline: { $gte: new Date() } }),
      Drive.countDocuments({ status: "pending" }),
      Application.find().populate("student", "name student").populate("company", "company name").sort({ createdAt: -1 }).lean(),
      User.find({ role: "company", status: "pending" }).select("name email company createdAt").sort({ createdAt: -1 }).limit(5).lean(),
      Drive.find({ status: "pending" }).populate("company", "name company").sort({ createdAt: -1 }).limit(5).lean(),
    ]);

  const selected = apps.filter((a) => a.status === "selected" && a.student);
  const placedIds = new Set(selected.map((a) => String(a.student._id)));

  const deptMap = {};
  students.forEach((s) => {
    const d = (s.student && s.student.department) || "Other";
    deptMap[d] = deptMap[d] || { name: d, students: 0, placed: 0 };
    deptMap[d].students += 1;
    if (placedIds.has(String(s._id))) deptMap[d].placed += 1;
  });

  const companyMap = {};
  selected.forEach((a) => {
    const n = (a.company && a.company.company && a.company.company.companyName) || "Unknown";
    companyMap[n] = (companyMap[n] || 0) + 1;
  });

  return {
    stats: {
      students: students.length,
      companies,
      pendingCompanies: pendingCompanyCount,
      activeDrives,
      pendingDrives: pendingDriveCount,
      applications: apps.length,
      placed: placedIds.size,
      placementRate: students.length ? Math.round((placedIds.size / students.length) * 100) : 0,
    },
    chart: statusChart(apps),
    departments: Object.values(deptMap),
    topCompanies: Object.entries(companyMap)
      .map(([name, hires]) => ({ name, hires }))
      .sort((a, b) => b.hires - a.hires)
      .slice(0, 5),
    pendingCompanies,
    pendingDrives,
  };
};

exports.get = async (req, res) => {
  const { role } = req.user;
  const data = role === "student" ? await studentStats(req.user) : role === "company" ? await companyStats(req.user) : await adminStats();
  res.json(data);
};
