import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  limit,
  orderBy,
  writeBatch,
  serverTimestamp,
  Unsubscribe,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { connectionManager } from './connectionManager';
import { cacheService } from './cacheService';
import { MonthReport, PetugasReport, LeakageRecord, WarehouseSettings } from '../types';
import { initialMonthReports, defaultSettings } from '../data/initialData';

// Operation types for standard error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: Record<string, any>;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    operationType,
    path,
    authInfo: {},
  };
  console.error('[Firestore Error]', JSON.stringify(errInfo));

  // Check quota error
  if (errMsg.includes('resource-exhausted') || errMsg.includes('quota') || errMsg.includes('Quota exceeded')) {
    connectionManager.handleQuotaExceeded(error);
  }

  return errInfo;
}

// Active listeners registry to prevent duplicates
const activeListenersMap = new Map<string, Unsubscribe>();

// Debounce queue for writes to prevent keystroke quota waste
const writeDebounceTimers = new Map<string, any>();

class FirestoreService {
  /**
   * SUBSCRIBE TO MONTHLY REPORTS
   * Listens to the 'monthly_reports' collection with incremental docChanges.
   * Prevents duplicate listeners.
   */
  public subscribeMonthlyReports(
    onUpdate: (reports: MonthReport[]) => void,
    onError?: (err: any) => void
  ): () => void {
    const listenerKey = 'monthly_reports_collection';

    // If Firebase is not configured or in offline/circuit breaker mode, read from cache
    if (!isFirebaseConfigured || !db || !connectionManager.shouldAllowCloudRequest()) {
      cacheService.get<MonthReport[]>('karung_bocor_reports', initialMonthReports).then((cached) => {
        onUpdate(cached);
      });
      return () => {};
    }

    // Deduplicate listener
    if (activeListenersMap.has(listenerKey)) {
      const existingUnsub = activeListenersMap.get(listenerKey);
      if (existingUnsub) existingUnsub();
      connectionManager.unregisterListener('firestore');
      activeListenersMap.delete(listenerKey);
    }

    try {
      const colRef = collection(db, 'monthly_reports');
      connectionManager.registerListener('firestore');

      const unsubscribe = onSnapshot(
        colRef,
        (snapshot: QuerySnapshot<DocumentData>) => {
          connectionManager.incrementRead(snapshot.docChanges().length || 1);
          connectionManager.setSyncing(false);

          if (snapshot.empty) {
            // First time initialization: initialize with initial reports without blocking
            return;
          }

          // Build reports map incrementally
          const fetchedMonths: Record<number, MonthReport> = {};
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as MonthReport;
            if (data && data.monthIndex) {
              fetchedMonths[data.monthIndex] = data;
            }
          });

          // Merge with all 12 months structure
          const completeReports: MonthReport[] = Array.from({ length: 12 }, (_, i) => {
            const monthIdx = i + 1;
            return (
              fetchedMonths[monthIdx] ||
              initialMonthReports[i] || {
                monthIndex: monthIdx,
                monthName: `${monthIdx < 10 ? '0' : ''}${monthIdx} Bulan`,
                penjualanKg: 0,
                dailyEntries: {},
              }
            );
          });

          // Update local cache & notify UI
          cacheService.set('karung_bocor_reports', completeReports);
          onUpdate(completeReports);
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, 'monthly_reports');
          if (onError) onError(err);
        }
      );

      activeListenersMap.set(listenerKey, unsubscribe);

      return () => {
        unsubscribe();
        connectionManager.unregisterListener('firestore');
        activeListenersMap.delete(listenerKey);
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'monthly_reports');
      return () => {};
    }
  }

  /**
   * SAVE SINGLE MONTH REPORT (Targeted Write)
   * Only writes to 'monthly_reports/month_{monthIndex}', preventing 12-doc rewrites!
   * Debounced by 400ms to eliminate write explosions during cell typing.
   */
  public async saveSingleMonthReport(report: MonthReport, debounceMs: number = 400): Promise<void> {
    const docId = `month_${report.monthIndex}`;
    const timerKey = `write_${docId}`;

    if (writeDebounceTimers.has(timerKey)) {
      clearTimeout(writeDebounceTimers.get(timerKey));
    }

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        writeDebounceTimers.delete(timerKey);

        if (!isFirebaseConfigured || !db || !connectionManager.shouldAllowCloudRequest()) {
          resolve();
          return;
        }

        try {
          connectionManager.setSyncing(true);
          const docRef = doc(db, 'monthly_reports', docId);

          await connectionManager.executeWithBackoff(async () => {
            await setDoc(docRef, {
              ...report,
              updatedAt: serverTimestamp(),
            });
            connectionManager.incrementWrite(1);
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `monthly_reports/${docId}`);
        } finally {
          connectionManager.setSyncing(false);
          resolve();
        }
      }, debounceMs);

      writeDebounceTimers.set(timerKey, timer);
    });
  }

  /**
   * BATCH SAVE ALL MONTH REPORTS
   * Used when resetting or loading sample reports. Uses writeBatch() for efficiency.
   */
  public async batchSaveAllReports(reports: MonthReport[]): Promise<void> {
    // Immediately persist in local cache
    await cacheService.set('karung_bocor_reports', reports);

    if (!isFirebaseConfigured || !db || !connectionManager.shouldAllowCloudRequest()) {
      return;
    }

    try {
      connectionManager.setSyncing(true);
      const batch = writeBatch(db);

      reports.forEach((rep) => {
        const docRef = doc(db, 'monthly_reports', `month_${rep.monthIndex}`);
        batch.set(docRef, {
          ...rep,
          updatedAt: serverTimestamp(),
        });
      });

      await connectionManager.executeWithBackoff(async () => {
        await batch.commit();
        connectionManager.incrementWrite(reports.length);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'monthly_reports/batch');
    } finally {
      connectionManager.setSyncing(false);
    }
  }

  /**
   * SUBSCRIBE TO PETUGAS REPORTS
   * Query limited to 50 records, ordered by createdAt descending.
   */
  public subscribePetugasReports(
    onUpdate: (reports: PetugasReport[]) => void,
    onError?: (err: any) => void
  ): () => void {
    const listenerKey = 'petugas_reports_collection';

    if (!isFirebaseConfigured || !db || !connectionManager.shouldAllowCloudRequest()) {
      cacheService.get<PetugasReport[]>('karung_bocor_petugas_reports', []).then((cached) => {
        onUpdate(cached);
      });
      return () => {};
    }

    if (activeListenersMap.has(listenerKey)) {
      const existingUnsub = activeListenersMap.get(listenerKey);
      if (existingUnsub) existingUnsub();
      connectionManager.unregisterListener('firestore');
      activeListenersMap.delete(listenerKey);
    }

    try {
      const q = query(collection(db, 'petugas_reports'), orderBy('createdAt', 'desc'), limit(50));
      connectionManager.registerListener('firestore');

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          connectionManager.incrementRead(snapshot.docChanges().length || 1);
          connectionManager.setSyncing(false);

          const list: PetugasReport[] = [];
          snapshot.forEach((d) => {
            list.push({ ...(d.data() as PetugasReport), id: d.id });
          });

          cacheService.set('karung_bocor_petugas_reports', list);
          onUpdate(list);
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, 'petugas_reports');
          if (onError) onError(err);
        }
      );

      activeListenersMap.set(listenerKey, unsubscribe);

      return () => {
        unsubscribe();
        connectionManager.unregisterListener('firestore');
        activeListenersMap.delete(listenerKey);
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'petugas_reports');
      return () => {};
    }
  }

  /**
   * SAVE PETUGAS REPORT (Single Document Write)
   */
  public async savePetugasReport(report: PetugasReport): Promise<void> {
    if (!isFirebaseConfigured || !db || !connectionManager.shouldAllowCloudRequest()) {
      return;
    }

    try {
      connectionManager.setSyncing(true);
      const docRef = doc(db, 'petugas_reports', report.id);
      await connectionManager.executeWithBackoff(async () => {
        await setDoc(docRef, {
          ...report,
          serverUpdatedAt: serverTimestamp(),
        });
        connectionManager.incrementWrite(1);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `petugas_reports/${report.id}`);
    } finally {
      connectionManager.setSyncing(false);
    }
  }

  /**
   * SUBSCRIBE TO LEAKAGE LOGS
   * Limit 50 records.
   */
  public subscribeLeakageLogs(
    onUpdate: (logs: LeakageRecord[]) => void,
    onError?: (err: any) => void
  ): () => void {
    const listenerKey = 'leakage_logs_collection';

    if (!isFirebaseConfigured || !db || !connectionManager.shouldAllowCloudRequest()) {
      cacheService.get<LeakageRecord[]>('karung_bocor_logs', []).then((cached) => {
        onUpdate(cached);
      });
      return () => {};
    }

    if (activeListenersMap.has(listenerKey)) {
      const existingUnsub = activeListenersMap.get(listenerKey);
      if (existingUnsub) existingUnsub();
      connectionManager.unregisterListener('firestore');
      activeListenersMap.delete(listenerKey);
    }

    try {
      const q = query(collection(db, 'leakage_logs'), orderBy('date', 'desc'), limit(50));
      connectionManager.registerListener('firestore');

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          connectionManager.incrementRead(snapshot.docChanges().length || 1);
          connectionManager.setSyncing(false);

          const list: LeakageRecord[] = [];
          snapshot.forEach((d) => {
            list.push({ ...(d.data() as LeakageRecord), id: d.id });
          });

          cacheService.set('karung_bocor_logs', list);
          onUpdate(list);
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, 'leakage_logs');
          if (onError) onError(err);
        }
      );

      activeListenersMap.set(listenerKey, unsubscribe);

      return () => {
        unsubscribe();
        connectionManager.unregisterListener('firestore');
        activeListenersMap.delete(listenerKey);
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'leakage_logs');
      return () => {};
    }
  }

  /**
   * ADD LEAKAGE LOG (Single Document Write)
   */
  public async addLeakageLog(logItem: LeakageRecord): Promise<void> {
    if (!isFirebaseConfigured || !db || !connectionManager.shouldAllowCloudRequest()) {
      return;
    }

    try {
      connectionManager.setSyncing(true);
      const docRef = doc(db, 'leakage_logs', logItem.id);
      await connectionManager.executeWithBackoff(async () => {
        await setDoc(docRef, {
          ...logItem,
          serverCreatedAt: serverTimestamp(),
        });
        connectionManager.incrementWrite(1);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `leakage_logs/${logItem.id}`);
    } finally {
      connectionManager.setSyncing(false);
    }
  }

  /**
   * SUBSCRIBE TO WAREHOUSE SETTINGS
   */
  public subscribeSettings(
    onUpdate: (settings: WarehouseSettings) => void,
    onError?: (err: any) => void
  ): () => void {
    const listenerKey = 'warehouse_settings_doc';

    if (!isFirebaseConfigured || !db || !connectionManager.shouldAllowCloudRequest()) {
      cacheService.get<WarehouseSettings>('karung_bocor_settings', defaultSettings).then((cached) => {
        onUpdate(cached);
      });
      return () => {};
    }

    if (activeListenersMap.has(listenerKey)) {
      const existingUnsub = activeListenersMap.get(listenerKey);
      if (existingUnsub) existingUnsub();
      connectionManager.unregisterListener('firestore');
      activeListenersMap.delete(listenerKey);
    }

    try {
      const docRef = doc(db, 'warehouse_settings', 'main');
      connectionManager.registerListener('firestore');

      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          connectionManager.incrementRead(1);
          connectionManager.setSyncing(false);

          if (docSnap.exists()) {
            const data = docSnap.data() as WarehouseSettings;
            cacheService.set('karung_bocor_settings', data);
            onUpdate(data);
          }
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, 'warehouse_settings/main');
          if (onError) onError(err);
        }
      );

      activeListenersMap.set(listenerKey, unsubscribe);

      return () => {
        unsubscribe();
        connectionManager.unregisterListener('firestore');
        activeListenersMap.delete(listenerKey);
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'warehouse_settings/main');
      return () => {};
    }
  }

  /**
   * SAVE SETTINGS
   */
  public async saveSettings(settings: WarehouseSettings): Promise<void> {
    await cacheService.set('karung_bocor_settings', settings);

    if (!isFirebaseConfigured || !db || !connectionManager.shouldAllowCloudRequest()) {
      return;
    }

    try {
      connectionManager.setSyncing(true);
      const docRef = doc(db, 'warehouse_settings', 'main');
      await connectionManager.executeWithBackoff(async () => {
        await setDoc(docRef, {
          ...settings,
          updatedAt: serverTimestamp(),
        });
        connectionManager.incrementWrite(1);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'warehouse_settings/main');
    } finally {
      connectionManager.setSyncing(false);
    }
  }
}

export const firestoreService = new FirestoreService();
