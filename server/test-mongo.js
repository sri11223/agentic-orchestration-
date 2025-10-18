// Test MongoDB Atlas connection
const mongoose = require('mongoose');
require('dotenv').config();

const testMongoDB = async () => {
  try {
    console.log('🔄 Testing MongoDB Atlas connection...');
    console.log('📡 Connection URI:', process.env.MONGODB_URI ? 'Found in .env' : 'Missing!');
    
    // Connect to MongoDB Atlas
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log('🏢 Host:', conn.connection.host);
    console.log('🗄️  Database:', conn.connection.name);
    console.log('📊 Ready State:', conn.connection.readyState === 1 ? 'Connected' : 'Not Connected');
    
    // Test creating a simple document
    const TestSchema = new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('ConnectionTest', TestSchema);
    
    // Insert test document
    const testDoc = new TestModel({ 
      message: 'Agentic Orchestration Platform - Connection Test Successful!' 
    });
    
    await testDoc.save();
    console.log('✅ Test document created:', testDoc._id);
    
    // Read test document
    const foundDoc = await TestModel.findById(testDoc._id);
    console.log('✅ Test document retrieved:', foundDoc.message);
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Test document cleaned up');
    
    // Show collections in database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Collections in database:', collections.length);
    collections.forEach(col => console.log('  -', col.name));
    
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('🔐 Authentication issue - check username/password');
    } else if (error.message.includes('network')) {
      console.log('🌐 Network issue - check internet connection and IP whitelist');
    } else if (error.message.includes('timeout')) {
      console.log('⏰ Timeout issue - check network and MongoDB Atlas status');
    }
    
    process.exit(1);
  }
};

console.log('🧪 MongoDB Atlas Connection Test');
console.log('================================');
testMongoDB();