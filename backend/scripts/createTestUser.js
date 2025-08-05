const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createTestUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check if test user already exists
        const existingUser = await User.findOne({ username: 'testuser' });
        if (existingUser) {
            console.log('ℹ️ Test user already exists');
            process.exit(0);
        }

        // Create test user
        const testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'Test123',
            firstName: 'Test',
            lastName: 'User',
            role: 'admin'
        });

        console.log('✅ Test user created successfully');
        console.log('📋 Login credentials:');
        console.log('   Username: testuser');
        console.log('   Password: Test123');
        console.log('   Email: test@example.com');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestUser();
