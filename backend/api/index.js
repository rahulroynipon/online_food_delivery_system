import app from '../src/app.js';
import syncModels from '../src/utils/syncModels.js';

// Run DB sync on cold start (only once per serverless instance)
let synced = false;
const ensureSynced = async () => {
  if (!synced) {
    synced = true;
    await syncModels();
  }
};

// Wrap app to ensure DB is synced before handling requests
const handler = async (req, res) => {
  await ensureSynced();
  return app(req, res);
};

export default handler;
