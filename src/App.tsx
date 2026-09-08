import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { MainTableView } from './components/MainTableView';
import { InputDataForm } from './components/InputDataForm';
import { AnalyticsView } from './components/AnalyticsView';
import { DataLogView } from './components/DataLogView';
import { SettingsView } from './components/SettingsView';
import { PetugasDashboardView } from './components/PetugasDashboardView';
import { FirebaseMonitor } from './components/FirebaseMonitor';
import { MonthReport, WarehouseSettings, LeakageRecord } from './types';
import { initialMonthReports, defaultSettings, emptyMonthReports, createEmptyMonthReports } from './data/initialData';
import { exportReportsToExcel } from './utils/excelExport';
import { cacheService } from './firebase/cacheService';
import { firestoreService } from './firebase/firestoreService';
import { connectionManager } from './firebase/connectionManager';

export default function App() {
  // Persistence state with synchronous initial value for 0ms paint
  const [reports, setReports] = useState<MonthReport[]>(() => {
    const saved = localStorage.getItem('karung_bocor_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return emptyMonthReports;
  });

  const [settings, setSettings] = useState<WarehouseSettings>(() => {
    const saved = localStorage.getItem('karung_bocor_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return defaultSettings;
  });

  const [logs, setLogs] = useState<LeakageRecord[]>(() => {
    const saved = localStorage.getItem('karung_bocor_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'table' | 'petugas' | 'input' | 'analytics' | 'log' | 'settings'>('petugas');
  const [isMonitorOpen, setIsMonitorOpen] = useState(false);

  // References to keep latest values without re-triggering effects
  const reportsRef = useRef(reports);
  reportsRef.current = reports;

  // Single active listener lifecycle on mount
  useEffect(() => {
    // 1. Asynchronously check IndexedDB cache to get freshest offline data
    cacheService.get<MonthReport[]>('karung_bocor_reports', emptyMonthReports).then((cachedReports) => {
      if (cachedReports && cachedReports.length > 0) {
        setReports(cachedReports);
      }
    });

    cacheService.get<WarehouseSettings>('karung_bocor_settings', defaultSettings).then((cachedSettings) => {
      if (cachedSettings) {
        setSettings(cachedSettings);
      }
    });

    cacheService.get<LeakageRecord[]>('karung_bocor_logs', []).then((cachedLogs) => {
      if (cachedLogs) {
        setLogs(cachedLogs);
      }
    });

    // 2. Attach single Firestore real-time listeners with lifecycle cleanup
    const unsubReports = firestoreService.subscribeMonthlyReports((cloudReports) => {
      setReports(cloudReports);
    });

    const unsubSettings = firestoreService.subscribeSettings((cloudSettings) => {
      setSettings(cloudSettings);
    });

    const unsubLogs = firestoreService.subscribeLeakageLogs((cloudLogs) => {
      setLogs(cloudLogs);
    });

    return () => {
      unsubReports();
      unsubSettings();
      unsubLogs();
    };
  }, []);

  // Synchronize document.title dynamically when system name or warehouse changes
  useEffect(() => {
    if (settings.namaSistem) {
      document.title = `${settings.namaSistem} - ${settings.namaGudang}`;
    } else {
      document.title = `Sistem Karung Bocor - ${settings.namaGudang}`;
    }
  }, [settings.namaSistem, settings.namaGudang]);

  // Handler: update cell entry (Optimistic update + targeted single month debounced write)
  const handleUpdateEntry = (
    monthIndex: number,
    day: number,
    field: 'forklift' | 'pallet' | 'bocorProduksi',
    value: number
  ) => {
    let targetUpdatedReport: MonthReport | null = null;

    setReports((prev) => {
      const next = prev.map((r) => {
        if (r.monthIndex === monthIndex) {
          const currentEntry = r.dailyEntries[day] || { forklift: 0, pallet: 0, bocorProduksi: 0 };
          const updated: MonthReport = {
            ...r,
            dailyEntries: {
              ...r.dailyEntries,
              [day]: {
                ...currentEntry,
                [field]: value,
              },
            },
          };
          targetUpdatedReport = updated;
          return updated;
        }
        return r;
      });
      cacheService.set('karung_bocor_reports', next);
      return next;
    });

    if (targetUpdatedReport) {
      firestoreService.saveSingleMonthReport(targetUpdatedReport);
    }
  };

  // Handler: update Penjualan Kg per month (Targeted single month write)
  const handleUpdatePenjualanKg = (monthIndex: number, newPenjualanKg: number) => {
    let targetUpdatedReport: MonthReport | null = null;

    setReports((prev) => {
      const next = prev.map((r) => {
        if (r.monthIndex === monthIndex) {
          const updated = { ...r, penjualanKg: newPenjualanKg };
          targetUpdatedReport = updated;
          return updated;
        }
        return r;
      });
      cacheService.set('karung_bocor_reports', next);
      return next;
    });

    if (targetUpdatedReport) {
      firestoreService.saveSingleMonthReport(targetUpdatedReport);
    }
  };

  // Handler: toggle cell status (red / yellow / normal)
  const handleToggleCellStatus = (
    monthIndex: number,
    day: number,
    statusType: 'red' | 'yellow' | 'normal'
  ) => {
    let targetUpdatedReport: MonthReport | null = null;

    setReports((prev) => {
      const next = prev.map((r) => {
        if (r.monthIndex === monthIndex) {
          const currentEntry = r.dailyEntries[day] || { forklift: 0, pallet: 0, bocorProduksi: 0 };
          const updated: MonthReport = {
            ...r,
            dailyEntries: {
              ...r.dailyEntries,
              [day]: {
                ...currentEntry,
                isRedDay: statusType === 'red',
                isYellowDay: statusType === 'yellow',
              },
            },
          };
          targetUpdatedReport = updated;
          return updated;
        }
        return r;
      });
      cacheService.set('karung_bocor_reports', next);
      return next;
    });

    if (targetUpdatedReport) {
      firestoreService.saveSingleMonthReport(targetUpdatedReport);
    }
  };

  // Handler: update cell status explicitly from form
  const handleUpdateCellStatusExplicit = (
    monthIndex: number,
    day: number,
    isRed: boolean,
    isYellow: boolean
  ) => {
    let targetUpdatedReport: MonthReport | null = null;

    setReports((prev) => {
      const next = prev.map((r) => {
        if (r.monthIndex === monthIndex) {
          const currentEntry = r.dailyEntries[day] || { forklift: 0, pallet: 0, bocorProduksi: 0 };
          const updated: MonthReport = {
            ...r,
            dailyEntries: {
              ...r.dailyEntries,
              [day]: {
                ...currentEntry,
                isRedDay: isRed,
                isYellowDay: isYellow,
              },
            },
          };
          targetUpdatedReport = updated;
          return updated;
        }
        return r;
      });
      cacheService.set('karung_bocor_reports', next);
      return next;
    });

    if (targetUpdatedReport) {
      firestoreService.saveSingleMonthReport(targetUpdatedReport);
    }
  };

  // Handler: sync petugas report directly into main monthly grid
  const handleSyncPetugasToMainReport = (
    monthIndex: number,
    day: number,
    forklift: number,
    pallet: number,
    bocorProduksi: number,
    logRecord?: Omit<LeakageRecord, 'id'>,
    isRedDay?: boolean
  ) => {
    if (logRecord) {
      const record: LeakageRecord = {
        ...logRecord,
        id: Date.now().toString(),
      };
      setLogs((prev) => {
        const next = [record, ...prev];
        cacheService.set('karung_bocor_logs', next);
        return next;
      });
      firestoreService.addLeakageLog(record);
    }

    let targetUpdatedReport: MonthReport | null = null;

    setReports((prev) => {
      const next = prev.map((r) => {
        if (r.monthIndex === monthIndex) {
          const currentEntry = r.dailyEntries[day] || { forklift: 0, pallet: 0, bocorProduksi: 0 };
          const updated: MonthReport = {
            ...r,
            dailyEntries: {
              ...r.dailyEntries,
              [day]: {
                ...currentEntry,
                forklift,
                pallet,
                bocorProduksi,
                isRedDay: isRedDay !== undefined ? isRedDay : currentEntry.isRedDay,
              },
            },
          };
          targetUpdatedReport = updated;
          return updated;
        }
        return r;
      });
      cacheService.set('karung_bocor_reports', next);
      return next;
    });

    if (targetUpdatedReport) {
      firestoreService.saveSingleMonthReport(targetUpdatedReport);
    }
  };

  // Handler: batch update all 12 month reports (e.g. from Holiday Manager)
  const handleBatchUpdateAllReports = async (updatedReports: MonthReport[]) => {
    setReports(updatedReports);
    reportsRef.current = updatedReports;
    await cacheService.set('karung_bocor_reports', updatedReports);
    await firestoreService.batchSaveAllReports(updatedReports);
  };

  // Handler: add new log entry
  const handleAddLogEntry = (newRecord: Omit<LeakageRecord, 'id'>) => {
    const record: LeakageRecord = {
      ...newRecord,
      id: Date.now().toString(),
    };

    setLogs((prev) => {
      const next = [record, ...prev];
      cacheService.set('karung_bocor_logs', next);
      return next;
    });
    firestoreService.addLeakageLog(record);

    let targetUpdatedReport: MonthReport | null = null;

    // Also update monthly grid data
    setReports((prev) => {
      const next = prev.map((r) => {
        if (r.monthIndex === newRecord.monthIndex) {
          const currentEntry = r.dailyEntries[newRecord.day] || { forklift: 0, pallet: 0, bocorProduksi: 0 };
          const updated: MonthReport = {
            ...r,
            dailyEntries: {
              ...r.dailyEntries,
              [newRecord.day]: {
                ...currentEntry,
                forklift: (currentEntry.forklift || 0) + newRecord.forklift,
                pallet: (currentEntry.pallet || 0) + newRecord.pallet,
                bocorProduksi: (currentEntry.bocorProduksi || 0) + newRecord.bocorProduksi,
              },
            },
          };
          targetUpdatedReport = updated;
          return updated;
        }
        return r;
      });
      cacheService.set('karung_bocor_reports', next);
      return next;
    });

    if (targetUpdatedReport) {
      firestoreService.saveSingleMonthReport(targetUpdatedReport);
    }
  };

  // Handler: delete log
  const handleDeleteLog = (id: string) => {
    setLogs((prev) => {
      const next = prev.filter((l) => l.id !== id);
      cacheService.set('karung_bocor_logs', next);
      return next;
    });
  };

  // Handler: clear single month entries (Targeted single month write)
  const handleClearMonthReport = (monthIndex: number) => {
    let targetUpdatedReport: MonthReport | null = null;

    setReports((prev) => {
      const next = prev.map((r) => {
        if (r.monthIndex === monthIndex) {
          const clearedDaily: Record<number, any> = {};
          Object.keys(r.dailyEntries).forEach((dayKey) => {
            const d = parseInt(dayKey, 10);
            clearedDaily[d] = {
              ...r.dailyEntries[d],
              forklift: 0,
              pallet: 0,
              bocorProduksi: 0,
            };
          });
          const updated = {
            ...r,
            dailyEntries: clearedDaily,
          };
          targetUpdatedReport = updated;
          return updated;
        }
        return r;
      });
      cacheService.set('karung_bocor_reports', next);
      return next;
    });

    if (targetUpdatedReport) {
      firestoreService.saveSingleMonthReport(targetUpdatedReport);
    }
  };

  // Handler: clear single day entries
  const handleClearDayReport = (monthIndex: number, day: number) => {
    let targetUpdatedReport: MonthReport | null = null;

    setReports((prev) => {
      const next = prev.map((r) => {
        if (r.monthIndex === monthIndex) {
          const currentEntry = r.dailyEntries[day] || {};
          const updated = {
            ...r,
            dailyEntries: {
              ...r.dailyEntries,
              [day]: {
                ...currentEntry,
                forklift: 0,
                pallet: 0,
                bocorProduksi: 0,
              },
            },
          };
          targetUpdatedReport = updated;
          return updated;
        }
        return r;
      });
      cacheService.set('karung_bocor_reports', next);
      return next;
    });

    if (targetUpdatedReport) {
      firestoreService.saveSingleMonthReport(targetUpdatedReport);
    }
  };

  // Handler: batch update day entries
  const handleBatchUpdateDay = (
    monthIndex: number,
    day: number,
    forklift: number,
    pallet: number,
    bocorProduksi: number,
    isRedDay?: boolean
  ) => {
    let targetUpdatedReport: MonthReport | null = null;

    setReports((prev) => {
      const next = prev.map((r) => {
        if (r.monthIndex === monthIndex) {
          const currentEntry = r.dailyEntries[day] || {};
          const updated: MonthReport = {
            ...r,
            dailyEntries: {
              ...r.dailyEntries,
              [day]: {
                ...currentEntry,
                forklift,
                pallet,
                bocorProduksi,
                isRedDay: isRedDay !== undefined ? isRedDay : currentEntry.isRedDay,
              },
            },
          };
          targetUpdatedReport = updated;
          return updated;
        }
        return r;
      });
      cacheService.set('karung_bocor_reports', next);
      return next;
    });

    if (targetUpdatedReport) {
      firestoreService.saveSingleMonthReport(targetUpdatedReport);
    }
  };

  // Handler: reset data to initial photo sample (Atomic batch commit)
  const handleResetData = () => {
    setReports(initialMonthReports);
    setSettings(defaultSettings);
    firestoreService.batchSaveAllReports(initialMonthReports);
    firestoreService.saveSettings(defaultSettings);
  };

  const handleClearReports = () => {
    const empty = createEmptyMonthReports();
    setReports(empty);
    setLogs([]);
    firestoreService.batchSaveAllReports(empty);
    cacheService.set('karung_bocor_logs', []);
  };

  const handleLoadSampleReports = () => {
    setReports(initialMonthReports);
    firestoreService.batchSaveAllReports(initialMonthReports);
  };

  const handleSaveSettings = (newSettings: WarehouseSettings) => {
    setSettings(newSettings);
    firestoreService.saveSettings(newSettings);
  };

  // Handler: explicitly save single month report to Firestore and Cache
  const handleSaveMonthReport = async (monthIndex: number) => {
    const currentReports = reportsRef.current;
    const targetReport = currentReports.find((r) => r.monthIndex === monthIndex);
    if (targetReport) {
      await cacheService.set('karung_bocor_reports', currentReports);
      await firestoreService.saveSingleMonthReport(targetReport, 0);
    }
  };

  const handleExportExcel = () => {
    exportReportsToExcel(reports, settings);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reports={reports}
        settings={settings}
        onExportExcel={handleExportExcel}
        onPrint={handlePrint}
        onResetData={handleResetData}
        onOpenMonitor={() => setIsMonitorOpen(true)}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'petugas' && (
          <PetugasDashboardView
            settings={settings}
            onSaveToMainLog={handleAddLogEntry}
            onSyncToMainReport={handleSyncPetugasToMainReport}
            onNavigateToMainTable={() => setActiveTab('table')}
          />
        )}

        {activeTab === 'table' && (
          <MainTableView
            reports={reports}
            settings={settings}
            onUpdateEntry={handleUpdateEntry}
            onUpdatePenjualanKg={handleUpdatePenjualanKg}
            onToggleCellStatus={handleToggleCellStatus}
            onClearReports={handleClearReports}
            onLoadSampleReports={handleLoadSampleReports}
            onClearMonthReport={handleClearMonthReport}
            onClearDayReport={handleClearDayReport}
            onBatchUpdateDay={handleBatchUpdateDay}
            onSaveMonthReport={handleSaveMonthReport}
            onBatchUpdateAllReports={handleBatchUpdateAllReports}
          />
        )}

        {activeTab === 'input' && (
          <InputDataForm
            reports={reports}
            settings={settings}
            onAddLogEntry={handleAddLogEntry}
            onUpdateCellStatus={handleUpdateCellStatusExplicit}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView reports={reports} settings={settings} />
        )}

        {activeTab === 'log' && (
          <DataLogView logs={logs} onDeleteLog={handleDeleteLog} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Development Firebase Monitor Widget */}
      <FirebaseMonitor
        isOpen={isMonitorOpen}
        onClose={() => setIsMonitorOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-12 print:hidden text-center text-xs text-slate-500">
        <p>
          Sistem Laporan Data Karung Bocor &bull; Gudang Jadi Utamain &bull; Firebase Multi-Device Synchronized
        </p>
      </footer>
    </div>
  );
}
