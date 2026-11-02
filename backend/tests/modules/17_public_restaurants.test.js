/**
 * API Test Module: Public Restaurants Discovery & Search API
 * Route: GET /api/v1/public/restaurants
 * 
 * Uses Supertest to send REAL HTTP requests to Express.
 * Run file: node tests/modules/17_public_restaurants.test.js
 * Run single fn: node tests/modules/17_public_restaurants.test.js testCase1
 */

import request from 'supertest';
import app from '../../src/app.js';
import { assertEqual, recordResult, executeTestCases } from '../helpers/testUtils.js';

export const metadata = {
  id: 17,
  title: 'Public Restaurants Discovery & Search API',
  method: 'GET',
  endpoint: '/api/v1/public/restaurants',
  filename: '17_public_restaurants.test.js',
};

// Test 1: Fetch all public approved restaurants list
export async function testCase1_getAllPublicRestaurants() {
  const response = await request(app).get('/api/v1/public/restaurants');
  const isOk = response.status === 200 && (Array.isArray(response.body?.restaurants) || response.body?.success === true);
  const assertion = assertEqual(isOk, true);
  return recordResult(1, 'Fetch public approved restaurants directory', assertion, 'HTTP 200 (Restaurant Array)', 'GET /api/v1/public/restaurants');
}

// Test 2: Fetch popular foods across restaurants for home feed
export async function testCase2_getPopularFoodsFeed() {
  const response = await request(app).get('/api/v1/public/restaurants/foods/popular');
  const isOk = response.status === 200;
  const assertion = assertEqual(isOk, true);
  return recordResult(2, 'Fetch popular trending dishes for customer app', assertion, 'HTTP 200 (Food Items)', 'GET /api/v1/public/restaurants/foods/popular');
}

// Test 3: Search foods across all active restaurants
export async function testCase3_searchPublicFoods() {
  const response = await request(app).get('/api/v1/public/restaurants/foods/search?search=Burger');
  const isOk = response.status === 200;
  const assertion = assertEqual(isOk, true);
  return recordResult(3, 'Search dish names across partner restaurants', assertion, 'HTTP 200 (Search Results)', 'search="Burger"');
}

// Test 4: Fetch restaurant by non-existent slug returns 404
export async function testCase4_getNonExistentRestaurantSlug() {
  const response = await request(app).get('/api/v1/public/restaurants/non-existent-restaurant-9999');
  const assertion = assertEqual(response.status, 404);
  return recordResult(4, 'Non-existent restaurant profile returns 404', assertion, 'HTTP 404 (Not Found)', 'slug="non-existent-restaurant-9999"');
}

// Test 5: Inverted assertion - Expect 404 on valid public restaurants listing
export async function testCase5_publicListingInvertedAssertion() {
  const response = await request(app).get('/api/v1/public/restaurants');
  const assertion = assertEqual(response.status, 404);
  return recordResult(5, 'Public restaurant directory available without auth', assertion, 'HTTP 404 (Wrong expectation)', 'GET /api/v1/public/restaurants');
}

export const allTests = {
  testCase1_getAllPublicRestaurants,
  testCase2_getPopularFoodsFeed,
  testCase3_searchPublicFoods,
  testCase4_getNonExistentRestaurantSlug,
  testCase5_publicListingInvertedAssertion,
};

if (process.argv[1]?.endsWith('17_public_restaurants.test.js')) {
  executeTestCases('17: Public Restaurants Discovery & Search API', allTests).then(() => {
    process.exit(0);
  });
}
