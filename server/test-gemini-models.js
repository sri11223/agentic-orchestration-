require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listGeminiModels() {
  try {
    console.log('🔍 Checking available Gemini models...');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    
    // Try to list models
    const models = await genAI.listModels();
    console.log('Available models:');
    models.forEach((model) => {
      console.log(`- ${model.name} (${model.displayName})`);
    });
    
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
  }
  
  // Try common model names
  const commonModels = ['gemini-1.5-pro', 'gemini-1.0-pro', 'models/gemini-pro', 'models/gemini-1.5-pro'];
  
  for (const modelName of commonModels) {
    try {
      console.log(`🧪 Trying model: ${modelName}`);
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello');
      const response = await result.response;
      const text = response.text();
      console.log(`✅ ${modelName} works! Response: ${text.trim()}`);
      break;
    } catch (err) {
      console.log(`❌ ${modelName} failed: ${err.message.split('\n')[0]}`);
    }
  }
}

listGeminiModels();