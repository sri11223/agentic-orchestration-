require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

console.log('🧪 Testing Individual AI Providers...');

// Test environment variables
console.log('Environment check:');
console.log('- GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? 'Set ✅' : 'Missing ❌');
console.log('- GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Set ✅' : 'Missing ❌');
console.log('- HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY ? 'Set ✅' : 'Missing ❌');
console.log();

async function testGemini() {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.log('⚠️ Skipping Gemini test - no API key');
      return;
    }
    
    console.log('🧪 Testing Gemini API...');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent('Say hello from Gemini in 1 sentence!');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini Response:', text.trim());
  } catch (error) {
    console.error('❌ Gemini Error:', error.message);
  }
}

async function testGroq() {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.log('⚠️ Skipping Groq test - no API key');
      return;
    }
    
    console.log('🧪 Testing Groq API...');
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
    console.error('❌ Groq Error:', error.message);
  }
}

async function runTests() {
  await testGemini();
  console.log();
  await testGroq();
  console.log('\n🎉 API Tests Complete!');
}

runTests();