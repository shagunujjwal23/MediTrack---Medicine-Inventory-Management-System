const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');  // ✅ Added
require('dotenv').config();

const app = express();

// ========================
// Security middleware
// ========================
app.use(helmet());

// ========================
// Rate limiting
// ========================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  }
});
app.use(limiter);

// ========================
// CORS configuration
// ========================
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    null
  ],
  credentials: true
}));

// ========================
// Body parser
// ========================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================
// Serve static frontend files
// ========================
app.use(express.static(path.join(__dirname, '../frontend')));

// ========================
// MongoDB connection
// ========================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// ========================
// API Routes
// ========================
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes')); // ✅ Notifications
app.use("/api/reports", require('./routes/reportRoutes'));

// ========================
// Root route to load dashboard
// ========================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/html/dashboard.html'));
});

// ========================
// Start server
// ========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
