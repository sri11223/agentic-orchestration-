/**
 * Test script to validate workflow execution with real nodes
 * Run with: node test-workflow.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test workflow that exercises email, http, and database nodes
const testWorkflow = {
  name: 'Test Email + HTTP + Database Workflow',
  description: 'Tests the core integration services',
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      data: {
        triggerType: 'manual'
      },
      position: { x: 100, y: 100 }
    },
    {
      id: 'http-1', 
      type: 'action',
      data: {
        actionType: 'http_request',
        config: {
          url: 'https://jsonplaceholder.typicode.com/posts/1',
          method: 'GET'
        }
      },
      position: { x: 300, y: 100 }
    },
    {
      id: 'email-1',
      type: 'action', 
      data: {
        actionType: 'email',
        config: {
          to: 'test@example.com',
          subject: 'Test Email from Workflow',
          body: 'HTTP Response: {{httpResponse.title}}'
        }
      },
      position: { x: 500, y: 100 }
    },
    {
      id: 'db-1',
      type: 'action',
      data: {
        actionType: 'database',
        config: {
          operation: 'insert',
          table: 'executions',
          data: {
            testResult: 'success',
            httpTitle: '{{httpResponse.title}}',
            timestamp: new Date().toISOString()
          }
        }
      },
      position: { x: 700, y: 100 }
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'trigger-1',
      target: 'http-1',
      type: 'default'
    },
    {
      id: 'e2', 
      source: 'http-1',
      target: 'email-1',
      type: 'default'
    },
    {
      id: 'e3',
      source: 'email-1', 
      target: 'db-1',
      type: 'default'
    }
  ],
  status: 'active'
};

async function runTests() {
  console.log('🚀 Starting Workflow Integration Tests...\n');

  try {
    // Test 1: Create workflow
    console.log('📝 Test 1: Creating test workflow...');
    const workflowResponse = await axios.post(`${API_BASE}/workflows`, testWorkflow);
    const workflowId = workflowResponse.data._id;
    console.log(`✅ Workflow created with ID: ${workflowId}\n`);

    // Test 2: Execute workflow
    console.log('▶️  Test 2: Starting workflow execution...');
    const executionResponse = await axios.post(`${API_BASE}/executions/start`, {
      workflowId,
      triggerData: {
        testMode: true,
        startedBy: 'test-script'
      }
    });
    const executionId = executionResponse.data.executionId;
    console.log(`✅ Execution started with ID: ${executionId}\n`);

    // Test 3: Monitor execution status
    console.log('👀 Test 3: Monitoring execution progress...');
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      try {
        const statusResponse = await axios.get(`${API_BASE}/executions/${executionId}`);
        const execution = statusResponse.data;
        
        console.log(`📊 Attempt ${attempts + 1}: Status = ${execution.status}`);
        
        if (execution.status === 'completed') {
          console.log('✅ Workflow completed successfully!');
          console.log('📋 Final execution data:', JSON.stringify(execution.data, null, 2));
          break;
        } else if (execution.status === 'failed') {
          console.log('❌ Workflow failed:', execution.error);
          break;
        } else if (execution.status === 'paused') {
          console.log('⏸️  Workflow paused (waiting for human input)');
          break;
        }
        
        attempts++;
      } catch (statusError) {
        console.log(`⚠️  Status check failed: ${statusError.message}`);
        attempts++;
      }
    }

    if (attempts >= maxAttempts) {
      console.log('⏰ Timeout: Execution taking longer than expected');
    }

    // Test 4: Get execution history
    console.log('\n📚 Test 4: Retrieving execution history...');
    const historyResponse = await axios.get(`${API_BASE}/executions/${executionId}/history`);
    console.log('✅ Execution history retrieved:');
    historyResponse.data.forEach((event, index) => {
      console.log(`  ${index + 1}. Node: ${event.nodeId}, Status: ${event.status}, Duration: ${event.duration}ms`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }

  console.log('\n🏁 Test completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testWorkflow, runTests };