// routes/userRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// ========================
// Rate limiting
// ========================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ========================
// Validation rules
// ========================
const loginValidation = [
    body('login').trim().notEmpty().withMessage('Username or email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// ========================
// Admin Login (DB-based)
// ========================
router.post('/login', loginLimiter, loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
            });
        }

        const { login, password } = req.body;

        // 🔹 Ensure admin exists
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            admin = await User.create({
                username: 'Shagun',
                email: 'shagun@gmail.com',
                password: 'Shagun@23',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin'
            });
        }

        // 🔹 Authenticate using model static method
        const { user, reason } = await User.getAuthenticated(login, password);

        if (!user) {
            return res.status(401).json({ success: false, message: reason || 'Invalid credentials' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
        }

        // 🔹 Success
        const token = generateToken(user._id);
        return res.status(200).json({
            success: true,
            message: 'Admin login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

module.exports = router;
