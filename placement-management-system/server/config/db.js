const mongoose = require("mongoose");

module.exports = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Check that your file is named .env (not _env) inside the server folder.");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    console.error("Tip: in MongoDB Atlas > Network Access, add your current IP address.");
    process.exit(1);
  }
};
