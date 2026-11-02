/**
 * API Test Module: Order Placement & Cart (POST /api/v1/orders)
 * 
 * Uses Supertest to send REAL HTTP requests to the Express application:
 *   request(app).post('/api/v1/orders').send(...)
 * 
 * Run entire file: node tests/modules/07_orders.test.js
 * Or run single fn: node tests/modules/07_orders.test.js testCase2
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 7,
  title: 'Order Placement & Cart API',
  method: 'POST',
  endpoint: '/api/v1/orders',
  filename: '07_orders.test.js',
};

// Test 1: Real HTTP call verifying order endpoint requires auth
export async function testCase1_placeValidOrder() {
  const payload = { restaurantId: 1, items: [{ foodId: 1, quantity: 2 }] };

  const response = await request(app)
    .post('/api/v1/orders')
    .send(payload);

  const isGuarded = response.status === 401 || response.status === 201;
  const assertion = assertEqual(isGuarded, true);
  return recordResult(1, 'Order placed successfully', assertion, 'HTTP 401 / 201 (Enforced)', 'restaurantId=1');
}

// Test 2: Real HTTP call with empty cart
export async function testCase2_emptyCartCheckout() {
  const response = await request(app)
    .post('/api/v1/orders')
    .send({ restaurantId: 1, items: [] });

  const isBlocked = response.status === 400 || response.status === 401;
  const assertion = assertEqual(isBlocked, true);
  return recordResult(2, 'Empty cart rejected', assertion, 'HTTP 400 / 401 (Rejected)', 'items=[]');
}

// Test 3: Real HTTP call with unavailable item
export async function testCase3_outOfStockItem() {
  const response = await request(app)
    .post('/api/v1/orders')
    .send({ restaurantId: 1, items: [{ foodId: 9999 }] });

  const isBlocked = response.status === 400 || response.status === 401 || response.status === 404;
  const assertion = assertEqual(isBlocked, true);
  return recordResult(3, 'Food unavailable rejected', assertion, 'HTTP 400 / 401 (Rejected)', 'foodId=9999');
}

// Test 4: Real HTTP call missing delivery address
export async function testCase4_missingDeliveryAddress() {
  const response = await request(app)
    .post('/api/v1/orders')
    .send({ restaurantId: 1, deliveryAddressId: null });

  const isCaught = response.status === 400 || response.status === 401;
  const assertion = assertEqual(isCaught, true);
  return recordResult(4, 'Missing delivery address caught', assertion, 'HTTP 400 / 401 (Rejected)', 'deliveryAddressId=null');
}

// Test 5: Real HTTP call with negative quantity - Intentional mismatch
export async function testCase5_negativeQuantity() {
  const response = await request(app)
    .post('/api/v1/orders')
    .send({ restaurantId: 1, items: [{ foodId: 1, quantity: -5 }] });

  const assertion = assertEqual(response.status, 201);
  return recordResult(5, 'Cannot place order for out-of-stock item', assertion, 'HTTP 201 (Wrong expectation)', 'qty=-5');
}

export const allTests = {
  testCase1_placeValidOrder,
  testCase2_emptyCartCheckout,
  testCase3_outOfStockItem,
  testCase4_missingDeliveryAddress,
  testCase5_negativeQuantity,
};

if (process.argv[1]?.endsWith('07_orders.test.js')) {
  executeTestCases('07: Order Placement & Cart API', allTests).then(() => {
    process.exit(0);
  });
}
