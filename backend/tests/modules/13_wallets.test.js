/**
 * API Test Module: Customer & Merchant Wallets API
 * Route: GET / POST /api/v1/wallets
 * 
 * Uses Supertest to send REAL HTTP requests to Express.
 * Run file: node tests/modules/13_wallets.test.js
 * Run single fn: node tests/modules/13_wallets.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 13,
  title: 'Customer & Merchant Wallets API',
  method: 'GET / POST',
  endpoint: '/api/v1/wallets/balance',
  filename: '13_wallets.test.js',
};

// Test 1: Fetching wallet balance requires user authentication
export async function testCase1_getBalanceWithoutAuth() {
  const response = await request(app).get('/api/v1/wallets/balance');
  const assertion = assertEqual(response.status, 401);
  return recordResult(1, 'Wallet balance route requires JWT bearer token', assertion, 'HTTP 401 (Unauthorized)', 'GET /api/v1/wallets/balance');
}

// Test 2: Admin wallet overview guarded against unauthenticated access
export async function testCase2_getAdminOverviewWithoutAuth() {
  const response = await request(app).get('/api/v1/wallets/admin-overview');
  const assertion = assertEqual(response.status, 401);
  return recordResult(2, 'Admin wallet financial overview guarded', assertion, 'HTTP 401 (Unauthorized)', 'GET /api/v1/wallets/admin-overview');
}

// Test 3: Merchant payout initiation blocked without authentication
export async function testCase3_requestPayoutWithoutAuth() {
  const response = await request(app)
    .post('/api/v1/wallets/payout')
    .send({ amount: 1500, method: 'BKASH' });

  const assertion = assertEqual(response.status, 401);
  return recordResult(3, 'Merchant wallet payout requires authentication', assertion, 'HTTP 401 (Unauthorized)', 'amount=1500, method="BKASH"');
}

// Test 4: Withdrawal history endpoint requires authentication
export async function testCase4_getMyWithdrawalsWithoutAuth() {
  const response = await request(app).get('/api/v1/wallets/withdrawals/my');
  const assertion = assertEqual(response.status, 401);
  return recordResult(4, 'Personal withdrawal history requires user session', assertion, 'HTTP 401 (Unauthorized)', 'GET /api/v1/wallets/withdrawals/my');
}

// Test 5: Inverted assertion - Expect 200 on unauthenticated payout request
export async function testCase5_unauthorizedWithdrawalSubmission() {
  const response = await request(app)
    .post('/api/v1/wallets/withdrawals')
    .send({ amount: 2000, accountNumber: '01700000000' });

  const assertion = assertEqual(response.status, 200);
  return recordResult(5, 'Direct withdrawal without credentials rejected', assertion, 'HTTP 200 (Wrong expectation)', 'amount=2000 (no token)');
}

export const allTests = {
  testCase1_getBalanceWithoutAuth,
  testCase2_getAdminOverviewWithoutAuth,
  testCase3_requestPayoutWithoutAuth,
  testCase4_getMyWithdrawalsWithoutAuth,
  testCase5_unauthorizedWithdrawalSubmission,
};

if (process.argv[1]?.endsWith('13_wallets.test.js')) {
  executeTestCases('13: Customer & Merchant Wallets API', allTests).then(() => {
    process.exit(0);
  });
}

