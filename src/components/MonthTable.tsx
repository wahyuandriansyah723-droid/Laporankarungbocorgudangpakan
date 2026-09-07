import React, { useState } from 'react';
import { MonthReport, WarehouseSettings } from '../types';
import {
  calculateMonthTotals,
  formatNumberIndonesian,
  getDaysInMonth,
  getIndonesianDayName,
} from '../utils/calculations';
import { isIndonesianRedDay } from '../data/initialData';
import { Edit3, Calendar, Check, X, AlertTriangle, Trash2, RotateCcw, Save, Sliders, AlertCircle } from 'lucide-react';

interface MonthTableProps {
  report: MonthReport;
  settings: WarehouseSettings;
  onUpdateEntry: (monthIndex: number, day: number, field: 'forklift' | 'pallet' | 'bocorProduksi', value: number) => void;
  onUpdatePenjualanKg: (monthIndex: number, newPenjualanKg: number) => void;
  onToggleCellStatus: (monthIndex: number, day: number, statusType: 'red' | 'yellow' | 'normal') => void;
  onClearMonthReport?: (monthIndex: number) => void;
  onClearDayReport?: (monthIndex: number, day: number) => void;
  onBatchUpdateDay?: (monthIndex: number, day: number, forklift: number, pallet: number, bocorProduksi: number, isRedDay?: boolean) => void;
  onSaveMonthReport?: (monthIndex: number) => Promise<void> | void;
  onOpenHolidayDashboard?: (monthIndex: number) => void;
}

