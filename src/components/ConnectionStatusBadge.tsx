import React, { useEffect, useState } from 'react';
import { connectionManager, TelemetryState } from '../firebase/connectionManager';
import { getDeviceTypeLabel } from '../firebase/firestoreService';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Database } from 'lucide-react';

interface ConnectionStatusBadgeProps {
  onOpenMonitor?: () => void;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({ onOpenMonitor }) => {
  const [telemetry, setTelemetry] = useState<TelemetryState>(connectionManager.getState());
  const deviceLabel = getDeviceTypeLabel();

  useEffect(() => {
    const unsub = connectionManager.subscribe((state) => {
      setTelemetry(state);
    });
    return () => unsub();
  }, []);

  const getStatusBadge = () => {
    if (telemetry.quotaStatus === 'limited') {
      return {
        bg: 'bg-amber-100 text-amber-900 border-amber-300',
        dot: 'bg-amber-500 animate-pulse',
        icon: AlertTriangle,
        text: 'Kuota Terbatas (Mode Cache)',
        subtext: 'Data aman di IndexedDB. Cloud sync dijadwalkan ulang.',
      };
    }

    if (telemetry.connectionStatus === 'offline') {
      return {
        bg: 'bg-red-100 text-red-900 border-red-300',
        dot: 'bg-red-500',
        icon: WifiOff,
        text: 'Offline (Cache Aktif)',
        subtext: 'Bekerja secara offline. Data tersimpan di perangkat.',
      };
    }

    if (telemetry.connectionStatus === 'syncing') {
      return {
        bg: 'bg-blue-100 text-blue-900 border-blue-300',
        dot: 'bg-blue-500 animate-ping',
        icon: RefreshCw,
        text: 'Menyinkronkan...',
        subtext: 'Mengirimkan pembaruan ke Cloud Firestore...',
      };
    }

    return {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-500',
      icon: Wifi,
      text: 'Real-Time Sync (Live)',
      subtext: `Sinkron ke HP, Komputer & Laptop. Perangkat Anda: ${deviceLabel} | R:${telemetry.readsCount} W:${telemetry.writesCount}`,
    };
  };

  const badge = getStatusBadge();
  const Icon = badge.icon;

  return (
    <div
      onClick={onOpenMonitor}
      className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} cursor-pointer transition-all shadow-2xs hover:brightness-95`}
      title={`${badge.text} - ${badge.subtext}. Klik untuk buka Firebase Monitor.`}
    >
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${badge.dot}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${badge.dot}`}></span>
      </span>
      <Icon className={`w-3 h-3 ${telemetry.connectionStatus === 'syncing' ? 'animate-spin' : ''}`} />
      <span className="whitespace-nowrap">{badge.text}</span>
      <span className="text-[9px] opacity-75 font-normal hidden sm:inline border-l border-current pl-1.5 ml-0.5">
        HP &bull; PC &bull; Laptop
      </span>
    </div>
  );
};
