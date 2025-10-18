// Quick test to verify AI service works
const { AIService } = require('./dist/services/ai.service.js');

async function testAI() {
  try {
    console.log('🧪 Testing AI Service...');
    
    const aiService = new AIService();
    
    // Test task processing
    const testNode = {
      data: {
        taskType: 'quick_decision',
        prompt: 'Choose between option A and B for testing'
      }
    };
    
    const result = await aiService.processNode(testNode, { test: true });
    console.log('✅ AI Service Result:', result);
    
    // Test decision analysis
    const decision = await aiService.analyzeDecision(
      { context: 'testing environment' }, 
      ['option A', 'option B']
    );
    console.log('✅ Decision Analysis:', decision);
    
    console.log('🎉 AI Service tests completed successfully!');
    
  } catch (error) {
    console.error('❌ AI Service test failed:', error.message);
  }
}

testAI();