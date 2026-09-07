import React, { useState, useEffect } from 'react';
import { connectionManager, TelemetryState } from '../firebase/connectionManager';
import { isFirebaseConfigured, firebaseConfig } from '../firebase/config';
import {
  Activity,
  Database,
  Wifi,
  WifiOff,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  Server,
  Zap,
} from 'lucide-react';

interface FirebaseMonitorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseMonitor: React.FC<FirebaseMonitorProps> = ({ isOpen, onClose }) => {
  const [telemetry, setTelemetry] = useState<TelemetryState>(connectionManager.getState());
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const unsub = connectionManager.subscribe((state) => {
      setTelemetry(state);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 overflow-hidden font-mono text-xs animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Firebase Monitor (Dev)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            title={isMinimized ? 'Perluas' : 'Minimalkan'}
          >
            {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            title="Tutup Monitor"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-3.5 text-[11px]">
          {/* Status Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] uppercase">Reads</span>
              <span className="text-emerald-400 font-extrabold text-sm">{telemetry.readsCount}</span>
              <span className="text-slate-500 text-[9px] block">dokumen</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] uppercase">Writes</span>
              <span className="text-blue-400 font-extrabold text-sm">{telemetry.writesCount}</span>
              <span className="text-slate-500 text-[9px] block">dokumen</span>
            </div>
          </div>

          {/* Details list */}
          <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Active Firestore Listeners:</span>
              <span className="font-bold text-amber-400">{telemetry.activeFirestoreListeners}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">RTDB Listeners:</span>
              <span className="text-slate-500">{telemetry.rtdbListeners}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Last Sync:</span>
              <span className="text-slate-200">{telemetry.lastSyncTime || 'Belum ada sync'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Connection:</span>
              <span
                className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                  telemetry.connectionStatus === 'online'
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                    : telemetry.connectionStatus === 'syncing'
                    ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                    : 'bg-red-900/60 text-red-300 border border-red-700'
                }`}
              >
                {telemetry.connectionStatus}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Cache:</span>
              <span className="text-purple-300 font-semibold">{telemetry.cacheStatus}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Quota Status:</span>
              <span
                className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                  telemetry.quotaStatus === 'normal'
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-amber-900/80 text-amber-300 border border-amber-600 animate-pulse'
                }`}
              >
                {telemetry.quotaStatus}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-700/50">
              <span className="text-slate-400">Firebase Configured:</span>
              <span className={`font-semibold ${isFirebaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isFirebaseConfigured ? 'Ya (Cloud Sync)' : 'Offline / Local Cache'}
              </span>
            </div>
          </div>

          {/* Circuit Breaker & Offline Simulation Controls */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Simulasi Uji Quota & Offline (Tahap 3):
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => connectionManager.toggleSimulateQuota()}
                className="flex items-center justify-center gap-1 py-1.5 px-2 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-200 rounded text-[10px] font-semibold transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Simulasi Quota</span>
              </button>
              <button
                type="button"
                onClick={() => connectionManager.toggleSimulateOffline()}
                className="flex items-center justify-center gap-1 py-1.5 px-2 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-red-200 rounded text-[10px] font-semibold transition-colors cursor-pointer"
              >
                <WifiOff className="w-3 h-3" />
                <span>Simulasi Offline</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => connectionManager.resetTelemetry()}
              className="w-full flex items-center justify-center gap-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded text-[10px] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Counter (0 R / 0 W)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
