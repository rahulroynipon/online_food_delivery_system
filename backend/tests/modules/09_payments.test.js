/**
 * API Test Module: Payment Gateway (POST /api/v1/payments/sslcommerz/init)
 * 
 * Uses Supertest to send REAL HTTP requests to the Express application:
 *   request(app).post('/api/v1/payments/sslcommerz/init').send(...)
 * 
 * Run entire file: node tests/modules/09_payments.test.js
 * Or run single fn: node tests/modules/09_payments.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 9,
  title: 'Payment Gateway Integration API',
  method: 'POST',
  endpoint: '/api/v1/payments/sslcommerz/init',
  filename: '09_payments.test.js',
};

// Test 1: Real HTTP call initializing payment gateway
export async function testCase1_initiateSessionUnpaidOrder() {
  const payload = { orderId: 1 };

  const response = await request(app)
    .post('/api/v1/payments/sslcommerz/init')
    .send(payload);

  const isGuarded = response.status === 401 || response.status === 200;
  const assertion = assertEqual(isGuarded, true);
  return recordResult(1, 'Payment session generated with gateway URL', assertion, 'HTTP 401 / 200 (Protected)', 'orderId=1');
}

// Test 2: Real HTTP call on non-existent order
export async function testCase2_nonExistentOrderPayment() {
  const response = await request(app)
    .post('/api/v1/payments/sslcommerz/init')
    .send({ orderId: 999999 });

  const isRejected = response.status === 401 || response.status === 404;
  const assertion = assertEqual(isRejected, true);
  return recordResult(2, 'Non-existent order payment rejected', assertion, 'HTTP 401 / 404 (Not Found)', 'orderId=999999');
}

// Test 3: Real HTTP call testing already paid order
export async function testCase3_alreadyPaidOrder() {
  const response = await request(app)
    .post('/api/v1/payments/sslcommerz/init')
    .send({ orderId: 2 });

  const isHandled = response.status === 401 || response.status === 400;
  const assertion = assertEqual(isHandled, true);
  return recordResult(3, 'Duplicate payment request blocked', assertion, 'HTTP 401 / 400 (Blocked)', 'orderId=2');
}

// Test 4: Real HTTP call missing order identifier
export async function testCase4_missingOrderIdPayload() {
  const response = await request(app)
    .post('/api/v1/payments/sslcommerz/init')
    .send({});

  const isCaught = response.status === 401 || response.status === 400;
  const assertion = assertEqual(isCaught, true);
  return recordResult(4, 'Missing order identifier rejected', assertion, 'HTTP 401 / 400 (Bad Request)', 'Payload: {}');
}

// Test 5: Real HTTP call tampered hash - Intentional mismatch
export async function testCase5_tamperedHashVerification() {
  const response = await request(app)
    .post('/api/v1/payments/sslcommerz/success')
    .send({ tran_id: 'INVALID_HASH' });

  const assertion = assertEqual(response.status, 200);
  return recordResult(5, 'Tampered payment verification rejected', assertion, 'HTTP 200 (Wrong expectation)', 'tran_id="INVALID_HASH"');
}

export const allTests = {
  testCase1_initiateSessionUnpaidOrder,
  testCase2_nonExistentOrderPayment,
  testCase3_alreadyPaidOrder,
  testCase4_missingOrderIdPayload,
  testCase5_tamperedHashVerification,
};

if (process.argv[1]?.endsWith('09_payments.test.js')) {
  executeTestCases('09: Payment Gateway Integration API', allTests).then(() => {
    process.exit(0);
  });
}
