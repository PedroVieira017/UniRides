// src/api/client.js
import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  withCredentials: false,
});

export default api;
