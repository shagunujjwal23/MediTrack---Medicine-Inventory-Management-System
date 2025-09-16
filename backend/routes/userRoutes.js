// routes/userRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { generateToken, protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ========================
// Rate limiter for login
// ========================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
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
// Unified Login (any role)
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
        const { user, reason } = await User.getAuthenticated(login, password);

        if (!user) return res.status(401).json({ success: false, message: reason || 'Invalid credentials' });

        const token = generateToken(user._id);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
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

// ========================
// Create User (Admin only)
// ========================
router.post(
    '/',
    protect,
    authorize('admin'),
    [
        body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required'),
        body('role').optional().isIn(['admin', 'user', 'pharmacist'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            const user = await User.create(req.body);
            res.status(201).json({ success: true, message: 'User created', user });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({ success: false, message: 'Server error during user creation' });
        }
    }
);

// ========================
// Get All Users (Admin only)
// ========================
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, users });
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ success: false, message: 'Error fetching users' });
    }
});

// ========================
// Update User (Admin only)
// ========================
router.put(
    '/:id',
    protect,
    authorize('admin'),
    [
        body('username').optional().isLength({ min: 3 }),
        body('email').optional().isEmail(),
        body('role').optional().isIn(['admin', 'user', 'pharmacist']),
        body('firstName').optional().notEmpty(),
        body('lastName').optional().notEmpty()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
            if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });

            res.json({ success: true, message: 'User updated', user: updatedUser });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ success: false, message: 'Server error during user update' });
        }
    }
);

// ========================
// Delete User (Admin only)
// ========================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Server error during user deletion' });
    }
});

module.exports = router;
