import React, { useState } from 'react';
import { HolidayItem, HolidayCategory, MonthReport } from '../types';
import {
  DEFAULT_HOLIDAYS_2026,
  getHolidayInfo,
  CATEGORY_METADATA,
  applyHolidaysToReports,
} from '../data/holidayData';
import {
  getDaysInMonth,
  getIndonesianDayName,
} from '../utils/calculations';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Layers,
  AlertCircle,
  HelpCircle,
  Clock,
  Filter,
} from 'lucide-react';

interface HolidayManagerDashboardProps {
  holidays: HolidayItem[];
  sundaysOff: boolean;
  reports: MonthReport[];
  onSaveHolidays: (updatedHolidays: HolidayItem[]) => void;
  onToggleSundaysOff: (enabled: boolean) => void;
  onApplyToReports: (updatedReports: MonthReport[], newHolidays: HolidayItem[], sundaysOff: boolean) => void;
  onClose?: () => void;
  initialMonthIndex?: number;
}

export const HolidayManagerDashboard: React.FC<HolidayManagerDashboardProps> = ({
  holidays,
  sundaysOff,
  reports,
  onSaveHolidays,
  onToggleSundaysOff,
  onApplyToReports,
  onClose,
  initialMonthIndex = 1,
}) => {
  const year = 2026;
  const [activeTab, setActiveTab] = useState<'calendar' | 'list' | 'add'>('calendar');
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonthIndex);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local state for editing holiday item
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<HolidayCategory>('nasional');

  // Form state for adding new holiday
  const [newMonthIndex, setNewMonthIndex] = useState<number>(selectedMonth);
  const [newDay, setNewDay] = useState<number>(1);
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<HolidayCategory>('pabrik_off');
  const [newIsRedDay, setNewIsRedDay] = useState<boolean>(true);

  // Status message
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const showNotification = (text: string, type: 'success' | 'info' = 'success') => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April',
    'Mei', 'Juni', 'Juli', 'Agustus',
    'September', 'Oktober', 'November', 'Desember'
  ];

  // Stats calculation
  const totalHolidays = holidays.filter((h) => h.isRedDay).length;
  const nationalCount = holidays.filter((h) => h.category === 'nasional' && h.isRedDay).length;
  const cutiCount = holidays.filter((h) => h.category === 'cuti_bersama' && h.isRedDay).length;
  const factoryCount = holidays.filter((h) => (h.category === 'pabrik_off' || h.category === 'khusus') && h.isRedDay).length;

  // Handle Quick Day Click in Calendar Tab
  const handleCalendarDayClick = (monthIdx: number, day: number) => {
    const existing = holidays.find((h) => h.monthIndex === monthIdx && h.day === day);

    if (existing) {
      // Toggle red status or prompt to remove
      if (existing.isRedDay) {
        // Toggle to normal
        const updated = holidays.map((h) =>
          h.id === existing.id ? { ...h, isRedDay: false } : h
        );
        onSaveHolidays(updated);
        showNotification(`Tanggal ${day} ${monthNames[monthIdx - 1]} diubah menjadi HARI KERJA (tidak merah).`);
      } else {
        // Toggle back to red
        const updated = holidays.map((h) =>
          h.id === existing.id ? { ...h, isRedDay: true } : h
        );
        onSaveHolidays(updated);
        showNotification(`Tanggal ${day} ${monthNames[monthIdx - 1]} diubah menjadi TANGGAL MERAH (OFF).`);
      }
    } else {
      // Create new holiday / red day for this day
      const dayName = getIndonesianDayName(year, monthIdx, day);
      const isSunday = new Date(year, monthIdx - 1, day).getDay() === 0;
      const newHol: HolidayItem = {
        id: `hol-${year}-${monthIdx}-${day}-${Date.now()}`,
        monthIndex: monthIdx,
        day,
        name: isSunday ? 'Hari Minggu' : `Hari Libur Tanggal ${day}`,
        category: isSunday ? 'nasional' : 'pabrik_off',
        isRedDay: true,
      };

      const updated = [...holidays, newHol];
      onSaveHolidays(updated);
      showNotification(`Tanggal ${day} ${monthNames[monthIdx - 1]} (${dayName}) ditandai sebagai TANGGAL MERAH.`);
    }
  };

  // Add new Holiday
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Mohon isi nama hari libur / keterangan.');
      return;
    }

    const maxDays = getDaysInMonth(year, newMonthIndex);
    if (newDay < 1 || newDay > maxDays) {
      alert(`Tanggal harus antara 1 sampai ${maxDays} untuk bulan ${monthNames[newMonthIndex - 1]}.`);
      return;
    }

    // Check if day already exists
    const existing = holidays.find((h) => h.monthIndex === newMonthIndex && h.day === newDay);
    let updated: HolidayItem[];

    if (existing) {
      updated = holidays.map((h) =>
        h.id === existing.id
          ? { ...h, name: newName.trim(), category: newCategory, isRedDay: newIsRedDay }
          : h
      );
      showNotification(`Hari libur ${newDay} ${monthNames[newMonthIndex - 1]} berhasil diperbarui!`);
    } else {
      const newHol: HolidayItem = {
        id: `hol-${year}-${newMonthIndex}-${newDay}-${Date.now()}`,
        monthIndex: newMonthIndex,
        day: newDay,
        name: newName.trim(),
        category: newCategory,
        isRedDay: newIsRedDay,
      };
      updated = [...holidays, newHol];
      showNotification(`Hari libur "${newName.trim()}" (${newDay} ${monthNames[newMonthIndex - 1]}) berhasil ditambahkan!`);
    }

    onSaveHolidays(updated);
    setNewName('');
    setActiveTab('calendar');
    setSelectedMonth(newMonthIndex);
  };

  // Delete Holiday
  const handleDeleteHoliday = (id: string, name: string) => {
    if (confirm(`Hapus hari libur "${name}"?`)) {
      const updated = holidays.filter((h) => h.id !== id);
      onSaveHolidays(updated);
      showNotification(`Hari libur "${name}" telah dihapus.`);
    }
  };

  // Save Edit Holiday
  const handleSaveEditHoliday = (id: string) => {
    if (!editName.trim()) return;
    const updated = holidays.map((h) =>
      h.id === id ? { ...h, name: editName.trim(), category: editCategory } : h
    );
    onSaveHolidays(updated);
    setEditingHolidayId(null);
    showNotification('Perubahan hari libur berhasil disimpan.');
  };

  // Reset to default 2026
  const handleResetToDefault = () => {
    if (confirm('Kembalikan ke daftar hari libur resmi Indonesia tahun 2026? Semua hari libur kustom pabrik akan direset.')) {
      onSaveHolidays(DEFAULT_HOLIDAYS_2026);
      onToggleSundaysOff(true);
      showNotification('Daftar hari libur telah direset ke Standar Resmi 2026.');
    }
  };

  // Apply to all 12 Monthly Reports
  const handleApplyToReports = () => {
    const updatedReports = applyHolidaysToReports(reports, holidays, sundaysOff, year);
    onApplyToReports(updatedReports, holidays, sundaysOff);
    showNotification('Berhasil menerapkan tanggal merah ke seluruh 12 Laporan Bulanan (Januari - Desember)!', 'success');
  };

  // Filtered Holidays for List view
  const filteredHolidays = holidays
    .filter((h) => {
      if (categoryFilter !== 'all' && h.category !== categoryFilter) return false;
      if (searchQuery.trim() && !h.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.monthIndex !== b.monthIndex) return a.monthIndex - b.monthIndex;
      return a.day - b.day;
    });

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden mb-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-inner">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-wide uppercase">
                Dasbor Tanggal Merah & Hari Libur {year}
              </h2>
              <span className="bg-amber-400 text-slate-900 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                Tahun 2026
              </span>
            </div>
            <p className="text-xs text-red-100 font-medium mt-0.5">
              Kelola hari libur resmi, cuti bersama, libur pabrik/gudang, dan sinkronkan dengan tampilan laporan Excel
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyToReports}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-lg text-xs font-black shadow-xs transition-colors cursor-pointer"
            title="Terapkan status tanggal merah ini ke 12 Laporan Bulanan"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-900" />
            <span>Terapkan ke 12 Bulan</span>
          </button>

          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-semibold border border-red-500/50 transition-colors cursor-pointer"
            title="Kembalikan ke kalender hari libur standar nasional"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Tutup Dasbor"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Key Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200">
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tanggal Merah</span>
          <span className="text-xl font-black text-red-600 mt-0.5 block">{totalHolidays}</span>
          <span className="text-[10px] text-slate-500">Hari Libur Khusus Terdaftar</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Libur Nasional</span>
          <span className="text-xl font-black text-slate-800 mt-0.5 block">{nationalCount}</span>
          <span className="text-[10px] text-slate-500">Hari Libur Resmi RI 2026</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cuti Bersama</span>
          <span className="text-xl font-black text-orange-600 mt-0.5 block">{cutiCount}</span>
          <span className="text-[10px] text-slate-500">Cuti Bersama Pemerintah</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Hari Minggu (OFF)</span>
            <button
              onClick={() => {
                const nextVal = !sundaysOff;
                onToggleSundaysOff(nextVal);
                showNotification(`Hari Minggu diubah menjadi: ${nextVal ? 'Selalu Tanggal Merah (OFF)' : 'Hari Kerja Normal'}`);
              }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                sundaysOff ? 'bg-red-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  sundaysOff ? 'translate-x-4.5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 leading-tight">
            {sundaysOff ? 'Semua Minggu otomatis ditandai merah (OFF)' : 'Minggu dihitung hari kerja biasa'}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 pt-3 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'calendar'
                ? 'border-red-600 text-red-600 bg-red-50/50 rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Kalender Interaktif 12 Bulan</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'border-red-600 text-red-600 bg-red-50/50 rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Daftar Libur ({holidays.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'border-red-600 text-red-600 bg-red-50/50 rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Libur Kustom</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 hidden md:block">
          Klik tanggal pada kalender untuk langsung toggle status Libur / Kerja
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-5">
        {/* ========================================================================= */}
        {/* TAB 1: KALENDER INTERAKTIF 12 BULAN                                      */}
        {/* ========================================================================= */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            {/* Month Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100">
              {monthNames.map((name, idx) => {
                const mIdx = idx + 1;
                const countInMonth = holidays.filter((h) => h.monthIndex === mIdx && h.isRedDay).length;
                return (
                  <button
                    key={mIdx}
                    onClick={() => setSelectedMonth(mIdx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedMonth === mIdx
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{name}</span>
                    {countInMonth > 0 && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                        selectedMonth === mIdx ? 'bg-white text-red-700' : 'bg-red-200 text-red-900'
                      }`}>
                        {countInMonth}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Month Calendar Display */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base uppercase tracking-wide">
                    {monthNames[selectedMonth - 1]} 2026
                  </h3>
                  <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    {getDaysInMonth(year, selectedMonth)} Hari
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-red-600 rounded-xs"></div>
                    <span className="text-slate-600 font-medium">Tanggal Merah (OFF)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-white border border-slate-300 rounded-xs"></div>
                    <span className="text-slate-600 font-medium">Hari Kerja</span>
                  </div>
                </div>
              </div>

              {/* Day Headers (Sen - Min) */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold mb-1">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((dayName, idx) => (
                  <div
                    key={dayName}
                    className={`py-1 rounded-sm ${idx === 6 ? 'bg-red-100 text-red-700 font-black' : 'bg-slate-200 text-slate-700'}`}
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Calendar Grid Days */}
              {(() => {
                const maxDays = getDaysInMonth(year, selectedMonth);
                // First day offset (0 = Monday in ISO, JS getDay() is 0 = Sunday)
                const firstDayJs = new Date(year, selectedMonth - 1, 1).getDay();
                // Convert to Monday = 0, ..., Sunday = 6
                const firstDayOffset = (firstDayJs + 6) % 7;

                const gridCells: React.ReactNode[] = [];

                // Empty padding for first week
                for (let i = 0; i < firstDayOffset; i++) {
                  gridCells.push(
                    <div key={`empty-${i}`} className="min-h-[56px] sm:min-h-[64px] bg-slate-100/40 rounded-lg border border-dashed border-slate-200" />
                  );
                }

                // Days of the month
                for (let d = 1; d <= maxDays; d++) {
                  const dayInfo = getHolidayInfo(holidays, sundaysOff, year, selectedMonth, d);
                  const isRed = dayInfo.isRed;
                  const dayName = getIndonesianDayName(year, selectedMonth, d);

                  gridCells.push(
                    <div
                      key={`day-${d}`}
                      onClick={() => handleCalendarDayClick(selectedMonth, d)}
                      className={`min-h-[56px] sm:min-h-[64px] p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between select-none ${
                        isRed
                          ? 'bg-red-600 text-white border-red-700 shadow-sm hover:bg-red-700 hover:scale-[1.02]'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-red-50/50 hover:border-red-300'
                      }`}
                      title={`Klik untuk ubah: Tanggal ${d} (${dayName}) - ${isRed ? dayInfo.reason || 'OFF' : 'Hari Kerja'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs sm:text-sm font-black ${isRed ? 'text-white' : 'text-slate-800'}`}>
                          {d}
                        </span>
                        {isRed && (
                          <span className="text-[9px] font-extrabold px-1 py-0.2 rounded-xs bg-red-800 text-red-100 uppercase tracking-wider">
                            OFF
                          </span>
                        )}
                      </div>

                      <div className="mt-1">
                        {isRed ? (
                          <p className="text-[9px] sm:text-[10px] font-bold text-red-100 leading-tight line-clamp-2">
                            {dayInfo.reason}
                          </p>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-medium">
                            Kerja
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {gridCells}
                  </div>
                );
              })()}
            </div>

            {/* Month Holiday Summary List */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Hari Libur Terjadwal di Bulan {monthNames[selectedMonth - 1]} 2026:</span>
              </h4>

              {(() => {
                const holidaysInMonth = holidays.filter((h) => h.monthIndex === selectedMonth);
                if (holidaysInMonth.length === 0) {
                  return (
                    <p className="text-xs text-slate-500 italic">
                      Tidak ada hari libur khusus terdaftar di bulan ini (hanya hari Minggu jika diaktifkan).
                    </p>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {holidaysInMonth.map((h) => {
                      const catMeta = CATEGORY_METADATA[h.category] || CATEGORY_METADATA.nasional;
                      return (
                        <div
                          key={h.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-[11px]">
                              {h.day}
                            </span>
                            <div>
                              <p className="font-bold text-slate-800 leading-tight">{h.name}</p>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold inline-block mt-0.5 ${catMeta.bgClass} ${catMeta.textClass} ${catMeta.borderClass}`}>
                                {catMeta.label}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteHoliday(h.id, h.name)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Hapus Libur Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DAFTAR SEMUA HARI LIBUR & TANGGAL MERAH                             */}
        {/* ========================================================================= */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Cari hari libur (misal: Idul Fitri, Imlek, Buruh, Pabrik)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium focus:outline-hidden"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="nasional">Hari Libur Nasional</option>
                  <option value="cuti_bersama">Cuti Bersama</option>
                  <option value="pabrik_off">Libur Pabrik / Gudang</option>
                  <option value="khusus">Khusus / Maintenance</option>
                </select>
              </div>
            </div>

            {/* Table of Holidays */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5 text-center w-12">NO</th>
                      <th className="p-2.5 w-36">TANGGAL</th>
                      <th className="p-2.5">NAMA HARI LIBUR</th>
                      <th className="p-2.5 w-40">KATEGORI</th>
                      <th className="p-2.5 text-center w-24">STATUS</th>
                      <th className="p-2.5 text-center w-28">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredHolidays.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                          Tidak ada hari libur yang cocok dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredHolidays.map((h, idx) => {
                        const dayName = getIndonesianDayName(year, h.monthIndex, h.day);
                        const isEditing = editingHolidayId === h.id;
                        const catMeta = CATEGORY_METADATA[h.category] || CATEGORY_METADATA.nasional;

                        return (
                          <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-800">
                              <span className="text-red-600 mr-1.5">{dayName},</span>
                              {h.day} {monthNames[h.monthIndex - 1]} 2026
                            </td>
                            <td className="p-2.5">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full text-xs px-2 py-1 border border-red-400 rounded-md focus:outline-hidden"
                                />
                              ) : (
                                <span className="font-extrabold text-slate-900">{h.name}</span>
                              )}
                            </td>
                            <td className="p-2.5">
                              {isEditing ? (
                                <select
                                  value={editCategory}
                                  onChange={(e) => setEditCategory(e.target.value as HolidayCategory)}
                                  className="text-xs px-2 py-1 border border-slate-300 rounded-md"
                                >
                                  <option value="nasional">Hari Libur Nasional</option>
                                  <option value="cuti_bersama">Cuti Bersama</option>
                                  <option value="pabrik_off">Libur Pabrik / Gudang</option>
                                  <option value="khusus">Khusus / Maintenance</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catMeta.bgClass} ${catMeta.textClass} ${catMeta.borderClass}`}>
                                  {catMeta.label}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => {
                                  const updated = holidays.map((item) =>
                                    item.id === h.id ? { ...item, isRedDay: !item.isRedDay } : item
                                  );
                                  onSaveHolidays(updated);
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-black transition-colors cursor-pointer ${
                                  h.isRedDay ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {h.isRedDay ? 'MERAH (OFF)' : 'NORMAL'}
                              </button>
                            </td>
                            <td className="p-2.5 text-center">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleSaveEditHoliday(h.id)}
                                    className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                                    title="Simpan"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingHolidayId(null)}
                                    className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 cursor-pointer"
                                    title="Batal"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingHolidayId(h.id);
                                      setEditName(h.name);
                                      setEditCategory(h.category);
                                    }}
                                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                    title="Edit Nama/Kategori"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteHoliday(h.id, h.name)}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FORM TAMBAH HARI LIBUR BARU                                       */}
        {/* ========================================================================= */}
        {activeTab === 'add' && (
          <div className="max-w-2xl mx-auto bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-600" />
              <span>Tambah Hari Libur / Tanggal Merah Baru (2026)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Gunakan form ini untuk menambahkan jadwal libur khusus pabrik, stock opname, maintenance berkala, atau cuti tambahan gudang.
            </p>

            <form onSubmit={handleAddHoliday} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Bulan (2026):</label>
                  <select
                    value={newMonthIndex}
                    onChange={(e) => setNewMonthIndex(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  >
                    {monthNames.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {idx + 1} - {m} 2026
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pilih Tanggal (1 s/d {getDaysInMonth(year, newMonthIndex)}):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={getDaysInMonth(year, newMonthIndex)}
                    value={newDay}
                    onChange={(e) => setNewDay(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Hari: <strong>{getIndonesianDayName(year, newMonthIndex, newDay)}</strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Hari Libur / Keterangan:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Stock Opname Semester 1, Maintenance Mesin Line A, Libur Idul Fitri Tambahan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Libur:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as HolidayCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  >
                    <option value="pabrik_off">Libur Pabrik / Gudang Jadi</option>
                    <option value="cuti_bersama">Cuti Bersama</option>
                    <option value="nasional">Hari Libur Nasional</option>
                    <option value="khusus">Khusus / Maintenance & Audit</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newIsRedDay}
                      onChange={(e) => setNewIsRedDay(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span className="font-bold text-slate-800">
                      Tandai Merah (OFF) di Kolom Laporan
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('calendar')}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Hari Libur</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Footer Instructions / Helper */}
      <div className="bg-slate-100 border-t border-slate-200 px-4 py-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Tips:</strong> Setelah mengubah hari libur, klik tombol{' '}
            <strong className="text-slate-900 bg-amber-200 px-1.5 py-0.5 rounded">
              "Terapkan ke 12 Bulan"
            </strong>{' '}
            agar status tanggal merah otomatis disinkronkan ke seluruh tabel bulan dan file ekspor Excel.
          </span>
        </div>

        <button
          onClick={handleApplyToReports}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-md transition-colors cursor-pointer"
        >
          Sinkronkan Sekarang
        </button>
      </div>
    </div>
  );
};
