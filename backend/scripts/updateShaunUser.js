const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function updateShaunUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check if Shagun user exists (case-insensitive)
        const existingUser = await User.findOne({ 
            username: { $regex: new RegExp('^shagun$', 'i') }
        });
        
        if (existingUser) {
            console.log('ℹ️ Found existing user:', existingUser.username);
            console.log('🔄 Updating username to "Shagun" and password to "Shagun123"...');
            
            // Update username and password
            existingUser.username = 'Shagun';
            existingUser.password = 'Shagun123';
            await existingUser.save();
            
            console.log('✅ User updated successfully');
        } else {
            console.log('ℹ️ Shagun user not found, creating new user...');
            
            // Create new Shagun user
            const newUser = await User.create({
                username: 'Shagun',
                email: 'shagun@example.com',
                password: 'Shagun123',
                firstName: 'Shagun',
                lastName: 'User',
                role: 'admin'
            });
            
            console.log('✅ Shagun user created successfully');
        }
        
        console.log('📋 Updated Login credentials:');
        console.log('   Username: Shagun');
        console.log('   Password: Shagun123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateShaunUser();
