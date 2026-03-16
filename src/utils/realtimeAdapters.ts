/**
 * Realtime Message Adapters
 * 
 * Functions to convert WebSocket messages to NormalizedEvent format.
 */

import { NormalizedEvent } from '../types/events';
import { AilyticsAlert, WebSocketAlertMessage } from '../types/alerts';

/**
 * Convert a WebSocket alert message to a NormalizedEvent
 * 
 * This adapter extracts the alert payload and wraps it in the normalized format.
 */
export const mapAilyticsRealtimeMessage = (
  message: WebSocketAlertMessage
): NormalizedEvent => {
  const payload = message.payload;
  return {
    id: payload.id,
    type: payload.trigger,
    timestamp: payload.timestamp || message.timestamp,
    source: 'ailytics',
    payload,
  };
};
