#!/usr/bin/env node

const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: body ? JSON.parse(body) : {}
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testWorkflowCreation() {
  // Use the fresh token from the login response
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGYzNzY3ZjFkYjFhZGU5ZmQ2OWUxYzQiLCJlbWFpbCI6InRlc3QxNzYwNzg2MDQ2NjE3ZWoyQHRlc3QuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjA3ODYyNDAsImV4cCI6MTc2MDc4NzE0MH0.rzsEn4flAvdWfEyybx4XsjqmkVgKtq3gewaOEbeCyY4';
  
  console.log('📋 Testing workflow creation with fresh token...');
  
  const workflowData = {
    name: 'Test Workflow',
    description: 'Simple test workflow',
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
  
  const response = await makeRequest(options, workflowData);
  
  console.log(`Status: ${response.statusCode}`);
  console.log('Response:', JSON.stringify(response.body, null, 2));
  
  if (response.statusCode === 201) {
    console.log('✅ Workflow creation successful!');
  } else {
    console.log('❌ Workflow creation failed');
  }
}

testWorkflowCreation();