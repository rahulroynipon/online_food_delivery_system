/**
 * API Test Module: Restaurant Partner Onboarding API
 * Route: POST /api/v1/onboarding/restaurant
 * 
 * Uses Supertest to send REAL HTTP requests to Express.
 * Run file: node tests/modules/19_onboarding_restaurant.test.js
 * Run single fn: node tests/modules/19_onboarding_restaurant.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 19,
  title: 'Restaurant Partner Onboarding API',
  method: 'POST',
  endpoint: '/api/v1/onboarding/restaurant',
  filename: '19_onboarding_restaurant.test.js',
};

// Test 1: Missing required restaurant fields returns 400 Bad Request
export async function testCase1_missingRequiredFieldsRejected() {
  const response = await request(app)
    .post('/api/v1/onboarding/restaurant')
    .send({});

  const assertion = assertEqual(response.status, 400);
  return recordResult(1, 'Empty restaurant application payload rejected', assertion, 'HTTP 400 (Bad Request)', '{}');
}

// Test 2: Incomplete coordinates in restaurant application rejected
export async function testCase2_missingCoordinatesRejected() {
  const response = await request(app)
    .post('/api/v1/onboarding/restaurant')
    .send({
      restaurantName: 'Grand Cafe',
      ownerName: 'Owner Smith',
      email: 'grandcafe@test.com',
      phone: '01712345678',
      description: 'Fine dining',
      address: 'Dhanmondi, Dhaka',
      deliveryZoneId: 1,
    });

  const assertion = assertEqual(response.status, 400);
  return recordResult(2, 'Missing map coordinates (lat/lng) rejected', assertion, 'HTTP 400 (Bad Request)', 'latitude=undefined, longitude=undefined');
}

// Test 3: Invalid delivery zone selection rejected
export async function testCase3_invalidDeliveryZoneRejected() {
  const response = await request(app)
    .post('/api/v1/onboarding/restaurant')
    .send({
      restaurantName: 'Corner Bistro',
      ownerName: 'Alice Green',
      email: 'cornerbistro@test.com',
      phone: '01812345678',
      description: 'Quick casual meals',
      address: 'Gulshan 2, Dhaka',
      deliveryZoneId: 99999,
      latitude: 23.7925,
      longitude: 90.4078,
    });

  const assertion = assertEqual(response.status, 400);
  return recordResult(3, 'Non-existent delivery zone reference rejected', assertion, 'HTTP 400 (Invalid Zone)', 'deliveryZoneId=99999');
}

// Test 4: Accessing pending onboarding applications requires admin auth
export async function testCase4_getApplicationsWithoutAuth() {
  const response = await request(app).get('/api/v1/onboarding/applications');
  const isGuarded = response.status === 401 || response.status === 403;
  const assertion = assertEqual(isGuarded, true);
  return recordResult(4, 'Admin applications queue guarded by authentication', assertion, 'HTTP 401 / 403 (Protected)', 'GET /api/v1/onboarding/applications');
}

// Test 5: Inverted assertion - Expect 200 on empty restaurant application
export async function testCase5_emptyApplicationInvertedExpectation() {
  const response = await request(app)
    .post('/api/v1/onboarding/restaurant')
    .send({});

  const assertion = assertEqual(response.status, 201);
  return recordResult(5, 'Malformed restaurant application submission rejected', assertion, 'HTTP 201 (Wrong expectation)', 'POST /api/v1/onboarding/restaurant');
}

export const allTests = {
  testCase1_missingRequiredFieldsRejected,
  testCase2_missingCoordinatesRejected,
  testCase3_invalidDeliveryZoneRejected,
  testCase4_getApplicationsWithoutAuth,
  testCase5_emptyApplicationInvertedExpectation,
};

if (process.argv[1]?.endsWith('19_onboarding_restaurant.test.js')) {
  executeTestCases('19: Restaurant Partner Onboarding API', allTests).then(() => {
    process.exit(0);
  });
}

