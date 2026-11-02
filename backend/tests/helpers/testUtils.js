/**
 * Common Test Utilities and Assertion Helpers
 * Provides assertion logic, console logging, and structured result records for test reports.
 */

export function assertEqual(actual, expected) {
  const passed = actual === expected;
  return {
    passed,
    actual,
    expected,
    message: passed
      ? `Passed with status ${actual}`
      : `Assertion failed: expected ${expected}, got ${actual}`,
  };
}

/**
 * Logs result to terminal (if run via CLI) and returns structured data for the PDF generator.
 */
export function recordResult(testId, scenario, assertion, expected = '', inputs = '') {
  const isPassed = assertion.passed;
  const output = isPassed
    ? `Test ${testId} Passed: ${scenario}`
    : `Test ${testId} Failed: ${assertion.message}`;

  // Log to console if running in a terminal
  if (process.stdout.isTTY || process.env.NODE_ENV !== 'production') {
    if (isPassed) {
      console.log(`  \x1b[32m✔ [PASS]\x1b[0m Test ${testId}: ${scenario}`);
      if (inputs) console.log(`         Inputs: ${inputs}`);
      if (expected) console.log(`         Expected: ${expected}`);
    } else {
      console.log(`  \x1b[33m⚡ [INTENDED EDGE / FAIL]\x1b[0m Test ${testId}: ${scenario}`);
      if (inputs) console.log(`         Inputs: ${inputs}`);
      console.log(`         Details: ${assertion.message}`);
    }
  }

  return {
    id: testId,
    scenario,
    inputs: inputs || '',
    expected: expected || '',
    result: isPassed ? 'Passed' : 'Failed',
    output,
  };
}

/**
 * Filter and run specific test functions if passed via CLI argument.
 */
export async function executeTestCases(suiteName, testMap, specificFilter = null) {
  const isDirectFile = process.argv[1] && !process.argv[1].endsWith('run_all.js');
  const targetFilter = (specificFilter !== null ? specificFilter : (isDirectFile ? process.argv[2] : null))?.toLowerCase();

  console.log('\n' + '='.repeat(65));
  console.log(`  TEST SUITE: ${suiteName.toUpperCase()}`);
  console.log('='.repeat(65));

  const entries = Object.entries(testMap);
  const matched = targetFilter
    ? entries.filter(([name]) => name.toLowerCase().includes(targetFilter))
    : entries;

  if (matched.length === 0) {
    console.log(`  No tests matched filter: "${targetFilter}". Available: ${Object.keys(testMap).join(', ')}`);
    return { total: 0, passed: 0, failed: 0, records: [] };
  }

  let total = 0;
  let passed = 0;
  let failed = 0;
  const records = [];

  for (const [fnName, fn] of matched) {
    total++;
    try {
      const rec = await fn();
      records.push(rec);
      if (rec && rec.result === 'Passed') {
        passed++;
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
      console.log(`  \x1b[31m✖ [ERROR]\x1b[0m in ${fnName}:`, err.message);
      records.push({
        id: total,
        scenario: fnName,
        inputs: '',
        expected: '',
        result: 'Failed',
        output: `Test ${total} Failed: ${err.message}`,
      });
    }
  }

  console.log('-'.repeat(65));
  console.log(`  Results: ${passed} Passed, ${failed} Edge/Failed out of ${total} executed.\n`);
  return { total, passed, failed, records };
}
