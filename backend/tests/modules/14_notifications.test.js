/**
 * API Test Module: Push Notifications & Alerts API
 * Route: GET / PUT /api/v1/notifications
 * 
 * Uses Supertest to send REAL HTTP requests to Express.
 * Run file: node tests/modules/14_notifications.test.js
 * Run single fn: node tests/modules/14_notifications.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 14,
  title: 'Push Notifications & Alerts API',
  method: 'GET / PUT',
  endpoint: '/api/v1/notifications',
  filename: '14_notifications.test.js',
};

// Test 1: Fetching user notifications requires authentication
export async function testCase1_getNotificationsWithoutAuth() {
  const response = await request(app).get('/api/v1/notifications');
  const assertion = assertEqual(response.status, 401);
  return recordResult(1, 'Notifications list requires active user session', assertion, 'HTTP 401 (Unauthorized)', 'GET /api/v1/notifications');
}

// Test 2: Mark single notification as read guarded
export async function testCase2_markNotificationReadWithoutAuth() {
  const response = await request(app).put('/api/v1/notifications/1/read');
  const assertion = assertEqual(response.status, 401);
  return recordResult(2, 'Marking notification read guarded against public access', assertion, 'HTTP 401 (Unauthorized)', 'PUT /api/v1/notifications/1/read');
}

// Test 3: Mark all notifications as read guarded
export async function testCase3_markAllReadWithoutAuth() {
  const response = await request(app).put('/api/v1/notifications/read-all');
  const assertion = assertEqual(response.status, 401);
  return recordResult(3, 'Batch mark all read guarded by authorization middleware', assertion, 'HTTP 401 (Unauthorized)', 'PUT /api/v1/notifications/read-all');
}

// Test 4: Clearing notification history requires authentication
export async function testCase4_clearNotificationsWithoutAuth() {
  const response = await request(app).delete('/api/v1/notifications');
  const assertion = assertEqual(response.status, 401);
  return recordResult(4, 'Clear all notifications requires administrative token', assertion, 'HTTP 401 (Unauthorized)', 'DELETE /api/v1/notifications');
}

// Test 5: Inverted assertion - Expect 200 on unauthenticated notification update
export async function testCase5_unauthorizedNotificationAccess() {
  const response = await request(app).put('/api/v1/notifications/999/read');
  const assertion = assertEqual(response.status, 200);
  return recordResult(5, 'Direct notification mutation without credentials rejected', assertion, 'HTTP 200 (Wrong expectation)', 'PUT /api/v1/notifications/999/read');
}

export const allTests = {
  testCase1_getNotificationsWithoutAuth,
  testCase2_markNotificationReadWithoutAuth,
  testCase3_markAllReadWithoutAuth,
  testCase4_clearNotificationsWithoutAuth,
  testCase5_unauthorizedNotificationAccess,
};

if (process.argv[1]?.endsWith('14_notifications.test.js')) {
  executeTestCases('14: Push Notifications & Alerts API', allTests).then(() => {
    process.exit(0);
  });
}

