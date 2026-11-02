/**
 * API Test Module: Delivery Rider Onboarding API
 * Route: POST /api/v1/onboarding/rider
 * 
 * Uses Supertest to send REAL HTTP requests to Express.
 * Run file: node tests/modules/20_onboarding_rider.test.js
 * Run single fn: node tests/modules/20_onboarding_rider.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 20,
  title: 'Delivery Rider Onboarding API',
  method: 'POST',
  endpoint: '/api/v1/onboarding/rider',
  filename: '20_onboarding_rider.test.js',
};

// Test 1: Missing required rider fields returns 400 Bad Request
export async function testCase1_missingRequiredFieldsRejected() {
  const response = await request(app)
    .post('/api/v1/onboarding/rider')
    .send({});

  const assertion = assertEqual(response.status, 400);
  return recordResult(1, 'Empty delivery rider application rejected', assertion, 'HTTP 400 (Bad Request)', '{}');
}

// Test 2: Incomplete vehicle information rejected
export async function testCase2_missingVehicleTypeRejected() {
  const response = await request(app)
    .post('/api/v1/onboarding/rider')
    .send({
      fullName: 'Karim Ahmed',
      email: 'karim_rider@test.com',
      phone: '01912345678',
    });

  const assertion = assertEqual(response.status, 400);
  return recordResult(2, 'Missing vehicle classification rejected', assertion, 'HTTP 400 (Bad Request)', 'vehicleType=undefined');
}

// Test 3: Existing user email collision on rider application
export async function testCase3_duplicateUserEmailRejected() {
  const response = await request(app)
    .post('/api/v1/onboarding/rider')
    .send({
      fullName: 'Duplicate Admin',
      email: 'admin@fooddelivery.com',
      phone: '01700000001',
      vehicleType: 'MOTORBIKE',
    });

  const assertion = assertEqual(response.status, 400);
  return recordResult(3, 'Existing user account email collision rejected', assertion, 'HTTP 400 (User Exists)', 'email="admin@fooddelivery.com"');
}

// Test 4: Fetching personal rider dashboard profile requires rider auth
export async function testCase4_getMyRiderWithoutAuth() {
  const response = await request(app).get('/api/v1/onboarding/rider/me');
  const assertion = assertEqual(response.status, 401);
  return recordResult(4, 'Personal rider profile requires active rider session', assertion, 'HTTP 401 (Unauthorized)', 'GET /api/v1/onboarding/rider/me');
}

// Test 5: Inverted assertion - Expect 200 on empty rider application submission
export async function testCase5_emptyRiderApplicationInvertedAssertion() {
  const response = await request(app)
    .post('/api/v1/onboarding/rider')
    .send({});

  const assertion = assertEqual(response.status, 201);
  return recordResult(5, 'Malformed rider registration submission rejected', assertion, 'HTTP 201 (Wrong expectation)', 'POST /api/v1/onboarding/rider');
}

export const allTests = {
  testCase1_missingRequiredFieldsRejected,
  testCase2_missingVehicleTypeRejected,
  testCase3_duplicateUserEmailRejected,
  testCase4_getMyRiderWithoutAuth,
  testCase5_emptyRiderApplicationInvertedAssertion,
};

if (process.argv[1]?.endsWith('20_onboarding_rider.test.js')) {
  executeTestCases('20: Delivery Rider Onboarding API', allTests).then(() => {
    process.exit(0);
  });
}

