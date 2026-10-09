const Application = require("../models/Application");
const Drive = require("../models/Drive");
const { httpError } = require("../utils/helpers");
const { checkEligibility } = require("../utils/eligibility");

const STATUSES = ["shortlisted", "interview", "selected", "rejected"];

exports.apply = async (req, res) => {
  const drive = await Drive.findById(req.params.driveId);
  if (!drive || drive.status !== "approved") throw httpError(404, "This drive is not open for applications");
  if (await Application.exists({ drive: drive._id, student: req.user._id })) {
    throw httpError(409, "You have already applied to this drive");
  }
  const { eligible, reasons } = checkEligibility(req.user, drive);
  if (!eligible) throw httpError(400, reasons[0]);

  const application = await Application.create({
    drive: drive._id,
    student: req.user._id,
    company: drive.company,
    coverNote: req.body.coverNote,
    timeline: [{ status: "applied", note: "Application submitted" }],
  });
  res.status(201).json({ application });
};

exports.mine = async (req, res) => {
  const applications = await Application.find({ student: req.user._id })
    .populate("drive", "title ctc jobType location deadline driveDate")
    .populate("company", "name company")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ applications });
};

exports.received = async (req, res) => {
  const { drive, status, q, department } = req.query;
  const filter = req.user.role === "company" ? { company: req.user._id } : {};
  if (drive) filter.drive = drive;
  if (status) filter.status = status;

  let applications = await Application.find(filter)
    .populate("student", "name email phone student")
    .populate("drive", "title ctc")
    .populate("company", "name company")
    .sort({ createdAt: -1 })
    .lean();

  if (department) applications = applications.filter((a) => a.student && a.student.student.department === department);
  if (q) {
    const needle = q.toLowerCase();
    applications = applications.filter((a) => {
      const s = a.student;
      if (!s) return false;
      const hay = [s.name, s.email, s.student.rollNo, ...(s.student.skills || [])].join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }
  res.json({ applications });
};

exports.updateStatus = async (req, res) => {
  const { status, note, interviewDate } = req.body;
  if (!STATUSES.includes(status)) throw httpError(400, "Invalid status");
  const application = await Application.findById(req.params.id);
  if (!application) throw httpError(404, "Application not found");
  if (req.user.role === "company" && String(application.company) !== String(req.user._id)) {
    throw httpError(403, "This applicant belongs to another company");
  }
  application.status = status;
  if (interviewDate) application.interviewDate = new Date(interviewDate);
  application.timeline.push({ status, note });
  await application.save();
  res.json({ application });
};

exports.withdraw = async (req, res) => {
  const application = await Application.findOne({ _id: req.params.id, student: req.user._id });
  if (!application) throw httpError(404, "Application not found");
  if (application.status !== "applied") throw httpError(400, "You can only withdraw before the company reviews your application");
  await application.deleteOne();
  res.json({ message: "Application withdrawn" });
};
