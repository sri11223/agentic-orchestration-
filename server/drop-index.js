#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

async function dropOldIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log('Dropping old apiKeys.key_1 index...');
    await db.collection('users').dropIndex('apiKeys.key_1');
    console.log('✅ Old index dropped!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.log('Index already dropped or collection doesnt exist:', error.message);
  }
}

dropOldIndex();