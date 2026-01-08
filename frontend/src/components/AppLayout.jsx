// src/components/AppLayout.jsx
import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const hideToolbarRoutes = new Set(["/rides/new", "/favorites"]);
  const hideToolbar = hideToolbarRoutes.has(location.pathname);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-left">
          <div className="logo-circle">
            <span className="logo-icon">U</span>
          </div>
          <div>
            <div className="app-title">UniRides</div>
            <div className="app-subtitle">Sistema de partilha de boleias</div>
          </div>
        </div>

        <div className="app-header-right">
          {user && (
            <>
              <div className="header-links">
                <Link className="header-link" to="/my-rides">
                  As minhas boleias
                </Link>
                <Link className="header-link" to="/my-bookings">
                  As minhas reservas
                </Link>
                <Link className="header-link" to="/favorites">
                  Favoritos
                </Link>
              </div>
              <span className="user-chip">
                {user.name} - {user.email}
              </span>
              <button className="secondary-button" onClick={handleLogout}>
                Sair
              </button>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        {!hideToolbar && (
          <div className="toolbar">
            <div>
              <div className="toolbar-title">
                Encontra ou oferece boleias
              </div>
              <div className="toolbar-subtitle">
                Pesquisa boleias partilhadas por colegas ou cria a tua boleia.
              </div>
            </div>

            <Link to="/rides/new" className="primary-button">
              + Criar Boleia
            </Link>
          </div>
        )}

        {children}
      </main>
    </div>
  );
};

export default AppLayout;
