const Drive = require("../models/Drive");
const User = require("../models/User");
const Application = require("../models/Application");
const { escapeRegex, httpError, toList } = require("../utils/helpers");
const { checkEligibility } = require("../utils/eligibility");

const COMPANY_FIELDS = "name email company";

const toEndOfDay = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T23:59:59`) : new Date(v));

const clean = (b) => {
  const o = {};
  for (const k of ["title", "description", "jobType", "location"]) if (b[k] !== undefined) o[k] = String(b[k]).trim();
  for (const k of ["ctc", "openings", "minCgpa"]) if (b[k] !== undefined && b[k] !== "") o[k] = Number(b[k]);
  for (const k of ["departments", "skills"]) if (b[k] !== undefined) o[k] = toList(b[k]);
  if (b.deadline) o.deadline = toEndOfDay(b.deadline);
  if (b.driveDate) o.driveDate = new Date(b.driveDate);
  return o;
};

const sorts = { latest: { createdAt: -1 }, ctc: { ctc: -1 }, deadline: { deadline: 1 } };

exports.list = async (req, res) => {
  const { q, status, jobType, minCtc, sort } = req.query;
  const role = req.user.role;
  const filter = {};
  const and = [];

  if (role === "student") {
    filter.status = "approved";
    filter.deadline = { $gte: new Date() };
  } else {
    if (role === "company") filter.company = req.user._id;
    if (status) filter.status = status;
  }
  if (jobType) filter.jobType = jobType;
  if (minCtc) filter.ctc = { $gte: Number(minCtc) };

  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    const companyIds = await User.find({ role: "company", "company.companyName": rx }).distinct("_id");
    and.push({ $or: [{ title: rx }, { location: rx }, { skills: rx }, { company: { $in: companyIds } }] });
  }
  if (and.length) filter.$and = and;

  const drives = await Drive.find(filter)
    .populate("company", COMPANY_FIELDS)
    .sort(sorts[sort] || sorts.latest)
    .lean();
  const ids = drives.map((d) => d._id);

  if (role === "student") {
    const mine = await Application.find({ student: req.user._id, drive: { $in: ids } }).select("drive status").lean();
    const byDrive = Object.fromEntries(mine.map((a) => [String(a.drive), a.status]));
    drives.forEach((d) => {
      d.applicationStatus = byDrive[String(d._id)] || null;
      d.eligibility = checkEligibility(req.user, d);
    });
  } else {
    const counts = await Application.aggregate([
      { $match: { drive: { $in: ids } } },
      { $group: { _id: "$drive", count: { $sum: 1 } } },
    ]);
    const byDrive = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    drives.forEach((d) => (d.applicants = byDrive[String(d._id)] || 0));
  }
  res.json({ drives });
};

exports.getOne = async (req, res) => {
  const drive = await Drive.findById(req.params.id).populate("company", COMPANY_FIELDS).lean();
  if (!drive) throw httpError(404, "Drive not found");
  const { role, _id } = req.user;

  if (role === "company" && String(drive.company._id) !== String(_id)) throw httpError(403, "This drive belongs to another company");
  if (role === "student") {
    if (drive.status !== "approved") throw httpError(404, "Drive not found");
    const app = await Application.findOne({ drive: drive._id, student: _id }).select("status").lean();
    drive.applicationStatus = app ? app.status : null;
    drive.eligibility = checkEligibility(req.user, drive);
  } else {
    drive.applicants = await Application.countDocuments({ drive: drive._id });
  }
  res.json({ drive });
};

exports.create = async (req, res) => {
  const data = clean(req.body);
  if (!data.deadline || data.deadline < new Date()) throw httpError(400, "Choose a deadline in the future");
  const drive = await Drive.create({ ...data, company: req.user._id, status: "pending" });
  res.status(201).json({ drive });
};

exports.update = async (req, res) => {
  const drive = await Drive.findById(req.params.id);
  if (!drive) throw httpError(404, "Drive not found");
  if (String(drive.company) !== String(req.user._id)) throw httpError(403, "This drive belongs to another company");
  Object.assign(drive, clean(req.body));
  if (drive.status === "rejected") {
    drive.status = "pending"; // resubmitted for approval
    drive.adminRemark = undefined;
  }
  await drive.save();
  res.json({ drive });
};

exports.setStatus = async (req, res) => {
  const { status, remark } = req.body;
  const drive = await Drive.findById(req.params.id);
  if (!drive) throw httpError(404, "Drive not found");

  if (req.user.role === "admin") {
    if (!["approved", "rejected", "closed"].includes(status)) throw httpError(400, "Invalid status");
    drive.status = status;
    drive.adminRemark = status === "rejected" ? remark || "Rejected by placement officer" : undefined;
  } else {
    if (String(drive.company) !== String(req.user._id)) throw httpError(403, "This drive belongs to another company");
    if (status !== "closed") throw httpError(400, "Companies can only close a drive");
    drive.status = "closed";
  }
  await drive.save();
  res.json({ drive });
};

exports.remove = async (req, res) => {
  const drive = await Drive.findById(req.params.id);
  if (!drive) throw httpError(404, "Drive not found");
  if (req.user.role === "company" && String(drive.company) !== String(req.user._id)) {
    throw httpError(403, "This drive belongs to another company");
  }
  await Application.deleteMany({ drive: drive._id });
  await drive.deleteOne();
  res.json({ message: "Drive deleted" });
};
