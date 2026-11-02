import { generateTestReportPDF, getLiveTestReportData } from '../services/testReportService.js';

/**
 * Controller to handle API test report generation.
 * When requested, generates and serves an automated PDF test report
 * covering all APIs in the Online Food Delivery System with 5 test cases per API.
 * 
 * @route GET /api/test-report
 * @route GET /api/v1/test-report
 */
export async function getTestReport(req, res) {
  try {
    const { type, download } = req.query;

    // Optional JSON endpoint: /api/test-report?type=json
    if (type === 'json') {
      const liveData = await getLiveTestReportData();
      const totalApis = liveData.length;
      const totalTestCases = totalApis * 5;
      let passed = 0;
      liveData.forEach(api => {
        api.testCases.forEach(tc => {
          if (tc.result === 'Passed') passed++;
        });
      });

      return res.status(200).json({
        success: true,
        project: 'Online Food Delivery System',
        reportType: 'Software Quality Assurance & Live API Verification',
        generatedAt: new Date(),
        summary: {
          totalApis,
          totalTestCases,
          passedTests: passed,
          edgeFailureTests: totalTestCases - passed,
          passRate: `${((passed / totalTestCases) * 100).toFixed(1)}%`,
        },
        apis: liveData,
      });
    }

    // Default: Generate and stream the formatted PDF document
    const disposition = download === 'true' ? 'attachment' : 'inline';
    const filename = 'Online_Food_Delivery_API_Test_Report.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);

    await generateTestReportPDF(res);
  } catch (error) {
    console.error('Failed to generate API test report PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate test report PDF.',
        error: error.message,
      });
    }
  }
}

