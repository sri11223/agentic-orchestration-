require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const { HfInference } = require('@huggingface/inference');
const axios = require('axios');

console.log('🧪 Testing All AI Providers...');

// Test environment variables
console.log('Environment check:');
console.log('- GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? 'Set ✅' : 'Missing ❌');
console.log('- GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Set ✅' : 'Missing ❌');
console.log('- HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY ? 'Set ✅' : 'Missing ❌');
console.log('- GLM4_API_KEY:', process.env.GLM4_API_KEY ? 'Set ✅' : 'Missing ❌');
console.log('- KIMI_API_KEY:', process.env.KIMI_API_KEY ? 'Set ✅' : 'Missing ❌');
console.log();

async function testGemini() {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.log('⚠️ Skipping Gemini test - no API key');
      return;
    }
    
    console.log('🧪 Testing Gemini 2.5 Flash...');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent('Say hello from Gemini in 1 sentence!');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini Response:', text.trim());
  } catch (error) {
    console.error('❌ Gemini Error:', error.message.split('\n')[0]);
  }
}

async function testGroq() {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.log('⚠️ Skipping Groq test - no API key');
      return;
    }
    
    console.log('🧪 Testing Groq Llama 3.1...');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello from Groq in 1 sentence!' }],
      model: 'llama-3.1-8b-instant',
      max_tokens: 50,
      temperature: 0.7
    });
    
    const text = completion.choices[0]?.message?.content || 'No response';
    console.log('✅ Groq Response:', text.trim());
  } catch (error) {
    console.error('❌ Groq Error:', error.message.split('\n')[0]);
  }
}

async function testHuggingFace() {
  try {
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.log('⚠️ Skipping HuggingFace test - no API key');
      return;
    }
    
    console.log('🧪 Testing HuggingFace Inference...');
    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    
    // Test text generation with a working model
    const result = await hf.textGeneration({
      model: 'gpt2',
      inputs: 'Hello from HuggingFace',
      parameters: {
        max_new_tokens: 20,
        temperature: 0.7
      }
    });
    
    console.log('✅ HuggingFace Response:', result.generated_text);
    
    // Test sentiment analysis
    const sentiment = await hf.textClassification({
      model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      inputs: 'I love this AI service!'
    });
    
    console.log('✅ HuggingFace Sentiment:', sentiment[0].label, `(${Math.round(sentiment[0].score * 100)}%)`);
    
  } catch (error) {
    console.error('❌ HuggingFace Error:', error.message.split('\n')[0]);
  }
}

async function testGLM4() {
  try {
    if (!process.env.GLM4_API_KEY) {
      console.log('⚠️ Skipping GLM-4 test - no API key');
      return;
    }
    
    console.log('🧪 Testing GLM-4 (Zhipu AI)...');
    
    // GLM-4 API endpoint (Zhipu AI format)
    const response = await axios.post('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      model: 'glm-4',
      messages: [
        { role: 'user', content: 'Say hello from GLM-4 in 1 sentence!' }
      ],
      max_tokens: 50,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GLM4_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    const text = response.data.choices[0]?.message?.content || 'No response';
    console.log('✅ GLM-4 Response:', text.trim());
    
  } catch (error) {
    if (error.response) {
      console.error('❌ GLM-4 Error:', error.response.status, error.response.data?.error?.message || error.response.statusText);
    } else {
      console.error('❌ GLM-4 Error:', error.message.split('\n')[0]);
    }
  }
}

async function testKimi() {
  try {
    if (!process.env.KIMI_API_KEY) {
      console.log('⚠️ Skipping Kimi test - no API key');
      return;
    }
    
    console.log('🧪 Testing Kimi (Moonshot AI)...');
    
    // Kimi API endpoint (Moonshot AI format)
    const response = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'user', content: 'Say hello from Kimi in 1 sentence!' }
      ],
      max_tokens: 50,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.KIMI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    const text = response.data.choices[0]?.message?.content || 'No response';
    console.log('✅ Kimi Response:', text.trim());
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Kimi Error:', error.response.status, error.response.data?.error?.message || error.response.statusText);
    } else {
      console.error('❌ Kimi Error:', error.message.split('\n')[0]);
    }
  }
}

async function runAllTests() {
  await testGemini();
  console.log();
  await testGroq();
  console.log();
  await testHuggingFace();
  console.log();
  await testGLM4();
  console.log();
  await testKimi();
  console.log('\n🎉 All API Tests Complete!');
}

runAllTests();