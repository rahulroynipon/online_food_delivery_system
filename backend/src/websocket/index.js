import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { registerAllHandlers } from './handlers/index.js';

let wss = null;

// Connected clients tracking
const adminClients = new Set();
// Maps userId -> Set of WebSocket connections (supporting multiple tabs/devices per user)
const userClients = new Map();

// Registry of message handlers: eventName -> handler function
const messageHandlers = new Map();

/**
 * Initialize the WebSocket Server and attach it to the HTTP server.
 * @param {import('http').Server} server - HTTP Server instance
 */
export const initWebSocket = (server) => {
  if (process.env.NODE_ENV === 'production') {
    console.log('[WebSocket] Skipped — not supported in production/serverless.');
    return;
  }

  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    console.log('[WebSocket] Client connection initiated...');

    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');

      if (!token) {
        rejectConnection(ws, 'Authentication token required.', 4001);
        return;
      }

      const decoded = jwt.verify(token, env.jwt.secret);
      const { id: userId, role } = decoded;

      // Save user details on the socket object
      ws.userId = userId;
      ws.userRole = role;

      // Track the socket connection
      registerClient(ws);

      // Send a welcome connection confirmation message
      sendEvent(ws, 'CONNECTED', {
        message: 'Successfully connected to BiteSpeed WebSocket Server.',
        userId,
        role,
      });

      // Modularly handle incoming socket messages
      ws.on('message', (message) => {
        handleIncomingMessage(ws, decoded, message);
      });

      ws.on('close', () => {
        unregisterClient(ws);
      });

      ws.on('error', (error) => {
        console.error(`[WebSocket] Client error for user ${userId}:`, error);
        unregisterClient(ws);
      });

    } catch (err) {
      console.error('[WebSocket] Connection verification failed:', err.message);
      rejectConnection(ws, 'Invalid or expired token.', 4002);
    }
  });

  // Register all modular handlers (e.g. ping, order tracking, etc.)
  registerAllHandlers();

  console.log('[WebSocket] Modular server initialized successfully.');
};

/**
 * Register an incoming message event handler.
 * @param {string} eventName - Name of the event to handle
 * @param {Function} handler - Callback function (ws, user, data)
 */
export const registerHandler = (eventName, handler) => {
  messageHandlers.set(eventName, handler);
  console.log(`[WebSocket] Registered event handler for: "${eventName}"`);
};

/**
 * Helper to reject a socket connection
 */
const rejectConnection = (ws, message, code) => {
  ws.send(JSON.stringify({ event: 'ERROR', message }));
  ws.close(code, message);
};

/**
 * Add client connection to tracking maps/sets
 */
const registerClient = (ws) => {
  const { userId, userRole } = ws;
  
  if (userRole === 'ADMIN') {
    adminClients.add(ws);
  }

  if (!userClients.has(userId)) {
    userClients.set(userId, new Set());
  }
  userClients.get(userId).add(ws);

  console.log(`[WebSocket] Client registered (User ID: ${userId}, Role: ${userRole}). Total active user connections: ${userClients.size}`);
};

/**
 * Remove client connection from tracking maps/sets
 */
const unregisterClient = (ws) => {
  const { userId, userRole } = ws;

  if (userRole === 'ADMIN') {
    adminClients.delete(ws);
  }

  const userSockets = userClients.get(userId);
  if (userSockets) {
    userSockets.delete(ws);
    if (userSockets.size === 0) {
      userClients.delete(userId);
    }
  }

  console.log(`[WebSocket] Client unregistered (User ID: ${userId}, Role: ${userRole}).`);
};

/**
 * Parse incoming message payloads and route them to registered handlers
 */
const handleIncomingMessage = (ws, user, messageStr) => {
  try {
    const payload = JSON.parse(messageStr);
    const { event, data } = payload;

    if (!event) {
      sendEvent(ws, 'ERROR', { message: 'Missing event name in payload.' });
      return;
    }

    const handler = messageHandlers.get(event);
    if (handler) {
      handler(ws, user, data);
    } else {
      console.warn(`[WebSocket] Unhandled event received: "${event}"`);
      sendEvent(ws, 'ERROR', { message: `No handler registered for event: "${event}"` });
    }
  } catch (err) {
    console.error('[WebSocket] Error processing message:', err.message);
    sendEvent(ws, 'ERROR', { message: 'Invalid payload format. Expected JSON.' });
  }
};

/**
 * Send an event payload to a single WebSocket client
 */
export const sendEvent = (ws, event, data) => {
  if (process.env.NODE_ENV === 'production') return;
  if (ws.readyState === 1) { // 1 = OPEN
    ws.send(JSON.stringify({ event, data, timestamp: new Date() }));
  }
};

/**
 * Broadcast an event payload to all connected admin clients
 */
export const broadcastToAdmins = (event, data) => {
  if (process.env.NODE_ENV === 'production') return;
  if (!wss) return;
  const payload = JSON.stringify({ event, data, timestamp: new Date() });
  for (const client of adminClients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
};

/**
 * Send an event payload to all active connections of a specific user ID
 */
export const sendToUser = (userId, event, data) => {
  if (process.env.NODE_ENV === 'production') return;
  const userSockets = userClients.get(userId);
  if (!userSockets) return;

  const payload = JSON.stringify({ event, data, timestamp: new Date() });
  for (const client of userSockets) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
};

/**
 * Send an event payload to all users with a specific role
 */
export const sendToRole = (role, event, data) => {
  if (process.env.NODE_ENV === 'production') return;
  const payload = JSON.stringify({ event, data, timestamp: new Date() });
  if (role === 'ADMIN') {
    broadcastToAdmins(event, data);
    return;
  }

  for (const [userId, sockets] of userClients.entries()) {
    for (const ws of sockets) {
      if (ws.userRole === role && ws.readyState === 1) {
        ws.send(payload);
      }
    }
  }
};

/**
 * Broadcast an event payload to all connected clients
 */
export const broadcastToAll = (event, data) => {
  if (process.env.NODE_ENV === 'production') return;
  const payload = JSON.stringify({ event, data, timestamp: new Date() });
  for (const [userId, sockets] of userClients.entries()) {
    for (const ws of sockets) {
      if (ws.readyState === 1) {
        ws.send(payload);
      }
    }
  }
};
