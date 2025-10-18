#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

async function nukeDatabaseCompletely() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  console.log('Database name:', db.databaseName);
  
  console.log('Dropping ENTIRE database...');
  await db.dropDatabase();
  console.log('✅ Database completely wiped!');
  
  await mongoose.disconnect();
}

nukeDatabaseCompletely();