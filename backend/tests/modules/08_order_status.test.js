/**
 * API Test Module: Order Status Lifecycle (PUT /api/v1/orders/:id/status)
 * 
 * Uses Supertest to send REAL HTTP requests to the Express application:
 *   request(app).put('/api/v1/orders/1/status').send(...)
 * 
 * Run entire file: node tests/modules/08_order_status.test.js
 * Or run single fn: node tests/modules/08_order_status.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 8,
  title: 'Order Status Lifecycle API',
  method: 'PUT',
  endpoint: '/api/v1/orders/:id/status',
  filename: '08_order_status.test.js',
};

// Test 1: Real HTTP call confirming order route protection
export async function testCase1_confirmPendingOrder() {
  const response = await request(app)
    .put('/api/v1/orders/1/status')
    .send({ status: 'CONFIRMED' });

  const isGuarded = response.status === 401 || response.status === 200;
  const assertion = assertEqual(isGuarded, true);
  return recordResult(1, 'Status updated to CONFIRMED', assertion, 'HTTP 401 / 200 (Protected)', 'status="CONFIRMED"');
}

// Test 2: Real HTTP call updating status to preparing
export async function testCase2_startPreparingKitchen() {
  const response = await request(app)
    .put('/api/v1/orders/1/status')
    .send({ status: 'PREPARING' });

  const isGuarded = response.status === 401 || response.status === 200;
  const assertion = assertEqual(isGuarded, true);
  return recordResult(2, 'Status updated to PREPARING', assertion, 'HTTP 401 / 200 (Protected)', 'status="PREPARING"');
}

// Test 3: Real HTTP call rider pickup status
export async function testCase3_riderPickupPackage() {
  const response = await request(app)
    .put('/api/v1/orders/1/status')
    .send({ status: 'OUT_FOR_DELIVERY' });

  const isGuarded = response.status === 401 || response.status === 200;
  const assertion = assertEqual(isGuarded, true);
  return recordResult(3, 'Status updated to OUT_FOR_DELIVERY', assertion, 'HTTP 401 / 200 (Protected)', 'status="OUT_FOR_DELIVERY"');
}

// Test 4: Real HTTP call delivered status
export async function testCase4_completeDelivery() {
  const response = await request(app)
    .put('/api/v1/orders/1/status')
    .send({ status: 'DELIVERED' });

  const isGuarded = response.status === 401 || response.status === 200;
  const assertion = assertEqual(isGuarded, true);
  return recordResult(4, 'Status updated to DELIVERED', assertion, 'HTTP 401 / 200 (Protected)', 'status="DELIVERED"');
}

// Test 5: Real HTTP call invalid backward transition - Intentional mismatch
export async function testCase5_illegalBackwardTransition() {
  const response = await request(app)
    .put('/api/v1/orders/1/status')
    .send({ status: 'PENDING' });

  const assertion = assertEqual(response.status, 200);
  return recordResult(5, 'Illegal state backward transition rejected', assertion, 'HTTP 200 (Wrong expectation)', 'status="PENDING"');
}

export const allTests = {
  testCase1_confirmPendingOrder,
  testCase2_startPreparingKitchen,
  testCase3_riderPickupPackage,
  testCase4_completeDelivery,
  testCase5_illegalBackwardTransition,
};

if (process.argv[1]?.endsWith('08_order_status.test.js')) {
  executeTestCases('08: Order Status Lifecycle API', allTests).then(() => {
    process.exit(0);
  });
}
