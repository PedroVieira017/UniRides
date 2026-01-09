// frontend/src/api/socket.js
import { io } from "socket.io-client";

const socketBaseUrl =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

const socket = io(socketBaseUrl, {
  autoConnect: false,
});

export default socket;
