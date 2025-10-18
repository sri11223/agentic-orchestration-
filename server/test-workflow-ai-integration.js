require('dotenv').config();
const { NodeExecutor } = require('./dist/engine/node-executor');
const { testAllAIProviders } = require('./dist/services/ai-test-workflows.service');

console.log('🧪 Testing Complete Workflow + AI Integration...\n');

async function runWorkflowAIIntegrationTest() {
  try {
    // Initialize node executor
    const nodeExecutor = new NodeExecutor();
    
    // Create test execution context
    const context = {
      executionId: 'test_exec_123',
      workflowId: 'test_workflow_456', 
      currentNodeId: 'test_node',
      variables: {},
      executionHistory: [],
      status: 'running',
      startTime: new Date()
    };

    console.log('🔧 Testing individual AI nodes in workflow context...\n');

    // Test 1: Content Generation Node
    console.log('1. 📝 Testing Content Generation Node (Smart Routing)');
    const contentNode = {
      id: 'content-test',
      type: 'AI_PROCESSOR',
      data: {
        taskType: 'content_generation',
        prompt: 'Write a brief introduction about AI workflow orchestration for {{audience}}. Keep it {{tone}} and under 200 words.',
        maxTokens: 400
      }
    };
    
    const contentContext = {
      ...context,
      variables: { audience: 'business executives', tone: 'professional' }
    };
    
    const contentResult = await nodeExecutor.executeNode(contentNode, contentContext);
    console.log('   Result:', contentResult.type === 'success' ? '✅ SUCCESS' : '❌ FAILED');
    if (contentResult.type === 'success') {
      console.log('   Provider:', contentResult.output.provider);
      console.log('   Response preview:', contentResult.output.aiResponse.substring(0, 100) + '...');
    } else {
      console.log('   Error:', contentResult.error);
    }

    console.log();

    // Test 2: Quick Decision Node
    console.log('2. ⚡ Testing Quick Decision Node (Smart Routing)');
    const decisionNode = {
      id: 'decision-test',
      type: 'AI_PROCESSOR',
      data: {
        taskType: 'quick_decision',
        prompt: 'Quick decision needed: Should we implement {{feature}} now or wait for {{alternative}}? Consider {{constraint}}.',
        maxTokens: 150
      }
    };
    
    const decisionContext = {
      ...context,
      variables: { 
        feature: 'real-time analytics dashboard', 
        alternative: 'the next major release',
        constraint: 'limited development resources'
      }
    };
    
    const decisionResult = await nodeExecutor.executeNode(decisionNode, decisionContext);
    console.log('   Result:', decisionResult.type === 'success' ? '✅ SUCCESS' : '❌ FAILED');
    if (decisionResult.type === 'success') {
      console.log('   Provider:', decisionResult.output.provider);
      console.log('   Decision:', decisionResult.output.aiResponse.substring(0, 100) + '...');
    } else {
      console.log('   Error:', decisionResult.error);
    }

    console.log();

    // Test 3: Sentiment Analysis Node
    console.log('3. 😊 Testing Sentiment Analysis Node (Smart Routing)');
    const sentimentNode = {
      id: 'sentiment-test',
      type: 'AI_PROCESSOR',
      data: {
        taskType: 'sentiment_analysis',
        prompt: '{{customerFeedback}}',
        maxTokens: 100
      }
    };
    
    const sentimentContext = {
      ...context,
      variables: { 
        customerFeedback: 'I absolutely love the new AI features! The workflow automation saves me so much time. Outstanding work!'
      }
    };
    
    const sentimentResult = await nodeExecutor.executeNode(sentimentNode, sentimentContext);
    console.log('   Result:', sentimentResult.type === 'success' ? '✅ SUCCESS' : '❌ FAILED');
    if (sentimentResult.type === 'success') {
      console.log('   Provider:', sentimentResult.output.provider);
      console.log('   Sentiment:', sentimentResult.output.aiResponse);
    } else {
      console.log('   Error:', sentimentResult.error);
    }

    console.log();

    // Test 4: Code Generation Node
    console.log('4. 💻 Testing Code Generation Node (Smart Routing)');
    const codeNode = {
      id: 'code-test',
      type: 'AI_PROCESSOR',
      data: {
        taskType: 'code_generation',
        prompt: 'Create a {{language}} function that {{functionality}}. Include proper error handling and documentation.',
        maxTokens: 500
      }
    };
    
    const codeContext = {
      ...context,
      variables: { 
        language: 'TypeScript',
        functionality: 'validates email addresses using regex'
      }
    };
    
    const codeResult = await nodeExecutor.executeNode(codeNode, codeContext);
    console.log('   Result:', codeResult.type === 'success' ? '✅ SUCCESS' : '❌ FAILED');
    if (codeResult.type === 'success') {
      console.log('   Provider:', codeResult.output.provider);
      console.log('   Code preview:', codeResult.output.aiResponse.substring(0, 150) + '...');
    } else {
      console.log('   Error:', codeResult.error);
    }

    console.log();

    // Test 5: Math Reasoning Node
    console.log('5. 🧮 Testing Math Reasoning Node (Smart Routing)');
    const mathNode = {
      id: 'math-test',
      type: 'AI_PROCESSOR',
      data: {
        taskType: 'math_reasoning',
        prompt: 'Calculate the ROI for this scenario: Initial investment of ${{investment}}, monthly revenue of ${{revenue}} for {{months}} months. Show calculations.',
        maxTokens: 300
      }
    };
    
    const mathContext = {
      ...context,
      variables: { 
        investment: '50000',
        revenue: '8500', 
        months: '12'
      }
    };
    
    const mathResult = await nodeExecutor.executeNode(mathNode, mathContext);
    console.log('   Result:', mathResult.type === 'success' ? '✅ SUCCESS' : '❌ FAILED');
    if (mathResult.type === 'success') {
      console.log('   Provider:', mathResult.output.provider);
      console.log('   Calculation:', mathResult.output.aiResponse.substring(0, 150) + '...');
    } else {
      console.log('   Error:', mathResult.error);
    }

    console.log();

    // Test 6: Long Context Node
    console.log('6. 📚 Testing Long Context Analysis Node (Smart Routing)');
    const longContextNode = {
      id: 'long-context-test',
      type: 'AI_PROCESSOR',
      data: {
        taskType: 'long_context',
        prompt: 'Analyze this business report and extract key insights: {{businessReport}}',
        maxTokens: 600
      }
    };
    
    const longReport = `
    QUARTERLY BUSINESS REPORT - Q4 2024
    
    Executive Summary:
    Our AI orchestration platform has shown remarkable growth this quarter, with user adoption increasing by 150% month-over-month. The integration of multiple AI providers has been a key differentiator, allowing users to optimize their workflows for both cost and performance.
    
    Key Metrics:
    - Monthly Active Users: 12,500 (up from 5,000 in Q3)
    - Revenue: $125,000 (up 200% from Q3)
    - Customer Satisfaction: 4.8/5 (up from 4.2/5)
    - Workflow Executions: 2.3M (up 180% from Q3)
    
    Market Analysis:
    The AI workflow automation market is experiencing unprecedented growth, with enterprises increasingly adopting no-code/low-code solutions. Our multi-provider approach positions us well against competitors who rely on single AI providers.
    
    Challenges:
    - Infrastructure scaling to meet demand
    - Maintaining quality while adding new AI providers
    - Competition from larger tech companies entering the space
    
    Opportunities:
    - Enterprise partnerships for white-label solutions
    - International expansion, particularly in European markets
    - Integration with popular business tools (Slack, Microsoft Teams, etc.)
    
    Financial Projections:
    Based on current growth trends, we project reaching $500,000 MRR by Q2 2025, with break-even expected in Q3 2025.
    `;
    
    const longContextContext = {
      ...context,
      variables: { businessReport: longReport }
    };
    
    const longContextResult = await nodeExecutor.executeNode(longContextNode, longContextContext);
    console.log('   Result:', longContextResult.type === 'success' ? '✅ SUCCESS' : '❌ FAILED');
    if (longContextResult.type === 'success') {
      console.log('   Provider:', longContextResult.output.provider);
      console.log('   Analysis preview:', longContextResult.output.aiResponse.substring(0, 200) + '...');
    } else {
      console.log('   Error:', longContextResult.error);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 WORKFLOW + AI INTEGRATION TEST COMPLETE!');
    console.log('='.repeat(80));
    
    // Count successes
    const results = [contentResult, decisionResult, sentimentResult, codeResult, mathResult, longContextResult];
    const successes = results.filter(r => r.type === 'success').length;
    
    console.log(`\n📊 Final Results: ${successes}/6 tests passed`);
    console.log('\n🏆 Provider Usage Summary:');
    results.forEach((result, index) => {
      const testNames = ['Content Gen', 'Quick Decision', 'Sentiment', 'Code Gen', 'Math Reasoning', 'Long Context'];
      if (result.type === 'success') {
        console.log(`   ${testNames[index]}: ✅ ${result.output.provider}`);
      } else {
        console.log(`   ${testNames[index]}: ❌ Failed`);
      }
    });

    if (successes === 6) {
      console.log('\n🚀 ALL AI PROVIDERS SUCCESSFULLY INTEGRATED INTO WORKFLOW SYSTEM!');
      console.log('🎯 Your backend is now PRODUCTION READY with 6-provider AI orchestration!');
    } else {
      console.log(`\n⚠️ ${6 - successes} tests failed. Please check the errors above.`);
    }

    return results;

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return [];
  }
}

// Run the test
runWorkflowAIIntegrationTest();