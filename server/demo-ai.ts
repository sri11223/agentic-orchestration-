import { AIService } from './src/services/ai.service';
import dotenv from 'dotenv';

dotenv.config();

async function demonstrateAIIntegration() {
  console.log('🚀 Comprehensive AI Integration Demo\n');
  
  const aiService = new AIService();
  
  // Test different task types with optimal provider routing
  const testCases = [
    {
      name: 'Quick Decision Making',
      node: {
        data: {
          taskType: 'quick_decision',
          prompt: 'Should we proceed with Plan A or Plan B for the new feature?'
        }
      },
      expectedProvider: 'groq'
    },
    {
      name: 'Content Generation',
      node: {
        data: {
          taskType: 'content_generation',
          prompt: 'Write a welcome message for new users'
        }
      },
      expectedProvider: 'gemini'
    },
    {
      name: 'Sentiment Analysis',
      node: {
        data: {
          taskType: 'sentiment_analysis',
          prompt: 'I love this new feature! It works perfectly.'
        }
      },
      expectedProvider: 'huggingface'
    },
    {
      name: 'Code Generation',
      node: {
        data: {
          taskType: 'code_generation',
          prompt: 'Create a simple React component for a button'
        }
      },
      expectedProvider: 'qwen'
    },
    {
      name: 'Math Reasoning',
      node: {
        data: {
          taskType: 'math_reasoning',
          prompt: 'If I have 15 apples and give away 7, how many do I have left?'
        }
      },
      expectedProvider: 'glm4'
    },
    {
      name: 'Long Context Processing',
      node: {
        data: {
          taskType: 'long_context',
          prompt: 'Summarize this lengthy document about AI trends'
        }
      },
      expectedProvider: 'kimi'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log(`Expected Provider: ${testCase.expectedProvider}`);
    console.log(`Prompt: "${testCase.node.data.prompt}"\n`);
    
    try {
      const result = await aiService.processNode(testCase.node, {});
      
      console.log(`✅ Result: ${result.result}`);
      console.log(`🔧 Used Provider: ${result.provider}`);
      console.log(`📊 Confidence: ${result.confidence || 'N/A'}`);
      console.log(`🎯 Tokens: ${result.tokens || 'N/A'}`);
      
      if (result.provider === testCase.expectedProvider) {
        console.log('🎯 Optimal provider selected!');
      } else {
        console.log('🔄 Fallback provider used (expected behavior if primary unavailable)');
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('─'.repeat(80));
  }

  // Test decision analysis
  console.log('\n🎯 Testing Decision Analysis Feature');
  
  try {
    const decisionContext = {
      budget: 10000,
      timeline: '3 months',
      team_size: 5,
      priority: 'high'
    };
    
    const options = ['Build in-house', 'Use third-party service', 'Hire consultants'];
    
    const decision = await aiService.analyzeDecision(decisionContext, options);
    
    console.log(`\n✅ Recommendation: ${decision.recommendation}`);
    console.log(`📊 Confidence: ${decision.confidence}`);
    console.log(`🤔 Reasoning: ${decision.reasoning}`);
    console.log(`🔧 Provider: ${decision.provider}`);
    
  } catch (error) {
    console.error(`❌ Decision Analysis Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n🎉 AI Integration Demo Complete!');
  console.log('\n📝 To enable real AI providers, add API keys to your .env file:');
  console.log('   - GOOGLE_AI_API_KEY (Gemini - Free)');
  console.log('   - GROQ_API_KEY (Groq - Free)'); 
  console.log('   - HUGGINGFACE_API_KEY (HuggingFace - Free)');
  console.log('   - QWEN_API_KEY, GLM4_API_KEY, KIMI_API_KEY (Coming soon)');
  
}

demonstrateAIIntegration().catch(console.error);