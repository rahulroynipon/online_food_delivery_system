import app, { API_PREFIX } from './app.js';
import env from './config/env.js';
import syncModels from './utils/syncModels.js';
import { initWebSocket } from './websocket/index.js';

const PORT = env.PORT;

const server = app.listen(PORT, async () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}${API_PREFIX}/api-docs`);

  if (env.NODE_ENV !== 'test') {
    await syncModels();
  }
});

// Initialize modular WebSocket server (disabled in production/serverless)
if (env.NODE_ENV !== 'production') {
  initWebSocket(server);
}

export default server;
