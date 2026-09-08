import React, { useState, useMemo } from 'react';
import { MonthReport, LeakageRecord, WarehouseSettings } from '../types';
import {
  formatNumberIndonesian,
  getIndonesianDayName,
  getIndonesianFullDayName,
} from '../utils/calculations';
import { isIndonesianRedDay } from '../data/initialData';
import {
  ClipboardList,
  Eye,
  Edit3,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface InputtedEntryItem {
  id: string;
  source: 'log' | 'report' | 'petugas';
  dateStr: string; // "YYYY-MM-DD"
  dayName: string; // "Sabtu"
  monthIndex: number; // 1..12
  monthName: string; // "07 Juli"
  day: number; // 1..31
  forklift: number;
  pallet: number;
  bocorProduksi: number;
  totalBocor: number;
  shift?: string;
  operator?: string;
  catatan?: string;
  isRedDay?: boolean;
}

interface InputtedDataRecordsTableProps {
  reports: MonthReport[];
  logs?: LeakageRecord[];
  settings: WarehouseSettings;
  onViewInTable: (monthIndex: number, day: number) => void;
  onEditDay: (monthIndex: number, day: number) => void;
  onDeleteEntry: (monthIndex: number, day: number, logId?: string) => void;
  onNavigateToInput?: () => void;
  onNavigateToPetugas?: () => void;
  onLoadSampleReports?: () => void;
}

export const InputtedDataRecordsTable: React.FC<InputtedDataRecordsTableProps> = ({
  reports,
  logs = [],
  settings,
  onViewInTable,
  onEditDay,
  onDeleteEntry,
  onNavigateToInput,
  onNavigateToPetugas,
  onLoadSampleReports,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'bocor_desc' | 'bocor_asc'>('date_desc');

  const year = 2026;

  // Compile all inputted entries from both `reports` and `logs`
  const allInputtedEntries = useMemo<InputtedEntryItem[]>(() => {
    const map = new Map<string, InputtedEntryItem>();

    // 1. First add from `reports` (all non-zero days in spreadsheet)
    reports.forEach((r) => {
      for (let d = 1; d <= 31; d++) {
        const entry = r.dailyEntries[d];
        if (!entry) continue;

        const fk = entry.forklift || 0;
        const pl = entry.pallet || 0;
        const pr = entry.bocorProduksi || 0;
        const total = fk + pl + pr;

        if (total > 0) {
          const dateStr = `${year}-${String(r.monthIndex).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dayName = getIndonesianFullDayName(year, r.monthIndex, d);
          const isSunday = new Date(year, r.monthIndex - 1, d).getDay() === 0;
          const isHoliday = isIndonesianRedDay(year, r.monthIndex, d);
          const isRed = entry.isRedDay !== undefined ? entry.isRedDay : (isSunday || isHoliday);

          map.set(`${r.monthIndex}-${d}`, {
            id: `rep-${r.monthIndex}-${d}`,
            source: 'report',
            dateStr,
            dayName,
            monthIndex: r.monthIndex,
            monthName: r.monthName,
            day: d,
            forklift: fk,
            pallet: pl,
            bocorProduksi: pr,
            totalBocor: total,
            shift: 'Reguler',
            operator: 'Petugas Gudang',
            catatan: entry.note || 'Tersinkron di Tabel Excel',
            isRedDay: isRed,
          });
        }
      }
    });

    // 2. Enrich/merge with `logs` if available (adds shift, operator, custom notes)
    logs.forEach((log) => {
      const key = `${log.monthIndex}-${log.day}`;
      const existing = map.get(key);
      const dayName = getIndonesianFullDayName(year, log.monthIndex, log.day);
      const isSunday = new Date(year, log.monthIndex - 1, log.day).getDay() === 0;
      const isHoliday = isIndonesianRedDay(year, log.monthIndex, log.day);
      const isRed = isSunday || isHoliday;

      const r = reports.find((rep) => rep.monthIndex === log.monthIndex);
      const monthName = r ? r.monthName : `Bulan ${log.monthIndex}`;

      if (existing) {
        // Merge log details into existing entry
        map.set(key, {
          ...existing,
          source: 'log',
          shift: log.shift || existing.shift,
          operator: log.operator || existing.operator,
          catatan: log.catatan || existing.catatan,
        });
      } else {
        // If not found in spreadsheet yet, add it
        map.set(key, {
          id: log.id || `log-${log.monthIndex}-${log.day}`,
          source: 'log',
          dateStr: log.date || `${year}-${String(log.monthIndex).padStart(2, '0')}-${String(log.day).padStart(2, '0')}`,
          dayName,
          monthIndex: log.monthIndex,
          monthName,
          day: log.day,
          forklift: log.forklift || 0,
          pallet: log.pallet || 0,
          bocorProduksi: log.bocorProduksi || 0,
          totalBocor: log.totalBocor || ((log.forklift || 0) + (log.pallet || 0) + (log.bocorProduksi || 0)),
          shift: log.shift || 'Shift 1',
          operator: log.operator || 'Petugas',
          catatan: log.catatan || 'Input Log Harian',
          isRedDay: isRed,
        });
      }
    });

    const list = Array.from(map.values());

    // Sort entries
    list.sort((a, b) => {
      if (sortBy === 'date_desc') {
        if (b.monthIndex !== a.monthIndex) return b.monthIndex - a.monthIndex;
        return b.day - a.day;
      }
      if (sortBy === 'date_asc') {
        if (a.monthIndex !== b.monthIndex) return a.monthIndex - b.monthIndex;
        return a.day - b.day;
      }
      if (sortBy === 'bocor_desc') {
        return b.totalBocor - a.totalBocor;
      }
      if (sortBy === 'bocor_asc') {
        return a.totalBocor - b.totalBocor;
      }
      return 0;
    });

    return list;
  }, [reports, logs, sortBy]);

  // Filtered by Search & Month Filter
  const filteredEntries = useMemo(() => {
    return allInputtedEntries.filter((item) => {
      const matchesMonth = selectedMonthFilter === 'all' || item.monthIndex === selectedMonthFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        item.dateStr.toLowerCase().includes(term) ||
        item.dayName.toLowerCase().includes(term) ||
        item.monthName.toLowerCase().includes(term) ||
        (item.operator && item.operator.toLowerCase().includes(term)) ||
        (item.shift && item.shift.toLowerCase().includes(term)) ||
        (item.catatan && item.catatan.toLowerCase().includes(term));

      return matchesMonth && matchesSearch;
    });
  }, [allInputtedEntries, selectedMonthFilter, searchTerm]);

  // Aggregate totals of inputted entries
  const stats = useMemo(() => {
    const totalEntries = allInputtedEntries.length;
    const sumForklift = allInputtedEntries.reduce((s, i) => s + i.forklift, 0);
    const sumPallet = allInputtedEntries.reduce((s, i) => s + i.pallet, 0);
    const sumProduksi = allInputtedEntries.reduce((s, i) => s + i.bocorProduksi, 0);
    const sumTotalBocor = allInputtedEntries.reduce((s, i) => s + i.totalBocor, 0);
    const avgPerEntry = totalEntries > 0 ? Math.round(sumTotalBocor / totalEntries) : 0;

    return {
      totalEntries,
      sumForklift,
      sumPallet,
      sumProduksi,
      sumTotalBocor,
      avgPerEntry,
    };
  }, [allInputtedEntries]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shadow-2xs">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-white flex items-center gap-2">
                Daftar Data Yang Sudah Diinput
              </h3>
              <span className="bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow-2xs">
                {stats.totalEntries} Tanggal Terinput
              </span>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Terhubung ke Tabel Excel
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Rincian seluruh data karung bocor yang telah masuk ke lembar kerja Excel 2026
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {onNavigateToInput && (
            <button
              type="button"
              onClick={onNavigateToInput}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Buka form untuk input data baru"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Input Data Baru</span>
            </button>
          )}

          {onNavigateToPetugas && (
            <button
              type="button"
              onClick={onNavigateToPetugas}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              title="Buka Form Berita Acara Petugas Gudang"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>Form Petugas</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-700"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{isExpanded ? 'Tutup Ringkasan' : 'Buka Ringkasan'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="bg-slate-50 p-3 sm:p-4 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 text-xs">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Tanggal Terisi</span>
          <span className="text-base font-black text-slate-900 mt-0.5 block">{stats.totalEntries} Hari</span>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Forklift</span>
          <span className="text-base font-extrabold text-slate-800 mt-0.5 block">{formatNumberIndonesian(stats.sumForklift)} Krg</span>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Pallet</span>
          <span className="text-base font-extrabold text-slate-800 mt-0.5 block">{formatNumberIndonesian(stats.sumPallet)} Krg</span>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Produksi</span>
          <span className="text-base font-extrabold text-slate-800 mt-0.5 block">{formatNumberIndonesian(stats.sumProduksi)} Krg</span>
        </div>
        <div className="bg-amber-500 text-slate-950 p-2.5 rounded-lg border border-amber-600 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-black uppercase tracking-wider block text-slate-900">Total Karung Bocor</span>
          <span className="text-base font-black mt-0.5 block">{formatNumberIndonesian(stats.sumTotalBocor)} Karung</span>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Toolbar: Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari tanggal, bulan, operator, catatan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Bulan */}
              <div className="flex items-center gap-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedMonthFilter}
                  onChange={(e) =>
                    setSelectedMonthFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
                  }
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="all">Semua Bulan ({allInputtedEntries.length})</option>
                  {reports.map((r) => {
                    const countInMonth = allInputtedEntries.filter((i) => i.monthIndex === r.monthIndex).length;
                    return (
                      <option key={r.monthIndex} value={r.monthIndex}>
                        {r.monthName} ({countInMonth})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Urutan Sort */}
              <div className="flex items-center gap-1 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="date_desc">Tanggal (Terbaru &rarr; Terlama)</option>
                  <option value="date_asc">Tanggal (Terlama &rarr; Terbaru)</option>
                  <option value="bocor_desc">Total Bocor (Terbesar &rarr; Terkecil)</option>
                  <option value="bocor_asc">Total Bocor (Terkecil &rarr; Terbesar)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table of Inputted Data */}
          {filteredEntries.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {allInputtedEntries.length === 0
                  ? 'Belum Ada Data Kebocoran yang Diinput'
                  : 'Tidak Ada Data yang Sesuai Pencarian'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {allInputtedEntries.length === 0
                  ? 'Data yang Anda masukkan lewat menu "Input Karung Bocor", form petugas, atau sel spreadsheet akan otomatis terdaftar dan terpampang di sini.'
                  : `Tidak ditemukan entri untuk kata kunci "${searchTerm}". Silakan ubah filter atau kata kunci.`}
              </p>
              {allInputtedEntries.length === 0 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  {onNavigateToInput && (
                    <button
                      type="button"
                      onClick={onNavigateToInput}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                    >
                      Input Data Pertama
                    </button>
                  )}
                  {onLoadSampleReports && (
                    <button
                      type="button"
                      onClick={onLoadSampleReports}
                      className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all"
                    >
                      Muat Contoh Data Demo
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
                      <th className="p-2.5 text-center w-10 border-r border-slate-800">NO</th>
                      <th className="p-2.5 border-r border-slate-800">TANGGAL & HARI</th>
                      <th className="p-2.5 border-r border-slate-800">BULAN</th>
                      <th className="p-2.5 text-right border-r border-slate-800">FORKLIFT</th>
                      <th className="p-2.5 text-right border-r border-slate-800">PALLET</th>
                      <th className="p-2.5 text-right border-r border-slate-800">PRODUKSI</th>
                      <th className="p-2.5 text-right bg-amber-400 text-slate-950 font-black border-r border-amber-500">
                        TOTAL BOCOR
                      </th>
                      <th className="p-2.5 border-r border-slate-800">SHIFT & OPERATOR</th>
                      <th className="p-2.5 border-r border-slate-800">KETERANGAN / SUMBER</th>
                      <th className="p-2.5 text-center w-28">AKSI DI TABEL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredEntries.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-amber-50/40 transition-colors group"
                      >
                        <td className="p-2.5 text-center text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">
                              {entry.dayName}, {entry.day} {entry.monthName.replace(/^[0-9]+\s*/, '')} {year}
                            </span>
                            {entry.isRedDay && (
                              <span className="bg-red-100 text-red-700 border border-red-200 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                                Off / Libur
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {entry.dateStr}
                          </span>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-700">
                          {entry.monthName}
                        </td>
                        <td className="p-2.5 text-right font-medium text-slate-800">
                          {formatNumberIndonesian(entry.forklift)}
                        </td>
                        <td className="p-2.5 text-right font-medium text-slate-800">
                          {formatNumberIndonesian(entry.pallet)}
                        </td>
                        <td className="p-2.5 text-right font-medium text-slate-800">
                          {formatNumberIndonesian(entry.bocorProduksi)}
                        </td>
                        <td className="p-2.5 text-right bg-amber-50/70 font-black text-slate-950 text-sm">
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300">
                            {formatNumberIndonesian(entry.totalBocor)}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="font-semibold text-slate-800 block">
                            {entry.shift || 'Shift 1'}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {entry.operator || 'Petugas Gudang'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="text-slate-600 block line-clamp-1 font-medium" title={entry.catatan}>
                            {entry.catatan || '—'}
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-tight">
                            {entry.source === 'petugas' ? 'Form Berita Acara Petugas' : entry.source === 'log' ? 'Form Input Harian' : 'Tabel Spreadsheet Excel'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Tombol Lihat & Sorot di Tabel */}
                            <button
                              type="button"
                              onClick={() => onViewInTable(entry.monthIndex, entry.day)}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs transition-colors shadow-2xs cursor-pointer"
                              title={`Buka & Sorot Tanggal ${entry.day} ${entry.monthName} di Tabel Excel`}
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                            </button>

                            {/* Tombol Edit Tanggal */}
                            <button
                              type="button"
                              onClick={() => onEditDay(entry.monthIndex, entry.day)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs transition-colors cursor-pointer"
                              title={`Edit Nilai Tanggal ${entry.day} ${entry.monthName}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Hapus */}
                            <button
                              type="button"
                              onClick={() => onDeleteEntry(entry.monthIndex, entry.day, entry.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md text-xs transition-colors cursor-pointer"
                              title={`Hapus Data Tanggal ${entry.day} ${entry.monthName}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Footer Totals */}
                  <tfoot>
                    <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={3} className="p-2.5 text-slate-800 uppercase tracking-wider text-right">
                        TOTAL DARI {filteredEntries.length} DATA TERFILTER:
                      </td>
                      <td className="p-2.5 text-right text-slate-800">
                        {formatNumberIndonesian(filteredEntries.reduce((s, i) => s + i.forklift, 0))}
                      </td>
                      <td className="p-2.5 text-right text-slate-800">
                        {formatNumberIndonesian(filteredEntries.reduce((s, i) => s + i.pallet, 0))}
                      </td>
                      <td className="p-2.5 text-right text-slate-800">
                        {formatNumberIndonesian(filteredEntries.reduce((s, i) => s + i.bocorProduksi, 0))}
                      </td>
                      <td className="p-2.5 text-right bg-amber-300 text-slate-950 font-black text-sm">
                        {formatNumberIndonesian(filteredEntries.reduce((s, i) => s + i.totalBocor, 0))}
                      </td>
                      <td colSpan={3} className="p-2.5 text-slate-500 text-[11px] font-normal">
                        * Data otomatis tersinkronisasi dua arah dengan sel tabel Excel.
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
