const router = require("express").Router();
const c = require("../controllers/driveController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.get("/", c.list);
router.get("/:id", c.getOne);
router.post("/", authorize("company"), c.create);
router.put("/:id", authorize("company"), c.update);
router.patch("/:id/status", authorize("admin", "company"), c.setStatus);
router.delete("/:id", authorize("admin", "company"), c.remove);

module.exports = router;
