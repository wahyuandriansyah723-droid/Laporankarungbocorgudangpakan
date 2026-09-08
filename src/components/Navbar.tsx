import React from 'react';
import { LayoutDashboard, PlusCircle, BarChart3, ListFilter, Settings, FileSpreadsheet, Printer, RotateCcw, PackageCheck, AlertCircle, ClipboardList, Activity, Edit3 } from 'lucide-react';
import { MonthReport, WarehouseSettings } from '../types';
import { calculateMonthTotals, formatNumberIndonesian } from '../utils/calculations';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';

interface NavbarProps {
  activeTab: 'table' | 'petugas' | 'input' | 'analytics' | 'log' | 'settings';
  setActiveTab: (tab: 'table' | 'petugas' | 'input' | 'analytics' | 'log' | 'settings') => void;
  reports: MonthReport[];
  settings: WarehouseSettings;
  onExportExcel: () => void;
  onPrint: () => void;
  onResetData: () => void;
  onOpenMonitor?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  reports,
  settings,
  onExportExcel,
  onPrint,
  onResetData,
  onOpenMonitor,
}) => {
  // Compute annual summary
  let grandTotalBocor = 0;
  let grandTotalForklift = 0;
  let grandTotalPallet = 0;
  let grandTotalProduksi = 0;
  let grandTotalKarung = 0;

  reports.forEach((report) => {
    const t = calculateMonthTotals(report, settings);
    grandTotalBocor += t.totalBocor;
    grandTotalForklift += t.totalForklift;
    grandTotalPallet += t.totalPallet;
    grandTotalProduksi += t.totalBocorProduksi;
    grandTotalKarung += t.totalPenjualanKarung;
  });

  const avgRasio = grandTotalKarung > 0 ? (grandTotalBocor / grandTotalKarung) * 100 : 0;
  const isOverTarget = avgRasio > settings.targetToleransiPersen;

  return (
    <header className="bg-white text-slate-800 shadow-xs sticky top-0 z-30 print:hidden border-b border-slate-200">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-xs font-extrabold flex items-center justify-center">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 group">
                <h1
                  onClick={() => setActiveTab('settings')}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase cursor-pointer hover:text-blue-700 transition-colors"
                  title="Klik untuk ubah nama sistem di Pengaturan"
                >
                  {settings.namaSistem !== undefined ? (settings.namaSistem || '(Tanpa Nama Sistem)') : 'LAPORAN KARUNG BOCOR'}
                </h1>
                {settings.subNamaSistem ? (
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                    {settings.subNamaSistem}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-800 transition-opacity p-1 rounded hover:bg-slate-100 cursor-pointer"
                  title="Edit Nama Sistem di Pengaturan"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {settings.namaGudang} &bull; Standar: <span className="text-slate-800 font-semibold">{settings.beratPerKarungKg} Kg/Karung</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">TOTAL BOCOR</span>
              <span className="font-extrabold text-slate-900 text-sm">{formatNumberIndonesian(grandTotalBocor)} <span className="text-[10px] font-normal text-slate-500">karung</span></span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">TOTAL PENJUALAN</span>
              <span className="font-bold text-slate-900 text-sm">{formatNumberIndonesian(grandTotalKarung)} <span className="text-[10px] font-normal text-slate-500">karung</span></span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">RATA-RATA RASIO</span>
              <span className={`font-bold text-sm flex items-center gap-1 ${isOverTarget ? 'text-red-600' : 'text-emerald-600'}`}>
                {avgRasio.toFixed(2)}%
                {isOverTarget && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">PENYEBAB UTAMA</span>
              <span className="font-semibold text-slate-800 text-xs truncate">
                {grandTotalPallet >= grandTotalForklift && grandTotalPallet >= grandTotalProduksi
                  ? `Pallet (${Math.round((grandTotalPallet/grandTotalBocor)*100 || 0)}%)`
                  : grandTotalForklift >= grandTotalProduksi
                  ? `Forklift (${Math.round((grandTotalForklift/grandTotalBocor)*100 || 0)}%)`
                  : `Produksi (${Math.round((grandTotalProduksi/grandTotalBocor)*100 || 0)}%)`}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Actions */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'table'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Tampilan Laporan (Excel)
            </button>

            <button
              onClick={() => setActiveTab('petugas')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'petugas'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-700 hover:bg-amber-100 hover:text-amber-900 bg-amber-50 border border-amber-200/80'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Laporan Petugas (JAPFA)
            </button>

            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'input'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Input Harian
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Grafik & Analisis
            </button>

            <button
              onClick={() => setActiveTab('log')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'log'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              Log Detail
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Pengaturan
            </button>
          </nav>

          {/* Quick Action Buttons & Status */}
          <div className="flex items-center flex-wrap gap-2 ml-auto">
            {/* Connection Status Badge */}
            <ConnectionStatusBadge onOpenMonitor={onOpenMonitor} />

            {/* Dev Firebase Monitor Trigger Button */}
            <button
              onClick={onOpenMonitor}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg text-xs font-mono transition-colors shadow-2xs border border-slate-700"
              title="Buka Firebase Dev Monitor (Telemetry, Circuit Breaker & Testing)"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Firebase Monitor</span>
            </button>

            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              title="Download File Excel Tahun 2026 Lengkap dengan Rekapitulasi Tahunan (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel 2026</span>
            </button>

            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-xs"
              title="Cetak Laporan / PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              onClick={onResetData}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg text-xs transition-colors border border-slate-200 font-medium"
              title="Reset Data ke Sampel Foto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Reset Sample</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
