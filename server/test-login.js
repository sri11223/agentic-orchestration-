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

async function testLogin() {
  console.log('🔐 Testing login with previously created user...');
  
  const loginData = {
    email: 'test1760786046617ej2@test.com',
    password: 'TestPass123!'
  };
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };
  
  const response = await makeRequest(options, loginData);
  
  console.log(`Status: ${response.statusCode}`);
  console.log('Response:', JSON.stringify(response.body, null, 2));
}

testLogin();