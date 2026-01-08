// backend/src/controllers/alertController.js
const Alert = require("../models/alert");

const parseTimeToMinutes = (time) => {
  if (!time || typeof time !== "string") return null;
  const parts = time.split(":");
  if (parts.length !== 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
};

// GET /api/alerts
const getMyAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    return res.json(alerts);
  } catch (err) {
    console.error("Erro a obter alertas:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

// POST /api/alerts
const createAlert = async (req, res) => {
  try {
    const { origin, destination, weekday, time } = req.body || {};

    if (!origin || !destination || weekday === undefined || !time) {
      return res.status(400).json({
        message: "Origem, destino, dia da semana e hora sao obrigatorios",
      });
    }

    const weekdayNum = parseInt(weekday, 10);
    if (Number.isNaN(weekdayNum) || weekdayNum < 0 || weekdayNum > 6) {
      return res.status(400).json({ message: "Dia da semana invalido" });
    }

    const timeMinutes = parseTimeToMinutes(time);
    if (timeMinutes === null) {
      return res.status(400).json({ message: "Hora invalida" });
    }

    const alert = await Alert.create({
      user: req.user._id,
      origin,
      destination,
      weekday: weekdayNum,
      timeMinutes,
    });

    return res.status(201).json(alert);
  } catch (err) {
    console.error("Erro a criar alerta:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

// DELETE /api/alerts/:id
const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);

    if (!alert) {
      return res.status(404).json({ message: "Alerta nao encontrado" });
    }

    if (alert.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    await alert.deleteOne();
    return res.json({ success: true });
  } catch (err) {
    console.error("Erro a remover alerta:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

module.exports = {
  getMyAlerts,
  createAlert,
  deleteAlert,
};
