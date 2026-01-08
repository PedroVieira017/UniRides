const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createRide,
  getRides,
  getRideById,
  getMyRides,
  getFavoriteRides,
  toggleFavorite,
} = require("../controllers/rideController");

// Criar boleia - precisa de login
router.post("/", authMiddleware, createRide);

// Listar boleias - publico
router.get("/", getRides);

// Favoritos
router.get("/favorites", authMiddleware, getFavoriteRides);
router.post("/:rideId/favorite", authMiddleware, toggleFavorite);

// Boleias do utilizador autenticado
router.get("/me", authMiddleware, getMyRides);

// Obter uma boleia especifica - publico
router.get("/:id", getRideById);

module.exports = router;
