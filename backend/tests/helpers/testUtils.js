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
      console.log(`  \x1b[32m✔ [RIGHT / PASS]\x1b[0m Test ${testId}: ${scenario}`);
      if (inputs) console.log(`         Inputs: ${inputs}`);
      if (expected) console.log(`         Expected: ${expected}`);
    } else {
      console.log(`  \x1b[31m✗ [WRONG / FAIL]\x1b[0m Test ${testId}: ${scenario}`);
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
 * Supports:
 *   - Single number: `node test.js 1`
 *   - Multiple numbers: `node test.js 1 2 3` or `node test.js 1,2,3`
 *   - Range: `node test.js 1-4`
 *   - Name filter: `node test.js duplicate`
 */
export async function executeTestCases(suiteName, testMap, specificFilter = null) {
  const isDirectFile = process.argv[1] && !process.argv[1].endsWith('run_all.js');
  
  // Collect raw tokens from CLI or parameter
  let rawTokens = [];
  if (specificFilter !== null) {
    rawTokens = [String(specificFilter)];
  } else if (isDirectFile && process.argv.length > 2) {
    rawTokens = process.argv.slice(2);
  }

  // Expand comma-separated values and ranges (e.g. "1-4" -> "1", "2", "3", "4")
  const filterTokens = [];
  for (const raw of rawTokens) {
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    for (const p of parts) {
      const rangeMatch = p.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        for (let i = start; i <= end; i++) {
          filterTokens.push(String(i));
        }
      } else {
        filterTokens.push(p.toLowerCase());
      }
    }
  }

  console.log('\n' + '='.repeat(65));
  console.log(`  TEST SUITE: ${suiteName.toUpperCase()}`);
  if (filterTokens.length > 0) {
    console.log(`  Active Filter: [${filterTokens.join(', ')}]`);
  }
  console.log('='.repeat(65));

  const entries = Object.entries(testMap);
  let matched = entries;

  if (filterTokens.length > 0) {
    matched = entries.filter(([name]) => {
      const lowerName = name.toLowerCase();
      const numMatch = lowerName.match(/\d+/);
      const testNum = numMatch ? numMatch[0] : '';
      return filterTokens.some(token => {
        if (token === testNum) return true;
        return lowerName.includes(token);
      });
    });
  }

  if (matched.length === 0) {
    console.log(`  No tests matched filter: [${filterTokens.join(', ')}]. Available: ${Object.keys(testMap).join(', ')}`);
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
  console.log(`  SUMMARY:`);
  console.log(`  • Total Tests Executed : ${total}`);
  console.log(`  • Right (Passed)       : \x1b[32m${passed}\x1b[0m ✔`);
  console.log(`  • Wrong (Edge / Failed): \x1b[31m${failed}\x1b[0m ✗`);
  console.log(`  • Overall Status       : ${total > 0 ? ((passed / total) * 100).toFixed(0) : 0}% (${passed}/${total} Right)\n`);

  return { total, passed, failed, records };
}
