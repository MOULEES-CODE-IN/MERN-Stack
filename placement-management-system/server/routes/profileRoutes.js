const router = require("express").Router();
const c = require("../controllers/profileController");
const upload = require("../middleware/upload");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.put("/", c.update);
router.post("/resume", authorize("student"), upload.single("resume"), c.uploadResume);
router.delete("/resume", authorize("student"), c.deleteResume);

module.exports = router;
