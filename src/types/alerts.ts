/**
 * Alert Types
 * 
 * These types represent alert data structures used in the sample app.
 * In a real application, these would match your backend alert format.
 */

export type AlertSeverity = 'Severe' | 'Medium' | 'Normal' | 'Info';

export interface CameraInfo {
  id: string;
  name: string;
}

export interface GroupInfo {
  id: string;
  name: string;
}

export interface SiteInfo {
  id: string;
  name: string;
}

/**
 * AilyticsAlert - Sample alert format
 * 
 * This represents a typical alert structure. Your app may use a different format.
 * The adapter pattern (see adapters/exampleAdapter.ts) shows how to convert
 * your alert format to SDK widget formats.
 */
export interface AilyticsAlert {
  id: string;
  trigger: string;
  camera_info: CameraInfo;
  group_info: GroupInfo;
  site_info: SiteInfo;
  frame: string | null;
  video: string | null;
  timestamp: string; // UTC ISO 8601 format
  timezone: string; // Named timezone, e.g., "Asia/Singapore"
  countryCode?: string;
  isMock?: boolean; // Indicates if this is a mock/dummy alert
}

export interface WebSocketAlertMessage {
  payload: AilyticsAlert;
  timestamp: string;
  topic: string;
}

export interface Camera {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  site_id: string;
  group_id: string;
  fov?: {
    angle: number;
    direction: number; // degrees
  };
}

/**
 * Map trigger types to severity levels
 */
export function mapTriggerToSeverity(trigger: string): AlertSeverity {
  switch (trigger) {
    case 'ppe_detection':
    case 'worker_near_heavy_machine':
      return 'Severe';
    case 'no_access_area':
      return 'Info';
    default:
      return 'Medium';
  }
}
