#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

async function checkCollections() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  
  // Try to drop index from 'users' collection
  try {
    const indexes = await db.collection('users').indexes();
    console.log('\nIndexes on users collection:');
    indexes.forEach(idx => console.log(`- ${idx.name}:`, idx.key));
    
    if (indexes.find(idx => idx.name === 'apiKeys.key_1')) {
      console.log('\nDropping apiKeys.key_1...');
      await db.collection('users').dropIndex('apiKeys.key_1');
      console.log('✅ Dropped!');
    }
  } catch (err) {
    console.log('Users collection error:', err.message);
  }
  
  await mongoose.disconnect();
}

checkCollections();