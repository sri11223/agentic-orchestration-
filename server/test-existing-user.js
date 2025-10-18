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

async function testWithExistingUser() {
  console.log('=== Testing with Existing User ===\n');
  
  // Try to login with existing user (we know testuser001 exists)
  console.log('🔐 Testing login with known user...');
  
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
    
    // Try with the user we created earlier
    const loginData = {
      email: 'testuser001@example.com',
      password: 'password123'
    };
    
    const response = await makeRequest(options, loginData);
    console.log(`Status: ${response.statusCode}`);
    
    if (response.statusCode === 200 && response.body.tokens) {
      console.log('✅ Login successful with existing user!');
      
      const token = response.body.tokens.accessToken;
      console.log('Got token, testing workflow creation...\n');
      
      // Test workflow creation
      const workflowOptions = {
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
        name: 'Test Workflow',
        description: 'Simple test',
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
      
      const workflowResponse = await makeRequest(workflowOptions, workflowData);
      console.log(`📋 Workflow creation: ${workflowResponse.statusCode}`);
      
      if (workflowResponse.statusCode === 201) {
        console.log('✅ Workflow created successfully!');
        console.log('🎉 API is working correctly!');
      } else {
        console.log('❌ Workflow creation failed');
        console.log('Response:', JSON.stringify(workflowResponse.body, null, 2));
      }
      
    } else {
      console.log('❌ Login failed');
      console.log('Response:', JSON.stringify(response.body, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testWithExistingUser();