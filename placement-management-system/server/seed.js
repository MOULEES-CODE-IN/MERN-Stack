// Fills the database with demo data:  npm run seed
// WARNING: this clears users, drives and applications first.
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Drive = require("./models/Drive");
const Application = require("./models/Application");

const day = (n) => new Date(Date.now() + n * 86400000);
const pick = (arr, i) => arr[i % arr.length];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Drive.deleteMany({}), Application.deleteMany({})]);

  const hash = await bcrypt.hash("Password@123", 10);
  const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin@123", 10);

  await User.create({
    name: "Placement Officer", email: (process.env.ADMIN_EMAIL || "admin@college.edu").toLowerCase(),
    password: adminHash, role: "admin", status: "approved",
  });

  const companyData = [
    ["Nimbus Systems", "hr@nimbus.com", "Cloud & DevOps", "Chennai", "approved"],
    ["Orbit Analytics", "careers@orbit.com", "Data & AI", "Bengaluru", "approved"],
    ["Kavya Software Labs", "jobs@kavyalabs.com", "Product Engineering", "Coimbatore", "approved"],
    ["Brightwave Technologies", "hello@brightwave.com", "Networking", "Hyderabad", "pending"],
  ];
  const companies = [];
  for (const [companyName, email, industry, location, status] of companyData) {
    companies.push(await User.create({
      name: `${companyName} HR`, email, password: hash, role: "company", status, phone: "9876500000",
      company: { companyName, industry, location, website: `https://www.${email.split("@")[1]}`, size: "200-500",
        about: `${companyName} builds software for enterprise customers and hires fresh graduates every year.` },
    }));
  }

  const names = ["Arun Kumar", "Divya Lakshmi", "Karthik Raja", "Meena Sundaram", "Praveen S", "Revathi M", "Sanjay Kumar", "Tamilselvi R", "Vignesh P", "Yuvaraj K"];
  const depts = ["CSE", "IT", "ECE", "CSE", "MECH", "IT", "CSE", "ECE", "AI&DS", "CSE"];
  const skillSets = [["React", "Node.js", "MongoDB"], ["Python", "SQL", "Pandas"], ["Java", "Spring Boot"], ["C++", "DSA"], ["AutoCAD"], ["JavaScript", "HTML", "CSS"], ["Python", "ML"], ["Embedded C", "IoT"], ["Python", "TensorFlow"], ["Java", "SQL", "AWS"]];
  const students = [];
  for (let i = 0; i < names.length; i++) {
    students.push(await User.create({
      name: names[i], email: `student${i + 1}@college.edu`, password: hash, role: "student", status: "approved", phone: `98765432${10 + i}`,
      student: { rollNo: `21CS${100 + i}`, department: depts[i], batch: 2026, cgpa: +(6.8 + (i % 5) * 0.6).toFixed(1), backlogs: 0, skills: skillSets[i],
        about: "Final year student looking for a software role.", linkedin: "https://linkedin.com/in/example", github: "https://github.com/example" },
    }));
  }

  const driveData = [
    [0, "Associate Cloud Engineer", "Full-time", "Chennai", 6.5, 10, 7.0, ["CSE", "IT", "ECE"], ["AWS", "Linux", "Docker"], 12, "approved"],
    [0, "DevOps Intern", "Internship + PPO", "Remote", 4.0, 5, 6.5, [], ["Git", "CI/CD"], 20, "approved"],
    [1, "Data Analyst Trainee", "Full-time", "Bengaluru", 7.2, 6, 7.5, ["CSE", "IT", "AI&DS"], ["Python", "SQL", "Power BI"], 9, "approved"],
    [1, "Machine Learning Engineer", "Full-time", "Bengaluru", 12.0, 3, 8.0, ["CSE", "AI&DS"], ["Python", "ML", "TensorFlow"], 15, "pending"],
    [2, "Full Stack Developer", "Full-time", "Coimbatore", 8.5, 8, 7.0, ["CSE", "IT"], ["React", "Node.js", "MongoDB"], 14, "approved"],
    [2, "Software Test Engineer", "Full-time", "Coimbatore", 4.5, 12, 6.0, [], ["Testing", "Selenium"], 5, "approved"],
  ];
  const drives = [];
  for (const [c, title, jobType, location, ctc, openings, minCgpa, departments, skills, deadlineIn, status] of driveData) {
    drives.push(await Drive.create({
      company: companies[c]._id, title, jobType, location, ctc, openings, minCgpa, departments, skills, status,
      deadline: day(deadlineIn), driveDate: day(deadlineIn + 7),
      description: `${companies[c].company.companyName} is hiring a ${title}. You will work with an experienced team on real customer projects, with mentoring from senior engineers during the first six months.`,
    }));
  }

  const flow = ["applied", "shortlisted", "interview", "selected", "rejected"];
  let n = 0;
  for (const drive of drives.filter((d) => d.status === "approved")) {
    for (let i = 0; i < 6; i++) {
      const student = pick(students, n * 3 + i);
      const status = flow[(n + i) % flow.length];
      const timeline = [{ status: "applied", note: "Application submitted" }];
      flow.slice(1, flow.indexOf(status) + 1).forEach((s) => status !== "rejected" || s === "rejected" ? timeline.push({ status: s }) : null);
      try {
        await Application.create({ drive: drive._id, student: student._id, company: drive.company, status, timeline });
      } catch { /* duplicate pair, skip */ }
    }
    n++;
  }

  console.log("Demo data ready.\n  Admin   : admin@college.edu / Admin@123\n  Student : student1@college.edu / Password@123\n  Company : hr@nimbus.com / Password@123");
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
