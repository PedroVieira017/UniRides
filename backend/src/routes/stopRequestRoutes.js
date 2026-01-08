const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getStopRequests,
  createStopRequest,
  updateStopRequest,
} = require("../controllers/stopRequestController");

router.get("/rides/:rideId/stop-requests", authMiddleware, getStopRequests);
router.post("/rides/:rideId/stop-requests", authMiddleware, createStopRequest);
router.patch("/stop-requests/:id", authMiddleware, updateStopRequest);

module.exports = router;
