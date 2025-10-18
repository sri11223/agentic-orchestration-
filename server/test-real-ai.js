require('dotenv').config();
const { AIService } = require('./src/services/ai.service');

console.log('🧪 Testing AI Service with Real API Keys...');
console.log('Environment variables loaded:');
console.log('- GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? 'Set' : 'Missing');
console.log('- GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Set' : 'Missing');
console.log('- HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY ? 'Set' : 'Missing');
console.log('- GLM4_API_KEY:', process.env.GLM4_API_KEY ? 'Set' : 'Missing');
console.log('- KIMI_API_KEY:', process.env.KIMI_API_KEY ? 'Set' : 'Missing');
console.log();

const aiService = new AIService();

async function testProviders() {
  try {
    // Test Gemini
    console.log('🧪 Testing Gemini...');
    const geminiResult = await aiService.processNode({
      data: { taskType: 'content_generation', prompt: 'Say hello from Gemini!' }
    }, {});
    console.log('✅ Gemini Result:', geminiResult);
    
    // Test Groq
    console.log('🧪 Testing Groq...');
    const groqResult = await aiService.processNode({
      data: { taskType: 'quick_decision', prompt: 'Say hello from Groq!' }
    }, {});
    console.log('✅ Groq Result:', groqResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProviders();