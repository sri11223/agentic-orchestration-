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

async function quickTest() {
  console.log('🧪 Quick Registration Test');
  
  const userData = {
    username: 'quicktest123',
    email: 'quicktest123@example.com',
    password: 'TestPass123!',
    firstName: 'Quick',
    lastName: 'Test'
  };
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };
  
  const response = await makeRequest(options, userData);
  
  if (response.statusCode === 201) {
    console.log('✅ SUCCESS! Registration worked!');
    console.log('Response:', response.body);
  } else {
    console.log(`❌ FAILED: ${response.statusCode}`);
    console.log('Response:', response.body);
  }
}

quickTest();