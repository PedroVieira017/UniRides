// @ts-nocheck
// src/pages/CreateRidePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";

const CreateRidePage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [originDistrict, setOriginDistrict] = useState("");
  const [originPlace, setOriginPlace] = useState("");
  const [destinationDistrict, setDestinationDistrict] = useState("");
  const [destinationPlace, setDestinationPlace] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [seatsTotal, setSeatsTotal] = useState(3);
  const [pricePerSeat, setPricePerSeat] = useState(2.5);
  const [meetingPoint, setMeetingPoint] = useState("");
  const [stops, setStops] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const districtOptions = [
    "Aveiro",
    "Beja",
    "Braga",
    "Braganca",
    "Castelo Branco",
    "Coimbra",
    "Evora",
    "Faro",
    "Guarda",
    "Leiria",
    "Lisboa",
    "Portalegre",
    "Porto",
    "Santarem",
    "Setubal",
    "Viana do Castelo",
    "Vila Real",
    "Viseu",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (
      !originDistrict ||
      !originPlace.trim() ||
      !destinationDistrict ||
      !destinationPlace.trim()
    ) {
      setError("Seleciona o distrito e indica a localidade.");
      return;
    }

    if (!date || !time) {
      setError("Seleciona data e hora de partida.");
      return;
    }

    const isoDateTime = new Date(`${date}T${time}`).toISOString();
    const isoArrivalTime = arrivalTime
      ? new Date(`${date}T${arrivalTime}`).toISOString()
      : undefined;
    const possibleStops = stops
      .split(",")
      .map((stop) => stop.trim())
      .filter(Boolean);

    const origin = `${originDistrict} - ${originPlace.trim()}`;
    const destination = `${destinationDistrict} - ${destinationPlace.trim()}`;

    const payload = {
      origin,
      destination,
      dateTime: isoDateTime,
      estimatedArrivalTime: isoArrivalTime,
      possibleStops,
      meetingPoint,
      notes,
      pricePerSeat: Number(pricePerSeat),
      seatsTotal: Number(seatsTotal),
      seatsAvailable: Number(seatsTotal),
    };

    setSaving(true);
    try {
      const res = await api.post("/rides", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate(`/rides/${res.data._id}`);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Nao foi possivel criar a boleia. Tenta novamente."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <button className="link-button" onClick={() => navigate(-1)}>
        Voltar
      </button>

      <div className="card">
        <h2>Criar nova boleia</h2>
        <p className="card-subtitle">
          Preenche os detalhes da tua boleia para a partilhares com colegas.
        </p>

        <form className="ride-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label>Distrito de origem *</label>
              <select
                className="input"
                value={originDistrict}
                onChange={(e) => setOriginDistrict(e.target.value)}
                required
              >
                <option value="">Seleciona distrito</option>
                {districtOptions.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Localidade de origem *</label>
              <input
                className="input"
                placeholder="Ex: Braga, Famalicao, Benfica"
                value={originPlace}
                onChange={(e) => setOriginPlace(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Distrito de destino *</label>
              <select
                className="input"
                value={destinationDistrict}
                onChange={(e) => setDestinationDistrict(e.target.value)}
                required
              >
                <option value="">Seleciona distrito</option>
                {districtOptions.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Localidade de destino *</label>
              <input
                className="input"
                placeholder="Ex: Guimaraes (Campus)"
                value={destinationPlace}
                onChange={(e) => setDestinationPlace(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Data *</label>
              <input
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Hora de partida *</label>
              <input
                className="input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Hora prevista de chegada</label>
              <input
                className="input"
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                placeholder="Ex: 18:30"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Lugares disponiveis *</label>
              <input
                className="input"
                type="number"
                min={1}
                max={8}
                value={seatsTotal}
                onChange={(e) => setSeatsTotal(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Preco por pessoa (opcional)</label>
              <input
                className="input"
                type="number"
                step="0.1"
                value={pricePerSeat}
                onChange={(e) => setPricePerSeat(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Ponto de encontro *</label>
            <input
              className="input"
              placeholder="Ex: Estacao CP Braga"
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Paragens possiveis (opcional)</label>
            <input
              className="input"
              placeholder="Ex: Famalicao, Trofa, Maia"
              value={stops}
              onChange={(e) => setStops(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Notas adicionais (opcional)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Ex: Saida pontual. Posso fazer uma paragem rapida."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="error">{error}</p>}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "A criar..." : "Criar boleia"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default CreateRidePage;
