#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

async function listCollections() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('All collections:');
  
  for (const col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`- ${col.name}: ${count} documents`);
    
    if (col.name.includes('user')) {
      const docs = await mongoose.connection.db.collection(col.name).find({}).toArray();
      console.log(`  Users in ${col.name}:`);
      docs.forEach(doc => console.log(`    - ${doc.username} (${doc._id})`));
    }
  }
  
  await mongoose.disconnect();
}

listCollections();