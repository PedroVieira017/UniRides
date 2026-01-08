// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";

const MyFavoritesPage = () => {
  const { token } = useAuth();
  const [favoriteDistricts, setFavoriteDistricts] = useState(new Set());
  const [editingDistricts, setEditingDistricts] = useState(false);
  const [districtDraft, setDistrictDraft] = useState(new Set());
  const [districtSaving, setDistrictSaving] = useState(false);
  const [districtError, setDistrictError] = useState(null);

  const districtOptions = [
    { id: "aveiro", label: "Aveiro" },
    { id: "beja", label: "Beja" },
    { id: "braga", label: "Braga" },
    { id: "braganca", label: "Braganca" },
    { id: "castelo branco", label: "Castelo Branco" },
    { id: "coimbra", label: "Coimbra" },
    { id: "evora", label: "Evora" },
    { id: "faro", label: "Faro" },
    { id: "guarda", label: "Guarda" },
    { id: "leiria", label: "Leiria" },
    { id: "lisboa", label: "Lisboa" },
    { id: "portalegre", label: "Portalegre" },
    { id: "porto", label: "Porto" },
    { id: "santarem", label: "Santarem" },
    { id: "setubal", label: "Setubal" },
    { id: "viana do castelo", label: "Viana do Castelo" },
    { id: "vila real", label: "Vila Real" },
    { id: "viseu", label: "Viseu" },
  ];

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

  useEffect(() => {
    if (editingDistricts) {
      setDistrictDraft(new Set(favoriteDistricts));
      setDistrictError(null);
    }
  }, [editingDistricts, favoriteDistricts]);

  const toggleDistrictDraft = (districtId) => {
    setDistrictDraft((prev) => {
      const next = new Set(prev);
      if (next.has(districtId)) {
        next.delete(districtId);
      } else {
        next.add(districtId);
      }
      return next;
    });
  };

  const handleSaveDistricts = async () => {
    if (!token) return;
    setDistrictSaving(true);
    setDistrictError(null);
    try {
      const res = await api.put(
        "/users/me/favorite-districts",
        { districts: Array.from(districtDraft) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = (res.data?.districts || []).map((value) =>
        value.toString().toLowerCase()
      );
      setFavoriteDistricts(new Set(updated));
      setEditingDistricts(false);
    } catch (err) {
      console.error("Erro a guardar distritos favoritos:", err);
      setDistrictError(
        err?.response?.data?.message || "Nao foi possivel guardar."
      );
    } finally {
      setDistrictSaving(false);
    }
  };

  const favoriteDistrictList = districtOptions.filter((district) =>
    favoriteDistricts.has(district.id)
  );

  return (
    <AppLayout>
      <Link className="link-button" to="/">
        Voltar
      </Link>
      <h2 className="toolbar-title">Boleias favoritas</h2>
      <p className="card-subtitle">
        Personaliza os distritos que queres seguir.
      </p>

      <div className="card favorites-editor">
        <div className="favorites-editor-header">
          <div>
            <h3>Distritos favoritos</h3>
            <p className="card-subtitle">
              Personaliza os distritos para veres rapidamente as tuas zonas.
            </p>
          </div>
          <button
            type="button"
            className="link-button"
            onClick={() => setEditingDistricts((prev) => !prev)}
          >
            {editingDistricts ? "Fechar" : "Editar favoritos"}
          </button>
        </div>

        {favoriteDistrictList.length === 0 && !editingDistricts && (
          <div className="rides-header-empty">
            Ainda nao escolheste distritos favoritos.
          </div>
        )}

        {!editingDistricts && favoriteDistrictList.length > 0 && (
          <div className="favorite-districts">
            {favoriteDistrictList.map((district) => (
              <span key={district.id} className="district-chip active">
                {district.label}
              </span>
            ))}
          </div>
        )}

        {editingDistricts && (
          <>
            {districtError && <div className="error">{districtError}</div>}
            <div className="favorite-districts">
              {districtOptions.map((district) => {
                const isActive = districtDraft.has(district.id);
                return (
                  <button
                    key={district.id}
                    type="button"
                    className={`district-chip ${isActive ? "active" : ""}`}
                    onClick={() => toggleDistrictDraft(district.id)}
                  >
                    {district.label}
                  </button>
                );
              })}
            </div>
            <div className="favorites-editor-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setEditingDistricts(false)}
                disabled={districtSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleSaveDistricts}
                disabled={districtSaving}
              >
                {districtSaving ? "A guardar..." : "Guardar favoritos"}
              </button>
            </div>
          </>
        )}
      </div>

    </AppLayout>
  );
};

export default MyFavoritesPage;
