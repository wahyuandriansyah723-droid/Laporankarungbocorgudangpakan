import { connectionManager } from './connectionManager';
import { MonthReport, PetugasReport, LeakageRecord, WarehouseSettings } from '../types';

const DB_NAME = 'karung_bocor_db';
const DB_VERSION = 1;
const STORE_NAME = 'cache_store';

class CacheService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isIndexedDBAvailable: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.isIndexedDBAvailable = true;
      this.initDB();
    } else {
      connectionManager.setCacheType('Local Storage Fallback');
    }
  }

  private initDB() {
    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e: any) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = (e: any) => {
          connectionManager.setCacheType('IndexedDB Active');
          resolve(e.target.result);
        };
        req.onerror = () => {
          connectionManager.setCacheType('Local Storage Fallback');
          reject(req.error);
        };
      } catch {
        connectionManager.setCacheType('Local Storage Fallback');
        reject(new Error('IndexedDB initialization failed'));
      }
    });
  }

  // Generic getItem with localStorage fallback
  public async get<T>(key: string, fallbackValue: T): Promise<T> {
    try {
      if (this.isIndexedDBAvailable && this.dbPromise) {
        const db = await this.dbPromise;
        const result = await new Promise<T | null>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result ?? null);
          req.onerror = () => resolve(null);
        });

        if (result !== null && result !== undefined) {
          return result;
        }
      }
    } catch {
      // Fallback
    }

    // LocalStorage fallback
    try {
      const item = localStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as T;
      }
    } catch (e) {
      console.warn(`[CacheService] Failed reading ${key} from localStorage:`, e);
    }

    return fallbackValue;
  }

  // Generic setItem with dual persist (IndexedDB + localStorage) for safety
  public async set<T>(key: string, value: T): Promise<void> {
    // Write to localStorage for immediate synchronous availability
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage full
    }

    // Write to IndexedDB
    try {
      if (this.isIndexedDBAvailable && this.dbPromise) {
        const db = await this.dbPromise;
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(value, key);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }
    } catch (e) {
      console.warn(`[CacheService] Failed writing ${key} to IndexedDB:`, e);
    }
  }

  // Clear cache key
  public async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {}

    try {
      if (this.isIndexedDBAvailable && this.dbPromise) {
        const db = await this.dbPromise;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(key);
      }
    } catch {}
  }
}

export const cacheService = new CacheService();
