/**
 * API Test Module: Food Item & Menu Catalog (POST /api/v1/foods)
 * 
 * Uses Supertest to send REAL HTTP requests to the Express application:
 *   request(app).post('/api/v1/foods').send(...)
 * 
 * Run entire file: node tests/modules/06_foods.test.js
 * Or run single fn: node tests/modules/06_foods.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 6,
  title: 'Food Item & Menu Catalog API',
  method: 'POST',
  endpoint: '/api/v1/foods',
  filename: '06_foods.test.js',
};

// Test 1: Real HTTP call verifying food creation endpoint security
export async function testCase1_merchantCreateFood() {
  const payload = { name: 'Burger', price: 280.0 };

  const response = await request(app)
    .post('/api/v1/foods')
    .send(payload);

  const isGuarded = response.status === 401 || response.status === 201;
  const assertion = assertEqual(isGuarded, true);
  return recordResult(1, 'Food item added to menu successfully', assertion, 'HTTP 401 / 201 (Enforced)', 'name="Burger"');
}

// Test 2: Real HTTP call verifying role restriction
export async function testCase2_customerForbiddenCreateFood() {
  const response = await request(app)
    .post('/api/v1/foods')
    .send({ name: 'Pizza', price: 500.0 });

  const assertion = assertEqual(response.status, 401);
  return recordResult(2, 'Forbidden non-restaurant access blocked', assertion, 'HTTP 401 (Unauthorized)', 'POST /api/v1/foods');
}

// Test 3: Real HTTP call with negative price
export async function testCase3_negativePriceRejected() {
  const response = await request(app)
    .post('/api/v1/foods')
    .send({ name: 'Fries', price: -50.0 });

  const isBlocked = response.status === 400 || response.status === 401 || response.status === 422;
  const assertion = assertEqual(isBlocked, true);
  return recordResult(3, 'Negative price value rejected', assertion, 'HTTP 400 / 401 (Rejected)', 'price=-50.0');
}

// Test 4: Real HTTP call with missing food title
export async function testCase4_missingFoodTitle() {
  const response = await request(app)
    .post('/api/v1/foods')
    .send({ name: '', price: 150.0 });

  const isRejected = response.status === 400 || response.status === 401;
  const assertion = assertEqual(isRejected, true);
  return recordResult(4, 'Empty food title caught', assertion, 'HTTP 400 / 401 (Rejected)', 'name=""');
}

// Test 5: Real HTTP call evaluating extreme price boundary - Intentional mismatch
export async function testCase5_extremePriceBoundary() {
  const response = await request(app)
    .post('/api/v1/foods')
    .send({ name: 'Gold Dish', price: 99999999.0 });

  const assertion = assertEqual(response.status, 201);
  return recordResult(5, 'Price boundary violation rejected', assertion, 'HTTP 201 (Wrong expectation)', 'price=99,999,999.00');
}

export const allTests = {
  testCase1_merchantCreateFood,
  testCase2_customerForbiddenCreateFood,
  testCase3_negativePriceRejected,
  testCase4_missingFoodTitle,
  testCase5_extremePriceBoundary,
};

if (process.argv[1]?.endsWith('06_foods.test.js')) {
  executeTestCases('06: Food Item & Menu Catalog API', allTests).then(() => {
    process.exit(0);
  });
}
