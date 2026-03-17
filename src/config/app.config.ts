/**
 * Application Configuration
 * 
 * This file contains minimal configuration for the sample app.
 * In a real application, you would configure:
 * - API endpoints
 * - SDK initialization settings
 * - Feature flags
 * - Environment-specific values
 */

export interface AppConfig {
  metaAtlas?: {
    accessToken: string;
    secretKey: string;
    role: string;
  };
  dataSources?: {
    realtime?: {
      enabled: boolean;
      url?: string;
    };
    activeSource?: string;
  };
}

/**
 * Sample app configuration
 * 
 * For this sample app, we'll use dummy mode by default.
 * To use realtime mode, configure a WebSocket URL here.
 * 
 * IMPORTANT: Replace the placeholder values with your actual SDK credentials.
 */
const appConfig: AppConfig = {
  // Map SDK configuration
  // Replace with your actual access token, secret key, and role
  metaAtlas: {
    "accessToken": "",
    "secretKey": "",
    "role": ""
  },
  // Data source configuration
  dataSources: {
    activeSource: 'ailytics', // Source identifier for event processing
    realtime: {
      enabled: false, // Set to true and provide URL to enable realtime mode
      url: undefined, // WebSocket URL for realtime alerts
    },
  },
};

export default appConfig;
