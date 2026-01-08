// backend/src/controllers/stopRequestController.js
const StopRequest = require("../models/stopRequest");
const Ride = require("../models/ride");
const Booking = require("../models/booking");

const getAcceptedPassengerIds = async (rideId) => {
  const acceptedBookings = await Booking.find({
    ride: rideId,
    status: "accepted",
  }).select("passenger");

  return acceptedBookings.map((booking) => booking.passenger.toString());
};

const canAccessRide = async (rideId, userId) => {
  const ride = await Ride.findById(rideId);
  if (!ride) return { ride: null, isDriver: false, hasBooking: false };

  const isDriver = ride.driver.toString() === userId.toString();
  const hasBooking = await Booking.exists({
    ride: rideId,
    passenger: userId,
    status: { $nin: ["cancelled", "rejected"] },
  });

  return { ride, isDriver, hasBooking: !!hasBooking };
};

const getRequiredApproverIds = async (rideId, ride, requesterId) => {
  const acceptedPassengerIds = await getAcceptedPassengerIds(rideId);
  const required = new Set(acceptedPassengerIds);
  if (requesterId) {
    required.delete(requesterId.toString());
  }
  if (ride?.driver) {
    required.add(ride.driver.toString());
  }
  return Array.from(required);
};

// GET /api/rides/:rideId/stop-requests
const getStopRequests = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { ride, isDriver, hasBooking } = await canAccessRide(
      rideId,
      req.user._id
    );

    if (!ride) {
      return res.status(404).json({ message: "Boleia nao encontrada" });
    }

    if (!isDriver && !hasBooking) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    const acceptedPassengerIds = await getAcceptedPassengerIds(rideId);
    const driverId = ride.driver ? ride.driver.toString() : null;

    const requests = await StopRequest.find({ ride: rideId })
      .populate("requester", "name email")
      .populate("approvals.user", "name email")
      .sort({ createdAt: -1 });

    const payload = requests.map((request) => {
      const requiredApproverIds = acceptedPassengerIds
        .filter((id) => id !== request.requester.toString());
      if (driverId) {
        requiredApproverIds.push(driverId);
      }
      const approvedIds = request.approvals
        .filter((approval) => approval.status === "approved")
        .map((approval) => approval.user.toString());
      const approvedCount = requiredApproverIds.filter((id) =>
        approvedIds.includes(id)
      ).length;
      return {
        ...request.toObject(),
        approvalsSummary: {
          required: requiredApproverIds.length,
          approved: approvedCount,
        },
      };
    });

    return res.json(payload);
  } catch (err) {
    console.error("Erro a obter pedidos de paragem:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

// POST /api/rides/:rideId/stop-requests
const createStopRequest = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { location, note } = req.body || {};

    if (!location || !location.trim()) {
      return res.status(400).json({ message: "Local e obrigatorio" });
    }

    const { ride, isDriver, hasBooking } = await canAccessRide(
      rideId,
      req.user._id
    );

    if (!ride) {
      return res.status(404).json({ message: "Boleia nao encontrada" });
    }

    if (isDriver || !hasBooking) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    const acceptedPassengerIds = await getAcceptedPassengerIds(rideId);
    const isAcceptedPassenger = acceptedPassengerIds.includes(
      req.user._id.toString()
    );

    if (!isAcceptedPassenger) {
      return res.status(403).json({ message: "Apenas passageiros aceites" });
    }

    const approvals = [];

    const request = await StopRequest.create({
      ride: rideId,
      requester: req.user._id,
      location: location.trim(),
      note: note ? note.trim() : "",
      status: "voting",
      approvals,
    });

    const requiredApproverIds = await getRequiredApproverIds(
      rideId,
      ride,
      req.user._id
    );
    if (approvedAll(requiredApproverIds, approvals)) {
      request.status = "approved";
      await request.save();
    }

    const populated = await request.populate("requester", "name email");
    return res.status(201).json(populated);
  } catch (err) {
    console.error("Erro a criar pedido de paragem:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

const approvedAll = (requiredApproverIds, approvals) => {
  if (requiredApproverIds.length === 0) return true;
  const approvedIds = approvals.map((approval) => approval.user.toString());
  return requiredApproverIds.every((id) => approvedIds.includes(id));
};

const updateStopRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body || {};

    if (!action) {
      return res.status(400).json({ message: "Acao e obrigatoria" });
    }

    const request = await StopRequest.findById(id).populate("ride");
    if (!request) {
      return res.status(404).json({ message: "Pedido nao encontrado" });
    }

    const ride = request.ride;
    const isDriver = ride.driver.toString() === req.user._id.toString();
    const requiredApproverIds = await getRequiredApproverIds(
      ride._id,
      ride,
      request.requester
    );
    const acceptedPassengerIds = await getAcceptedPassengerIds(ride._id);
    const isAcceptedPassenger = acceptedPassengerIds.includes(
      req.user._id.toString()
    );

    if (action === "driver-approve") {
      if (!isDriver) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      if (request.status !== "voting") {
        return res.status(400).json({ message: "Estado invalido" });
      }

      const existingIndex = request.approvals.findIndex(
        (approval) => approval.user.toString() === req.user._id.toString()
      );
      if (existingIndex >= 0) {
        request.approvals[existingIndex].status = "approved";
        request.approvals[existingIndex].decidedAt = new Date();
      } else {
        request.approvals.push({
          user: req.user._id,
          status: "approved",
        });
      }

      const approvals = request.approvals.filter(
        (approval) => approval.status === "approved"
      );
      if (approvedAll(requiredApproverIds, approvals)) {
        request.status = "approved";
      }

      await request.save();
      const populated = await request
        .populate("requester", "name email")
        .populate("approvals.user", "name email");
      return res.json(populated);
    }

    if (action === "driver-reject") {
      if (!isDriver) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      if (request.status !== "voting") {
        return res.status(400).json({ message: "Estado invalido" });
      }
      request.status = "rejected";
      await request.save();
      const populated = await request
        .populate("requester", "name email")
        .populate("approvals.user", "name email");
      return res.json(populated);
    }

    if (action === "passenger-approve" || action === "passenger-reject") {
      if (!isAcceptedPassenger) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      if (request.requester.toString() === req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: "Nao podes votar no teu pedido" });
      }
      if (request.status !== "voting") {
        return res.status(400).json({ message: "Estado invalido" });
      }

      const status = action === "passenger-approve" ? "approved" : "rejected";
      const existingIndex = request.approvals.findIndex(
        (approval) => approval.user.toString() === req.user._id.toString()
      );
      if (existingIndex >= 0) {
        request.approvals[existingIndex].status = status;
        request.approvals[existingIndex].decidedAt = new Date();
      } else {
        request.approvals.push({
          user: req.user._id,
          status,
        });
      }

      if (status === "rejected") {
        request.status = "rejected";
      } else {
        const approvals = request.approvals.filter(
          (approval) => approval.status === "approved"
        );
        if (approvedAll(requiredApproverIds, approvals)) {
          request.status = "approved";
        }
      }

      await request.save();
      const populated = await request
        .populate("requester", "name email")
        .populate("approvals.user", "name email");
      return res.json(populated);
    }

    return res.status(400).json({ message: "Acao invalida" });
  } catch (err) {
    console.error("Erro a atualizar pedido de paragem:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

module.exports = {
  getStopRequests,
  createStopRequest,
  updateStopRequest,
};
