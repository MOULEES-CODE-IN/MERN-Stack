require("dotenv").config({ quiet: true });
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const ensureAdmin = require("./utils/ensureAdmin");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : true }));
app.use(express.json());

fs.mkdirSync(path.join(__dirname, "uploads", "resumes"), { recursive: true });
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Placement Management System Backend is Running!");
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/drives", require("./routes/driveRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await ensureAdmin();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
