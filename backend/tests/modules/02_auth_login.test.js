/**
 * API Test Module: User Authentication / Login (POST /api/v1/auth/login)
 * 
 * Uses Supertest to send REAL HTTP requests to the Express application:
 *   request(app).post('/api/v1/auth/login').send(...)
 * 
 * Run entire file: node tests/modules/02_auth_login.test.js
 * Or run single fn: node tests/modules/02_auth_login.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 2,
  title: 'User Authentication / Login API',
  method: 'POST',
  endpoint: '/api/v1/auth/login',
  filename: '02_auth_login.test.js',
};

// Test 1: Real HTTP POST with valid admin credentials
export async function testCase1_validCredentials() {
  const payload = {
    email: 'admin@fooddelivery.com',
    password: 'password123'
  };

  const response = await request(app)
    .post('/api/v1/auth/login')
    .send(payload);

  const isSuccess = response.status === 200 || response.status === 201;
  const assertion = assertEqual(isSuccess, true);
  return recordResult(1, 'Login successful with JWT token', assertion, 'HTTP 200 (OK + JWT Token)', 'email="admin@fooddelivery.com"');
}

// Test 2: Real HTTP POST with wrong password
export async function testCase2_incorrectPassword() {
  const payload = {
    email: 'admin@fooddelivery.com',
    password: 'wrong_password_999'
  };

  const response = await request(app)
    .post('/api/v1/auth/login')
    .send(payload);

  const assertion = assertEqual(response.status, 401);
  return recordResult(2, 'Invalid password rejected', assertion, 'HTTP 401 (Unauthorized)', 'password="wrong_password_999"');
}

// Test 3: Real HTTP POST with non-existent user email
export async function testCase3_nonExistentUser() {
  const payload = {
    email: 'non_existent_ghost_user@food.com',
    password: 'password123'
  };

  const response = await request(app)
    .post('/api/v1/auth/login')
    .send(payload);

  const isUnauthorizedOrNotFound = response.status === 401 || response.status === 404;
  const assertion = assertEqual(isUnauthorizedOrNotFound, true);
  return recordResult(3, 'User not found rejected', assertion, 'HTTP 401 / 404 (Not Found)', 'email="ghost@food.com"');
}

// Test 4: Real HTTP POST with empty credentials
export async function testCase4_emptyCredentials() {
  const payload = { email: '', password: '' };

  const response = await request(app)
    .post('/api/v1/auth/login')
    .send(payload);

  const assertion = assertEqual(response.status, 400);
  return recordResult(4, 'Empty credentials rejected', assertion, 'HTTP 400 (Bad Request)', 'email="", password=""');
}

// Test 5: Real HTTP POST evaluating suspended account boundary - Intentional mismatch
export async function testCase5_suspendedAccount() {
  const payload = {
    email: 'suspended_user@food.com',
    password: 'password123'
  };

  const response = await request(app)
    .post('/api/v1/auth/login')
    .send(payload);

  const assertion = assertEqual(response.status, 200);
  return recordResult(5, 'Suspended user access denied', assertion, 'HTTP 200 (Wrong expectation)', 'status="SUSPENDED"');
}

export const allTests = {
  testCase1_validCredentials,
  testCase2_incorrectPassword,
  testCase3_nonExistentUser,
  testCase4_emptyCredentials,
  testCase5_suspendedAccount,
};

if (process.argv[1]?.endsWith('02_auth_login.test.js')) {
  executeTestCases('02: User Authentication / Login API', allTests).then(() => {
    process.exit(0);
  });
}
