// backend/src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Erro no authMiddleware:", err.message);

      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Token expirado. Faça login novamente." });
      }

      return res.status(401).json({ message: "Token inválido." });
    }

    const user = await User.findById(decoded.sub).select("-passwordHash");

    if (!user) {
      return res.status(401).json({ message: "Utilizador não encontrado" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Erro no authMiddleware (bloco externo):", err.message);
    return res.status(500).json({ message: "Erro na autenticação" });
  }
};

module.exports = authMiddleware;
