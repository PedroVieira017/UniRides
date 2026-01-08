// backend/src/routes/bookingRoutes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  requestBooking,
  getBookingsForRide,
  updateBookingStatus,
  getMyBookings,
} = require("../controllers/bookingController");

// Passageiro pede reserva numa boleia
router.post("/rides/:rideId/bookings", authMiddleware, requestBooking);

// Motorista vê reservas de uma boleia
router.get("/rides/:rideId/bookings", authMiddleware, getBookingsForRide);

// Passageiro vê as suas reservas
router.get("/bookings/my", authMiddleware, getMyBookings);

// Motorista/passagem atualizam estado de uma reserva
router.patch("/bookings/:id", authMiddleware, updateBookingStatus);

module.exports = router;
