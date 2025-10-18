// Test Redis connection
require('dotenv').config();
const Redis = require('ioredis');

async function testRedisConnection() {
  console.log('🔄 Testing Redis connection...');
  console.log('Redis URL:', process.env.REDIS_URL?.replace(/:([^:@]*@)/, ':****@')); // Hide password in logs
  
  const redis = new Redis(process.env.REDIS_URL, {
    db: parseInt(process.env.REDIS_DB || '1'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'agentic:',
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
  });

  try {
    // Test basic operations
    console.log('📝 Testing SET operation...');
    await redis.set('test-connection', 'Hello from Agentic Orchestration!');
    
    console.log('📖 Testing GET operation...');
    const result = await redis.get('test-connection');
    console.log('✅ Retrieved:', result);
    
    console.log('🗑️ Cleaning up test key...');
    await redis.del('test-connection');
    
    console.log('📊 Redis Info:');
    const info = await redis.info('server');
    const version = info.split('\n').find(line => line.startsWith('redis_version:'));
    console.log('  -', version);
    
    console.log('🎉 Redis connection successful!');
    console.log('✅ Using Database:', process.env.REDIS_DB || '1');
    console.log('🏷️ Key Prefix:', process.env.REDIS_KEY_PREFIX || 'agentic:');
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
  } finally {
    await redis.disconnect();
  }
}

testRedisConnection();