import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As palavras-passe nao coincidem.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", { name, email, password });
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Erro no registo. Verifica os dados introduzidos."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card auth-card">
        <div className="auth-header">
          <div className="auth-logo-circle">
            <span className="auth-logo-icon" aria-hidden="true">
              U
            </span>
          </div>
          <div>
            <h1 className="auth-title">Criar conta UniRides</h1>
            <p className="auth-subtitle">
              Junta-te a colegas que partilham boleias para o campus.
            </p>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label htmlFor="name">Nome</label>
            <input
              id="name"
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Ana Martins"
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email academico</label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ex: nome@alunos.uminho.pt"
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

          <div className="field">
            <label htmlFor="confirmPassword">Confirmar palavra-passe</label>
            <input
              id="confirmPassword"
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repete a palavra-passe"
            />
          </div>

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? "A registar..." : "Criar conta"}
          </button>
        </form>

        <p className="auth-footer">
          Ja tens conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
