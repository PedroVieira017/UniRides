const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getFavoriteDistricts,
  updateFavoriteDistricts,
} = require("../controllers/userController");

router.get("/me/favorite-districts", authMiddleware, getFavoriteDistricts);
router.put("/me/favorite-districts", authMiddleware, updateFavoriteDistricts);

module.exports = router;
