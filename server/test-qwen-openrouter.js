require('dotenv').config();
const axios = require('axios');

console.log('🧪 Testing Qwen via OpenRouter...');

async function testQwen() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('❌ No OpenRouter API key found');
    return;
  }
  
  console.log('✅ OpenRouter API key found');
  console.log();
  
  // Test Qwen 2.5 72B Instruct
  try {
    console.log('🧪 Testing Qwen 2.5 72B Instruct (qwen/qwen-2.5-72b-instruct:free)...');
    
    const qwenResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'qwen/qwen-2.5-72b-instruct:free',
      messages: [
        { role: 'user', content: 'Write a simple Python function to calculate factorial. Include both code and explanation in 2 sentences.' }
      ],
      max_tokens: 200
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://agentic-orchestration.app',
        'X-Title': 'Agentic Orchestration Builder'
      },
      timeout: 20000
    });
    
    const qwenText = qwenResponse.data.choices[0]?.message?.content || 'No response';
    console.log('✅ Qwen 2.5 72B Response:', qwenText.trim());
    console.log('   Tokens used:', qwenResponse.data.usage?.total_tokens || 'unknown');
    
    // Test Qwen Coder model too
    console.log('\n🧪 Testing Qwen3 Coder (qwen/qwen3-coder:free)...');
    
    const coderResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'qwen/qwen3-coder:free',
      messages: [
        { role: 'user', content: 'Explain the difference between async and sync programming in JavaScript in one sentence.' }
      ],
      max_tokens: 100
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://agentic-orchestration.app',
        'X-Title': 'Agentic Orchestration Builder'
      },
      timeout: 20000
    });
    
    const coderText = coderResponse.data.choices[0]?.message?.content || 'No response';
    console.log('✅ Qwen3 Coder Response:', coderText.trim());
    console.log('   Tokens used:', coderResponse.data.usage?.total_tokens || 'unknown');
    
  } catch (error) {
    const status = error.response?.status || 'Network';
    const message = error.response?.data?.error?.message || error.message;
    console.error('❌ Qwen Error:', status, message);
  }
  
  console.log('\n🎉 Qwen OpenRouter test complete!');
}

testQwen();