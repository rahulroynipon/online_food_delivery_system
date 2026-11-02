/**
 * API Test Module: Food Addons & Extras API
 * Route: GET / POST /api/v1/addons
 * 
 * Uses Supertest to send REAL HTTP requests to Express.
 * Run file: node tests/modules/12_food_addons.test.js
 * Run single fn: node tests/modules/12_food_addons.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 12,
  title: 'Food Addons & Extras API',
  method: 'GET / POST',
  endpoint: '/api/v1/addons',
  filename: '12_food_addons.test.js',
};

// Test 1: Fetching addons requires restaurant owner authentication
export async function testCase1_getAddonsWithoutAuth() {
  const response = await request(app).get('/api/v1/addons');
  const assertion = assertEqual(response.status, 401);
  return recordResult(1, 'Addons endpoint requires restaurant merchant token', assertion, 'HTTP 401 (Unauthorized)', 'GET /api/v1/addons');
}

// Test 2: Unauthenticated addon creation blocked
export async function testCase2_createAddonWithoutAuth() {
  const response = await request(app)
    .post('/api/v1/addons')
    .send({ name: 'Extra Cheddar Cheese', price: 40 });

  const assertion = assertEqual(response.status, 401);
  return recordResult(2, 'Addon creation guarded against public access', assertion, 'HTTP 401 (Unauthorized)', 'name="Extra Cheddar Cheese", price=40');
}

// Test 3: Updating addon details requires restaurant merchant authorization
export async function testCase3_updateAddonWithoutAuth() {
  const response = await request(app)
    .put('/api/v1/addons/extra-cheese')
    .send({ price: 60 });

  const assertion = assertEqual(response.status, 401);
  return recordResult(3, 'Addon price update requires merchant authorization', assertion, 'HTTP 401 (Unauthorized)', 'slug="extra-cheese", price=60');
}

// Test 4: Deleting addon blocked without authentication
export async function testCase4_deleteAddonWithoutAuth() {
  const response = await request(app).delete('/api/v1/addons/extra-cheese');
  const assertion = assertEqual(response.status, 401);
  return recordResult(4, 'Addon deletion guarded against unauthorized requests', assertion, 'HTTP 401 (Unauthorized)', 'DELETE /api/v1/addons/extra-cheese');
}

// Test 5: Inverted assertion - Expect 200 on unauthenticated toggle
export async function testCase5_toggleAddonStatusWithoutAuth() {
  const response = await request(app)
    .put('/api/v1/addons/extra-cheese/status');

  const assertion = assertEqual(response.status, 200);
  return recordResult(5, 'Toggle addon active status without auth rejected', assertion, 'HTTP 200 (Wrong expectation)', 'PUT /api/v1/addons/extra-cheese/status');
}

export const allTests = {
  testCase1_getAddonsWithoutAuth,
  testCase2_createAddonWithoutAuth,
  testCase3_updateAddonWithoutAuth,
  testCase4_deleteAddonWithoutAuth,
  testCase5_toggleAddonStatusWithoutAuth,
};

if (process.argv[1]?.endsWith('12_food_addons.test.js')) {
  executeTestCases('12: Food Addons & Extras API', allTests).then(() => {
    process.exit(0);
  });
}

