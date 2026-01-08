// src/pages/RideDetailsPage.jsx
// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import RideChat from "../components/RideChat";

const RideDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [ride, setRide] = useState(null);

  const [seats, setSeats] = useState(1);
  const [bookingMessage, setBookingMessage] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [stopRequests, setStopRequests] = useState([]);
  const [stopLoading, setStopLoading] = useState(false);
  const [stopError, setStopError] = useState(null);
  const [stopLocation, setStopLocation] = useState("");
  const [stopNote, setStopNote] = useState("");
  const [stopSubmitting, setStopSubmitting] = useState(false);
  const [myBooking, setMyBooking] = useState(null);

  const formatLocation = (value) => {
    if (!value) return "";
    const parts = value.split(" - ").map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) return value;
    const district = parts[0];
    const place = parts.slice(1).join(" - ");
    if (place.toLowerCase() === district.toLowerCase()) {
      return district;
    }
    return `${place} (${district})`;
  };

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await api.get(`/rides/${id}`);
        const data = res.data;
        setRide(data);

        const available = data.seatsAvailable ?? 0;
        setSeats(available > 0 ? 1 : 0);
      } catch (err) {
        console.error("Erro a carregar boleia:", err);
      }
    };

    fetchRide();
  }, [id]);

  const driverId = ride?.driver?._id || ride?.driver?.id || null;
  const currentUserId = user?._id || user?.id || null;
  const isDriver = !!driverId && !!currentUserId && driverId === currentUserId;

  useEffect(() => {
    if (!ride?._id || !user?.favorites) {
      setIsFavorited(false);
      return;
    }
    const hasFavorite = user.favorites.some(
      (favId) => favId.toString() === ride._id
    );
    setIsFavorited(hasFavorite);
  }, [ride?._id, user]);

  const handleToggleFavorite = async () => {
    if (!token || !ride?._id) return;
    try {
      const res = await api.post(
        `/rides/${ride._id}/favorite`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setIsFavorited(!!res.data?.favorited);
    } catch (err) {
      console.error("Erro a atualizar favorito:", err);
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (!ride || !token || !isDriver) return;

      setBookingsLoading(true);
      setBookingsError(null);

      try {
        const res = await api.get(`/rides/${ride._id}/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookings(res.data || []);
      } catch (err) {
        console.error("Erro a carregar reservas da boleia:", err);
        setBookingsError(
          err?.response?.data?.message ||
            "Nao foi possivel carregar os pedidos de reserva."
        );
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookings();
  }, [ride?._id, token, isDriver]);

  useEffect(() => {
    const fetchMyBooking = async () => {
      if (!ride || !token) return;
      try {
        const res = await api.get("/bookings/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const match = (res.data || []).find(
          (booking) => booking.ride?._id === ride._id
        );
        setMyBooking(match || null);
      } catch (err) {
        console.error("Erro a carregar a minha reserva:", err);
      }
    };

    fetchMyBooking();
  }, [ride?._id, token, isDriver]);

  useEffect(() => {
    const fetchStopRequests = async () => {
      const canSeeStopRequests =
        token && (isDriver || myBooking?.status === "accepted");
      if (!ride || !canSeeStopRequests) {
        return;
      }
      setStopLoading(true);
      setStopError(null);
      try {
        const res = await api.get(`/rides/${ride._id}/stop-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStopRequests(res.data || []);
      } catch (err) {
        console.error("Erro a carregar pedidos de paragem:", err);
        setStopError(
          err?.response?.data?.message ||
            "Nao foi possivel carregar os pedidos de paragem."
        );
      } finally {
        setStopLoading(false);
      }
    };

    fetchStopRequests();
  }, [ride?._id, token, isDriver, myBooking?.status]);

  const handleBooking = async () => {
    if (!ride || !token || seats < 1) return;

    setBookingLoading(true);
    setBookingMessage(null);

    try {
      await api.post(
        `/rides/${ride._id}/bookings`,
        { seats },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBookingMessage("Pedido de reserva enviado com sucesso.");
    } catch (err) {
      console.error(err);
      setBookingMessage(
        err?.response?.data?.message || "Nao foi possivel reservar."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleUpdateBooking = async (booking, newStatus) => {
    if (!token) return;

    setBookingsError(null);

    try {
      const res = await api.patch(
        `/bookings/${booking._id}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updated = res.data;

      setBookings((prev) =>
        prev.map((b) => (b._id === updated._id ? updated : b))
      );
      setBookingsError(null);

      if (ride?._id) {
        const refreshed = await api.get(`/rides/${ride._id}`);
        setRide(refreshed.data);
      }
    } catch (err) {
      console.error("Erro ao atualizar reserva:", err);
      setBookingsError(
        err?.response?.data?.message ||
          "Nao foi possivel atualizar o estado da reserva."
      );
    }
  };

  const canRequestStop = token && myBooking?.status === "accepted";
  const canVoteStop =
    token && myBooking?.status === "accepted" && !isDriver;
  const showStopSection =
    token && (isDriver || myBooking?.status === "accepted");

  const handleCreateStopRequest = async () => {
    if (!ride || !token || !stopLocation.trim()) return;
    setStopSubmitting(true);
    setStopError(null);

    try {
      const res = await api.post(
        `/rides/${ride._id}/stop-requests`,
        {
          location: stopLocation,
          note: stopNote,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStopRequests((prev) => [res.data, ...prev]);
      setStopLocation("");
      setStopNote("");
    } catch (err) {
      console.error("Erro a criar pedido de paragem:", err);
      setStopError(
        err?.response?.data?.message ||
          "Nao foi possivel criar o pedido de paragem."
      );
    } finally {
      setStopSubmitting(false);
    }
  };

  const handleStopAction = async (requestId, action) => {
    if (!token) return;
    try {
      const res = await api.patch(
        `/stop-requests/${requestId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data;
      setStopRequests((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
    } catch (err) {
      console.error("Erro a atualizar pedido de paragem:", err);
      setStopError(
        err?.response?.data?.message ||
          "Nao foi possivel atualizar o pedido."
      );
    }
  };

  if (!ride) {
    return (
      <AppLayout>
        <p>A carregar boleia...</p>
      </AppLayout>
    );
  }

  const date = new Date(ride.dateTime);
  const dateStr = date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const arrivalDate = ride.estimatedArrivalTime
    ? new Date(ride.estimatedArrivalTime)
    : null;
  const arrivalStr = arrivalDate
    ? arrivalDate.toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const available = ride.seatsAvailable ?? 0;
  const total = ride.seatsTotal ?? 0;
  const pricePerSeat = ride.pricePerSeat || 0;
  const totalPrice = (seats * pricePerSeat).toFixed(2);

  return (
    <AppLayout>
      <button className="link-button" onClick={() => navigate(-1)}>
        Voltar
      </button>

      <div className="card details-card">
        <div className="details-header">
          <div>
            <h2 className="ride-route">
              {formatLocation(ride.origin)} {" -> "}{" "}
              {formatLocation(ride.destination)}
            </h2>
            <div className="details-sub">
              {available} de {total} lugares disponiveis
            </div>
          </div>
          <div className="details-price-block">
            <div className="details-label">Preco por pessoa</div>
            <div className="details-price">{pricePerSeat.toFixed(2)} EUR</div>
          </div>
        </div>

        <section className="details-grid">
          <div className="details-item">
            <div className="details-label">Data</div>
            <div className="details-value">{dateStr}</div>
          </div>
          <div className="details-item">
            <div className="details-label">Hora de partida</div>
            <div className="details-value">{timeStr}</div>
          </div>
          <div className="details-item">
            <div className="details-label">Hora prevista de chegada</div>
            <div className="details-value">
              {arrivalStr || "Nao indicado"}
            </div>
          </div>
          <div className="details-item">
            <div className="details-label">Ponto de encontro</div>
            <div className="details-value">{ride.meetingPoint}</div>
          </div>
          <div className="details-item full">
            <div className="details-label">Paragens possiveis</div>
            <div className="details-value">
              {ride.possibleStops && ride.possibleStops.length > 0 ? (
                <div className="tag-list">
                  {ride.possibleStops.map((stop) => (
                    <span key={stop} className="tag">
                      {stop}
                    </span>
                  ))}
                </div>
              ) : (
                "Nenhuma paragem indicada"
              )}
            </div>
          </div>
          {ride.notes && (
            <div className="details-item full">
              <div className="details-label">Notas do motorista</div>
              <div className="details-value">{ride.notes}</div>
            </div>
          )}
        </section>
      </div>

      <div className="card">
        <h3>Motorista</h3>
        <div className="driver-row">
          <div className="avatar-circle">
            {ride.driver?.name?.[0] || "U"}
          </div>
          <div>
            <div className="driver-name">{ride.driver?.name}</div>
            <div className="driver-meta">
              {ride.driver?.role === "student"
                ? "Estudante"
                : ride.driver?.role || "Utilizador"}{" "}
              - {(ride.driver?.rating || 4.8).toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {isDriver && (
        <div className="card">
          <h3>Pedidos de reserva</h3>

          {bookingsLoading && <p>A carregar pedidos...</p>}

          {bookingsError && <p className="error">{bookingsError}</p>}

          {!bookingsLoading && !bookingsError && bookings.length === 0 && (
            <p className="card-subtitle">
              Ainda nao ha pedidos de reserva para esta boleia.
            </p>
          )}

          {!bookingsLoading && bookings.length > 0 && (
            <div className="booking-list">
              {bookings.map((b) => (
                <div key={b._id} className="booking-item">
                  <div className="booking-main">
                    <div className="booking-name">
                      {b.passenger?.name || b.passenger?.email || "Passageiro"}
                    </div>
                    <div className="booking-email">
                      {b.passenger?.email || ""}
                    </div>
                    <div className="details-sub">
                      {b.seats || 1} lugar
                      {b.seats > 1 ? "es" : ""} reservados
                    </div>
                    <div className={`status-pill ${b.status}`}>
                      {b.status === "pending" && "Pendente"}
                      {b.status === "accepted" && "Aceite"}
                      {b.status === "rejected" && "Recusada"}
                      {b.status === "cancelled" && "Cancelada"}
                    </div>
                  </div>

                  <div className="booking-actions">
                    {b.status === "pending" && (
                      <>
                        <button
                          className="secondary-button small"
                          onClick={() => handleUpdateBooking(b, "rejected")}
                        >
                          Recusar
                        </button>
                        <button
                          className="primary-button small"
                          onClick={() => handleUpdateBooking(b, "accepted")}
                        >
                          Aceitar
                        </button>
                      </>
                    )}

                    {b.status === "accepted" && (
                      <button
                        className="secondary-button small"
                        onClick={() => handleUpdateBooking(b, "cancelled")}
                      >
                        Cancelar
                      </button>
                    )}
                    {isDriver && b.status === "cancelled" && (
                      <button
                        className="primary-button small"
                        onClick={() => handleUpdateBooking(b, "accepted")}
                      >
                        Reverter
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isDriver && (
        <div className="card">
          <h3>Reservar lugares</h3>
          <div className="reserve-row">
            <div>
              <div className="details-label">Numero de lugares</div>
              <select
                className="input"
                style={{ width: "90px" }}
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                disabled={available === 0}
              >
                {Array.from(
                  { length: Math.max(available, 0) },
                  (_, i) => i + 1
                ).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="primary-button"
              onClick={handleBooking}
              disabled={bookingLoading || available === 0 || seats < 1}
            >
              {available === 0
                ? "Esgotado"
                : bookingLoading
                ? "A reservar..."
                : `Reservar ${seats} lugar${seats > 1 ? "es" : ""} - ${totalPrice} EUR`}
            </button>
          </div>

          {bookingMessage && <p className="info-message">{bookingMessage}</p>}
        </div>
      )}

      {showStopSection && (
        <div className="card">
          <h3>Pedidos de paragem</h3>
          <p className="card-subtitle">
            Pedido para desviar ou apanhar alguem. So avanca quando o motorista
            e todos os passageiros aceitam.
          </p>

          {canRequestStop && (
            <div className="stop-form">
              <div className="form-row">
                <div className="field">
                  <label>Local</label>
                  <input
                    className="input"
                    placeholder="Ex: Esposende"
                    value={stopLocation}
                    onChange={(e) => setStopLocation(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Nota (opcional)</label>
                  <input
                    className="input"
                    placeholder="Ex: Posso esperar 5 min"
                    value={stopNote}
                    onChange={(e) => setStopNote(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={handleCreateStopRequest}
                disabled={stopSubmitting || !stopLocation.trim()}
              >
                {stopSubmitting ? "A enviar..." : "Pedir paragem"}
              </button>
            </div>
          )}

          {stopLoading && <p>A carregar pedidos...</p>}
          {stopError && <p className="error">{stopError}</p>}

          {!stopLoading && !stopError && stopRequests.length === 0 && (
            <p className="card-subtitle">
              Ainda nao ha pedidos de paragem para esta boleia.
            </p>
          )}

          {!stopLoading && stopRequests.length > 0 && (
            <div className="stop-list">
              {stopRequests.map((request) => {
                const approvals = request.approvals || [];
                const myApproval = approvals.find((approval) => {
                  const approvalUserId =
                    approval.user?._id ||
                    approval.user?.id ||
                    approval.user;
                  if (!approvalUserId || !currentUserId) return false;
                  return approvalUserId.toString() === currentUserId.toString();
                });
                const isRequester =
                  request.requester?._id === currentUserId ||
                  request.requester?.id === currentUserId;
                const canResetReject = myApproval?.status === "rejected";
                const summary = request.approvalsSummary || {
                  required: approvals.length,
                  approved: approvals.filter(
                    (approval) => approval.status === "approved"
                  ).length,
                };

                return (
                  <div key={request._id} className="stop-item">
                    <div className="stop-main">
                      <div className="stop-title">
                        {request.location}
                      </div>
                      {request.note && (
                        <div className="stop-note">{request.note}</div>
                      )}
                      <div className="stop-meta">
                        Pedido por {request.requester?.name || "Utilizador"} ·{" "}
                        {summary.approved}/{summary.required} aprovados
                      </div>
                      <div className={`status-pill ${request.status}`}>
                        {request.status === "pending" && "Pendente"}
                        {request.status === "voting" && "Em votacao"}
                        {request.status === "approved" && "Aprovado"}
                        {request.status === "rejected" && "Recusado"}
                      </div>
                    </div>

                  <div className="stop-actions">
                    {isDriver && request.status === "voting" && (
                      <>
                        <button
                          className="secondary-button small"
                          onClick={() =>
                            handleStopAction(request._id, "driver-reject")
                          }
                        >
                          Recusar
                        </button>
                        <button
                          className="primary-button small"
                          onClick={() =>
                            handleStopAction(request._id, "driver-approve")
                          }
                        >
                          Aprovar
                        </button>
                      </>
                    )}

                    {canVoteStop && request.status === "voting" && !isRequester && (
                      <>
                        <button
                          className="secondary-button small"
                          onClick={() =>
                            handleStopAction(
                              request._id,
                              "passenger-reject"
                            )
                          }
                          disabled={myApproval?.status === "rejected"}
                        >
                          Recusar
                        </button>
                        <button
                          className="primary-button small"
                          onClick={() =>
                            handleStopAction(
                              request._id,
                              "passenger-approve"
                            )
                          }
                          disabled={myApproval?.status === "approved"}
                        >
                          Aprovar
                        </button>
                      </>
                    )}
                    {!isDriver &&
                      canResetReject &&
                      request.status === "rejected" &&
                      !isRequester && (
                        <button
                          className="secondary-button small"
                          onClick={() =>
                            handleStopAction(request._id, "passenger-reset")
                          }
                        >
                          Cancelar recusa
                        </button>
                      )}
                    {isDriver &&
                      canResetReject &&
                      request.status === "rejected" && (
                        <button
                          className="secondary-button small"
                          onClick={() =>
                            handleStopAction(request._id, "driver-reset")
                          }
                        >
                          Cancelar recusa
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {ride?._id && <RideChat rideId={ride._id} />}
    </AppLayout>
  );
};

export default RideDetailsPage;
