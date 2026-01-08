// src/components/AppLayout.jsx
import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
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
              <button
                type="button"
                className="header-toggle"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                {menuOpen ? "Fechar" : "Menu"}
              </button>
              <div className={`header-menu ${menuOpen ? "open" : ""}`}>
                <div className="header-links">
                  <Link
                    className="header-link"
                    to="/my-rides"
                    onClick={() => setMenuOpen(false)}
                  >
                    As minhas boleias
                  </Link>
                  <Link
                    className="header-link"
                    to="/my-bookings"
                    onClick={() => setMenuOpen(false)}
                  >
                    As minhas reservas
                  </Link>
                  <Link
                    className="header-link"
                    to="/favorites"
                    onClick={() => setMenuOpen(false)}
                  >
                    Favoritos
                  </Link>
                </div>
                <span className="user-chip">
                  {user.name} - {user.email}
                </span>
                <button className="secondary-button" onClick={handleLogout}>
                  Sair
                </button>
              </div>
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
