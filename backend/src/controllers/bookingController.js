// backend/src/controllers/bookingController.js
const Booking = require("../models/booking");
const Ride = require("../models/ride");

const MIN_ACCEPT_MINUTES =
  parseInt(process.env.MIN_ACCEPT_MINUTES, 10) || 30;
const MIN_CANCEL_MINUTES =
  parseInt(process.env.MIN_CANCEL_MINUTES, 10) || 120;

const getMinutesUntilRide = (rideDate) => {
  if (!rideDate) return 0;
  return Math.floor((new Date(rideDate).getTime() - Date.now()) / 60000);
};

// POST /api/rides/:rideId/bookings
// Passageiro faz pedido de reserva
// POST /api/rides/:rideId/bookings
// Passageiro faz pedido de reserva
const requestBooking = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { seats } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Boleia não encontrada" });
    }

    // não deixar o driver reservar a própria boleia
    if (ride.driver.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Não podes reservar a tua própria boleia" });
    }

    if (ride.seatsAvailable <= 0) {
      return res.status(400).json({ message: "Não há lugares disponíveis" });
    }

    // nº de lugares pedido
    const qty = parseInt(seats, 10) || 1;

    if (qty < 1) {
      return res
        .status(400)
        .json({ message: "Número de lugares inválido" });
    }

    if (qty > ride.seatsAvailable) {
      return res
        .status(400)
        .json({ message: "Não há lugares suficientes para essa reserva" });
    }

    // opcional: continuar a não permitir mais que uma reserva por passageiro
    const existing = await Booking.findOne({
      ride: rideId,
      passenger: req.user._id,
      status: { $ne: "cancelled" },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Já tens uma reserva para esta boleia" });
    }

    const booking = await Booking.create({
      ride: rideId,
      passenger: req.user._id,
      seats: qty,
      status: "pending",
    });

    return res.status(201).json(booking);
  } catch (err) {
    console.error("Erro a criar reserva:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

// GET /api/rides/:rideId/bookings
// Motorista vê pedidos da sua boleia
const getBookingsForRide = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Boleia não encontrada" });
    }

    // garantir que só o driver vê as reservas
    if (ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    const bookings = await Booking.find({ ride: rideId })
      .populate("passenger", "name email")
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (err) {
    console.error("Erro a obter reservas da boleia:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const body = req.body || {};
    const { status } = body;

    if (!status) {
      return res.status(400).json({ message: "Estado é obrigatório" });
    }

    const booking = await Booking.findById(id).populate("ride");
    if (!booking) {
      return res.status(404).json({ message: "Reserva não encontrada" });
    }

    const ride = booking.ride;

    if (!["accepted", "rejected", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const isDriver =
      ride.driver.toString() === req.user._id.toString();
    const isPassenger =
      booking.passenger.toString() === req.user._id.toString();

    if ((status === "accepted" || status === "rejected") && !isDriver) {
      return res
        .status(403)
        .json({ message: "Só o motorista pode aceitar/recusar" });
    }

    if (status === "cancelled" && !isPassenger && !isDriver) {
      return res
        .status(403)
        .json({ message: "Só passageiro ou motorista podem cancelar" });
    }

    const seats = booking.seats || 1;
    const minutesUntilRide = getMinutesUntilRide(ride.dateTime);

    if (status === "accepted") {
      if (minutesUntilRide < MIN_ACCEPT_MINUTES) {
        return res.status(400).json({
          message:
            "Faltam poucos minutos para a partida. Ja nao e possivel aceitar pedidos.",
        });
      }

      const earlierPending = await Booking.findOne({
        ride: ride._id,
        status: "pending",
        createdAt: { $lt: booking.createdAt },
        _id: { $ne: booking._id },
      });

      if (earlierPending) {
        return res.status(400).json({
          message:
            "Existe um pedido pendente mais antigo. Decide primeiro esse pedido.",
        });
      }
    }

    if (status === "cancelled") {
      if (minutesUntilRide < MIN_CANCEL_MINUTES) {
        return res.status(400).json({
          message:
            "Faltam poucos minutos para a partida. Ja nao e possivel cancelar.",
        });
      }
    }

    // passar para ACEITE → consumir lugares
    if (booking.status !== "accepted" && status === "accepted") {
      if (ride.seatsAvailable < seats) {
        return res.status(400).json({
          message: "Já não há lugares suficientes para aceitar esta reserva",
        });
      }
      ride.seatsAvailable -= seats;
      await ride.save();
    }

    // deixar de estar ACEITE → libertar lugares
    if (
      booking.status === "accepted" &&
      (status === "cancelled" || status === "rejected")
    ) {
      ride.seatsAvailable += seats;
      await ride.save();
    }

    booking.status = status;
    await booking.save();

    return res.json(booking);
  } catch (err) {
    console.error("Erro a atualizar reserva:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

// GET /api/bookings/my
// Passageiro vê as suas reservas
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ passenger: req.user._id })
      .populate("ride")
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (err) {
    console.error("Erro a obter as minhas reservas:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

module.exports = {
  requestBooking,
  getBookingsForRide,
  updateBookingStatus,
  getMyBookings,
};
