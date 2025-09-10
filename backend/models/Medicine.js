const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },       // Medicine name
  batchNo: { type: String, required: true },    // Batch number
  category: { type: String, default: 'General' }, // Default category if not provided
  quantity: { type: Number, required: true },   // Stock quantity
  unit: { type: String, default: 'Tablets' },   // Default unit
  price: { type: Number, required: true },      // Price per unit
  expiryDate: { type: Date, required: true },   // Expiry date
  manufacturer: { type: String, default: 'N/A' }, // Default manufacturer
  purchaseDate: { type: Date, default: Date.now } // When the stock was purchased
}, { timestamps: true }); // Automatically adds createdAt & updatedAt

module.exports = mongoose.model('Medicine', medicineSchema);
