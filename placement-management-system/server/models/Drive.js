const mongoose = require("mongoose");

const driveSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: [true, "Job title is required"], trim: true },
    description: { type: String, required: [true, "Description is required"], trim: true },
    jobType: { type: String, enum: ["Full-time", "Internship", "Internship + PPO"], default: "Full-time" },
    location: { type: String, trim: true, default: "On-site" },
    ctc: { type: Number, required: [true, "Package (LPA) is required"], min: 0 },
    openings: { type: Number, default: 1, min: 1 },
    minCgpa: { type: Number, default: 0, min: 0, max: 10 },
    departments: [String], // empty list = open to all departments
    skills: [String],
    deadline: { type: Date, required: [true, "Deadline is required"] },
    driveDate: Date,
    // pending -> (admin) approved/rejected -> (company/admin) closed
    status: { type: String, enum: ["pending", "approved", "rejected", "closed"], default: "pending" },
    adminRemark: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Drive", driveSchema);
