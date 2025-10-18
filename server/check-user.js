#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

async function checkUser() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const userId = '68f3767f1db1ade9fd69e1c4';
  
  // Check userv2s collection (UserV2 model creates userv2s collection)
  const users = await mongoose.connection.db.collection('userv2s').find({}).toArray();
  console.log(`Found ${users.length} users in userv2s collection:`);
  users.forEach(user => {
    console.log(`- ID: ${user._id}, Username: ${user.username}`);
  });
  
  // Try to find the specific user
  const specificUser = await mongoose.connection.db.collection('userv2s').findOne({
    _id: new mongoose.Types.ObjectId(userId)
  });
  
  if (specificUser) {
    console.log('\n✅ Found user:', specificUser.username);
  } else {
    console.log('\n❌ User not found with ID:', userId);
  }
  
  await mongoose.disconnect();
}

checkUser();