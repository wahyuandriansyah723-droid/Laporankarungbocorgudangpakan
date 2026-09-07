/**
 * Centralized Connection Manager & Circuit Breaker
 * Manages Online/Offline status, Quota Circuit Breaker, Exponential Backoff,
 * and Telemetry Monitor stats.
 */

export type ConnectionStatus = 'online' | 'syncing' | 'offline';
export type QuotaStatus = 'normal' | 'limited';

export interface TelemetryState {
  readsCount: number;
  writesCount: number;
  activeFirestoreListeners: number;
  rtdbListeners: number;
  lastSyncTime: string | null;
  connectionStatus: ConnectionStatus;
  quotaStatus: QuotaStatus;
  cacheStatus: 'IndexedDB Active' | 'Local Storage Fallback';
  errorMessage: string | null;
}

type ListenerCallback = (state: TelemetryState) => void;

class ConnectionManager {
  private listeners: Set<ListenerCallback> = new Set();
  private state: TelemetryState = {
    readsCount: 0,
    writesCount: 0,
    activeFirestoreListeners: 0,
    rtdbListeners: 0,
    lastSyncTime: null,
    connectionStatus: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
    quotaStatus: 'normal',
    cacheStatus: 'IndexedDB Active',
    errorMessage: null,
  };

  private quotaResetTimeout: any = null;
  private isSimulatedOffline: boolean = false;
  private isSimulatedQuota: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public subscribe(cb: ListenerCallback): () => void {
    this.listeners.add(cb);
    cb({ ...this.state });
    return () => {
      this.listeners.delete(cb);
    };
  }

  public getState(): TelemetryState {
    return { ...this.state };
  }

  private notify() {
    const copy = { ...this.state };
    this.listeners.forEach((cb) => {
      try {
        cb(copy);
      } catch (err) {
        console.error('[ConnectionManager] Listener error:', err);
      }
    });
  }

  // Network handler
  private handleNetworkChange(isOnline: boolean) {
    if (this.isSimulatedOffline) return;
    this.state.connectionStatus = isOnline ? 'online' : 'offline';
    if (!isOnline) {
      this.state.errorMessage = 'Jaringan terputus. Mode Offline aktif.';
    } else {
      this.state.errorMessage = null;
      this.state.connectionStatus = 'syncing';
      this.notify();
      setTimeout(() => {
        this.state.connectionStatus = 'online';
        this.state.lastSyncTime = new Date().toLocaleTimeString();
        this.notify();
      }, 800);
      return;
    }
    this.notify();
  }

  // Telemetry updates
  public incrementRead(count: number = 1) {
    this.state.readsCount += count;
    this.notify();
  }

  public incrementWrite(count: number = 1) {
    this.state.writesCount += count;
    this.state.lastSyncTime = new Date().toLocaleTimeString();
    this.notify();
  }

  public registerListener(type: 'firestore' | 'rtdb' = 'firestore') {
    if (type === 'firestore') {
      this.state.activeFirestoreListeners += 1;
    } else {
      this.state.rtdbListeners += 1;
    }
    this.notify();
  }

  public unregisterListener(type: 'firestore' | 'rtdb' = 'firestore') {
    if (type === 'firestore') {
      this.state.activeFirestoreListeners = Math.max(0, this.state.activeFirestoreListeners - 1);
    } else {
      this.state.rtdbListeners = Math.max(0, this.state.rtdbListeners - 1);
    }
    this.notify();
  }

  public setSyncing(isSyncing: boolean) {
    if (this.state.connectionStatus === 'offline') return;
    this.state.connectionStatus = isSyncing ? 'syncing' : 'online';
    if (!isSyncing) {
      this.state.lastSyncTime = new Date().toLocaleTimeString();
    }
    this.notify();
  }

  public setCacheType(type: 'IndexedDB Active' | 'Local Storage Fallback') {
    this.state.cacheStatus = type;
    this.notify();
  }

  // Quota Circuit Breaker
  public handleQuotaExceeded(error?: any) {
    console.warn('[CircuitBreaker] Quota Exceeded / Resource Exhausted detected. Tripping breaker!');
    this.state.quotaStatus = 'limited';
    this.state.errorMessage = 'Kuota Firestore harian tercapai. Mode offline / cache lokal aktif tanpa gangguan.';
    this.notify();

    // Gradually attempt reset after cool-down (e.g., 60 seconds)
    if (this.quotaResetTimeout) clearTimeout(this.quotaResetTimeout);
    this.quotaResetTimeout = setTimeout(() => {
      console.info('[CircuitBreaker] Attempting gradual quota circuit breaker reset...');
      if (!this.isSimulatedQuota) {
        this.state.quotaStatus = 'normal';
        this.state.errorMessage = null;
        this.notify();
      }
    }, 60000);
  }

  // Check if requests should proceed to Cloud Firestore
  public shouldAllowCloudRequest(): boolean {
    if (this.isSimulatedOffline || this.state.connectionStatus === 'offline') {
      return false;
    }
    if (this.state.quotaStatus === 'limited') {
      return false;
    }
    return true;
  }

  // Exponential Backoff helper
  public async executeWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 1000
  ): Promise<T> {
    let delay = initialDelayMs;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        const msg = String(err?.message || err);
        // Do NOT retry on permission-denied or unauthenticated
        if (msg.includes('permission-denied') || msg.includes('unauthenticated')) {
          console.error('[ConnectionManager] Permission denied. Halting retry immediately.', err);
          this.state.errorMessage = 'Akses ditolak (Permission Denied). Periksa konfigurasi keamanan.';
          this.notify();
          throw err;
        }

        // Quota error
        if (msg.includes('resource-exhausted') || msg.includes('quota') || msg.includes('Quota exceeded')) {
          this.handleQuotaExceeded(err);
          throw err;
        }

        if (attempt === maxRetries) {
          throw err;
        }

        // Backoff: 1s, 2s, 4s, etc.
        console.warn(`[ConnectionManager] Retry attempt ${attempt} failed. Backing off for ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    throw new Error('Max retries exceeded');
  }

  // Simulation Controls for testing
  public toggleSimulateOffline() {
    this.isSimulatedOffline = !this.isSimulatedOffline;
    this.state.connectionStatus = this.isSimulatedOffline ? 'offline' : 'online';
    this.state.errorMessage = this.isSimulatedOffline ? 'Simulasi: Offline (Menggunakan Cache)' : null;
    this.notify();
  }

  public toggleSimulateQuota() {
    this.isSimulatedQuota = !this.isSimulatedQuota;
    if (this.isSimulatedQuota) {
      this.handleQuotaExceeded();
    } else {
      this.state.quotaStatus = 'normal';
      this.state.errorMessage = null;
      this.notify();
    }
  }

  public resetTelemetry() {
    this.state.readsCount = 0;
    this.state.writesCount = 0;
    this.notify();
  }
}

export const connectionManager = new ConnectionManager();
