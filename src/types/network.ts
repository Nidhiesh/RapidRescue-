/**
 * RapidRescue Driver Mobile App - Network State Models
 * Lightweight network reachability abstraction for offline/online awareness.
 */

export type NetworkStatus = 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'ERROR';

export interface NetworkState {
  status: NetworkStatus;
  isOnline: boolean;
  lastChecked: number;
  latencyMs?: number;
}
