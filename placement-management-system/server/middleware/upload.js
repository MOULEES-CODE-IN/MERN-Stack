const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { httpError } = require("../utils/helpers");

const dir = path.join(__dirname, "..", "uploads", "resumes");
fs.mkdirSync(dir, { recursive: true });

module.exports = multer({
  storage: multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) => cb(null, `${req.user._id}-${Date.now()}.pdf`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype === "application/pdf" ? cb(null, true) : cb(httpError(400, "Only PDF files are allowed")),
});
