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

async function singleTest() {
  const uniqueId = `test${Date.now()}${Math.random().toString(36).substring(2, 5)}`;
  
  console.log(`Testing registration with ID: ${uniqueId}`);
  
  const userData = {
    username: uniqueId,
    email: `${uniqueId}@test.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User'
  };
  
  console.log('Sending:', JSON.stringify(userData, null, 2));
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };
  
  const response = await makeRequest(options, userData);
  console.log(`\nResponse: ${response.statusCode}`);
  console.log(JSON.stringify(response.body, null, 2));
}

singleTest().catch(console.error);