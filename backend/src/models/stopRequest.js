// backend/src/models/stopRequest.js
const mongoose = require("mongoose");

const StopRequestSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "voting", "approved", "rejected"],
      default: "pending",
    },
    approvals: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["approved", "rejected"],
          required: true,
        },
        decidedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const StopRequest =
  mongoose.models.StopRequest || mongoose.model("StopRequest", StopRequestSchema);

module.exports = StopRequest;
