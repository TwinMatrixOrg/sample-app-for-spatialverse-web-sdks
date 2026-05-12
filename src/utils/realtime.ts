/**
 * Realtime Connection Utilities
 *
 * WebSocket connection handler with exponential-backoff reconnection.
 * Reconnects automatically on close unless close() is called explicitly.
 */

export type RealtimeConnectionHandlers = {
  onMessage: (data: unknown) => void;
  onOpen?: () => void;
  /** Fires on every successful open, including after auto-reconnect (new WebSocket instance). */
  onSocketReady?: (ws: WebSocket) => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
};

/**
 * Connect to a WebSocket server with automatic exponential-backoff reconnection.
 *
 * @param url      - WebSocket server URL
 * @param handlers - Event handlers for connection lifecycle
 * @returns Connection object with close() and send() methods
 */
export const connectRealtime = (
  url: string,
  handlers: RealtimeConnectionHandlers
) => {
  let currentWs: WebSocket;
  let reconnectAttempts = 0;
  let closed = false;

  const connect = () => {
    currentWs = new WebSocket(url);

    currentWs.onopen = () => {
      reconnectAttempts = 0;
      handlers.onOpen?.();
      handlers.onSocketReady?.(currentWs);
    };
    currentWs.onmessage = (event) => {
      let parsed: unknown = event.data;
      if (typeof event.data === 'string') {
        try {
          parsed = JSON.parse(event.data);
        } catch {
          parsed = event.data;
        }
      }
      handlers.onMessage(parsed);
    };

    currentWs.onerror = (event) => {
      handlers.onError?.(event);
    };

    currentWs.onclose = () => {
      handlers.onClose?.();
      if (!closed) {
        const delay = Math.min(10000, 1000 * Math.pow(2, reconnectAttempts++));
        setTimeout(connect, delay);
      }
    };
  };

  connect();

  return {
    close: () => {
      closed = true;
      currentWs.close();
    },
    send: (data: unknown) => {
      if (currentWs.readyState === WebSocket.OPEN) {
        currentWs.send(typeof data === 'string' ? data : JSON.stringify(data));
      }
    },
    getSocket: () => currentWs,
  };
};
