// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";

const MyBookingsPage = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatLocation = (value) => {
    if (!value) return "";
    const parts = value.split(" - ").map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) return value;
    const district = parts[0];
    const place = parts.slice(1).join(" - ");
    if (place.toLowerCase() == district.toLowerCase()) {
      return district;
    }
    return `${place} (${district})`;
  };

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        const res = await api.get("/bookings/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookings(res.data);
      } catch (err) {
        console.error("Erro a carregar as minhas reservas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookings();
  }, [token]);

  return (
    <AppLayout>
      <h2 className="toolbar-title">As minhas reservas</h2>
      <p className="card-subtitle">
        Pedidos de reserva que fiz como passageiro.
      </p>

      {loading && <p>A carregar...</p>}

      {!loading && bookings.length === 0 && (
        <p className="card-subtitle">
          Ainda não fizeste nenhuma reserva.
        </p>
      )}

      <div className="rides-list">
        {bookings.map((b) => {
          const ride = b.ride;
          const date = new Date(ride.dateTime);
          const dateStr = date.toLocaleDateString("pt-PT", {
            day: "2-digit",
            month: "2-digit",
          });
          const timeStr = date.toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <article key={b._id} className="ride-card">
              <div className="ride-card-main">
                <div className="ride-line">
                  <span className="ride-route">
                    {formatLocation(ride.origin)} -> {formatLocation(ride.destination)}
                  </span>
                  <span className={`status-pill ${b.status}`}>
                    {b.status === "pending" && "Pendente"}
                    {b.status === "accepted" && "Aceite"}
                    {b.status === "rejected" && "Recusada"}
                    {b.status === "cancelled" && "Cancelada"}
                  </span>
                </div>
                <div className="ride-meta-row">
                  <span>
                    {timeStr} · {dateStr}
                  </span>
                  <span>Motorista: {ride.driver?.name}</span>
                </div>
              </div>
              <div className="ride-card-side">
                <Link
                  to={`/rides/${ride._id}`}
                  className="secondary-button small"
                >
                  Ver boleia
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default MyBookingsPage;
