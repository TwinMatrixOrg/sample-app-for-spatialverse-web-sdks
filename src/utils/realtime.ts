/**
 * Realtime Connection Utilities
 * 
 * Simple WebSocket connection handler for realtime alerts.
 * In a production app, you might use a more robust WebSocket library.
 */

export type RealtimeConnectionHandlers = {
  onMessage: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
};

/**
 * Connect to a WebSocket server for realtime alerts
 * 
 * @param url - WebSocket server URL
 * @param handlers - Event handlers for connection lifecycle
 * @returns Connection object with close() method
 */
export const connectRealtime = (
  url: string,
  handlers: RealtimeConnectionHandlers
) => {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    handlers.onOpen?.();
  };

  ws.onmessage = (event) => {
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

  ws.onerror = (event) => {
    handlers.onError?.(event);
  };

  ws.onclose = () => {
    handlers.onClose?.();
  };

  return {
    close: () => ws.close(),
  };
};
