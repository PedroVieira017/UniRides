const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getMyAlerts,
  createAlert,
  deleteAlert,
} = require("../controllers/alertController");

router.get("/", authMiddleware, getMyAlerts);
router.post("/", authMiddleware, createAlert);
router.delete("/:id", authMiddleware, deleteAlert);

module.exports = router;
