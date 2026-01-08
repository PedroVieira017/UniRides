// backend/src/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const rideRoutes = require("./routes/rideRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const messageRoutes = require("./routes/messageRoutes"); // NOVO
const alertRoutes = require("./routes/alertRoutes");
const stopRequestRoutes = require("./routes/stopRequestRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const server = http.createServer(app);

// --- Socket.IO ---
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// guardar io na app para usar nos controllers
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🟢 Novo cliente ligado", socket.id);

  // cliente entra na sala da boleia
  socket.on("join-ride", (rideId) => {
    socket.join(rideId);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Cliente saiu", socket.id);
  });
});

// --- middlewares base ---
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);
app.use(express.json());

// endpoint de health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "UniRides API a funcionar" });
});

// rotas REST
app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api", bookingRoutes);
app.use("/api", messageRoutes); // NOVO
app.use("/api/alerts", alertRoutes);
app.use("/api", stopRequestRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Servidor UniRides em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Erro a iniciar servidor:", err);
  }
};

startServer();
