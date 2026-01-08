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

const getAcceptedPassengerIdSet = async (rideId) => {
  const acceptedPassengerIds = await getAcceptedPassengerIds(rideId);
  return new Set(acceptedPassengerIds);
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

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return value._id.toString();
  if (typeof value.toString === "function") return value.toString();
  return null;
};

const countApprovedUsers = (
  approvals,
  acceptedPassengerIds,
  requesterIdStr
) => {
  const approvedUsers = new Set();
  if (requesterIdStr && acceptedPassengerIds.has(requesterIdStr)) {
    approvedUsers.add(requesterIdStr);
  }
  approvals.forEach((approval) => {
    if (approval.status !== "approved") return;
    const userId = toIdString(approval.user);
    if (!userId) return;
    if (acceptedPassengerIds.has(userId)) {
      approvedUsers.add(userId);
    }
  });
  return approvedUsers.size;
};

const buildStopRequestPayload = (
  request,
  acceptedPassengerIds,
  requesterIdStr,
  requiredUsers
) => {
  const approvedUsers = countApprovedUsers(
    request.approvals || [],
    acceptedPassengerIds,
    requesterIdStr
  );
  return {
    ...request.toObject(),
    approvalsSummary: {
      required: requiredUsers,
      approved: approvedUsers,
    },
  };
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

    const acceptedPassengerIds = await getAcceptedPassengerIdSet(rideId);
    const driverIdStr = toIdString(ride.driver);
    const requiredUsers = acceptedPassengerIds.size;

    const requests = await StopRequest.find({ ride: rideId })
      .populate("requester", "name email")
      .populate("approvals.user", "name email")
      .sort({ createdAt: -1 });

    const payload = requests.map((request) =>
      buildStopRequestPayload(
        request,
        acceptedPassengerIds,
        toIdString(request.requester),
        requiredUsers
      )
    );

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

    const acceptedPassengerList = await getAcceptedPassengerIds(rideId);
    const isAcceptedPassenger = acceptedPassengerList.includes(
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

    const acceptedPassengerIds = await getAcceptedPassengerIdSet(rideId);
    const driverIdStr = toIdString(ride.driver);
    const requiredUsers = acceptedPassengerIds.size;
    if (approvedAll(requiredUsers, 0, false)) {
      request.status = "approved";
      await request.save();
    }

    const populated = await request.populate("requester", "name email");
    const payload = buildStopRequestPayload(
      populated,
      acceptedPassengerIds,
      toIdString(populated.requester),
      requiredUsers
    );
    return res.status(201).json(payload);
  } catch (err) {
    console.error("Erro a criar pedido de paragem:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

const approvedAll = (requiredUsers, approvedUsers, driverApproved) => {
  if (!driverApproved) return false;
  return approvedUsers >= requiredUsers;
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
    const driverIdStr = toIdString(ride?.driver);
    const requesterIdStr = toIdString(request.requester);

    if (!requesterIdStr) {
      return res.status(400).json({ message: "Pedido invalido" });
    }

    const isDriver = driverIdStr === req.user._id.toString();
    const acceptedPassengerIds = await getAcceptedPassengerIdSet(ride._id);
    const requiredUsers = acceptedPassengerIds.size;
    const isAcceptedPassenger = acceptedPassengerIds.has(
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
        (approval) => toIdString(approval.user) === req.user._id.toString()
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

      const approvedUsers = countApprovedUsers(
        request.approvals || [],
        acceptedPassengerIds,
        requesterIdStr
      );
      const driverApproved = request.approvals.some(
        (approval) =>
          approval.status === "approved" &&
          toIdString(approval.user) === driverIdStr
      );
      if (approvedAll(requiredUsers, approvedUsers, driverApproved)) {
        request.status = "approved";
      }

      await request.save();
      await request.populate([
        { path: "requester", select: "name email" },
        { path: "approvals.user", select: "name email" },
      ]);
      return res.json(
        buildStopRequestPayload(
          request,
          acceptedPassengerIds,
          requesterIdStr,
          requiredUsers
        )
      );
    }

    if (action === "driver-reject") {
      if (!isDriver) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      if (request.status !== "voting") {
        return res.status(400).json({ message: "Estado invalido" });
      }
      const existingIndex = request.approvals.findIndex(
        (approval) => toIdString(approval.user) === req.user._id.toString()
      );
      if (existingIndex >= 0) {
        request.approvals[existingIndex].status = "rejected";
        request.approvals[existingIndex].decidedAt = new Date();
      } else {
        request.approvals.push({
          user: req.user._id,
          status: "rejected",
        });
      }
      request.status = "rejected";
      await request.save();
      await request.populate([
        { path: "requester", select: "name email" },
        { path: "approvals.user", select: "name email" },
      ]);
      return res.json(
        buildStopRequestPayload(
          request,
          acceptedPassengerIds,
          requesterIdStr,
          requiredUsers
        )
      );
    }

    if (action === "passenger-approve" || action === "passenger-reject") {
      if (!isAcceptedPassenger) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      if (request.status !== "voting") {
        return res.status(400).json({ message: "Estado invalido" });
      }

      const status = action === "passenger-approve" ? "approved" : "rejected";
      const existingIndex = request.approvals.findIndex(
        (approval) => toIdString(approval.user) === req.user._id.toString()
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
        const approvedUsers = countApprovedUsers(
          request.approvals || [],
          acceptedPassengerIds,
          requesterIdStr
        );
        const driverApproved = request.approvals.some(
          (approval) =>
            approval.status === "approved" &&
            toIdString(approval.user) === driverIdStr
        );
        if (approvedAll(requiredUsers, approvedUsers, driverApproved)) {
          request.status = "approved";
        }
      }

      await request.save();
      await request.populate([
        { path: "requester", select: "name email" },
        { path: "approvals.user", select: "name email" },
      ]);
      return res.json(
        buildStopRequestPayload(
          request,
          acceptedPassengerIds,
          requesterIdStr,
          requiredUsers
        )
      );
    }

    if (action === "passenger-reset" || action === "driver-reset") {
      const isPassengerReset = action === "passenger-reset";
      if (isPassengerReset && !isAcceptedPassenger) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      if (!isPassengerReset && !isDriver) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const existingIndex = request.approvals.findIndex(
        (approval) => toIdString(approval.user) === req.user._id.toString()
      );
      if (existingIndex < 0) {
        return res.status(400).json({ message: "Sem voto para remover" });
      }

      request.approvals.splice(existingIndex, 1);

      const hasRejection = request.approvals.some(
        (approval) => approval.status === "rejected"
      );
      if (hasRejection) {
        request.status = "rejected";
      } else {
      const approvedUsers = countApprovedUsers(
        request.approvals || [],
        acceptedPassengerIds,
        requesterIdStr
      );
      const driverApproved = request.approvals.some(
        (approval) =>
          approval.status === "approved" &&
          toIdString(approval.user) === driverIdStr
      );
      request.status = approvedAll(requiredUsers, approvedUsers, driverApproved)
        ? "approved"
        : "voting";
    }

      await request.save();
      await request.populate([
        { path: "requester", select: "name email" },
        { path: "approvals.user", select: "name email" },
      ]);
      return res.json(
        buildStopRequestPayload(
          request,
          acceptedPassengerIds,
          requesterIdStr,
          requiredUsers
        )
      );
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
