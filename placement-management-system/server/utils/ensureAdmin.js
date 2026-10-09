const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Creates the first admin automatically so the app is usable right after setup.
module.exports = async () => {
  if (await User.exists({ role: "admin" })) return;
  const email = (process.env.ADMIN_EMAIL || "admin@college.edu").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin@123";
  await User.create({
    name: "Placement Officer",
    email,
    password: await bcrypt.hash(password, 10),
    role: "admin",
    status: "approved",
  });
  console.log(`Default admin created -> ${email} / ${password}`);
};
