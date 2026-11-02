/**
 * Master Test Runner for all API Modules
 * Executes all 10 modules (50 test cases total) or filtered by argument.
 * 
 * Usage:
 *   node tests/run_all.js              # Runs all 50 test cases
 *   node tests/run_all.js login        # Runs only Login test suite
 *   node tests/run_all.js 01           # Runs only Module 01
 */

import { allTests as tests01 } from './modules/01_auth_register.test.js';
import { allTests as tests02 } from './modules/02_auth_login.test.js';
import { allTests as tests03 } from './modules/03_auth_otp.test.js';
import { allTests as tests04 } from './modules/04_delivery_zones.test.js';
import { allTests as tests05 } from './modules/05_user_addresses.test.js';
import { allTests as tests06 } from './modules/06_foods.test.js';
import { allTests as tests07 } from './modules/07_orders.test.js';
import { allTests as tests08 } from './modules/08_order_status.test.js';
import { allTests as tests09 } from './modules/09_payments.test.js';
import { allTests as tests10 } from './modules/10_reviews.test.js';

import { executeTestCases } from './helpers/testUtils.js';

const suites = [
  { name: '01: Customer Registration (POST /api/v1/auth/register)', tests: tests01, key: 'register' },
  { name: '02: User Authentication (POST /api/v1/auth/login)', tests: tests02, key: 'login' },
  { name: '03: OTP Verification (POST /api/v1/auth/verify-otp)', tests: tests03, key: 'otp' },
  { name: '04: Delivery Zone Coverage (POST / GET /api/v1/delivery-zones)', tests: tests04, key: 'zone' },
  { name: '05: Customer Address Management (POST /api/v1/user-addresses)', tests: tests05, key: 'address' },
  { name: '06: Food Item & Menu Catalog (POST /api/v1/foods)', tests: tests06, key: 'food' },
  { name: '07: Order Placement & Cart (POST /api/v1/orders)', tests: tests07, key: 'order' },
  { name: '08: Order Status Lifecycle (PUT /api/v1/orders/:id/status)', tests: tests08, key: 'status' },
  { name: '09: Payment Gateway (POST /api/v1/payments/sslcommerz/init)', tests: tests09, key: 'payment' },
  { name: '10: Customer Reviews & Ratings (POST /api/v1/reviews)', tests: tests10, key: 'review' },
];

async function run() {
  const filter = process.argv[2]?.toLowerCase();

  console.log('='.repeat(70));
  console.log('   ONLINE FOOD DELIVERY SYSTEM - MODULAR API TEST RUNNER');
  console.log('='.repeat(70));
  console.log(`Execution Time: ${new Date().toLocaleString()}`);
  console.log(`Filter: ${filter ? `"${filter}"` : 'ALL MODULES'}`);

  const targetSuites = filter
    ? suites.filter(s => s.name.toLowerCase().includes(filter) || s.key.includes(filter))
    : suites;

  if (targetSuites.length === 0) {
    console.log(`\n❌ No test suites matched filter: "${filter}".`);
    console.log(`Available suites: register, login, otp, zone, address, food, order, status, payment, review\n`);
    process.exit(1);
  }

  let totalExecuted = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of targetSuites) {
    const res = await executeTestCases(suite.name, suite.tests);
    totalExecuted += res.total;
    totalPassed += res.passed;
    totalFailed += res.failed;
  }

  console.log('='.repeat(70));
  console.log('                   FINAL TEST EXECUTION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Suites Run        : ${targetSuites.length}`);
  console.log(`Total Test Cases  : ${totalExecuted}`);
  console.log(`Standard Passed   : \x1b[32m${totalPassed}\x1b[0m`);
  console.log(`Boundary / Edge   : \x1b[33m${totalFailed}\x1b[0m`);
  console.log(`Pass Rate         : \x1b[32m${totalExecuted > 0 ? ((totalPassed / totalExecuted) * 100).toFixed(1) : 0}%\x1b[0m`);
  console.log('='.repeat(70));
  console.log(`\n📄 Generated PDF report endpoint:`);
  console.log(`   http://localhost:5005/api/test-report\n`);
  process.exit(0);
}

run();

