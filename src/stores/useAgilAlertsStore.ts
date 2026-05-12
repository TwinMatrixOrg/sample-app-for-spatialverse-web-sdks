/**
 * Agil Alerts Store
 *
 * Manages a realtime WebSocket connection dedicated to alerts
 *
 * Usage:
 * ```tsx
 * const alerts  = useAgilAlertsStore(state => state.alerts);
 * const connect = useAgilAlertsStore(state => state.connect);
 * connect();
 * ```
 */

import { create } from 'zustand';
import dayjs from 'dayjs';
import appConfig from '../config/app.config';
import { connectRealtime, type RealtimeConnectionHandlers } from '../utils/realtime';
import { AgilAlert, AgilAlertMessage } from '../types/alerts';

type Connection = { close: () => void; send: (data: unknown) => void; getSocket: () => WebSocket };

export type AgilAlertsConnectOptions = {
  /** Called whenever the socket opens, including after reconnect — use to rebind SDK listeners. */
  onSocketReady?: (ws: WebSocket) => void;
};

interface AgilAlertsState {
  alerts: AgilAlert[];
  alertsById: Record<string, AgilAlert>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  connect: (options?: AgilAlertsConnectOptions) => void;
  disconnect: () => void;
  addAlerts: (alerts: AgilAlert[]) => void;
  sendMessage: (data: unknown) => void;
  getSocket: () => WebSocket | null;
  clear: () => void;
}

export const useAgilAlertsStore = create<AgilAlertsState>((set, get) => {
  let connection: Connection | null = null;

  const addAlerts = (incoming: AgilAlert[]) => {
    if (incoming.length === 0) return;
    const { alertsById } = get();
    const nextById = { ...alertsById };
    let changed = false;

    incoming.forEach((alert) => {
      if (!nextById[alert.id]) {
        nextById[alert.id] = alert;
        changed = true;
      }
    });

    if (!changed) return;

    const nextAlerts = Object.values(nextById).sort(
      (a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf()
    );

    set({ alertsById: nextById, alerts: nextAlerts });
  };

  const handleMessage: RealtimeConnectionHandlers['onMessage'] = (data) => {
    console.log('[AgilAlerts] incoming message:', data);
    if (!data || typeof data !== 'object') return;

    if (Array.isArray(data)) {
      const alerts: AgilAlert[] = [];
      data.forEach((item) => {
        const msg = item as AgilAlertMessage;
        if (msg?.type === 'alert' && msg.data?.id) alerts.push(msg.data);
      });
      addAlerts(alerts);
      return;
    }

    const msg = data as AgilAlertMessage;
    if (msg.type === 'alert' && msg.data?.id) addAlerts([msg.data]);
  };

  return {
    alerts: [],
    alertsById: {},
    isConnected: false,
    isLoading: false,
    error: null,

    addAlerts,

    connect: (options?: AgilAlertsConnectOptions) => {
      if (connection) return;
      const cfg = appConfig.dataSources?.alerts;
      if (!cfg?.enabled || !cfg.url) {
        set({ error: 'Agil Alerts not configured. Set dataSources.alerts.url in app.config.ts.' });
        return;
      }
      set({ isLoading: true, error: null });
      connection = connectRealtime(cfg.url, {
        onMessage: handleMessage,
        onOpen:  () => set({ isConnected: true, isLoading: false, error: null }),
        onSocketReady: options?.onSocketReady,
        onClose: () => set({ isConnected: false }),
        onError: () => set({ error: 'Agil Alerts connection error', isLoading: false }),
      });
    },

    disconnect: () => {
      connection?.close();
      connection = null;
      set({ isConnected: false });
    },

    sendMessage: (data: unknown) => { connection?.send(data); },

    getSocket: () => connection?.getSocket() ?? null,

    clear: () => set({ alerts: [], alertsById: {} }),
  };
});
