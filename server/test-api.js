#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let workflowId = '';
let executionId = '';
// Generate truly unique user for each test run
const timestamp = Date.now();
const randomPart = Math.random().toString(36).substring(2, 8);
let testUser = {
  username: `api_test_${timestamp}`,
  email: `api_test_${timestamp}_${randomPart}@testdomain.local`,
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User'
};

console.log('Using test user:', testUser.username, testUser.email);

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : {}
          };
          resolve(response);
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function healthCheck() {
  console.log('\n🏥 Testing Health Check...');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log(`✅ Health Check: ${response.statusCode} - ${JSON.stringify(response.body)}`);
    return response.statusCode === 200;
  } catch (error) {
    console.log(`❌ Health Check Failed: ${error.message}`);
    return false;
  }
}

async function registerUser() {
  console.log('\n👤 Testing User Registration...');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const userData = testUser;
    
    const response = await makeRequest(options, userData);
    if (response.statusCode === 201) {
      console.log(`✅ Registration: ${response.statusCode} - User created successfully`);
      return true;
    } else {
      console.log(`❌ Registration Failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Registration Failed: ${error.message}`);
    return false;
  }
}

async function loginUser() {
  console.log('\n🔐 Testing User Login...');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = {
      email: testUser.email,
      password: testUser.password
    };
    
    const response = await makeRequest(options, loginData);
    
    if (response.statusCode === 200 && response.body.tokens && response.body.tokens.accessToken) {
      authToken = response.body.tokens.accessToken;
      console.log(`✅ Login Success: Token received`);
      return true;
    } else {
      console.log(`❌ Login Failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Login Failed: ${error.message}`);
    return false;
  }
}

async function createWorkflow() {
  console.log('\n📋 Creating Test Workflow...');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/workflows',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    const workflowData = {
      name: 'Integration Test Workflow',
      description: 'Tests HTTP + Email + Database nodes',
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
          id: 'log-1',
          type: 'action',
          data: {
            actionType: 'log',
            config: {
              message: 'HTTP call succeeded! Post title: {{httpResponse.title}}',
              level: 'info'
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
              table: 'test_executions',
              data: {
                result: 'success',
                postTitle: '{{httpResponse.title}}',
                timestamp: '{{new Date().toISOString()}}'
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
          target: 'log-1',
          type: 'default'
        },
        {
          id: 'e3',
          source: 'log-1',
          target: 'db-1',
          type: 'default'
        }
      ],
      status: 'active'
    };
    
    const response = await makeRequest(options, workflowData);
    
    if (response.statusCode === 201 && response.body.workflow && response.body.workflow._id) {
      workflowId = response.body.workflow._id;
      console.log(`✅ Workflow Created: ID ${workflowId}`);
      return true;
    } else {
      console.log(`❌ Workflow Creation Failed: ${response.statusCode}`);
      console.log(`Response Body: ${JSON.stringify(response.body, null, 2)}`);
      console.log(`Auth Token: ${authToken ? 'Present' : 'Missing'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Workflow Creation Failed: ${error.message}`);
    return false;
  }
}

async function startExecution() {
  console.log('\n🚀 Starting Workflow Execution...');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflows/${workflowId}/execute`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    const executionData = {
      triggerData: {
        testMode: true,
        message: 'Started from test script'
      }
    };
    
    const response = await makeRequest(options, executionData);
    
    if (response.statusCode === 202 && response.body.executionId) {
      executionId = response.body.executionId;
      console.log(`✅ Execution Started: ID ${executionId}`);
      return true;
    } else {
      console.log(`❌ Execution Start Failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Execution Start Failed: ${error.message}`);
    return false;
  }
}

async function checkExecutionStatus() {
  console.log('\n📊 Checking Execution Status...');
  
  for (let i = 0; i < 10; i++) {
    try {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: `/api/executions/${executionId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      };
      
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        // The API is returning the ExecutionContext directly due to route precedence
        const execution = response.body;
        
        if (execution && execution.status) {
          const totalNodes = execution.executionHistory ? execution.executionHistory.length : 0;
          const completedNodes = execution.executionHistory ? execution.executionHistory.filter(h => !h.error).length : 0;
          
          console.log(`📈 Status Check ${i + 1}: ${execution.status} (${completedNodes}/${totalNodes} nodes)`);
          
          if (execution.status === 'completed') {
            console.log('✅ Workflow Completed Successfully!');
            return true;
          } else if (execution.status === 'failed') {
            console.log('❌ Workflow Failed!');
            if (execution.executionHistory) {
              const failedNodes = execution.executionHistory.filter(h => h.error);
              failedNodes.forEach(node => {
                console.log(`  - Failed node ${node.nodeId}: ${node.error}`);
              });
            }
            return false;
          }
        } else {
          console.log(`📈 Status Check ${i + 1}: Invalid execution data received`);
        }
      } else {
        console.log(`❌ Status Check Failed: ${response.statusCode}`);
      }
      
      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`❌ Status Check Error: ${error.message}`);
    }
  }
  
  console.log('⏰ Timeout waiting for completion');
  return false;
}

async function getExecutionHistory() {
  console.log('\n📜 Getting Execution History...');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/executions/${executionId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      const execution = response.body;
      const history = execution.executionHistory || [];
      console.log(`✅ Execution History Retrieved (${history.length} node executions):`);
      
      history.forEach((nodeExec, index) => {
        const status = nodeExec.error ? '❌ FAILED' : '✅ SUCCESS';
        console.log(`  ${index + 1}. [${nodeExec.timestamp}] ${status}: ${nodeExec.nodeId}`);
        if (nodeExec.error) {
          console.log(`     Error: ${nodeExec.error}`);
        }
        if (nodeExec.output) {
          console.log(`     Output: ${JSON.stringify(nodeExec.output).substring(0, 100)}...`);
        }
      });
      return true;
    } else {
      console.log(`❌ History Retrieval Failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ History Retrieval Failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive API Tests');
  console.log('=====================================');
  
  const results = {
    health: false,
    register: false,
    login: false,
    workflow: false,
    execution: false,
    status: false,
    history: false
  };
  
  // Run tests in sequence
  results.health = await healthCheck();
  
  if (results.health) {
    // Since we use unique user each time, always register first
    results.register = await registerUser();
    if (results.register) {
      results.login = await loginUser();
    }
    
    if (results.login) {
      results.workflow = await createWorkflow();
      
      if (results.workflow) {
        results.execution = await startExecution();
        
        if (results.execution) {
          results.status = await checkExecutionStatus();
          results.history = await getExecutionHistory();
        }
      }
    }
  }
  
  // Print summary
  console.log('\n🎯 Test Results Summary');
  console.log('=======================');
  console.log(`Health Check: ${results.health ? '✅' : '❌'}`);
  console.log(`User Registration: ${results.register ? '✅' : '❌'}`);
  console.log(`User Login: ${results.login ? '✅' : '❌'}`);
  console.log(`Workflow Creation: ${results.workflow ? '✅' : '❌'}`);
  console.log(`Execution Start: ${results.execution ? '✅' : '❌'}`);
  console.log(`Status Monitoring: ${results.status ? '✅' : '❌'}`);
  console.log(`History Retrieval: ${results.history ? '✅' : '❌'}`);
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n📊 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
  
  return passed === total;
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  healthCheck,
  registerUser,
  loginUser,
  createWorkflow,
  startExecution,
  checkExecutionStatus,
  getExecutionHistory
};