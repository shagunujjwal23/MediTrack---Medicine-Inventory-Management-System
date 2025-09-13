const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// ===========================
// Create a new notification
// ===========================
router.post("/", async (req, res) => {
  try {
    const { message, type } = req.body;

    const notification = new Notification({ message, type });
    await notification.save();

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating notification", error });
  }
});

// ===========================
// Get all notifications
// ===========================
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching notifications", error });
  }
});

// ===========================
// Mark a single notification as read
// ===========================
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating notification", error });
  }
});

// ===========================
// Clear all notifications
// ===========================
router.delete("/clear", async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error clearing notifications", error });
  }
});

module.exports = router;
