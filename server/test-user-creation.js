#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

// Define a simple user schema for testing
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true },
  apiKeys: [{
    name: String,
    key: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }]
});

// Add sparse index
userSchema.index({ 'apiKeys.key': 1 }, { sparse: true });

const User = mongoose.model('User', userSchema);

async function testUserCreation() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const randomId = Math.random().toString(36).substring(2, 10);
    const userData = {
      username: `user${randomId}`,
      email: `user${randomId}@example.com`,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    console.log('Creating user:', userData.username);
    const user = new User(userData);
    await user.save();
    console.log('✅ User created successfully!');

    // Try creating another user to see if we still get duplicate key error
    const userData2 = {
      username: 'testuser002',
      email: 'testuser002@example.com', 
      password: 'password123',
      firstName: 'Test',
      lastName: 'User2'
    };

    console.log('Creating second user:', userData2.username);
    const user2 = new User(userData2);
    await user2.save();
    console.log('✅ Second user created successfully!');

    console.log('Both users created without duplicate key error on apiKeys!');

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testUserCreation();