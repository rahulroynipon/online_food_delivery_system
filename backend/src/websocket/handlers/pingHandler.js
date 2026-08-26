import { sendEvent } from '../index.js';

/**
 * Handle incoming PING messages and respond with PONG.
 * @param {import('ws').WebSocket} ws - Client socket connection
 * @param {Object} user - Decoded JWT user object
 * @param {Object} data - Payload data
 */
export const handlePing = (ws, user, data) => {
  console.log(`[WebSocket] Received PING from user ${user.id} (${user.role})`);
  
  // Respond with a PONG event and timestamp
  sendEvent(ws, 'PONG', {
    reply: 'pong',
    originalData: data,
    timestamp: new Date(),
  });
};
