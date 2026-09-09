import app from '../src/app.js';

export default function handler(req, res) {
  try {
    return app(req, res);
  } catch (error) {
    console.error('Serverless Execution Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Internal serverless execution error.',
        error: error.message,
      });
    }
  }
}
