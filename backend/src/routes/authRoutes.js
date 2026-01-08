// backend/src/routes/authRoutes.js
const express = require("express");
const router = express.Router();

const { register, login, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Registar
router.post("/register", register);

// Login
router.post("/login", login);

// Info do utilizador autenticado
router.get("/me", authMiddleware, getMe);

module.exports = router;
