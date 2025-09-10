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
        today.setHours(0, 0, 0, 0); // normalize to midnight
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

        const expired = await Medicine.find({ expiryDate: { $lte: today } });
        const expiringSoon = await Medicine.find({ 
            expiryDate: { $gt: today, $lte: thirtyDaysFromNow } 
        });
        const valid = await Medicine.find({ expiryDate: { $gt: thirtyDaysFromNow } });

        res.json({
            expired: {
                count: expired.length,
                medicines: expired.map(med => ({ name: med.name, expiryDate: med.expiryDate }))
            },
            expiringSoon: {
                count: expiringSoon.length,
                medicines: expiringSoon.map(med => ({ name: med.name, expiryDate: med.expiryDate }))
            },
            valid: {
                count: valid.length,
                medicines: valid.map(med => ({ name: med.name, expiryDate: med.expiryDate }))
            }
        });
    } catch (err) {
        console.error('Error fetching expiry status:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a medicine by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedMedicine = await Medicine.findByIdAndDelete(req.params.id);
        if (!deletedMedicine) {
            return res.status(404).json({ success: false, message: "Medicine not found" });
        }
        res.json({ success: true, message: "Medicine deleted successfully" });
    } catch (err) {
        console.error('Error deleting medicine:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
