import express from 'express';
import { getTestReport } from '../controllers/testReportController.js';

const router = express.Router();

/**
 * @swagger
 * /api/test-report:
 *   get:
 *     summary: Generate and download the comprehensive API Test Report in PDF format
 *     description: Returns a professionally formatted PDF containing 5 test cases and execution results for every core API in the system.
 *     tags: [Testing & QA]
 *     parameters:
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *         description: Set to true to trigger file download attachment instead of inline preview
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [pdf, json]
 *         description: Output format (defaults to pdf)
 *     responses:
 *       200:
 *         description: Test report PDF document
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Generation error
 */
router.get('/', getTestReport);

export default router;

