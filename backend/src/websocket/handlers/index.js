import { registerHandler } from '../index.js';
import { handlePing } from './pingHandler.js';

/**
 * Register all event handlers for incoming WebSocket messages.
 */
export const registerAllHandlers = () => {
  // Register ping handler
  registerHandler('PING', handlePing);
  
  // Future handlers can be registered here:
  // registerHandler('ORDER_STATUS_UPDATE', handleOrderStatusUpdate);
  // registerHandler('DRIVER_LOCATION_UPDATE', handleDriverLocationUpdate);
};
