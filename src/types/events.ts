/**
 * Event Types
 * 
 * This file defines the normalized event structure used throughout the app.
 * Events are normalized to a common format regardless of their source.
 */

/**
 * NormalizedEvent - Common event format used by the event stream store
 * 
 * This format allows the app to handle events from different sources
 * (realtime, dummy, etc.) in a unified way.
 */
export type NormalizedEvent = {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  payload: unknown;
};
