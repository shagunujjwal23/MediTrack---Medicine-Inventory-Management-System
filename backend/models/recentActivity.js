const express = require('express');
const router = express.Router();
const RecentActivity = require('../models/recentActivity');

// Get all recent activities
router.get('/', async (req, res) => {
  try {
    const activities = await RecentActivity.find().sort({ createdAt: -1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new activity
router.post('/', async (req, res) => {
  try {
    const { medicineName } = req.body;
    const activity = new RecentActivity({ medicineName });
    const savedActivity = await activity.save();
    res.status(201).json(savedActivity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an activity (only from log)
router.delete('/:id', async (req, res) => {
  try {
    const deletedActivity = await RecentActivity.findByIdAndDelete(req.params.id);
    if (!deletedActivity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.json({ message: "Activity removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
