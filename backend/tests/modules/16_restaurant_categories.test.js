/**
 * API Test Module: Restaurant Menu Categories API
 * Route: GET / POST /api/v1/restaurant-categories
 * 
 * Uses Supertest to send REAL HTTP requests to Express.
 * Run file: node tests/modules/16_restaurant_categories.test.js
 * Run single fn: node tests/modules/16_restaurant_categories.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 16,
  title: 'Restaurant Menu Categories API',
  method: 'GET / POST',
  endpoint: '/api/v1/restaurant-categories',
  filename: '16_restaurant_categories.test.js',
};

// Test 1: Fetching restaurant merchant categories requires authorization
export async function testCase1_getMyCategoriesWithoutAuth() {
  const response = await request(app).get('/api/v1/restaurant-categories');
  const assertion = assertEqual(response.status, 401);
  return recordResult(1, 'Merchant categories route guarded by RESTAURANT role', assertion, 'HTTP 401 (Unauthorized)', 'GET /api/v1/restaurant-categories');
}

// Test 2: Creating a menu category requires restaurant merchant session
export async function testCase2_createCategoryWithoutAuth() {
  const response = await request(app)
    .post('/api/v1/restaurant-categories')
    .send({ name: 'Special Combos' });

  const assertion = assertEqual(response.status, 401);
  return recordResult(2, 'Category creation requires merchant credentials', assertion, 'HTTP 401 (Unauthorized)', 'name="Special Combos" (no token)');
}

// Test 3: Updating category by slug requires authorization
export async function testCase3_updateCategoryWithoutAuth() {
  const response = await request(app)
    .put('/api/v1/restaurant-categories/special-combos')
    .send({ name: 'Super Combos' });

  const assertion = assertEqual(response.status, 401);
  return recordResult(3, 'Category update guarded against unauthorized requests', assertion, 'HTTP 401 (Unauthorized)', 'slug="special-combos"');
}

// Test 4: Deleting category requires authorization
export async function testCase4_deleteCategoryWithoutAuth() {
  const response = await request(app).delete('/api/v1/restaurant-categories/special-combos');
  const assertion = assertEqual(response.status, 401);
  return recordResult(4, 'Category deletion guarded against unauthenticated requests', assertion, 'HTTP 401 (Unauthorized)', 'DELETE /api/v1/restaurant-categories/special-combos');
}

// Test 5: Inverted assertion - Expect 200 on unauthenticated category toggle
export async function testCase5_toggleCategoryStatusWithoutAuth() {
  const response = await request(app)
    .put('/api/v1/restaurant-categories/special-combos/status');

  const assertion = assertEqual(response.status, 200);
  return recordResult(5, 'Toggle category status without auth rejected', assertion, 'HTTP 200 (Wrong expectation)', 'PUT /api/v1/restaurant-categories/special-combos/status');
}

export const allTests = {
  testCase1_getMyCategoriesWithoutAuth,
  testCase2_createCategoryWithoutAuth,
  testCase3_updateCategoryWithoutAuth,
  testCase4_deleteCategoryWithoutAuth,
  testCase5_toggleCategoryStatusWithoutAuth,
};

if (process.argv[1]?.endsWith('16_restaurant_categories.test.js')) {
  executeTestCases('16: Restaurant Menu Categories API', allTests).then(() => {
    process.exit(0);
  });
}

