#!/usr/bin/env node

// Quick JWT decode test
const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGYzNzY3ZjFkYjFhZGU5ZmQ2OWUxYzQiLCJlbWFpbCI6InRlc3QxNzYwNzg2MDQ2NjE3ZWoyQHRlc3QuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjA3ODYwNDcsImV4cCI6MTc2MDc4Njk0N30.rXDb12KkBmzNEtg_6aBZwsbQ_Clh4LB4khMUC5xuzaM';

try {
  const decoded = jwt.decode(token);
  console.log('JWT payload:', JSON.stringify(decoded, null, 2));
} catch (err) {
  console.log('Error decoding:', err.message);
}