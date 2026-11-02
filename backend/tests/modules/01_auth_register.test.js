/**
 * API Test Module: Customer Registration (POST /api/v1/auth/register)
 * 
 * Uses Supertest to send REAL HTTP requests to the Express application:
 *   request(app).post('/api/v1/auth/register').send(...)
 * 
 * Run entire file: node tests/modules/01_auth_register.test.js
 * Or run single fn: node tests/modules/01_auth_register.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

// Module metadata for automated reporting
export const metadata = {
  id: 1,
  title: 'Customer Registration API',
  method: 'POST',
  endpoint: '/api/v1/auth/register',
  filename: '01_auth_register.test.js',
};

// Test 1: Real HTTP POST with valid customer payload
export async function testCase1_validCustomerRegistration() {
  const uniqueEmail = `user_${Date.now()}@example.com`;
  const payload = {
    name: 'Test Customer',
    email: uniqueEmail,
    phone: '+8801711111111',
    password: 'password123'
  };

  const response = await request(app)
    .post('/api/v1/auth/register')
    .send(payload);

  const assertion = assertEqual(response.status, 201);
  return recordResult(1, 'Customer registered successfully', assertion, 'HTTP 201 (Created)', `email="${uniqueEmail}"`);
}

// Test 2: Real HTTP POST with missing email
export async function testCase2_missingRequiredEmail() {
  const payload = {
    name: 'John Doe',
    email: '',
    phone: '+8801711111111',
    password: 'password123'
  };

  const response = await request(app)
    .post('/api/v1/auth/register')
    .send(payload);

  const assertion = assertEqual(response.status, 400);
  return recordResult(2, 'Missing required email rejected', assertion, 'HTTP 400 (Bad Request)', 'email=""');
}

// Test 3: Real HTTP POST with malformed email syntax
export async function testCase3_invalidEmailFormat() {
  const payload = {
    name: 'John Doe',
    email: 'invalid_email_format',
    phone: '+8801711111111',
    password: 'password123'
  };

  const response = await request(app)
    .post('/api/v1/auth/register')
    .send(payload);

  const assertion = assertEqual(response.status, 400);
  return recordResult(3, 'Invalid email syntax rejected', assertion, 'HTTP 400 (Validation Error)', 'email="invalid_email_format"');
}

// Test 4: Real HTTP POST with duplicate existing email
export async function testCase4_duplicateEmailConflict() {
  const payload = {
    name: 'Duplicate Admin',
    email: 'admin@fooddelivery.com',
    phone: '+8801711111111',
    password: 'password123'
  };

  const response = await request(app)
    .post('/api/v1/auth/register')
    .send(payload);

  const assertion = assertEqual(response.status, 400);
  return recordResult(4, 'Duplicate email collision rejected', assertion, 'HTTP 400 (Duplicate Conflict)', 'email="admin@fooddelivery.com"');
}

// Test 5: Real HTTP POST with weak password (< 6 chars) - Intentional expectation test
export async function testCase5_weakPasswordBoundary() {
  const payload = {
    name: 'Short Password User',
    email: `short_${Date.now()}@test.com`,
    phone: '+8801711111111',
    password: '123'
  };

  const response = await request(app)
    .post('/api/v1/auth/register')
    .send(payload);

  // Intentional assertion test for boundary
  const assertion = assertEqual(response.status, 201);
  return recordResult(5, 'Weak password rejected by system validation', assertion, 'HTTP 201 (Wrong expectation)', 'password="123" (< 6 chars)');
}

export const allTests = {
  testCase1_validCustomerRegistration,
  testCase2_missingRequiredEmail,
  testCase3_invalidEmailFormat,
  testCase4_duplicateEmailConflict,
  testCase5_weakPasswordBoundary,
};

if (process.argv[1]?.endsWith('01_auth_register.test.js')) {
  executeTestCases('01: Customer Registration API', allTests).then(() => {
    process.exit(0);
  });
}
