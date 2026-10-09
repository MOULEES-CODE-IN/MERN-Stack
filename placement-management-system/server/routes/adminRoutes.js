const router = require("express").Router();
const c = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));
router.get("/users", c.listUsers);
router.patch("/users/:id/status", c.setUserStatus);
router.delete("/users/:id", c.deleteUser);
router.get("/report", c.report);

module.exports = router;
