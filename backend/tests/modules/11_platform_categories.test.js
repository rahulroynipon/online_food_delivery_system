/**
 * API Test Module: Platform Categories API
 * Route: GET / POST /api/v1/platform-categories
 * 
 * Uses Supertest to send REAL HTTP requests to Express.
 * Run file: node tests/modules/11_platform_categories.test.js
 * Run single fn: node tests/modules/11_platform_categories.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 11,
  title: 'Platform Categories API',
  method: 'GET / POST',
  endpoint: '/api/v1/platform-categories',
  filename: '11_platform_categories.test.js',
};

// Test 1: Fetch all public platform categories (Active items for customer app)
export async function testCase1_getPublicCategories() {
  const response = await request(app).get('/api/v1/platform-categories');
  const isOk = response.status === 200 && (Array.isArray(response.body?.platformCategories) || response.body?.success === true);
  const assertion = assertEqual(isOk, true);
  return recordResult(1, 'Fetch public platform categories list', assertion, 'HTTP 200 (Category Array)', 'GET /api/v1/platform-categories');
}

// Test 2: Unauthenticated category creation blocked
export async function testCase2_createCategoryWithoutAuth() {
  const response = await request(app)
    .post('/api/v1/platform-categories')
    .send({ name: 'Specialty Beverages', status: 'ACTIVE' });

  const assertion = assertEqual(response.status, 401);
  return recordResult(2, 'Unauthenticated category creation blocked', assertion, 'HTTP 401 (Unauthorized)', 'name="Specialty Beverages" (no token)');
}

// Test 3: Fetch platform category by non-existent slug returns 404
export async function testCase3_getCategoryByInvalidSlug() {
  const response = await request(app).get('/api/v1/platform-categories/non-existent-category-slug-9999');
  const assertion = assertEqual(response.status, 404);
  return recordResult(3, 'Non-existent category slug returns 404', assertion, 'HTTP 404 (Not Found)', 'slug="non-existent-category-slug-9999"');
}

// Test 4: Protected category deletion blocked without admin auth
export async function testCase4_deleteCategoryWithoutAuth() {
  const response = await request(app).delete('/api/v1/platform-categories/fast-food');
  const assertion = assertEqual(response.status, 401);
  return recordResult(4, 'Category deletion blocked without admin credentials', assertion, 'HTTP 401 (Unauthorized)', 'DELETE /api/v1/platform-categories/fast-food');
}

// Test 5: Inverted assertion - Verify runner flags invalid success expectation
export async function testCase5_unauthorizedCategoryUpdate() {
  const response = await request(app)
    .put('/api/v1/platform-categories/fast-food')
    .send({ name: 'Modified Category' });

  const assertion = assertEqual(response.status, 200);
  return recordResult(5, 'Unauthorized category modification rejected', assertion, 'HTTP 200 (Wrong expectation)', 'PUT /api/v1/platform-categories/fast-food');
}

export const allTests = {
  testCase1_getPublicCategories,
  testCase2_createCategoryWithoutAuth,
  testCase3_getCategoryByInvalidSlug,
  testCase4_deleteCategoryWithoutAuth,
  testCase5_unauthorizedCategoryUpdate,
};

if (process.argv[1]?.endsWith('11_platform_categories.test.js')) {
  executeTestCases('11: Platform Categories API', allTests).then(() => {
    process.exit(0);
  });
}
