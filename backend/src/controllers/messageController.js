// backend/src/controllers/messageController.js
const Message = require("../models/message");
const Ride = require("../models/ride");

// GET /api/rides/:rideId/messages
const getMessagesForRide = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Boleia não encontrada" });
    }

    const messages = await Message.find({ ride: rideId })
      .populate("user", "name email")
      .sort({ createdAt: 1 });

    return res.json(messages);
  } catch (err) {
    console.error("Erro a obter mensagens:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

// POST /api/rides/:rideId/messages
const sendMessage = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Texto é obrigatório" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Boleia não encontrada" });
    }

    const message = await Message.create({
      ride: rideId,
      user: req.user._id,
      text: text.trim(),
    });

    const populated = await message.populate("user", "name email");

    const io = req.app.get("io");
    io.to(rideId.toString()).emit("new-message", populated);

    return res.status(201).json(populated);
  } catch (err) {
    console.error("Erro a enviar mensagem:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

module.exports = {
  getMessagesForRide,
  sendMessage,
};
