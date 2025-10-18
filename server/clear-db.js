#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

async function clearDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    
    // Drop the entire users collection to start fresh
    console.log('Dropping users collection...');
    try {
      await db.collection('users').drop();
      console.log('✅ Users collection dropped');
    } catch (err) {
      console.log('Collection might not exist:', err.message);
    }

    await mongoose.disconnect();
    console.log('✅ Database cleared! Ready for fresh testing.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

clearDatabase();