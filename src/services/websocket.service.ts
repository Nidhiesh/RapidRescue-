/**
 * RapidRescue WebSocket Service Interface
 *
 * Provides typed contract for real-time telemetry and emergency dispatch events.
 */

import { WebSocketEventType, WebSocketMessage } from '@/types/socket.types';

export type SocketListener<T = unknown> = (message: WebSocketMessage<T>) => void;

export interface IWebSocketService {
  connect(emergencyId: string, token?: string): void;
  disconnect(): void;
  isConnected(): boolean;
  subscribe<T = unknown>(event: WebSocketEventType, listener: SocketListener<T>): () => void;
  sendMessage<T = unknown>(event: WebSocketEventType, payload: T): void;
}

export class WebSocketServiceStub implements IWebSocketService {
  private connected: boolean = false;

  connect(_emergencyId: string, _token?: string): void {
    // Stub for Phase 1; live implementation in Phase 4
    this.connected = false;
  }

  disconnect(): void {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  subscribe<T = unknown>(_event: WebSocketEventType, _listener: SocketListener<T>): () => void {
    return () => {};
  }

  sendMessage<T = unknown>(_event: WebSocketEventType, _payload: T): void {
    // Stub
  }
}

export const webSocketService: IWebSocketService = new WebSocketServiceStub();
export default webSocketService;
