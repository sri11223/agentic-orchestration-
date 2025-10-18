#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    console.log('Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`- ${index.name}:`, index.key);
    });

    console.log('\nDropping problematic apiKeys index...');
    try {
      await collection.dropIndex('apiKeys.key_1');
      console.log('✅ Dropped old index');
    } catch (err) {
      console.log('Index may not exist or already dropped:', err.message);
    }

    console.log('Creating new sparse index...');
    await collection.createIndex({ 'apiKeys.key': 1 }, { sparse: true, name: 'apiKeys_key_sparse' });
    console.log('✅ Created new sparse index');

    console.log('\nUpdated indexes:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`- ${index.name}:`, index.key, index.sparse ? '(sparse)' : '');
    });

    await mongoose.disconnect();
    console.log('Done!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixIndexes();