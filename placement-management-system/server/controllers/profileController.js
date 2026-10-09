const fs = require("fs");
const path = require("path");
const { httpError, toList } = require("../utils/helpers");

const FIELDS = {
  student: ["rollNo", "department", "batch", "cgpa", "backlogs", "skills", "about", "linkedin", "github"],
  company: ["companyName", "website", "industry", "location", "size", "about"],
};
const NUMERIC = ["cgpa", "batch", "backlogs"];

const removeFile = (url) => {
  if (!url || !url.startsWith("/uploads/")) return;
  fs.unlink(path.join(__dirname, "..", url), () => {});
};

exports.update = async (req, res) => {
  const user = req.user;
  const { name, phone } = req.body;
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;

  const source = req.body[user.role] || {};
  for (const field of FIELDS[user.role] || []) {
    if (source[field] === undefined) continue;
    let value = source[field];
    if (field === "skills") value = toList(value);
    if (NUMERIC.includes(field)) value = value === "" || value === null ? undefined : Number(value);
    user[user.role][field] = value;
  }
  await user.save();
  res.json({ user });
};

exports.uploadResume = async (req, res) => {
  if (!req.file) throw httpError(400, "Choose a PDF file to upload");
  removeFile(req.user.student.resume && req.user.student.resume.url);
  req.user.student.resume = {
    url: `/uploads/resumes/${req.file.filename}`,
    originalName: req.file.originalname,
    uploadedAt: new Date(),
  };
  await req.user.save();
  res.json({ user: req.user });
};

exports.deleteResume = async (req, res) => {
  removeFile(req.user.student.resume && req.user.student.resume.url);
  req.user.student.resume = undefined;
  await req.user.save();
  res.json({ user: req.user });
};

exports.removeFile = removeFile;
