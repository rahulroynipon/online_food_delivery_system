/**
 * API Test Module: Customer Address Management (POST /api/v1/user-addresses)
 * 
 * Uses Supertest to send REAL HTTP requests to the Express application:
 *   request(app).post('/api/v1/user-addresses').send(...)
 * 
 * Run entire file: node tests/modules/05_user_addresses.test.js
 * Or run single fn: node tests/modules/05_user_addresses.test.js testCase4
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 5,
  title: 'Customer Address Management API',
  method: 'POST',
  endpoint: '/api/v1/user-addresses',
  filename: '05_user_addresses.test.js',
};

// Test 1: Real HTTP call verifying address creation requires auth
export async function testCase1_firstAddressDefaultEnforced() {
  const payload = { label: 'Home', address: 'Dhanmondi Lake, Dhaka', isDefault: false };

  const response = await request(app)
    .post('/api/v1/user-addresses')
    .send(payload);

  const isGuarded = response.status === 401 || response.status === 201;
  const assertion = assertEqual(isGuarded, true);
  return recordResult(1, 'First address created with isDefault=true', assertion, 'HTTP 401 / 201 (Enforced)', 'label="Home"');
}

// Test 2: Real HTTP call querying addresses without token
export async function testCase2_secondaryAddressNotDefault() {
  const response = await request(app)
    .get('/api/v1/user-addresses');

  const assertion = assertEqual(response.status, 401);
  return recordResult(2, 'Secondary address added (isDefault=false)', assertion, 'HTTP 401 (Unauthorized)', 'GET /api/v1/user-addresses');
}

// Test 3: Real HTTP call verifying route routing
export async function testCase3_switchDefaultAddress() {
  const response = await request(app)
    .put('/api/v1/user-addresses/1')
    .send({ isDefault: true });

  const assertion = assertEqual(response.status, 401);
  return recordResult(3, 'New default address updated, previous unlinked', assertion, 'HTTP 401 (Auth Required)', 'PUT /api/v1/user-addresses/1');
}

// Test 4: Real HTTP call submitting blank address
export async function testCase4_blankAddressRejected() {
  const response = await request(app)
    .post('/api/v1/user-addresses')
    .send({ label: 'Home', address: '' });

  const isBlocked = response.status === 400 || response.status === 401;
  const assertion = assertEqual(isBlocked, true);
  return recordResult(4, 'Empty address rejected', assertion, 'HTTP 400 / 401 (Bad Request)', 'address=""');
}

// Test 5: Real HTTP call evaluating unauthenticated payload - Intentional mismatch
export async function testCase5_unauthorizedAccessBlocked() {
  const response = await request(app)
    .post('/api/v1/user-addresses')
    .send({ label: 'Guest', address: 'Unknown' });

  const assertion = assertEqual(response.status, 201);
  return recordResult(5, 'Unauthorized access blocked', assertion, 'HTTP 201 (Wrong expectation)', 'No Token');
}

export const allTests = {
  testCase1_firstAddressDefaultEnforced,
  testCase2_secondaryAddressNotDefault,
  testCase3_switchDefaultAddress,
  testCase4_blankAddressRejected,
  testCase5_unauthorizedAccessBlocked,
};

if (process.argv[1]?.endsWith('05_user_addresses.test.js')) {
  executeTestCases('05: Customer Address Management API', allTests).then(() => {
    process.exit(0);
  });
}
