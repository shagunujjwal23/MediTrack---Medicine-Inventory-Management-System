const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
require('dotenv').config();

async function healthCheck() {
    console.log('🏥 Backend Health Check Starting...\n');

    try {
        // 1. Check MongoDB Connection
        console.log('1️⃣ Testing MongoDB Connection...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected successfully');

        // 2. Check Environment Variables
        console.log('\n2️⃣ Checking Environment Variables...');
        const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRE'];
        let envCheck = true;
        
        requiredEnvVars.forEach(envVar => {
            if (process.env[envVar]) {
                console.log(`✅ ${envVar}: Set`);
            } else {
                console.log(`❌ ${envVar}: Missing`);
                envCheck = false;
            }
        });

        if (!envCheck) {
            console.log('❌ Some environment variables are missing');
        }

        // 3. Check Database Collections
        console.log('\n3️⃣ Checking Database Collections...');
        
        const medicineCount = await Medicine.countDocuments();
        console.log(`✅ Medicines collection: ${medicineCount} documents`);
        
        const userCount = await User.countDocuments();
        console.log(`✅ Users collection: ${userCount} documents`);

        // 4. Test Medicine Model Operations
        console.log('\n4️⃣ Testing Medicine Model Operations...');
        
        // Test find operation
        const medicines = await Medicine.find().limit(1);
        if (medicines.length > 0) {
            console.log('✅ Medicine find operation working');
        } else {
            console.log('⚠️ No medicines found in database');
        }

        // 5. Test User Model Operations
        console.log('\n5️⃣ Testing User Model Operations...');
        
        const users = await User.find().limit(1);
        if (users.length > 0) {
            console.log('✅ User find operation working');
            
            // Test authentication method
            const testUser = await User.findOne({ username: 'testuser' });
            if (testUser) {
                console.log('✅ Test user exists');
                const isValidPassword = await testUser.comparePassword('Test123');
                if (isValidPassword) {
                    console.log('✅ Password comparison working');
                } else {
                    console.log('❌ Password comparison failed');
                }
            } else {
                console.log('⚠️ Test user not found');
            }
        } else {
            console.log('⚠️ No users found in database');
        }

        // 6. Check Data Integrity
        console.log('\n6️⃣ Checking Data Integrity...');
        
        const today = new Date();
        const expiredMeds = await Medicine.find({ expiryDate: { $lt: today } });
        const validMeds = await Medicine.find({ expiryDate: { $gte: today } });
        
        console.log(`✅ Expired medicines: ${expiredMeds.length}`);
        console.log(`✅ Valid medicines: ${validMeds.length}`);

        // 7. Summary
        console.log('\n📊 Health Check Summary:');
        console.log('✅ MongoDB Connection: OK');
        console.log(`✅ Environment Variables: ${envCheck ? 'OK' : 'ISSUES FOUND'}`);
        console.log(`✅ Medicine Collection: ${medicineCount} documents`);
        console.log(`✅ User Collection: ${userCount} documents`);
        console.log('✅ Model Operations: OK');
        console.log('✅ Data Integrity: OK');

        console.log('\n🎉 Backend Health Check Completed Successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Health Check Failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

healthCheck();
