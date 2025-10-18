require('dotenv').config();
const axios = require('axios');

console.log('🧪 Testing OpenRouter Free Models...');

async function testOpenRouter() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('❌ No OpenRouter API key found');
    return;
  }
  
  console.log('✅ OpenRouter API key found');
  console.log();
  
  // Test GLM-4.5-Air
  try {
    console.log('🧪 Testing GLM-4.5-Air (z-ai/glm-4.5-air:free)...');
    
    const glmResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'z-ai/glm-4.5-air:free',
      messages: [
        { role: 'user', content: 'Say hello from GLM-4.5-Air in one sentence!' }
      ],
      max_tokens: 100
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://agentic-orchestration.app',
        'X-Title': 'Agentic Orchestration Builder'
      },
      timeout: 15000
    });
    
    const glmText = glmResponse.data.choices[0]?.message?.content || 'No response';
    console.log('✅ GLM-4.5-Air Response:', glmText.trim());
    console.log('   Tokens used:', glmResponse.data.usage?.total_tokens || 'unknown');
    
  } catch (error) {
    const status = error.response?.status || 'Network';
    const message = error.response?.data?.error?.message || error.message;
    console.error('❌ GLM-4.5-Air Error:', status, message);
  }
  
  console.log();
  
  // Test Kimi Dev 72B
  try {
    console.log('🧪 Testing Kimi Dev 72B (moonshotai/kimi-dev-72b:free)...');
    
    const kimiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'moonshotai/kimi-dev-72b:free',
      messages: [
        { role: 'user', content: 'Say hello from Kimi K2 in one sentence!' }
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
    
    const kimiText = kimiResponse.data.choices[0]?.message?.content || 'No response';
    console.log('✅ Kimi K2 Response:', kimiText.trim());
    console.log('   Tokens used:', kimiResponse.data.usage?.total_tokens || 'unknown');
    
  } catch (error) {
    const status = error.response?.status || 'Network';
    const message = error.response?.data?.error?.message || error.message;
    console.error('❌ Kimi K2 Error:', status, message);
  }
  
  console.log('\n🎉 OpenRouter test complete!');
}

testOpenRouter();