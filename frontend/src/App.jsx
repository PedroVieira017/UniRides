// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RidesPage from "./pages/RidesPage";
import RideDetailsPage from "./pages/RideDetailsPage";
import CreateRidePage from "./pages/CreateRidePage";
import ProtectedRoute from "./components/ProtectedRoute";
import MyRidesPage from "./pages/MyRidesPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import MyFavoritesPage from "./pages/MyFavoritesPage";

const App = () => {
  return (
    <Routes>
      {/* Home: lista de boleias */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RidesPage />
          </ProtectedRoute>
        }
      />

      {/* Detalhe da boleia */}
      <Route
        path="/rides/:id"
        element={
          <ProtectedRoute>
            <RideDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* Criar nova boleia */}
      <Route
        path="/rides/new"
        element={
          <ProtectedRoute>
            <CreateRidePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-rides"
        element={
          <ProtectedRoute>
            <MyRidesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <MyFavoritesPage />
          </ProtectedRoute>
        }
      />

      {/* Autenticação */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Qualquer outra rota redireciona para "/" */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>


  );
};

export default App;
