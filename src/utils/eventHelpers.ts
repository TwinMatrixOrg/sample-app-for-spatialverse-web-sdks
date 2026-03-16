/**
 * Event Helper Functions
 * 
 * Utilities for converting between different event/alert formats.
 */

import { NormalizedEvent } from '../types/events';
import { AilyticsAlert } from '../types/alerts';

/**
 * Extract AilyticsAlert from a NormalizedEvent
 * 
 * This function checks if an event is from the 'ailytics' source
 * and extracts the alert payload.
 */
export function getAilyticsAlertFromEvent(
  event: NormalizedEvent
): AilyticsAlert | null {
  if (event.source !== 'ailytics') return null;
  return event.payload as AilyticsAlert;
}

/**
 * Convert an array of NormalizedEvent to AilyticsAlert[]
 */
export function getAilyticsAlertsFromEvents(
  events: NormalizedEvent[]
): AilyticsAlert[] {
  return events
    .map(getAilyticsAlertFromEvent)
    .filter((alert): alert is AilyticsAlert => alert !== null);
}
