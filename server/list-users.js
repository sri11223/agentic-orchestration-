#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

async function listUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.username} (${user.email})`);
    });

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

listUsers();