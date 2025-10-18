require('dotenv').config();
const axios = require('axios');

console.log('🧪 Checking OpenRouter Available Models...');

async function checkAvailableModels() {
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const freeModels = response.data.data.filter(model => 
      model.pricing.prompt === "0" && model.pricing.completion === "0"
    );
    
    console.log('🆓 Available FREE models:');
    freeModels.forEach(model => {
      console.log(`   • ${model.id} - ${model.name}`);
    });
    
    // Look specifically for Kimi models
    const kimiModels = response.data.data.filter(model => 
      model.id.toLowerCase().includes('kimi') || model.id.toLowerCase().includes('moonshot')
    );
    
    if (kimiModels.length > 0) {
      console.log('\n🌙 Available Kimi/Moonshot models:');
      kimiModels.forEach(model => {
        const cost = model.pricing.prompt === "0" ? "FREE" : `$${model.pricing.prompt}/1K tokens`;
        console.log(`   • ${model.id} - ${cost}`);
      });
    }
    
    // Look for GLM models
    const glmModels = response.data.data.filter(model => 
      model.id.toLowerCase().includes('glm')
    );
    
    if (glmModels.length > 0) {
      console.log('\n🔥 Available GLM models:');
      glmModels.forEach(model => {
        const cost = model.pricing.prompt === "0" ? "FREE" : `$${model.pricing.prompt}/1K tokens`;
        console.log(`   • ${model.id} - ${cost}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking models:', error.message);
  }
}

checkAvailableModels();