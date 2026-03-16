/**
 * Event Stream Store
 * 
 * This store manages the event stream for the dashboard application.
 * It supports two modes:
 * - 'dummy': Generates mock alerts for testing/demo purposes
 * - 'realtime': Connects to a WebSocket server for live alerts
 * 
 * The store normalizes all events to a common format (NormalizedEvent)
 * regardless of their source, making it easy to work with different data sources.
 * 
 * Key Features:
 * - Camera management: Stores camera metaFeatures from the Map SDK
 * - Event aggregation: Collects and deduplicates events
 * - Mode switching: Can switch between dummy and realtime modes
 * - Visible events: Provides filtered events based on current mode
 * 
 * Usage:
 * ```tsx
 * const events = useEventStreamStore(state => state.getVisibleEvents());
 * const startDummy = useEventStreamStore(state => state.startDummy);
 * startDummy(); // Start generating dummy alerts
 * ```
 */

import { create } from 'zustand';
import { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import appConfig from '../config/app.config';
import { NormalizedEvent } from '../types/events';
import { connectRealtime, type RealtimeConnectionHandlers } from '../utils/realtime';
import { mapAilyticsRealtimeMessage } from '../utils/realtimeAdapters';
import { AilyticsAlert, WebSocketAlertMessage } from '../types/alerts';
// Import Map SDK hooks and types from external package
import { useSearch } from '@twinmatrix/spatialverse-sdk-web/react';
import type { metaFeature } from '@twinmatrix/spatialverse-sdk-web';

export type EventMode = 'realtime' | 'dummy';

// Dummy alert triggers - used to generate realistic test alerts
const DUMMY_TRIGGERS = [
  'ppe_detection',
  'worker_near_heavy_machine',
  'no_access_area',
  'slip_trip_fall',
  'crowding',
];

/**
 * Generate a dummy alert for testing purposes
 * 
 * This creates a mock alert with random trigger and camera information.
 * Used in dummy mode to simulate real-time alert generation.
 */
const generateDummyAlert = (cameraId: string, cameraName: string): AilyticsAlert => {
  const trigger = DUMMY_TRIGGERS[Math.floor(Math.random() * DUMMY_TRIGGERS.length)];
  const now = new Date();
  
  return {
    id: `dummy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    trigger,
    camera_info: {
      id: cameraId,
      name: cameraName,
    },
    group_info: {
      id: 'dummy-group-1',
      name: 'Dummy Group',
    },
    site_info: {
      id: 'dummy-site-1',
      name: 'Dummy Site',
    },
    frame: null,
    video: null,
    timestamp: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    countryCode: 'SG',
    isMock: true,
  };
};

interface EventStreamState {
  mode: EventMode;
  events: NormalizedEvent[];
  eventsById: Record<string, NormalizedEvent>;
  isLoading: boolean;
  error: string | null;
  
  // Camera management
  // Cameras are stored as metaFeatures from the Map SDK
  cameras: metaFeature[];
  isLoadingCameras: boolean;
  camerasReady: boolean; // True when cameras have been loaded

  setMode: (mode: EventMode) => void;
  addEvents: (events: NormalizedEvent[]) => void;
  clear: () => void;
  startRealtime: () => void;
  stopRealtime: () => void;
  startDummy: () => void;
  stopDummy: () => void;
  setCameras: (cameras: metaFeature[]) => void;
  
  // Get visible events based on mode
  // In dummy/realtime modes, returns all events
  getVisibleEvents: () => NormalizedEvent[];
}

export const useEventStreamStore = create<EventStreamState>((set, get) => {
  let connection: { close: () => void } | null = null;
  let dummyInterval: NodeJS.Timeout | null = null;

  /**
   * Add events to the store, deduplicating by ID
   * 
   * Events are sorted by timestamp (newest first) after being added.
   */
  const addEvents = (incoming: NormalizedEvent[]) => {
    if (incoming.length === 0) return;
    const { eventsById } = get();
    const nextById = { ...eventsById };
    let changed = false;

    incoming.forEach((event) => {
      if (!nextById[event.id]) {
        nextById[event.id] = event;
        changed = true;
      }
    });

    if (!changed) return;

    const nextEvents = Object.values(nextById).sort((a, b) =>
      dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf()
    );

    set({ eventsById: nextById, events: nextEvents });
  };

  /**
   * Handle realtime WebSocket messages
   * 
   * Converts incoming WebSocket messages to NormalizedEvent format
   * and adds them to the store.
   */
  const handleRealtimeMessage: RealtimeConnectionHandlers['onMessage'] = (
    data
  ) => {
    const source = appConfig.dataSources?.activeSource;
    if (source !== 'ailytics') return;

    const payloads: AilyticsAlert[] = [];

    if (Array.isArray(data)) {
      data.forEach((item) => {
        const alert = item as AilyticsAlert;
        if (alert?.id) payloads.push(alert);
      });
    } else if (data && typeof data === 'object') {
      const message = data as WebSocketAlertMessage & {
        type?: string;
        data?: unknown;
      };
      if (message.payload) {
        addEvents([mapAilyticsRealtimeMessage(message)]);
        return;
      }
      if (message.type && message.data !== undefined) {
        if (Array.isArray(message.data)) {
          message.data.forEach((item) => {
            const alert = item as AilyticsAlert;
            if (alert?.id) payloads.push(alert);
          });
        } else {
          const alert = message.data as AilyticsAlert;
          if (alert?.id) payloads.push(alert);
        }
      }
    }

    if (payloads.length > 0) {
      // Convert alerts to normalized events
      const normalizedEvents = payloads.map((alert) => ({
        id: alert.id,
        type: alert.trigger,
        timestamp: alert.timestamp,
        source: 'ailytics',
        payload: alert,
      }));
      addEvents(normalizedEvents);
    }
  };

  /**
   * Handle dummy alert generation
   * 
   * Converts a generated dummy alert to NormalizedEvent format
   * using the same pattern as realtime messages.
   */
  const handleDummyMessage = (alert: AilyticsAlert) => {
    const message: WebSocketAlertMessage = {
      payload: alert,
      timestamp: alert.timestamp,
      topic: 'alerts',
    };
    addEvents([mapAilyticsRealtimeMessage(message)]);
  };

  return {
    mode: 'dummy', // Default to dummy mode for sample app
    events: [],
    eventsById: {},
    isLoading: false,
    error: null,
    cameras: [],
    isLoadingCameras: false,
    camerasReady: false,

    setMode: (mode) => {
      set({ mode });
    },
    
    setCameras: (cameras: metaFeature[]) => {
      set({ cameras, isLoadingCameras: false, camerasReady: cameras.length > 0 });
    },

    addEvents,
    
    clear: () =>
      set({
        events: [],
        eventsById: {},
      }),

    /**
     * Start realtime mode - connect to WebSocket server
     * 
     * Requires appConfig.dataSources.realtime.url to be configured.
     */
    startRealtime: () => {
      if (connection) return;
      const realtimeConfig = appConfig.dataSources?.realtime;
      if (!realtimeConfig?.enabled || !realtimeConfig.url) {
        set({ error: 'Realtime mode not configured. Please set appConfig.dataSources.realtime.url' });
        return;
      }
      connection = connectRealtime(realtimeConfig.url, {
        onMessage: handleRealtimeMessage,
        onError: () => set({ error: 'Realtime connection error' }),
      });
    },

    stopRealtime: () => {
      if (connection) {
        connection.close();
        connection = null;
      }
    },

    /**
     * Start dummy mode - generate mock alerts
     * 
     * Requires cameras to be loaded first (via setCameras).
     * Generates alerts at random intervals (1-3 seconds).
     */
    startDummy: () => {
      if (dummyInterval) return;
      const { cameras } = get();
      
      if (cameras.length === 0) {
        set({ error: 'No cameras available for dummy mode. Load cameras first.' });
        return;
      }

      // Generate alerts at random intervals
      const generateAndEmit = () => {
        const randomCamera = cameras[Math.floor(Math.random() * cameras.length)];
        const cameraId = randomCamera.mapObjectId || randomCamera.name || 'unknown';
        const cameraName = randomCamera.name || 'Unknown Camera';
        const alert = generateDummyAlert(cameraId, cameraName);
        handleDummyMessage(alert);
      };

      // Generate first alert immediately
      generateAndEmit();

      // Then generate at random intervals
      const scheduleNext = () => {
        const delay = 1000 + Math.random() * 2000; // 1-3 seconds
        dummyInterval = setTimeout(() => {
          generateAndEmit();
          scheduleNext();
        }, delay);
      };

      scheduleNext();
    },

    stopDummy: () => {
      if (dummyInterval) {
        clearTimeout(dummyInterval);
        dummyInterval = null;
      }
    },

    /**
     * Get visible events based on current mode
     * 
     * In dummy/realtime modes, returns all events.
     * This can be extended to support filtering by time range, etc.
     */
    getVisibleEvents: () => {
      const { mode, events } = get();
      
      // In realtime/dummy mode, show all events
      if (mode === 'realtime' || mode === 'dummy') {
        return events;
      }
      
      // Fallback: return empty array
      return [];
    },
  };
});

/**
 * Hook to load cameras from Map SDK
 * 
 * This hook uses the Map SDK's useSearch hook internally to load cameras
 * and automatically updates the event stream store when cameras are loaded.
 * 
 * Usage:
 * ```tsx
 * const camerasReady = useLoadCameras();
 * ```
 * 
 * @returns boolean indicating if cameras have been loaded and are ready
 */
export function useLoadCameras(): boolean {
  const { getMapObjectsByWhatTaxonomy, isReady: searchReady } = useSearch();
  const camerasReady = useEventStreamStore((state) => state.camerasReady);
  const setCameras = useEventStreamStore((state) => state.setCameras);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    console.log('useLoadCameras', searchReady);
    // Only proceed if search services are ready and cameras haven't been loaded yet
    if (!searchReady || !getMapObjectsByWhatTaxonomy || hasLoadedRef.current || camerasReady) {
      return;
    }

    // Query cameras from Map SDK using the CCTV taxonomy
    getMapObjectsByWhatTaxonomy('what.security.cctv', (mapObjects) => {
      console.log('useLoadCameras', mapObjects);
      // Update eventStreamStore cameras
      setCameras(mapObjects);
      
      // Mark cameras as loaded
      hasLoadedRef.current = true;
    });
  }, [searchReady]);

  // Return true if cameras are loaded and we have at least one camera
  return camerasReady;
}
