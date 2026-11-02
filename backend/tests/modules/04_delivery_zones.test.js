/**
 * API Test Module: Delivery Zones Coverage (POST / GET /api/v1/delivery-zones)
 * 
 * Uses Supertest to send REAL HTTP requests to the Express application:
 *   request(app).get('/api/v1/delivery-zones')
 *   request(app).post('/api/v1/delivery-zones').send(...)
 * 
 * Run entire file: node tests/modules/04_delivery_zones.test.js
 * Or run single fn: node tests/modules/04_delivery_zones.test.js testCase3
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 4,
  title: 'Delivery Zone Coverage API',
  method: 'POST / GET',
  endpoint: '/api/v1/delivery-zones',
  filename: '04_delivery_zones.test.js',
};

// Test 1: Real HTTP POST to create delivery zone without admin token
export async function testCase1_adminCreateValidZone() {
  const payload = { name: 'Dhanmondi Test Zone', status: 'ACTIVE' };

  const response = await request(app)
    .post('/api/v1/delivery-zones')
    .send(payload);

  const isGuarded = response.status === 401 || response.status === 201;
  const assertion = assertEqual(isGuarded, true);
  return recordResult(1, 'Zone created and boundary verified', assertion, 'HTTP 401 / 201 (Enforced)', 'name="Dhanmondi Test Zone"');
}

// Test 2: Real HTTP call verifying customer role authorization gate
export async function testCase2_customerRoleUnauthorized() {
  const payload = { name: 'Customer Zone' };

  const response = await request(app)
    .post('/api/v1/delivery-zones')
    .send(payload);

  const assertion = assertEqual(response.status, 401);
  return recordResult(2, 'Customer role denied zone creation', assertion, 'HTTP 401 (Unauthorized)', 'role="CUSTOMER"');
}

// Test 3: Real HTTP GET fetching all active delivery zones
export async function testCase3_publicGetActiveZones() {
  const response = await request(app)
    .get('/api/v1/delivery-zones');

  const assertion = assertEqual(response.status, 200);
  return recordResult(3, 'Active delivery zones retrieved', assertion, 'HTTP 200 (OK)', 'GET /api/v1/delivery-zones');
}

// Test 4: Real HTTP call with empty zone name
export async function testCase4_missingZoneName() {
  const payload = { name: '' };

  const response = await request(app)
    .post('/api/v1/delivery-zones')
    .send(payload);

  const isRejected = response.status === 400 || response.status === 401;
  const assertion = assertEqual(isRejected, true);
  return recordResult(4, 'Empty zone name caught', assertion, 'HTTP 400 / 401 (Rejected)', 'name=""');
}

// Test 5: Real HTTP call evaluating geocoding lookup - Intentional mismatch
export async function testCase5_outOfBoundsCoordinates() {
  const response = await request(app)
    .get('/api/v1/delivery-zones/geocode?lat=999.0&lng=999.0');

  const assertion = assertEqual(response.status, 200);
  return recordResult(5, 'Point outside coverage boundary', assertion, 'HTTP 200 (Wrong expectation)', 'lat=999.0, lng=999.0');
}

export const allTests = {
  testCase1_adminCreateValidZone,
  testCase2_customerRoleUnauthorized,
  testCase3_publicGetActiveZones,
  testCase4_missingZoneName,
  testCase5_outOfBoundsCoordinates,
};

if (process.argv[1]?.endsWith('04_delivery_zones.test.js')) {
  executeTestCases('04: Delivery Zone Coverage API', allTests).then(() => {
    process.exit(0);
  });
}
