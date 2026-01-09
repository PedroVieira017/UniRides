const Ride = require("../models/ride");
const User = require("../models/user");

// Criar nova boleia
const createRide = async (req, res) => {
  try {
    const {
      origin,
      destination,
      dateTime,
      meetingPoint,
      pricePerSeat,
      seatsTotal,
      notes,
      estimatedArrivalTime,
      possibleStops,
    } = req.body;

    if (
      !origin ||
      !destination ||
      !dateTime ||
      !meetingPoint ||
      pricePerSeat === undefined ||
      seatsTotal === undefined
    ) {
      return res.status(400).json({ message: "Dados incompletos" });
    }

    const ride = await Ride.create({
      driver: req.user._id,
      origin,
      destination,
      dateTime,
      meetingPoint,
      pricePerSeat,
      seatsTotal,
      seatsAvailable: seatsTotal,
      notes,
      estimatedArrivalTime,
      possibleStops,
    });

    return res.status(201).json(ride);
  } catch (err) {
    console.error("🚨 Erro a criar boleia:", err.message);
    console.error(err); // mostra stack completa

    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

// Listar boleias (com filtros)
const getRides = async (req, res) => {
  try {
    const { origin, destination, date } = req.query;

    let filters = {};

    if (origin) filters.origin = new RegExp(origin, "i");
    if (destination) filters.destination = new RegExp(destination, "i");
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filters.dateTime = { $gte: start, $lte: end };
    }

    const rides = await Ride.find(filters).populate("driver", "name email rating");

    res.json(rides);
  } catch (err) {
    console.error("Erro a buscar boleias:", err);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

// Detalhe da boleia
const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate(
      "driver",
      "name email rating"
    );

    if (!ride) return res.status(404).json({ message: "Boleia não encontrada" });

    res.json(ride);
  } catch (err) {
    console.error("Erro ao buscar boleia:", err);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

// Listar boleias do utilizador autenticado
const getMyRides = async (req, res) => {
  try {
    const rides = await Ride.find({ driver: req.user._id }).sort({
      dateTime: 1,
    });
    return res.json(rides);
  } catch (err) {
    console.error("Erro a obter as minhas boleias:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

// GET /api/rides/favorites
const getFavoriteRides = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("favorites");
    if (!user) {
      return res.status(404).json({ message: "Utilizador nao encontrado" });
    }
    return res.json(user.favorites || []);
  } catch (err) {
    console.error("Erro a obter favoritos:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

// POST /api/rides/:rideId/favorite
const toggleFavorite = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Boleia nao encontrada" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Utilizador nao encontrado" });
    }

    const alreadyFavorited = (user.favorites || []).some(
      (favId) => favId.toString() === rideId
    );

    if (alreadyFavorited) {
      user.favorites = user.favorites.filter(
        (favId) => favId.toString() !== rideId
      );
    } else {
      user.favorites.push(rideId);
    }

    await user.save();

    return res.json({ favorited: !alreadyFavorited });
  } catch (err) {
    console.error("Erro a atualizar favorito:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

module.exports = {
  createRide,
  getRides,
  getRideById,
  getMyRides, 
  getFavoriteRides,
  toggleFavorite,
};
