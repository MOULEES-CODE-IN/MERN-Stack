const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken, assertCanSignIn } = require("../middleware/auth");
const { httpError } = require("../utils/helpers");

const num = (v) => (v === "" || v === undefined || v === null ? undefined : Number(v));

exports.register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password) throw httpError(400, "Name, email and password are required");
  if (password.length < 6) throw httpError(400, "Password must be at least 6 characters");
  if (!["student", "company"].includes(role)) throw httpError(400, "Choose whether you are a student or a company");
  if (await User.exists({ email: email.toLowerCase() })) throw httpError(409, "This email is already registered");

  const data = { name, email, phone, role, password: await bcrypt.hash(password, 10) };

  if (role === "student") {
    const { rollNo, department, batch, cgpa } = req.body;
    if (!rollNo || !department) throw httpError(400, "Roll number and department are required");
    data.student = { rollNo, department, batch: num(batch), cgpa: num(cgpa) };
    data.status = "approved";
  } else {
    const { companyName, website, industry, location } = req.body;
    if (!companyName) throw httpError(400, "Company name is required");
    data.company = { companyName, website, industry, location };
    data.status = "pending";
  }

  const user = await User.create(data);

  if (role === "company") {
    return res.status(201).json({
      pending: true,
      message: "Registration submitted. You can sign in once the placement officer approves your company.",
    });
  }
  res.status(201).json({ token: signToken(user), user });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || "").toLowerCase() }).select("+password");
  if (!user || !(await bcrypt.compare(String(password || ""), user.password))) {
    throw httpError(401, "Invalid email or password");
  }
  assertCanSignIn(user);
  res.json({ token: signToken(user), user });
};

exports.me = async (req, res) => res.json({ user: req.user });

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) throw httpError(400, "New password must be at least 6 characters");
  const user = await User.findById(req.user._id).select("+password");
  if (!(await bcrypt.compare(String(currentPassword || ""), user.password))) {
    throw httpError(400, "Current password is incorrect");
  }
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Password updated" });
};
