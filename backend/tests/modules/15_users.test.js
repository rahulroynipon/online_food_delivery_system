/**
 * API Test Module: User Administration & Roles API
 * Route: GET / POST /api/v1/users
 * 
 * Uses Supertest to send REAL HTTP requests to Express.
 * Run file: node tests/modules/15_users.test.js
 * Run single fn: node tests/modules/15_users.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 15,
  title: 'User Administration & Roles API',
  method: 'GET / POST',
  endpoint: '/api/v1/users',
  filename: '15_users.test.js',
};

// Test 1: Fetching all system users requires ADMIN authorization
export async function testCase1_getUsersListWithoutAuth() {
  const response = await request(app).get('/api/v1/users');
  const assertion = assertEqual(response.status, 401);
  return recordResult(1, 'System users list guarded by admin authorization', assertion, 'HTTP 401 (Unauthorized)', 'GET /api/v1/users');
}

// Test 2: Creating a user via admin portal requires authorization
export async function testCase2_createUserWithoutAdminPrivileges() {
  const response = await request(app)
    .post('/api/v1/users')
    .send({ name: 'Staff User', email: 'staff@example.com', role: 'ADMIN' });

  const assertion = assertEqual(response.status, 401);
  return recordResult(2, 'Privileged user creation guarded against public access', assertion, 'HTTP 401 (Unauthorized)', 'email="staff@example.com", role="ADMIN"');
}

// Test 3: Updating user credentials/profile requires admin authorization
export async function testCase3_updateUserWithoutAuth() {
  const response = await request(app)
    .put('/api/v1/users/1')
    .send({ status: 'SUSPENDED' });

  const assertion = assertEqual(response.status, 401);
  return recordResult(3, 'Administrative user state mutation guarded', assertion, 'HTTP 401 (Unauthorized)', 'id=1, status="SUSPENDED"');
}

// Test 4: Deleting a user account requires admin authorization
export async function testCase4_deleteUserWithoutAuth() {
  const response = await request(app).delete('/api/v1/users/1');
  const assertion = assertEqual(response.status, 401);
  return recordResult(4, 'User deletion guarded against unauthenticated requests', assertion, 'HTTP 401 (Unauthorized)', 'DELETE /api/v1/users/1');
}

// Test 5: Inverted assertion - Expect 200 on unauthenticated user creation
export async function testCase5_unauthorizedUserProvisioning() {
  const response = await request(app)
    .post('/api/v1/users')
    .send({ name: 'Hacker User', email: 'hacker@test.com', role: 'ADMIN' });

  const assertion = assertEqual(response.status, 201);
  return recordResult(5, 'Direct user provisioning without admin session rejected', assertion, 'HTTP 201 (Wrong expectation)', 'POST /api/v1/users');
}

export const allTests = {
  testCase1_getUsersListWithoutAuth,
  testCase2_createUserWithoutAdminPrivileges,
  testCase3_updateUserWithoutAuth,
  testCase4_deleteUserWithoutAuth,
  testCase5_unauthorizedUserProvisioning,
};

if (process.argv[1]?.endsWith('15_users.test.js')) {
  executeTestCases('15: User Administration & Roles API', allTests).then(() => {
    process.exit(0);
  });
}

