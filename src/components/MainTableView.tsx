import React, { useState } from 'react';
import { MonthReport, WarehouseSettings, HolidayItem } from '../types';
import { MonthTable } from './MonthTable';
import { HolidayManagerDashboard } from './HolidayManagerDashboard';
import {
  loadStoredHolidays,
  saveStoredHolidays,
  loadSundaysOffSetting,
  saveSundaysOffSetting,
} from '../data/holidayData';
import {
  Filter,
  Calendar,
  Info,
  Layers,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Sparkles,
  FileSpreadsheet,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import {
  calculateMonthTotals,
  calculateAnnualTotals,
  formatNumberIndonesian,
} from '../utils/calculations';
import { exportReportsToExcel } from '../utils/excelExport';

interface MainTableViewProps {
  reports: MonthReport[];
  settings: WarehouseSettings;
  onUpdateEntry: (monthIndex: number, day: number, field: 'forklift' | 'pallet' | 'bocorProduksi', value: number) => void;
  onUpdatePenjualanKg: (monthIndex: number, newPenjualanKg: number) => void;
  onToggleCellStatus: (monthIndex: number, day: number, statusType: 'red' | 'yellow' | 'normal') => void;
  onClearReports?: () => void;
  onLoadSampleReports?: () => void;
  onClearMonthReport?: (monthIndex: number) => void;
  onClearDayReport?: (monthIndex: number, day: number) => void;
  onBatchUpdateDay?: (monthIndex: number, day: number, forklift: number, pallet: number, bocorProduksi: number, isRedDay?: boolean) => void;
  onSaveMonthReport?: (monthIndex: number) => Promise<void> | void;
  onBatchUpdateAllReports?: (updatedReports: MonthReport[]) => void;
}

export const MainTableView: React.FC<MainTableViewProps> = ({
  reports,
  settings,
  onUpdateEntry,
  onUpdatePenjualanKg,
  onToggleCellStatus,
  onClearReports,
  onLoadSampleReports,
  onClearMonthReport,
  onClearDayReport,
  onBatchUpdateDay,
  onSaveMonthReport,
  onBatchUpdateAllReports,
}) => {
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<number | 'all'>('all');
  const [showAnnualTable, setShowAnnualTable] = useState(true);
  const [isHolidayDashboardOpen, setIsHolidayDashboardOpen] = useState(false);
  const [holidays, setHolidays] = useState<HolidayItem[]>(() => loadStoredHolidays());
  const [sundaysOff, setSundaysOff] = useState<boolean>(() => loadSundaysOffSetting());
  const [holidayFocusMonth, setHolidayFocusMonth] = useState<number>(1);

  const filteredReports = selectedMonthFilter === 'all'
    ? reports
    : reports.filter((r) => r.monthIndex === selectedMonthFilter);

  // Compute Grand Totals and Annual Breakdown for 2026
  const annual = calculateAnnualTotals(reports, settings);
  const grandTotalBocor = annual.grandTotalBocor;
  const grandTotalForklift = annual.grandTotalForklift;
  const grandTotalPallet = annual.grandTotalPallet;
  const grandTotalProduksi = annual.grandTotalProduksi;
  const grandTotalKarung = annual.grandTotalPenjualanKarung;
  const grandRasio = annual.grandRasioBocorPersen;

  const handleExportExcel = () => {
    exportReportsToExcel(reports, settings, holidays);
  };

  return (
    <div className="space-y-6">
      {/* Realtime Integration & Controls Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              Buku Laporan Excel Realtime Gudang
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Otomatis Terisi dari Petugas
              </span>
            </h2>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Setiap kali petugas membuat laporan atau upload Excel, data kebocoran harian langsung masuk ke tabel spreadsheet ini.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHolidayDashboardOpen(!isHolidayDashboardOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs border ${
              isHolidayDashboardOpen
                ? 'bg-red-600 text-white border-red-400 ring-2 ring-red-400'
                : 'bg-red-700 hover:bg-red-600 text-white border-red-600'
            }`}
            title="Kelola Tanggal Merah, Cuti Bersama, dan Hari Libur Kalender 2026"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Dasbor Tanggal Merah & Libur</span>
            <span className="bg-white text-red-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {holidays.filter((h) => h.isRedDay).length} Libur
            </span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
            title="Download File Excel Tahun 2026 Lengkap dengan Rekap Tahunan"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel 2026</span>
          </button>

          {onClearReports && (
            <button
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin mengosongkan seluruh isi laporan Excel? Semua angka harian akan direset ke 0.')) {
                  onClearReports();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              title="Kosongkan tampilan laporan Excel agar bersih untuk entri baru"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Tabel Excel</span>
            </button>
          )}

          {onLoadSampleReports && (
            <button
              onClick={() => {
                if (confirm('Muat ulang data contoh demo tahunan?')) {
                  onLoadSampleReports();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Isi kembali dengan data contoh demo"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Isi Data Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* Dasbor Edit Tanggal Merah & Hari Libur 2026 */}
      {isHolidayDashboardOpen && (
        <HolidayManagerDashboard
          holidays={holidays}
          sundaysOff={sundaysOff}
          reports={reports}
          onSaveHolidays={(updated) => {
            setHolidays(updated);
            saveStoredHolidays(updated);
          }}
          onToggleSundaysOff={(enabled) => {
            setSundaysOff(enabled);
            saveSundaysOffSetting(enabled);
          }}
          onApplyToReports={(updatedReports, newHolidays, newSundaysOff) => {
            setHolidays(newHolidays);
            saveStoredHolidays(newHolidays);
            setSundaysOff(newSundaysOff);
            saveSundaysOffSetting(newSundaysOff);
            if (onBatchUpdateAllReports) {
              onBatchUpdateAllReports(updatedReports);
            }
          }}
          onClose={() => setIsHolidayDashboardOpen(false)}
          initialMonthIndex={holidayFocusMonth}
        />
      )}

      {/* Top Filter & Legend Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month Filter Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pilih Bulan:</span>
          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">Semua Bulan (12 Bulan)</option>
            {reports.map((r) => (
              <option key={r.monthIndex} value={r.monthIndex}>
                {r.monthName}
              </option>
            ))}
          </select>
        </div>

        {/* Legend Indicators - Exactly matching the spreadsheet colors */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-red-500 border border-red-600 rounded-sm inline-block"></span>
            <span className="text-slate-600 font-medium">Hari Libur / Off (Sel Merah)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-amber-300 border border-amber-400 rounded-sm inline-block"></span>
            <span className="text-slate-600 font-medium">Sorot Khusus / Audit (Sel Kuning)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md font-medium">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Klik kanan sel untuk ubah warna</span>
          </div>
        </div>
      </div>

      {/* Empty Report Banner Notice */}
      {grandTotalBocor === 0 && (
        <div className="bg-amber-50 border border-amber-200/90 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 font-medium">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-950">Tampilan Laporan Excel Saat Ini Kosong (Belum Ada Data Kebocoran)</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Buku laporan ini disiapkan bersih untuk entri petugas. Ketika Petugas Gudang membuat laporan atau upload file Excel di menu <strong>"Form Laporan Petugas"</strong>, angka harian akan otomatis terisi di tabel ini secara real-time.
              </p>
            </div>
          </div>
          {onLoadSampleReports && (
            <button
              onClick={onLoadSampleReports}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-400 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Muat Data Contoh Demo</span>
            </button>
          )}
        </div>
      )}

      {/* Annual Summary Card & Rekapan Per Tahun 2026 */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between mb-4 border-b border-slate-100 pb-3 gap-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4 text-slate-700" />
            <span>REKAPITULASI TOTAL TAHUNAN 2026</span>
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
              12 Bulan Kalender
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnnualTable(!showAnnualTable)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-300"
            >
              {showAnnualTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showAnnualTable ? 'Sembunyikan Tabel Rekap' : 'Tampilkan Tabel Rekap Tahunan'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              title="Download File Excel Tahun 2026 Lengkap dengan Rekap Tahunan"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel 2026</span>
            </button>
          </div>
        </div>

        {/* 6 Quick Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs mb-5">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Forklift</span>
            <span className="font-extrabold text-slate-900 text-base mt-0.5 block">{formatNumberIndonesian(grandTotalForklift)}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Pallet</span>
            <span className="font-extrabold text-slate-900 text-base mt-0.5 block">{formatNumberIndonesian(grandTotalPallet)}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Produksi</span>
            <span className="font-extrabold text-slate-900 text-base mt-0.5 block">{formatNumberIndonesian(grandTotalProduksi)}</span>
          </div>
          <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-900 text-center shadow-xs">
            <span className="text-slate-300 text-[10px] font-bold uppercase tracking-wider block">Grand Total Bocor</span>
            <span className="font-black text-amber-400 text-lg mt-0.5 block">{formatNumberIndonesian(grandTotalBocor)}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Penjualan</span>
            <span className="font-extrabold text-slate-900 text-base mt-0.5 block">{formatNumberIndonesian(grandTotalKarung)}</span>
          </div>
          <div className={`p-3 rounded-lg border text-center ${
            grandRasio > settings.targetToleransiPersen
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block">Rasio Bocor</span>
            <span className="font-black text-base flex items-center justify-center gap-1 mt-0.5">
              {grandRasio.toFixed(2)}%
              {grandRasio > settings.targetToleransiPersen && (
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              )}
            </span>
          </div>
        </div>

        {/* Detailed Annual Recap Table (12 Bulan Tahun 2026) */}
        {showAnnualTable && (
          <div className="border border-slate-200 rounded-lg overflow-hidden mt-4">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Tabel Rekapitulasi Bulanan Tahun 2026 (Sesuai Format Excel)
              </span>
              <span className="text-[11px] text-slate-500">
                Target Toleransi: &le; {settings.targetToleransiPersen}% | Standar: {settings.beratPerKarungKg} Kg/Karung
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200/80 text-slate-700 font-bold border-b border-slate-300">
                    <th className="p-2 text-center w-10">NO</th>
                    <th className="p-2">BULAN (2026)</th>
                    <th className="p-2 text-right">FORKLIFT</th>
                    <th className="p-2 text-right">PALLET</th>
                    <th className="p-2 text-right">PRODUKSI</th>
                    <th className="p-2 text-right bg-amber-100 text-amber-950 font-black">TOTAL BOCOR</th>
                    <th className="p-2 text-right">KONTRIBUSI</th>
                    <th className="p-2 text-right">PENJUALAN (KG)</th>
                    <th className="p-2 text-right">PENJUALAN (KR)</th>
                    <th className="p-2 text-right">RASIO (%)</th>
                    <th className="p-2 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {annual.monthlyBreakdown.map((m, idx) => (
                    <tr key={m.monthIndex} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2 text-center font-semibold text-slate-400">{idx + 1}</td>
                      <td className="p-2 font-bold text-slate-800">{m.monthName} 2026</td>
                      <td className="p-2 text-right font-medium text-slate-700">{formatNumberIndonesian(m.totalForklift)}</td>
                      <td className="p-2 text-right font-medium text-slate-700">{formatNumberIndonesian(m.totalPallet)}</td>
                      <td className="p-2 text-right font-medium text-slate-700">{formatNumberIndonesian(m.totalBocorProduksi)}</td>
                      <td className="p-2 text-right font-black text-slate-900 bg-amber-50/50">
                        {formatNumberIndonesian(m.totalBocor)}
                      </td>
                      <td className="p-2 text-right text-slate-500 font-medium">
                        {m.kontribusiPersen.toFixed(1)}%
                      </td>
                      <td className="p-2 text-right font-medium text-slate-700">{formatNumberIndonesian(m.totalPenjualanKg)}</td>
                      <td className="p-2 text-right font-medium text-slate-700">{formatNumberIndonesian(m.totalPenjualanKarung)}</td>
                      <td className="p-2 text-right">
                        <span className={`font-bold ${m.isOverTarget ? 'text-red-600' : 'text-emerald-700'}`}>
                          {m.rasioBocorPersen.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.isOverTarget
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {m.isOverTarget ? 'Melebihi Target' : 'Memenuhi Target'}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Grand Total Row */}
                  <tr className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-950">
                    <td className="p-2 text-center text-amber-400">TOTAL</td>
                    <td className="p-2 text-amber-400 uppercase tracking-wider">TOTAL KESELURUHAN 2026</td>
                    <td className="p-2 text-right text-slate-200">{formatNumberIndonesian(grandTotalForklift)}</td>
                    <td className="p-2 text-right text-slate-200">{formatNumberIndonesian(grandTotalPallet)}</td>
                    <td className="p-2 text-right text-slate-200">{formatNumberIndonesian(grandTotalProduksi)}</td>
                    <td className="p-2 text-right text-amber-400 font-black text-sm">{formatNumberIndonesian(grandTotalBocor)}</td>
                    <td className="p-2 text-right text-slate-300">100.0%</td>
                    <td className="p-2 text-right text-slate-200">{formatNumberIndonesian(annual.grandTotalPenjualanKg)}</td>
                    <td className="p-2 text-right text-slate-200">{formatNumberIndonesian(grandTotalKarung)}</td>
                    <td className="p-2 text-right text-amber-400 font-black">{grandRasio.toFixed(2)}%</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                        grandRasio <= settings.targetToleransiPersen ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {grandRasio <= settings.targetToleransiPersen ? 'AMAN' : 'EVALUASI'}
                      </span>
                    </td>
                  </tr>

                  {/* Average Row */}
                  <tr className="bg-slate-100 text-slate-700 font-bold">
                    <td className="p-2 text-center text-slate-400">RATA2</td>
                    <td className="p-2 text-slate-700">RATA-RATA PER BULAN</td>
                    <td className="p-2 text-right">{formatNumberIndonesian(Math.round(grandTotalForklift / 12))}</td>
                    <td className="p-2 text-right">{formatNumberIndonesian(Math.round(grandTotalPallet / 12))}</td>
                    <td className="p-2 text-right">{formatNumberIndonesian(Math.round(grandTotalProduksi / 12))}</td>
                    <td className="p-2 text-right font-extrabold text-slate-900">{formatNumberIndonesian(Math.round(grandTotalBocor / 12))}</td>
                    <td className="p-2 text-right text-slate-400">—</td>
                    <td className="p-2 text-right">{formatNumberIndonesian(Math.round(annual.grandTotalPenjualanKg / 12))}</td>
                    <td className="p-2 text-right">{formatNumberIndonesian(Math.round(grandTotalKarung / 12))}</td>
                    <td className="p-2 text-right text-slate-900">{grandRasio.toFixed(2)}%</td>
                    <td className="p-2 text-center text-slate-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Month Tables List */}
      <div className="space-y-6">
        {filteredReports.map((report) => (
          <MonthTable
            key={report.monthIndex}
            report={report}
            settings={settings}
            onUpdateEntry={onUpdateEntry}
            onUpdatePenjualanKg={onUpdatePenjualanKg}
            onToggleCellStatus={onToggleCellStatus}
            onClearMonthReport={onClearMonthReport}
            onClearDayReport={onClearDayReport}
            onBatchUpdateDay={onBatchUpdateDay}
            onSaveMonthReport={onSaveMonthReport}
            onOpenHolidayDashboard={(mIdx) => {
              setHolidayFocusMonth(mIdx);
              setIsHolidayDashboardOpen(true);
            }}
          />
        ))}
      </div>
    </div>
  );
};
