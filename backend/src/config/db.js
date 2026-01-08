// backend/src/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MONGODB_URI não está definido no .env");
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: "unirides",
    });

    console.log("✅ MongoDB ligado em:", conn.connection.host);
  } catch (err) {
    console.error("❌ Erro a ligar ao MongoDB:", err.message);
    // Em desenvolvimento não vamos matar o servidor,
    // mas em produção provavelmente deveríamos fazer process.exit(1)
  }
};

module.exports = connectDB;
