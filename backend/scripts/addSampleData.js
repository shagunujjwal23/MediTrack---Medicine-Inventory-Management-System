const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
require('dotenv').config();

// Sample medicine data
const sampleMedicines = [
    {
        name: "Paracetamol",
        batchNo: "PAR001",
        quantity: 50,
        unit: "tablets",
        price: 10.50,
        expiryDate: new Date('2025-12-31')
    },
    {
        name: "Aspirin",
        batchNo: "ASP002",
        quantity: 1,
        unit: "strips",
        price: 15.75,
        expiryDate: new Date('2024-06-15')
    },
    {
        name: "Amoxicillin",
        batchNo: "AMX003",
        quantity: 2,
        unit: "strips",
        price: 25.00,
        expiryDate: new Date('2024-03-20')
    },
    {
        name: "Ibuprofen",
        batchNo: "IBU004",
        quantity: 30,
        unit: "tablets",
        price: 12.25,
        expiryDate: new Date('2026-01-15')
    },
    {
        name: "Cough Syrup",
        batchNo: "CS005",
        quantity: 1,
        unit: "bottle",
        price: 45.00,
        expiryDate: new Date('2023-11-30') // Expired
    }
];

async function addSampleData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Medicine.deleteMany({});
        console.log('🗑️ Cleared existing medicine data');

        // Add sample data
        const result = await Medicine.insertMany(sampleMedicines);
        console.log(`✅ Added ${result.length} sample medicines`);

        // Display summary
        const total = await Medicine.countDocuments();
        const expired = await Medicine.countDocuments({ expiryDate: { $lt: new Date() } });
        const lowStock = await Medicine.countDocuments({ quantity: { $lte: 2 } });

        console.log('\n📊 Summary:');
        console.log(`Total medicines: ${total}`);
        console.log(`Expired medicines: ${expired}`);
        console.log(`Low stock medicines: ${lowStock}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addSampleData();
