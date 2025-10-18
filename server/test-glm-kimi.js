require('dotenv').config();
const axios = require('axios');

async function testGLMVariants() {
  console.log('🧪 Testing GLM-4 with different formats...');
  
  if (!process.env.GLM4_API_KEY) {
    console.log('❌ No GLM-4 API key');
    return;
  }
  
  const models = ['glm-4', 'glm-4-plus', 'glm-4-0520', 'glm-4-flash'];
  const endpoints = [
    'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    'https://api.zhipuai.cn/api/paas/v4/chat/completions'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\nTrying endpoint: ${endpoint}`);
    for (const model of models) {
      try {
        console.log(`Testing model: ${model}`);
        
        const response = await axios.post(endpoint, {
          model: model,
          messages: [
            { role: 'user', content: 'Hello from GLM-4!' }
          ],
          max_tokens: 50
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.GLM4_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        const text = response.data.choices[0]?.message?.content || 'No response';
        console.log(`✅ ${model} Response:`, text.trim());
        return; // Success, exit
        
      } catch (error) {
        const status = error.response?.status || 'Network';
        const message = error.response?.data?.error?.message || error.message;
        console.log(`❌ ${model} (${status}):`, message.split('\n')[0]);
      }
    }
  }
}

async function testKimiVariants() {
  console.log('\n🧪 Testing Kimi with different formats...');
  
  if (!process.env.KIMI_API_KEY) {
    console.log('❌ No Kimi API key');
    return;
  }
  
  const models = ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'];
  const endpoints = [
    'https://api.moonshot.cn/v1/chat/completions',
    'https://api.moonshot.ai/v1/chat/completions'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\nTrying endpoint: ${endpoint}`);
    for (const model of models) {
      try {
        console.log(`Testing model: ${model}`);
        
        const response = await axios.post(endpoint, {
          model: model,
          messages: [
            { role: 'user', content: 'Hello from Kimi!' }
          ],
          max_tokens: 50
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.KIMI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        const text = response.data.choices[0]?.message?.content || 'No response';
        console.log(`✅ ${model} Response:`, text.trim());
        return; // Success, exit
        
      } catch (error) {
        const status = error.response?.status || 'Network';
        const message = error.response?.data?.error?.message || error.message;
        console.log(`❌ ${model} (${status}):`, message.split('\n')[0]);
      }
    }
  }
}

async function runTests() {
  await testGLMVariants();
  await testKimiVariants();
  console.log('\n🎉 API variant tests complete!');
}

runTests();