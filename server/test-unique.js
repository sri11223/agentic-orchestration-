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

async function testUniqueRegistration() {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  console.log(`Trying to register user with unique ID: ${uniqueId}`);
  
  const userData = {
    username: `u${uniqueId.replace(/-/g, '_')}`, // Replace hyphens with underscores
    email: `user${uniqueId}@testdomain.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User'
  };
  
  console.log('User data:', JSON.stringify(userData, null, 2));
  
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
    console.log(`\nStatus: ${response.statusCode}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

testUniqueRegistration();