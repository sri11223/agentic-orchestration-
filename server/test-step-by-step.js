#!/usr/bin/env node

const http = require('http');

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

async function testSingleRegistration() {
  console.log('Testing single user registration...');
  
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 10000);
  const userData = {
    username: `testuser${randomPart}`,
    email: `testuser${timestamp}_${randomPart}@example.com`, 
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User'
  };
  
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
    
    const response = await makeRequest(options, userData);
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 201) {
      return { success: true, userData };
    }
    return { success: false, userData };
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSingleLogin(userData) {
  console.log('Testing single user login...');
  
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
      email: userData.email,
      password: userData.password
    };
    
    const response = await makeRequest(options, loginData);
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200 && response.body.tokens) {
      return { success: true, token: response.body.tokens.accessToken };
    }
    return { success: false };
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSingleWorkflow(token) {
  console.log('Testing single workflow creation...');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/workflows',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const workflowData = {
      name: 'Simple Test Workflow',
      description: 'A minimal test workflow',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          data: { triggerType: 'manual' },
          position: { x: 100, y: 100 }
        }
      ],
      edges: [],
      status: 'active'
    };
    
    const response = await makeRequest(options, workflowData);
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    
    return response.statusCode === 201;
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return false;
  }
}

async function runStepByStep() {
  console.log('=== Step by Step Testing ===\n');
  
  // Test registration
  const regResult = await testSingleRegistration();
  if (!regResult.success) {
    console.log('❌ Registration failed, stopping tests');
    return;
  }
  console.log('✅ Registration successful\n');
  
  // Wait to avoid rate limiting
  console.log('Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test login
  const loginResult = await testSingleLogin(regResult.userData);
  if (!loginResult.success) {
    console.log('❌ Login failed, stopping tests');
    return;
  }
  console.log('✅ Login successful\n');
  
  // Wait to avoid rate limiting
  console.log('Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test workflow creation
  const workflowResult = await testSingleWorkflow(loginResult.token);
  if (workflowResult) {
    console.log('✅ Workflow creation successful');
  } else {
    console.log('❌ Workflow creation failed');
  }
}

runStepByStep().catch(console.error);