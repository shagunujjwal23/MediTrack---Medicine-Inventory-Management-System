const express = require('express');
const router = express.Router();
const RecentActivity = require('../models/recentActivity');

// ===============================
// Get All Recent Activities (latest first)
// ===============================
router.get('/', async (req, res) => {
  try {
    const logs = await RecentActivity.find()
      .sort({ createdAt: -1 })
      .limit(10); // Fetch latest 10
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===============================
// Delete a Single Recent Activity (log only)
// ===============================
router.delete('/:id', async (req, res) => {
  try {
    await RecentActivity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recent activity log deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
