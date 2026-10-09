const router = require("express").Router();
const c = require("../controllers/applicationController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.post("/drive/:driveId", authorize("student"), c.apply);
router.get("/mine", authorize("student"), c.mine);
router.get("/received", authorize("company", "admin"), c.received);
router.patch("/:id/status", authorize("company", "admin"), c.updateStatus);
router.delete("/:id", authorize("student"), c.withdraw);

module.exports = router;
