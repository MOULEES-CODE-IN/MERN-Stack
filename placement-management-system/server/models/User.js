const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "company", "admin"], required: true },
    // companies start as "pending" until the admin approves them
    status: { type: String, enum: ["pending", "approved", "rejected", "blocked"], default: "approved" },
    phone: { type: String, trim: true },

    student: {
      rollNo: { type: String, trim: true },
      department: { type: String, trim: true },
      batch: Number,
      cgpa: { type: Number, min: [0, "CGPA cannot be below 0"], max: [10, "CGPA cannot be above 10"] },
      backlogs: { type: Number, min: 0 },
      skills: [String],
      about: { type: String, maxlength: 600 },
      linkedin: String,
      github: String,
      resume: { url: String, originalName: String, uploadedAt: Date },
    },

    company: {
      companyName: { type: String, trim: true },
      website: String,
      industry: String,
      location: String,
      size: String,
      about: { type: String, maxlength: 800 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("User", userSchema);
