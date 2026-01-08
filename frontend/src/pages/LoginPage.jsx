// src/pages/LoginPage.jsx
// @ts-nocheck
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Erro no login. Verifica as credenciais e tenta novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <div className="auth-logo-circle">
            <span className="auth-logo-icon" aria-hidden="true">
              U
            </span>
          </div>
          <div>
            <h1 className="auth-title">Entrar na UniRides</h1>
            <p className="auth-subtitle">
              Acede a tua conta para encontrar ou oferecer boleias com colegas.
            </p>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ex: escola@ipvc.pt"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Palavra-passe</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Minimo 6 caracteres"
            />
          </div>

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <p className="auth-footer">
          Ainda nao tens conta? <Link to="/register">Regista-te aqui</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
