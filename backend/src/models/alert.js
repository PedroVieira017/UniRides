// backend/src/models/alert.js
const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    weekday: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    timeMinutes: {
      type: Number,
      required: true,
      min: 0,
      max: 1439,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Alert = mongoose.models.Alert || mongoose.model("Alert", AlertSchema);

module.exports = Alert;
