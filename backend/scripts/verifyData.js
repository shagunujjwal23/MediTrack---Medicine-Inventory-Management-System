const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
require('dotenv').config();

async function verifyData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const medicines = await Medicine.find().sort({ createdAt: -1 });
        console.log(`\n📊 Total medicines in database: ${medicines.length}`);
        
        const today = new Date();
        let expired = 0;
        let expiring = 0;
        let valid = 0;
        let lowStock = 0;
        let totalValue = 0;

        console.log('\n📋 Medicine Details:');
        medicines.forEach((med, index) => {
            const expDate = new Date(med.expiryDate);
            const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
            
            let status = '';
            if (daysUntilExpiry < 0) {
                status = '❌ EXPIRED';
                expired++;
            } else if (daysUntilExpiry <= 30) {
                status = '⚠️ EXPIRING SOON';
                expiring++;
            } else {
                status = '✅ VALID';
                valid++;
            }

            if (med.quantity <= 2) {
                lowStock++;
            }

            totalValue += (med.quantity * med.price);

            console.log(`${index + 1}. ${med.name}`);
            console.log(`   Batch: ${med.batchNo}`);
            console.log(`   Quantity: ${med.quantity} ${med.unit}`);
            console.log(`   Price: ₹${med.price}`);
            console.log(`   Expiry: ${expDate.toDateString()} (${daysUntilExpiry} days)`);
            console.log(`   Status: ${status}`);
            console.log('');
        });

        console.log('📈 Summary:');
        console.log(`   Total Medicines: ${medicines.length}`);
        console.log(`   Expired: ${expired}`);
        console.log(`   Expiring Soon: ${expiring}`);
        console.log(`   Valid: ${valid}`);
        console.log(`   Low Stock (≤2): ${lowStock}`);
        console.log(`   Total Value: ₹${totalValue.toFixed(2)}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verifyData();
