const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { httpError } = require("../utils/helpers");

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const assertCanSignIn = (user) => {
  if (user.role === "admin") return;
  if (user.status === "pending") throw httpError(403, "Your company is awaiting approval from the placement officer.");
  if (user.status === "rejected") throw httpError(403, "Your registration was rejected. Please contact the placement cell.");
  if (user.status === "blocked") throw httpError(403, "Your account has been blocked. Please contact the placement cell.");
};

const protect = async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw httpError(401, "Please sign in to continue");
  let payload;
  try {
    payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    throw httpError(401, "Your session has expired. Please sign in again.");
  }
  const user = await User.findById(payload.id);
  if (!user) throw httpError(401, "Account no longer exists");
  assertCanSignIn(user);
  req.user = user;
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw httpError(403, "You do not have permission to do this");
  next();
};

module.exports = { signToken, assertCanSignIn, protect, authorize };