export const MonthTable: React.FC<MonthTableProps> = ({
  report,
  settings,
  onUpdateEntry,
  onUpdatePenjualanKg,
  onToggleCellStatus,
  onClearMonthReport,
  onClearDayReport,
  onBatchUpdateDay,
  onSaveMonthReport,
  onOpenHolidayDashboard,
}) => {
  const year = 2026;
  const maxDays = getDaysInMonth(year, report.monthIndex);
  const totals = calculateMonthTotals(report, settings);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Saving state for this month report
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Inline Editing State for Sales (Penjualan Kg)
  const [isEditingSales, setIsEditingSales] = useState(false);
  const [salesInput, setSalesInput] = useState(report.penjualanKg.toString());

  // Inline Single Cell Editing State
  const [editingCell, setEditingCell] = useState<{
    day: number;
    field: 'forklift' | 'pallet' | 'bocorProduksi';
    value: string;
  } | null>(null);

  // Modal State for Day Batch Edit
  const [dayEditModal, setDayEditModal] = useState<{
    day: number;
    forklift: number;
    pallet: number;
    bocorProduksi: number;
    isRedDay: boolean;
  } | null>(null);

  const handleSaveMonth = async () => {
    // If inline edits are open, commit them first
    if (editingCell) {
      handleCellSave();
    }
    if (isEditingSales) {
      handleSaveSales();
    }

    setIsSaving(true);
    try {
      if (onSaveMonthReport) {
        await onSaveMonthReport(report.monthIndex);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Gagal menyimpan laporan bulan:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSales = () => {
    const num = parseFloat(salesInput.replace(/[^0-9]/g, ''));
    if (!isNaN(num)) {
      onUpdatePenjualanKg(report.monthIndex, num);
    }
    setIsEditingSales(false);
  };

  const handleCellSave = () => {
    if (!editingCell) return;
    const val = parseInt(editingCell.value, 10);
    onUpdateEntry(
      report.monthIndex,
      editingCell.day,
      editingCell.field,
      isNaN(val) || val < 0 ? 0 : val
    );
    setEditingCell(null);
  };

  const handleOpenDayModal = (d: number) => {
    const entry = report.dailyEntries[d] || { forklift: 0, pallet: 0, bocorProduksi: 0 };
    setDayEditModal({
      day: d,
      forklift: entry.forklift || 0,
      pallet: entry.pallet || 0,
      bocorProduksi: entry.bocorProduksi || 0,
      isRedDay: !!entry.isRedDay,
    });
  };

  const handleSaveDayModal = () => {
    if (!dayEditModal) return;
    if (onBatchUpdateDay) {
      onBatchUpdateDay(
        report.monthIndex,
        dayEditModal.day,
        dayEditModal.forklift,
        dayEditModal.pallet,
        dayEditModal.bocorProduksi,
        dayEditModal.isRedDay
      );
    } else {
      onUpdateEntry(report.monthIndex, dayEditModal.day, 'forklift', dayEditModal.forklift);
      onUpdateEntry(report.monthIndex, dayEditModal.day, 'pallet', dayEditModal.pallet);
      onUpdateEntry(report.monthIndex, dayEditModal.day, 'bocorProduksi', dayEditModal.bocorProduksi);
    }
    setDayEditModal(null);
  };

  const handleDeleteDay = (d: number) => {
    if (confirm(`Hapus / Kosongkan semua data kebocoran untuk Tanggal ${d} ${report.monthName}?`)) {
      if (onClearDayReport) {
        onClearDayReport(report.monthIndex, d);
      } else {
        onUpdateEntry(report.monthIndex, d, 'forklift', 0);
        onUpdateEntry(report.monthIndex, d, 'pallet', 0);
        onUpdateEntry(report.monthIndex, d, 'bocorProduksi', 0);
      }
    }
  };

  const handleDeleteMonth = () => {
    if (confirm(`Apakah Anda yakin ingin MENGOSONGKAN seluruh data kebocoran di bulan ${report.monthName}? Semua jumlah harian akan direset ke 0.`)) {
      if (onClearMonthReport) {
        onClearMonthReport(report.monthIndex);
      } else {
        days.forEach((d) => {
          onUpdateEntry(report.monthIndex, d, 'forklift', 0);
          onUpdateEntry(report.monthIndex, d, 'pallet', 0);
          onUpdateEntry(report.monthIndex, d, 'bocorProduksi', 0);
        });
      }
    }
  };

  const isExceedingTarget = totals.rasioBocorPersen > settings.targetToleransiPersen;

  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden mb-8 transition-all hover:shadow-md">
      {/* Month Header Banner - Yellow background matching image */}
      <div className="bg-amber-400 text-slate-900 font-bold px-4 py-2.5 text-center text-sm md:text-base tracking-wider uppercase border-b border-amber-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-800" />
          <span className="font-extrabold">{report.monthName} 2026</span>
          <span className="text-[10px] font-bold bg-amber-200/90 text-slate-800 px-2 py-0.5 rounded-full border border-amber-500/40">
            {maxDays} Hari Kalender
          </span>
        </div>

        <div className="text-xs font-normal text-slate-800 hidden md:block">
          * Klik sel untuk edit cepat | Gunakan tombol <span className="font-bold border border-slate-700 px-1 py-0.2 rounded bg-amber-200">Aksi Harian</span> untuk edit/hapus
        </div>

        {/* Action Controls for the Entire Month */}
        <div className="flex items-center gap-2">
          {/* Tombol Simpan Bulan Ini */}
          <button
            onClick={handleSaveMonth}
            disabled={isSaving}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded shadow-xs transition-all cursor-pointer border ${
              saveSuccess
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-950 hover:shadow-sm'
            } disabled:opacity-75`}
            title={`Simpan Laporan Bulan ${report.monthName} ke Database Cloud & Cache`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Tersimpan!</span>
              </>
            ) : isSaving ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Simpan Bulan Ini</span>
              </>
            )}
          </button>

          <button
            onClick={handleDeleteMonth}
            className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded border border-red-700 shadow-2xs transition-colors cursor-pointer"
            title={`Hapus / Kosongkan Seluruh Data Kebocoran Bulan ${report.monthName}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hapus Bulan Ini</span>
          </button>

          {onOpenHolidayDashboard && (
            <button
              onClick={() => onOpenHolidayDashboard(report.monthIndex)}
              className="flex items-center gap-1 text-xs bg-red-100 hover:bg-red-200 text-red-800 font-bold px-2.5 py-1 rounded border border-red-300 transition-colors cursor-pointer"
              title={`Atur Tanggal Merah & Hari Libur Bulan ${report.monthName} 2026`}
            >
              <Calendar className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">Atur Libur</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-xs bg-amber-200/80 px-2 py-0.5 rounded border border-amber-400">
            <span>Target: &le; {settings.targetToleransiPersen}%</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse select-none">
          <thead>
            {/* Header row: TANGGAL | 1..31 | TOTAL | TOTAL PENJUALAN */}
            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
              <th className="p-1.5 border-r border-slate-300 text-left w-36 bg-slate-200 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                TANGGAL
              </th>
              {days.map((d) => {
                const isOutOfMonth = d > maxDays;
                if (isOutOfMonth) {
                  return (
                    <th
                      key={d}
                      className="p-1 border-r border-slate-300 text-center min-w-[32px] max-w-[36px] bg-slate-200/50 text-slate-400 select-none"
                      title={`Tanggal ${d} tidak ada di bulan ${report.monthName} 2026`}
                    >
                      <div className="flex flex-col items-center justify-center py-0.5">
                        <span className="text-[7px] text-slate-400 font-bold leading-none">—</span>
                        <span className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">{d}</span>
                      </div>
                    </th>
                  );
                }

                const dayName = getIndonesianDayName(year, report.monthIndex, d);
                const isSunday = new Date(year, report.monthIndex - 1, d).getDay() === 0;
                const isHoliday = isIndonesianRedDay(year, report.monthIndex, d);
                const entry = report.dailyEntries[d];
                const isRed = entry?.isRedDay !== undefined ? entry.isRedDay : (isSunday || isHoliday);
                const isYellow = entry?.isYellowDay;
                const hasData = (entry?.forklift || 0) + (entry?.pallet || 0) + (entry?.bocorProduksi || 0) > 0;

                return (
                  <th
                    key={d}
                    onClick={() => handleOpenDayModal(d)}
                    className={`p-1 border-r border-slate-300 text-center min-w-[32px] max-w-[36px] transition-colors cursor-pointer hover:brightness-95 ${
                      isRed ? 'bg-red-600 text-white font-black shadow-inner' : isYellow ? 'bg-amber-300 text-slate-900 font-bold' : hasData ? 'bg-blue-50/80 font-bold text-slate-900' : 'bg-slate-100 text-slate-700'
                    }`}
                    title={`Klik untuk Edit/Hapus Tanggal ${d} (${dayName}) - ${isRed ? 'Hari Libur / Minggu' : 'Hari Kerja'}`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className={`text-[8px] font-bold uppercase tracking-tight leading-none ${isRed ? 'text-red-100' : 'text-slate-500'}`}>
                        {dayName}
                      </span>
                      <span className="text-xs font-black leading-tight mt-0.5">{d}</span>
                      {isRed && (
                        <span className="text-[7px] leading-none font-black text-red-100 uppercase tracking-tighter mt-0.5">
                          OFF
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              <th className="p-1.5 border-r border-slate-300 text-center w-16 bg-slate-200 font-bold">
                TOTAL
              </th>
              <th className="p-1.5 text-center w-48 bg-amber-100/70 border-l border-amber-300 font-bold text-amber-900">
                TOTAL PENJUALAN
              </th>
            </tr>

            {/* ACTION ROW: Tombol Edit & Hapus Per Hari */}
            <tr className="bg-slate-200/80 text-slate-800 border-b border-slate-300">
              <td className="p-1 border-r border-slate-300 font-extrabold text-[10px] uppercase text-slate-700 bg-slate-300/80 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-center">
                AKSI HARIAN
              </td>
              {days.map((d) => {
                const isOutOfMonth = d > maxDays;
                if (isOutOfMonth) {
                  return (
                    <td key={d} className="p-0.5 border-r border-slate-300 text-center bg-slate-200/40 text-slate-300 text-[10px] select-none">
                      —
                    </td>
                  );
                }

                const entry = report.dailyEntries[d];
                const hasData = (entry?.forklift || 0) + (entry?.pallet || 0) + (entry?.bocorProduksi || 0) > 0;

                return (
                  <td key={d} className="p-0.5 border-r border-slate-300 text-center bg-slate-100/60">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        onClick={() => handleOpenDayModal(d)}
                        className={`p-1 rounded transition-colors ${
                          hasData
                            ? 'text-blue-700 hover:bg-blue-200 bg-blue-100/80'
                            : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200'
                        }`}
                        title={`Edit Jumlah Input Tanggal ${d}`}
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>

                      {hasData && (
                        <button
                          onClick={() => handleDeleteDay(d)}
                          className="p-1 text-red-600 hover:bg-red-200 bg-red-100/80 rounded transition-colors"
                          title={`Hapus / Reset Jumlah Tanggal ${d}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                );
              })}
              <td className="p-1 border-r border-slate-300 bg-slate-200 text-center text-[10px] font-bold text-slate-500">
                SUM
              </td>
              <td className="p-1 bg-amber-100/40 text-center text-[10px] font-bold text-amber-800">
                AKSI BULAN
              </td>
            </tr>
          </thead>

          <tbody>
            {/* ROW 1: FORKLIFT */}
            <tr className="border-b border-slate-200 hover:bg-slate-50/50">
              <td className="p-1.5 border-r border-slate-300 font-medium text-slate-800 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                FORKLIFT
              </td>
              {days.map((d) => {
                const isOutOfMonth = d > maxDays;
                if (isOutOfMonth) {
                  return (
                    <td key={d} className="p-1 border-r border-slate-200 text-center bg-slate-100/60 text-slate-300 font-mono text-[10px] select-none">
                      —
                    </td>
                  );
                }

                const entry = report.dailyEntries[d];
                const val = entry?.forklift;
                const isSunday = new Date(year, report.monthIndex - 1, d).getDay() === 0;
                const isHoliday = isIndonesianRedDay(year, report.monthIndex, d);
                const isRed = entry?.isRedDay !== undefined ? entry.isRedDay : (isSunday || isHoliday);
                const isYellow = entry?.isYellowDay;
                const isEditing = editingCell?.day === d && editingCell?.field === 'forklift';

                return (
                  <td
                    key={d}
                    onClick={() => setEditingCell({ day: d, field: 'forklift', value: (val || 0).toString() })}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const nextStatus = isRed ? 'yellow' : isYellow ? 'normal' : 'red';
                      onToggleCellStatus(report.monthIndex, d, nextStatus);
                    }}
                    className={`p-1 border-r border-slate-200 text-center cursor-pointer transition-colors ${
                      isRed
                        ? 'bg-red-500 text-white font-semibold'
                        : isYellow
                        ? 'bg-amber-200 text-slate-900 font-semibold'
                        : val && val > 0
                        ? 'text-slate-800 hover:bg-blue-50 font-medium'
                        : 'text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isEditing ? (
                      <input
                        type="number"
                        autoFocus
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                        onBlur={handleCellSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
                        className="w-full h-full text-center bg-white text-slate-900 border border-blue-500 rounded outline-none text-xs p-0"
                      />
                    ) : (
                      val && val > 0 ? val : ''
                    )}
                  </td>
                );
              })}
              <td className="p-1.5 border-r border-slate-300 text-center font-semibold text-slate-900 bg-slate-100">
                {formatNumberIndonesian(totals.totalForklift)}
              </td>
              {/* Right Side: Total Penjualan (Kg) */}
              <td className="p-2 text-right font-medium text-slate-800 bg-amber-50/50 border-l border-amber-200">
                {isEditingSales ? (
                  <div className="flex items-center justify-end gap-1">
                    <input
                      type="text"
                      value={salesInput}
                      onChange={(e) => setSalesInput(e.target.value)}
                      className="w-28 text-right text-xs px-1 py-0.5 border border-amber-500 rounded bg-white text-slate-900"
                    />
                    <button onClick={handleSaveSales} className="text-green-600 hover:text-green-800 p-0.5" title="Simpan">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIsEditingSales(false)} className="text-red-500 hover:text-red-700 p-0.5" title="Batal">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsEditingSales(true)} title="Klik untuk Edit Penjualan (Kg)">
                    <span className="text-[11px] text-slate-500 font-normal">PENJUALAN (KG):</span>
                    <span className="font-semibold text-slate-900 group-hover:text-amber-700 flex items-center gap-1">
                      {formatNumberIndonesian(totals.totalPenjualanKg)}
                      <Edit3 className="w-3 h-3 text-amber-600" />
                    </span>
                  </div>
                )}
              </td>
            </tr>

            {/* ROW 2: PALLET */}
            <tr className="border-b border-slate-200 hover:bg-slate-50/50">
              <td className="p-1.5 border-r border-slate-300 font-medium text-slate-800 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                PALLET
              </td>
              {days.map((d) => {
                const isOutOfMonth = d > maxDays;
                if (isOutOfMonth) {
                  return (
                    <td key={d} className="p-1 border-r border-slate-200 text-center bg-slate-100/60 text-slate-300 font-mono text-[10px] select-none">
                      —
                    </td>
                  );
                }

                const entry = report.dailyEntries[d];
                const val = entry?.pallet;
                const isSunday = new Date(year, report.monthIndex - 1, d).getDay() === 0;
                const isHoliday = isIndonesianRedDay(year, report.monthIndex, d);
                const isRed = entry?.isRedDay !== undefined ? entry.isRedDay : (isSunday || isHoliday);
                const isYellow = entry?.isYellowDay;
                const isEditing = editingCell?.day === d && editingCell?.field === 'pallet';

                return (
                  <td
                    key={d}
                    onClick={() => setEditingCell({ day: d, field: 'pallet', value: (val || 0).toString() })}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const nextStatus = isRed ? 'yellow' : isYellow ? 'normal' : 'red';
                      onToggleCellStatus(report.monthIndex, d, nextStatus);
                    }}
                    className={`p-1 border-r border-slate-200 text-center cursor-pointer transition-colors ${
                      isRed
                        ? 'bg-red-500 text-white font-semibold'
                        : isYellow
                        ? 'bg-amber-200 text-slate-900 font-semibold'
                        : val && val > 0
                        ? 'text-slate-800 hover:bg-blue-50 font-medium'
                        : 'text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isEditing ? (
                      <input
                        type="number"
                        autoFocus
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                        onBlur={handleCellSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
                        className="w-full h-full text-center bg-white text-slate-900 border border-blue-500 rounded outline-none text-xs p-0"
                      />
                    ) : (
                      val && val > 0 ? val : ''
                    )}
                  </td>
                );
              })}
              <td className="p-1.5 border-r border-slate-300 text-center font-semibold text-slate-900 bg-slate-100">
                {formatNumberIndonesian(totals.totalPallet)}
              </td>
              {/* Right Side: Total Penjualan (Karung) */}
              <td className="p-2 text-right font-medium text-slate-800 bg-amber-50/50 border-l border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-normal">KARUNG (@{settings.beratPerKarungKg}kg):</span>
                  <span className="font-semibold text-slate-900">{formatNumberIndonesian(totals.totalPenjualanKarung)}</span>
                </div>
              </td>
            </tr>

            {/* ROW 3: BOCOR PRODUKSI */}
            <tr className="border-b border-slate-200 hover:bg-slate-50/50">
              <td className="p-1.5 border-r border-slate-300 font-medium text-slate-800 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                BOCOR PRODUKSI
              </td>
              {days.map((d) => {
                const isOutOfMonth = d > maxDays;
                if (isOutOfMonth) {
                  return (
                    <td key={d} className="p-1 border-r border-slate-200 text-center bg-slate-100/60 text-slate-300 font-mono text-[10px] select-none">
                      —
                    </td>
                  );
                }

                const entry = report.dailyEntries[d];
                const val = entry?.bocorProduksi;
                const isSunday = new Date(year, report.monthIndex - 1, d).getDay() === 0;
                const isHoliday = isIndonesianRedDay(year, report.monthIndex, d);
                const isRed = entry?.isRedDay !== undefined ? entry.isRedDay : (isSunday || isHoliday);
                const isYellow = entry?.isYellowDay;
                const isEditing = editingCell?.day === d && editingCell?.field === 'bocorProduksi';

                return (
                  <td
                    key={d}
                    onClick={() => setEditingCell({ day: d, field: 'bocorProduksi', value: (val || 0).toString() })}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const nextStatus = isRed ? 'yellow' : isYellow ? 'normal' : 'red';
                      onToggleCellStatus(report.monthIndex, d, nextStatus);
                    }}
                    className={`p-1 border-r border-slate-200 text-center cursor-pointer transition-colors ${
                      isRed
                        ? 'bg-red-500 text-white font-semibold'
                        : isYellow
                        ? 'bg-amber-200 text-slate-900 font-semibold'
                        : val && val > 0
                        ? 'text-slate-800 hover:bg-blue-50 font-medium'
                        : 'text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isEditing ? (
                      <input
                        type="number"
                        autoFocus
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                        onBlur={handleCellSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
                        className="w-full h-full text-center bg-white text-slate-900 border border-blue-500 rounded outline-none text-xs p-0"
                      />
                    ) : (
                      val && val > 0 ? val : ''
                    )}
                  </td>
                );
              })}
              <td className="p-1.5 border-r border-slate-300 text-center font-semibold text-slate-900 bg-slate-100">
                {formatNumberIndonesian(totals.totalBocorProduksi)}
              </td>
              {/* Right Side: Persentase Ratio % */}
              <td className="p-2 text-right border-l border-amber-200 bg-amber-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-normal">RASIO BOCOR (%):</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-xs flex items-center gap-1 ${
                      isExceedingTarget ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {isExceedingTarget && <AlertTriangle className="w-3 h-3 text-red-600" />}
                    {totals.rasioBocorPersen.toFixed(2)}%
                  </span>
                </div>
              </td>
            </tr>

            {/* ROW 4: TOTAL BOCOR */}
            <tr className="bg-slate-100/90 font-bold border-t border-slate-300 text-slate-900">
              <td className="p-1.5 border-r border-slate-300 bg-slate-200 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                TOTAL BOCOR
              </td>
              {days.map((d) => {
                const isOutOfMonth = d > maxDays;
                if (isOutOfMonth) {
                  return (
                    <td key={d} className="p-1 border-r border-slate-300 text-center bg-slate-200/50 text-slate-300 font-mono text-[10px] select-none">
                      —
                    </td>
                  );
                }

                const entry = report.dailyEntries[d];
                const sum = entry ? (entry.forklift || 0) + (entry.pallet || 0) + (entry.bocorProduksi || 0) : 0;
                const isSunday = new Date(year, report.monthIndex - 1, d).getDay() === 0;
                const isHoliday = isIndonesianRedDay(year, report.monthIndex, d);
                const isRed = entry?.isRedDay !== undefined ? entry.isRedDay : (isSunday || isHoliday);
                const isYellow = entry?.isYellowDay;

                return (
                  <td
                    key={d}
                    onClick={() => handleOpenDayModal(d)}
                    className={`p-1 border-r border-slate-300 text-center font-bold cursor-pointer hover:brightness-95 ${
                      isRed
                        ? 'bg-red-500 text-white'
                        : isYellow
                        ? 'bg-amber-300 text-slate-900'
                        : sum > 0
                        ? 'bg-amber-50 text-slate-900'
                        : 'text-slate-400'
                    }`}
                    title={`Klik untuk Edit Data Tanggal ${d}`}
                  >
                    {sum > 0 ? sum : ''}
                  </td>
                );
              })}
              <td className="p-1.5 border-r border-slate-300 text-center font-extrabold text-slate-900 bg-amber-200 text-sm">
                {formatNumberIndonesian(totals.totalBocor)}
              </td>
              <td className="p-2 text-center bg-amber-100/80 border-l border-amber-300 font-extrabold text-amber-900 text-xs">
                TOTAL KARUNG BOCOR: {formatNumberIndonesian(totals.totalBocor)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Month Bottom Action Bar with Status and Save Button */}
      <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-semibold text-slate-700">Ringkasan {report.monthName}:</span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isExceedingTarget ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            Rasio: {totals.rasioBocorPersen.toFixed(2)}% ({isExceedingTarget ? 'Di Atas Toleransi' : 'Dalam Toleransi'})
          </span>
          <span className="text-slate-500 font-medium hidden sm:inline">
            &bull; Total Bocor: <strong className="text-slate-800">{formatNumberIndonesian(totals.totalBocor)}</strong> karung
          </span>
          <span className="text-slate-500 font-medium hidden sm:inline">
            &bull; Penjualan: <strong className="text-slate-800">{formatNumberIndonesian(totals.totalPenjualanKarung)}</strong> karung
          </span>
          {saveSuccess && (
            <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Laporan bulan {report.monthName} berhasil disimpan
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleSaveMonth}
            disabled={isSaving}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-sm'
            } disabled:opacity-75`}
            title={`Simpan Laporan Kebocoran Bulan ${report.monthName}`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Laporan {report.monthName} Tersimpan!</span>
              </>
            ) : isSaving ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Simpan Laporan {report.monthName}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODAL EDIT HARIAN */}
      {dayEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                  Edit Input Harian — Tanggal {dayEditModal.day} {report.monthName}
                </h3>
              </div>
              <button
                onClick={() => setDayEditModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                {/* Forklift Input */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                    Forklift
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={dayEditModal.forklift}
                      onChange={(e) => setDayEditModal({ ...dayEditModal, forklift: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full text-center font-bold text-sm bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block text-center mt-1">karung</span>
                </div>

                {/* Pallet Input */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                    Pallet
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={dayEditModal.pallet}
                      onChange={(e) => setDayEditModal({ ...dayEditModal, pallet: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full text-center font-bold text-sm bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block text-center mt-1">karung</span>
                </div>

                {/* Bocor Produksi Input */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                    Produksi
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={dayEditModal.bocorProduksi}
                      onChange={(e) => setDayEditModal({ ...dayEditModal, bocorProduksi: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full text-center font-bold text-sm bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block text-center mt-1">karung</span>
                </div>
              </div>

              {/* Red Day Toggle */}
              <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dayEditModal.isRedDay}
                    onChange={(e) => setDayEditModal({ ...dayEditModal, isRedDay: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                  />
                  <span className="font-extrabold text-slate-800">
                    🔴 Status Hari Libur / Off (Latar Merah)
                  </span>
                </label>
              </div>

              {/* Total Calculation Preview */}
              <div className="bg-slate-900 text-white p-3 rounded-lg flex items-center justify-between">
                <span className="text-slate-300 uppercase tracking-wider text-[10px] font-bold">
                  Total Kebocoran Hari Ini:
                </span>
                <span className="text-amber-400 font-black text-base">
                  {dayEditModal.forklift + dayEditModal.pallet + dayEditModal.bocorProduksi} Karung
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-5 py-3 flex items-center justify-between border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  handleDeleteDay(dayEditModal.day);
                  setDayEditModal(null);
                }}
                className="flex items-center gap-1 text-red-600 hover:text-red-800 font-bold text-xs cursor-pointer hover:bg-red-50 px-2 py-1 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Hari Ini</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDayEditModal(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveDayModal}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

