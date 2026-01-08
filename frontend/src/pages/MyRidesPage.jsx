// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";

const MyRidesPage = () => {
  const { token } = useAuth();
  const [rides, setRides] = useState([]);
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
    const fetchMyRides = async () => {
      try {
        const res = await api.get("/rides/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRides(res.data);
      } catch (err) {
        console.error("Erro a carregar as minhas boleias:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyRides();
  }, [token]);

  return (
    <AppLayout>
      <Link className="link-button" to="/">
        Voltar
      </Link>
      <h2 className="toolbar-title">As minhas boleias</h2>
      <p className="card-subtitle">
        Boleias que criaste como motorista.
      </p>

      {loading && <p>A carregar...</p>}

      {!loading && rides.length === 0 && (
        <p className="card-subtitle">
          Ainda não criaste nenhuma boleia.
        </p>
      )}

      <div className="rides-list">
        {rides.map((ride) => {
          const date = new Date(ride.dateTime);
          const dateStr = date.toLocaleDateString("pt-PT", {
            day: "2-digit",
            month: "2-digit",
          });
          const timeStr = date.toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const occupied = ride.seatsTotal - ride.seatsAvailable;

          return (
            <article key={ride._id} className="ride-card">
              <div className="ride-card-main">
                <div className="ride-line">
                  <span className="ride-route">
                    {formatLocation(ride.origin)} {" -> "}{" "}
                    {formatLocation(ride.destination)}
                  </span>
                  <span className="ride-tag">As minhas boleias</span>
                </div>
                <div className="ride-meta-row">
                  <span>
                    {timeStr} · {dateStr}
                  </span>
                  <span>
                    Lugares: {occupied}/{ride.seatsTotal}
                  </span>
                </div>
              </div>
              <div className="ride-card-side">
                <Link
                  to={`/rides/${ride._id}`}
                  className="secondary-button small"
                >
                  Ver detalhes
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default MyRidesPage;
