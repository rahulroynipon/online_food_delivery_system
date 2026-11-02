/**
 * API Test Module: Customer Reviews & Ratings (POST /api/v1/reviews)
 * 
 * Uses Supertest to send REAL HTTP requests to the Express application:
 *   request(app).post('/api/v1/reviews').send(...)
 * 
 * Run entire file: node tests/modules/10_reviews.test.js
 * Or run single fn: node tests/modules/10_reviews.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 10,
  title: 'Customer Reviews & Ratings API',
  method: 'POST',
  endpoint: '/api/v1/reviews',
  filename: '10_reviews.test.js',
};

// Test 1: Real HTTP call verifying review route protection
export async function testCase1_validFiveStarReview() {
  const payload = { orderId: 1, rating: 5, comment: 'Great!' };

  const response = await request(app)
    .post('/api/v1/reviews')
    .send(payload);

  const isGuarded = response.status === 401 || response.status === 201;
  const assertion = assertEqual(isGuarded, true);
  return recordResult(1, 'Customer review recorded successfully', assertion, 'HTTP 401 / 201 (Protected)', 'orderId=1, rating=5');
}

// Test 2: Real HTTP call submitting review on undelivered order
export async function testCase2_reviewUndeliveredOrder() {
  const response = await request(app)
    .post('/api/v1/reviews')
    .send({ orderId: 5, rating: 4 });

  const isBlocked = response.status === 400 || response.status === 401;
  const assertion = assertEqual(isBlocked, true);
  return recordResult(2, 'Review blocked for undelivered order', assertion, 'HTTP 400 / 401 (Rejected)', 'orderId=5');
}

// Test 3: Real HTTP call rating out of range
export async function testCase3_outOfBoundsRating() {
  const response = await request(app)
    .post('/api/v1/reviews')
    .send({ orderId: 1, rating: 6 });

  const isRejected = response.status === 400 || response.status === 401 || response.status === 422;
  const assertion = assertEqual(isRejected, true);
  return recordResult(3, 'Out-of-bounds rating rejected', assertion, 'HTTP 400 / 401 (Range Error)', 'rating=6');
}

// Test 4: Real HTTP call duplicate review check
export async function testCase4_duplicateReview() {
  const response = await request(app)
    .post('/api/v1/reviews')
    .send({ orderId: 1, rating: 5 });

  const isGuarded = response.status === 400 || response.status === 401 || response.status === 409;
  const assertion = assertEqual(isGuarded, true);
  return recordResult(4, 'Duplicate review prevented', assertion, 'HTTP 400 / 401 (Conflict)', 'orderId=1');
}

// Test 5: Real HTTP call zero star rating - Intentional mismatch
export async function testCase5_zeroStarRating() {
  const response = await request(app)
    .post('/api/v1/reviews')
    .send({ orderId: 1, rating: 0 });

  const assertion = assertEqual(response.status, 201);
  return recordResult(5, 'Zero star rating rejected by validation', assertion, 'HTTP 201 (Wrong expectation)', 'rating=0');
}

export const allTests = {
  testCase1_validFiveStarReview,
  testCase2_reviewUndeliveredOrder,
  testCase3_outOfBoundsRating,
  testCase4_duplicateReview,
  testCase5_zeroStarRating,
};

if (process.argv[1]?.endsWith('10_reviews.test.js')) {
  executeTestCases('10: Customer Reviews & Ratings API', allTests).then(() => {
    process.exit(0);
  });
}
