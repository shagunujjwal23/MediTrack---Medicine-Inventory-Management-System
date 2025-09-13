const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "error", "success"],
      default: "info",
    },
    read: {
      type: Boolean,
      default: false, // initially unread
    },
  },
  {
    timestamps: true, // createdAt and updatedAt
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
