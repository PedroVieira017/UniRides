// @ts-nocheck
// src/pages/RidesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";

const RidesPage = () => {
  const { token } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [recurringWeekday, setRecurringWeekday] = useState("");
  const [recurringTime, setRecurringTime] = useState("");
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
  const [favoriteDistricts, setFavoriteDistricts] = useState(new Set());

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

  const localityToDistrict = {
    benfica: "lisboa",
    amadora: "lisboa",
    oeiras: "lisboa",
    cascais: "lisboa",
    sintra: "lisboa",
    loures: "lisboa",
    odivelas: "lisboa",
    almada: "setubal",
    seixal: "setubal",
    barreiro: "setubal",
    setubal: "setubal",
    gaia: "porto",
    "vila nova de gaia": "porto",
    gondomar: "porto",
    maia: "porto",
    matosinhos: "porto",
  };

  const normalizeText = (value) => {
    if (!value) return "";
    return value
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const localityEntries = Object.entries(localityToDistrict).map(
    ([locality, district]) => [normalizeText(locality), normalizeText(district)]
  );

  const expandWithDistricts = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return "";
    const districts = new Set();
    for (const [locality, district] of localityEntries) {
      if (normalized.includes(locality)) {
        districts.add(district);
      }
    }
    const districtText = Array.from(districts).join(" ");
    return `${normalized} ${districtText}`.trim();
  };

  const regionOptions = [
    {
      id: "north",
      label: "Portugal Norte",
      hint: "Braga, Porto, Guimaraes",
      keywords: [
        "braga",
        "porto",
        "guimaraes",
        "viana",
        "vila real",
        "braganca",
        "chaves",
      ],
    },
    {
      id: "center",
      label: "Portugal Centro",
      hint: "Coimbra, Aveiro, Viseu",
      keywords: [
        "coimbra",
        "aveiro",
        "viseu",
        "leiria",
        "guarda",
        "castelo branco",
      ],
    },
    {
      id: "south",
      label: "Portugal Sul",
      hint: "Lisboa, Setubal, Faro",
      keywords: [
        "lisboa",
        "setubal",
        "evora",
        "beja",
        "faro",
        "algarve",
      ],
    },
    {
      id: "europe",
      label: "Uniao Europeia",
      hint: "Madrid, Paris, Roma",
      keywords: [
        "madrid",
        "paris",
        "roma",
        "barcelona",
        "berlim",
        "bruxelas",
        "amsterdam",
        "londres",
      ],
    },
  ];

  const weekdayOptions = [
    { value: "1", label: "Segunda" },
    { value: "2", label: "Terca" },
    { value: "3", label: "Quarta" },
    { value: "4", label: "Quinta" },
    { value: "5", label: "Sexta" },
    { value: "6", label: "Sabado" },
    { value: "0", label: "Domingo" },
  ];

  const parseTimeToMinutes = (timeValue) => {
    if (!timeValue) return null;
    const [hoursStr, minutesStr] = timeValue.split(":");
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
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

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await api.get("/rides");
        setRides(res.data);
      } catch (err) {
        console.error("Erro a carregar boleias:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!token) return;
      try {
        const res = await api.get("/users/me/favorite-districts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const districts = (res.data?.districts || []).map((value) =>
          value.toString().toLowerCase()
        );
        setFavoriteDistricts(new Set(districts));
      } catch (err) {
        console.error("Erro a carregar distritos favoritos:", err);
      }
    };

    fetchDistricts();
  }, [token]);

  const recurringTimeMinutes = useMemo(
    () => parseTimeToMinutes(recurringTime),
    [recurringTime]
  );

  const matchesRecurring = (ride, weekdayValue, timeMinutes) => {
    const date = new Date(ride.dateTime);
    const weekdayMatch =
      !weekdayValue || date.getDay() === Number(weekdayValue);
    const rideMinutes = date.getHours() * 60 + date.getMinutes();
    const timeMatch =
      timeMinutes === null || timeMinutes === rideMinutes;
    return weekdayMatch && timeMatch;
  };

  const filteredRides = rides.filter((ride) => {
    const rideSearchText = expandWithDistricts(
      `${ride.origin} ${ride.destination}`
    );
    const matchesSearch =
      search.trim().length === 0 ||
      rideSearchText.includes(normalizeText(search));

    const originText = expandWithDistricts(ride.origin);
    const matchesOrigin =
      originFilter.trim().length === 0 ||
      originText.includes(normalizeText(originFilter));

    const destinationText = expandWithDistricts(ride.destination);
    const matchesDestination =
      destinationFilter.trim().length === 0 ||
      destinationText.includes(normalizeText(destinationFilter));

    const matchesDate =
      !dateFilter ||
      new Date(ride.dateTime).toISOString().slice(0, 10) === dateFilter;

    const selectedRegion = regionOptions.find(
      (region) => region.id === regionFilter
    );
    const regionKeywords = selectedRegion?.keywords || [];
    const rideText = rideSearchText;
    const matchesRegion =
      regionFilter.length === 0 ||
      regionKeywords.some((keyword) => rideText.includes(keyword));

    const matchesRecurringFilters = matchesRecurring(
      ride,
      recurringWeekday,
      recurringTimeMinutes
    );

    const matchesFavorites = true;

    return (
      matchesSearch &&
      matchesOrigin &&
      matchesDestination &&
      matchesDate &&
      matchesRegion &&
      matchesRecurringFilters &&
      matchesFavorites
    );
  });

  const showResults =
    search.trim() ||
    originFilter.trim() ||
    destinationFilter.trim() ||
    dateFilter ||
    regionFilter ||
    recurringWeekday ||
    recurringTime ||
    false;

  const districtCandidates = districtOptions.map((district) =>
    normalizeText(district)
  );
  const getRideDistrictMatches = (value) => {
    const normalized = expandWithDistricts(value);
    const matches = new Set();
    for (const district of districtCandidates) {
      if (normalized.includes(district)) {
        matches.add(district);
      }
    }
    return matches;
  };

  const favoriteDistrictRides = rides.filter((ride) => {
    if (favoriteDistricts.size === 0) return false;
    const originMatches = getRideDistrictMatches(ride.origin);
    const destinationMatches = getRideDistrictMatches(ride.destination);
    const originOk = Array.from(originMatches).some((district) =>
      favoriteDistricts.has(district)
    );
    const destinationOk = Array.from(destinationMatches).some((district) =>
      favoriteDistricts.has(district)
    );
    return originOk || destinationOk;
  });
  const showFavoriteMatches = !showResults && favoriteDistrictRides.length > 0;
  const ridesToShow = showFavoriteMatches ? favoriteDistrictRides : filteredRides;

  return (
    <AppLayout>
      <section className="hero">
        <div className="hero-content">
          <p className="hero-tag">Boleias para estudantes</p>
          <h1 className="hero-title">
            Parte contigo, chega com tempo, conhece colegas.
          </h1>
          <p className="hero-subtitle">
            Pesquisa boleias por zona ou escreve o teu destino para ver as
            opcoes disponiveis.
          </p>

          <div className="hero-search">
            <input
              className="input hero-input"
              placeholder="Procura origem ou destino"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="primary-button" type="button">
              Pesquisar
            </button>
          </div>

          <div className="region-grid">
            {regionOptions.map((region) => (
              <button
                key={region.id}
                type="button"
                className={`region-card ${
                  regionFilter === region.id ? "active" : ""
                }`}
                onClick={() =>
                  setRegionFilter((prev) =>
                    prev === region.id ? "" : region.id
                  )
                }
              >
                <div className="region-card-title">{region.label}</div>
                <div className="region-card-hint">{region.hint}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-orbit" />
          <div className="hero-map-card">
            <div className="hero-map-title">Rotas populares</div>
            <div className="hero-map-row">
              <span>Porto</span>
              <span className="hero-map-arrow">-</span>
              <span>Braga</span>
            </div>
            <div className="hero-map-row">
              <span>Lisboa</span>
              <span className="hero-map-arrow">-</span>
              <span>Coimbra</span>
            </div>
            <div className="hero-map-row">
              <span>Aveiro</span>
              <span className="hero-map-arrow">-</span>
              <span>Guimaraes</span>
            </div>
          </div>
        </div>
      </section>

      <div className="filters-card">
        <input
          className="input"
          placeholder="Pesquisar boleias"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

          <div className="filters-row">
            <div className="field">
              <label>Origem</label>
              <input
                className="input"
                placeholder="Ex: Braga"
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Destino</label>
              <input
                className="input"
                placeholder="Ex: Guimaraes"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Data</label>
              <input
                className="input"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="filters-row">
            <div className="field">
              <label>Dia da semana</label>
              <select
                className="input"
                value={recurringWeekday}
                onChange={(e) => setRecurringWeekday(e.target.value)}
              >
                <option value="">Qualquer dia</option>
                {weekdayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Hora</label>
              <input
                className="input"
                type="time"
                value={recurringTime}
                onChange={(e) => setRecurringTime(e.target.value)}
              />
            </div>
          </div>

        </div>

      {!showResults && !showFavoriteMatches && (
        <div className="empty-state">
          <div className="empty-title">Escolhe uma zona ou pesquisa.</div>
          <p className="empty-subtitle">
            As boleias aparecem aqui assim que pesquisas ou selecionas uma
            regiao.
          </p>
        </div>
      )}

      {(showResults || showFavoriteMatches) && (
        <>
          <div className="rides-header-row">
            <span className="rides-count">
              {showFavoriteMatches
                ? `${favoriteDistrictRides.length} boleias nos teus distritos favoritos`
                : `${filteredRides.length} boleias disponiveis`}
            </span>
            {showResults && (
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setSearch("");
                  setOriginFilter("");
                  setDestinationFilter("");
                  setDateFilter("");
                  setRegionFilter("");
                  setRecurringWeekday("");
                  setRecurringTime("");
                }}
              >
                Limpar pesquisa
              </button>
            )}
          </div>

          {loading ? (
            <p>A carregar boleias...</p>
          ) : ridesToShow.length === 0 ? (
            <p>Nenhuma boleia encontrada com os filtros aplicados.</p>
          ) : (
            <div className="rides-list">
              {ridesToShow.map((ride) => {
                const date = new Date(ride.dateTime);
                const dateStr = date.toLocaleDateString("pt-PT", {
                  day: "2-digit",
                  month: "2-digit",
                });
                const timeStr = date.toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const arrival = ride.estimatedArrivalTime
                  ? new Date(ride.estimatedArrivalTime)
                  : null;
                const arrivalStr = arrival
                  ? arrival.toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null;

                const occupied = ride.seatsTotal - ride.seatsAvailable;
                const isFull = ride.seatsAvailable === 0;

                return (
                  <article key={ride._id} className="ride-card">
                    <div className="ride-card-main">
                      <div className="ride-line">
                        <span className="ride-route">
                          {formatLocation(ride.origin)} {" -> "}{" "}
                          {formatLocation(ride.destination)}
                        </span>
                      </div>

                      <div className="ride-meta-row">
                        <span>
                          {timeStr} - {dateStr}
                        </span>
                        {arrivalStr && <span>Chegada {arrivalStr}</span>}
                        <span>
                          {ride.driver?.name} -{" "}
                          {(ride.driver?.rating || 4.5).toFixed(1)}
                        </span>
                        <span>{ride.pricePerSeat.toFixed(2)} EUR</span>
                      </div>

                      <div className="ride-meeting">
                        <span className="dot" />
                        {ride.meetingPoint}
                      </div>

                      {ride.possibleStops?.length > 0 && (
                        <div className="ride-stops">
                          {ride.possibleStops.slice(0, 3).map((stop) => (
                            <span key={stop} className="tag">
                              {stop}
                            </span>
                          ))}
                          {ride.possibleStops.length > 3 && (
                            <span className="tag tag-muted">
                              +{ride.possibleStops.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ride-card-side">
                      <div className="seats-pill">
                        {occupied}/{ride.seatsTotal}
                      </div>
                      <Link
                        to={`/rides/${ride._id}`}
                        className="secondary-button small"
                      >
                        {isFull ? "Esgotado" : "Ver Detalhes"}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
};

export default RidesPage;
