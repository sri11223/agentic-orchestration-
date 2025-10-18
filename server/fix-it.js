#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

async function fixIt() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  try {
    console.log('Dropping apiKeys.key_1 index...');
    await db.collection('users').dropIndex('apiKeys.key_1');
    console.log('✅ Index dropped!');
  } catch (err) {
    console.log('Error:', err.message);
  }
  
  await mongoose.disconnect();
}

fixIt();