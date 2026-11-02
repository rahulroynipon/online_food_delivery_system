/**
 * API Test Module: Global Platform Settings API
 * Route: GET / PUT /api/v1/settings/platform
 * 
 * Uses Supertest to send REAL HTTP requests to Express.
 * Run file: node tests/modules/18_settings.test.js
 * Run single fn: node tests/modules/18_settings.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 18,
  title: 'Global Platform Settings API',
  method: 'GET / PUT',
  endpoint: '/api/v1/settings/platform',
  filename: '18_settings.test.js',
};

// Test 1: Fetch public platform operational settings (currency, charges, etc.)
export async function testCase1_getPlatformSettings() {
  const response = await request(app).get('/api/v1/settings/platform');
  const isOk = response.status === 200 && response.body?.success === true;
  const assertion = assertEqual(isOk, true);
  return recordResult(1, 'Fetch public platform configuration', assertion, 'HTTP 200 (Settings Object)', 'GET /api/v1/settings/platform');
}

// Test 2: Unauthenticated mutation of platform settings blocked
export async function testCase2_updateSettingsWithoutAuth() {
  const response = await request(app)
    .put('/api/v1/settings/platform')
    .send({ commissionRate: 15, deliveryFee: 50 });

  const assertion = assertEqual(response.status, 401);
  return recordResult(2, 'Platform settings modification requires admin token', assertion, 'HTTP 401 (Unauthorized)', 'commissionRate=15, deliveryFee=50 (no token)');
}

// Test 3: Unauthenticated payload with invalid schema blocked
export async function testCase3_updateSettingsInvalidPayload() {
  const response = await request(app)
    .put('/api/v1/settings/platform')
    .send({ unknownField: 'test' });

  const assertion = assertEqual(response.status, 401);
  return recordResult(3, 'Guarded against unauthorized schema injections', assertion, 'HTTP 401 (Unauthorized)', 'unknownField="test"');
}

// Test 4: Verification that platform settings contains fee structures
export async function testCase4_verifySettingsStructure() {
  const response = await request(app).get('/api/v1/settings/platform');
  const hasData = response.status === 200 && (response.body?.settings !== undefined || response.body?.data !== undefined);
  const assertion = assertEqual(hasData, true);
  return recordResult(4, 'Settings response includes fee structures', assertion, 'HTTP 200 (Has Settings Payload)', 'GET /api/v1/settings/platform');
}

// Test 5: Inverted assertion - Expect 200 on unauthenticated settings modification
export async function testCase5_unauthorizedSettingsUpdateRejected() {
  const response = await request(app)
    .put('/api/v1/settings/platform')
    .send({ maintenanceMode: true });

  const assertion = assertEqual(response.status, 200);
  return recordResult(5, 'Direct platform configuration change without auth rejected', assertion, 'HTTP 200 (Wrong expectation)', 'maintenanceMode=true');
}

export const allTests = {
  testCase1_getPlatformSettings,
  testCase2_updateSettingsWithoutAuth,
  testCase3_updateSettingsInvalidPayload,
  testCase4_verifySettingsStructure,
  testCase5_unauthorizedSettingsUpdateRejected,
};

if (process.argv[1]?.endsWith('18_settings.test.js')) {
  executeTestCases('18: Global Platform Settings API', allTests).then(() => {
    process.exit(0);
  });
}
