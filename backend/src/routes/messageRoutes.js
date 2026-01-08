// backend/src/routes/messageRoutes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getMessagesForRide,
  sendMessage,
} = require("../controllers/messageController"); // <-- ATENÇÃO: ../controllers

// Chat por boleia
router.get("/rides/:rideId/messages", authMiddleware, getMessagesForRide);
router.post("/rides/:rideId/messages", authMiddleware, sendMessage);

module.exports = router;
