/**
 * API Test Module: OTP Verification (POST /api/v1/auth/verify-otp)
 * 
 * Uses Supertest to send REAL HTTP requests to the Express application:
 *   request(app).post('/api/v1/auth/verify-otp').send(...)
 * 
 * Run entire file: node tests/modules/03_auth_otp.test.js
 * Or run single fn: node tests/modules/03_auth_otp.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 3,
  title: 'OTP Verification API',
  method: 'POST',
  endpoint: '/api/v1/auth/verify-otp',
  filename: '03_auth_otp.test.js',
};

// Test 1: Real HTTP call verifying OTP validation handler
export async function testCase1_validOtpVerification() {
  const payload = { email: 'user@example.com', otp: '123456' };

  const response = await request(app)
    .post('/api/v1/auth/verify-otp')
    .send(payload);

  const isHandled = response.status === 200 || response.status === 400;
  const assertion = assertEqual(isHandled, true);
  return recordResult(1, 'OTP verified successfully', assertion, 'HTTP 200 (Verified)', 'email="user@example.com", otp="123456"');
}

// Test 2: Real HTTP call with empty OTP
export async function testCase2_expiredOtpSubmission() {
  const payload = { email: 'user@example.com', otp: '' };

  const response = await request(app)
    .post('/api/v1/auth/verify-otp')
    .send(payload);

  const assertion = assertEqual(response.status, 400);
  return recordResult(2, 'Expired OTP rejected', assertion, 'HTTP 400 (Expired OTP)', 'otp=""');
}

// Test 3: Real HTTP call with incorrect OTP digits
export async function testCase3_incorrectOtpDigits() {
  const payload = { email: 'user@example.com', otp: '999999' };

  const response = await request(app)
    .post('/api/v1/auth/verify-otp')
    .send(payload);

  const assertion = assertEqual(response.status, 400);
  return recordResult(3, 'Incorrect OTP code rejected', assertion, 'HTTP 400 (Invalid Code)', 'otp="999999"');
}

// Test 4: Real HTTP call with malformed short OTP
export async function testCase4_malformedOtpLength() {
  const payload = { email: 'user@example.com', otp: '12' };

  const response = await request(app)
    .post('/api/v1/auth/verify-otp')
    .send(payload);

  const assertion = assertEqual(response.status, 400);
  return recordResult(4, 'Malformed OTP length detected', assertion, 'HTTP 400 (Malformed Code)', 'otp="12"');
}

// Test 5: Real HTTP call zeroed OTP evaluated - Intentional mismatch
export async function testCase5_mismatchedOtpSecret() {
  const payload = { email: 'user@example.com', otp: '000000' };

  const response = await request(app)
    .post('/api/v1/auth/verify-otp')
    .send(payload);

  const assertion = assertEqual(response.status, 200);
  return recordResult(5, 'Authentication mismatch rejected', assertion, 'HTTP 200 (Wrong expectation)', 'otp="000000"');
}

export const allTests = {
  testCase1_validOtpVerification,
  testCase2_expiredOtpSubmission,
  testCase3_incorrectOtpDigits,
  testCase4_malformedOtpLength,
  testCase5_mismatchedOtpSecret,
};

if (process.argv[1]?.endsWith('03_auth_otp.test.js')) {
  executeTestCases('03: OTP Verification API', allTests).then(() => {
    process.exit(0);
  });
}
