const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    drive: { type: mongoose.Schema.Types.ObjectId, ref: "Drive", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "interview", "selected", "rejected"],
      default: "applied",
    },
    coverNote: { type: String, maxlength: 500 },
    interviewDate: Date,
    timeline: [
      {
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

applicationSchema.index({ drive: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
