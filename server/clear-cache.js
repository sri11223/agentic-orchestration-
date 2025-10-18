#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

async function clearMongooseCache() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Delete the cached User model
    if (mongoose.models.User) {
      delete mongoose.models.User;
      console.log('✅ Cleared User model from Mongoose cache');
    }
    
    // Clear all model cache
    Object.keys(mongoose.models).forEach(model => {
      delete mongoose.models[model];
    });
    console.log('✅ Cleared all Mongoose models from cache');
    
    // Drop the users collection completely
    try {
      await mongoose.connection.db.collection('users').drop();
      console.log('✅ Dropped users collection');
    } catch (err) {
      console.log('Users collection already empty');
    }
    
    await mongoose.disconnect();
    console.log('✅ Ready for fresh start!');
    console.log('\nNow restart the server with: npm run dev');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

clearMongooseCache();