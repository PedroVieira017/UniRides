const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },

    // ✅ validação extra no model
    dateTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "A data da boleia tem de ser no futuro",
      },
    },

    meetingPoint: { type: String, required: true },
    pricePerSeat: { type: Number, required: true, min: 0 },
    seatsTotal: { type: Number, required: true, min: 1 },
    seatsAvailable: { type: Number, required: true, min: 0 },
    notes: { type: String },
    estimatedArrivalTime: { type: Date },
    possibleStops: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

const Ride = mongoose.models.Ride || mongoose.model("Ride", RideSchema);

module.exports = Ride;
