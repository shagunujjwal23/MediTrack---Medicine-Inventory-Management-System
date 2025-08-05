const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');

// Add a new medicine
router.post('/', async (req, res) => {
    try {
        const newMed = new Medicine(req.body);
        const saved = await newMed.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error('Error saving medicine:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all medicines
router.get('/', async (req, res) => {
    try {
        const meds = await Medicine.find().sort({ createdAt: -1 });
        res.json(meds);
    } catch (err) {
        console.error('Error fetching medicines:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get medicines by expiry status
router.get('/expiry-status', async (req, res) => {
    try {
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        const expired = await Medicine.find({ expiryDate: { $lt: today } });
        const expiringSoon = await Medicine.find({ 
            expiryDate: { $gte: today, $lte: thirtyDaysFromNow } 
        });
        const valid = await Medicine.find({ expiryDate: { $gt: thirtyDaysFromNow } });
        
        res.json({ expired, expiringSoon, valid });
    } catch (err) {
        console.error('Error fetching expiry status:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
