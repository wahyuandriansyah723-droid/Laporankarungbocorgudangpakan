import React, { useState, useRef } from 'react';
import {
  PackageCheck,
  Printer,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Building2,
  Calendar,
  Save,
  BarChart2,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  Upload,
  Download,
  RefreshCw,
} from 'lucide-react';
import { PetugasReport, FeedItemLeak, LeakageRecord, WarehouseSettings } from '../types';
import { defaultPetugasReport, sampleJapfaReportItems, initialFeedTypes } from '../data/samplePetugasReport';
import { isIndonesianRedDay } from '../data/initialData';
import { formatNumberIndonesian } from '../utils/calculations';
import { exportPetugasReportToExcel, importPetugasReportFromExcel } from '../utils/excelExport';
import { firestoreService } from '../firebase/firestoreService';
import { cacheService } from '../firebase/cacheService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface PetugasDashboardViewProps {
  settings: WarehouseSettings;
  onSaveToMainLog?: (record: Omit<LeakageRecord, 'id'>) => void;
  onSyncToMainReport?: (
    monthIndex: number,
    day: number,
    forklift: number,
    pallet: number,
    bocorProduksi: number,
    logRecord?: Omit<LeakageRecord, 'id'>,
    isRedDay?: boolean
  ) => void;
  onNavigateToMainTable?: () => void;
}

export const PetugasDashboardView: React.FC<PetugasDashboardViewProps> = ({
  settings,
  onSaveToMainLog,
  onSyncToMainReport,
  onNavigateToMainTable,
}) => {
  // Current active report being edited
  const [report, setReport] = useState<PetugasReport>(() => {
    const saved = localStorage.getItem('japfa_petugas_report');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return defaultPetugasReport;
  });

  // History of saved reports
  const [reportHistory, setReportHistory] = useState<PetugasReport[]>(() => {
    const saved = localStorage.getItem('japfa_petugas_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [defaultPetugasReport];
  });

  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const indonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Preset choices for signatures
  const workerPresets = ['Petugas FG WH', 'Hardi (Worker)', 'Budi (Worker)', 'Slamet (Worker)', 'Ahmad (Worker)', 'Wahyu (Worker)'];
  const supervisorPresets = ['AMIN SODIK (FG WH Supervisor)', 'AMIN SODIK', 'BAMBANG S. (FG WH Supervisor)', 'AGUS TRIONO (FG WH Supervisor)'];
  const headPresets = ['HERY SHAPRIANTO (Head of WH Subdept)', 'HERY SHAPRIANTO', 'ANTONIUS (Head of WH Subdept)', 'EKO PURWANTO (Head of WH Subdept)'];

  // Handle Date Selection (Per Tanggal, Per Bulan, Per Tahun)
  const handleDateChange = (newDateStr: string) => {
    if (!newDateStr) return;
    const parts = newDateStr.split('-');
    if (parts.length !== 3) return;

    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);

    if (isNaN(dateObj.getTime())) return;

    const dayName = indonesianDays[dateObj.getDay()];
    const dayNum = String(d).padStart(2, '0');
    const monthNum = String(m + 1).padStart(2, '0');
    const formatted = `${dayNum}.${monthNum}.${y}`;

    const isRedHoliday = isIndonesianRedDay(y, m + 1, d);

    const monthKey = `${y}-${monthNum}`;
    const savedSigsStr = localStorage.getItem(`japfa_sigs_${monthKey}`);
    let sigs = {
      dibuatOleh: report.dibuatOleh,
      disetujuiOleh: report.disetujuiOleh,
      diketahuiOleh: report.diketahuiOleh,
    };
    if (savedSigsStr) {
      try {
        sigs = { ...sigs, ...JSON.parse(savedSigsStr) };
      } catch (e) {
        console.error(e);
      }
    }

    const updated = {
      ...report,
      tanggalStr: newDateStr,
      hari: dayName,
      tanggalFormatted: formatted,
      isRedDay: isRedHoliday,
      ...sigs,
    };

    updateReport(updated);

    if (onSyncToMainReport) {
      const grandForklift = report.items.reduce((sum, i) => sum + (i.bocorForklift || 0), 0);
      const grandPallet = report.items.reduce((sum, i) => sum + (i.bocorPallet || 0), 0);
      const grandProduksi = report.items.reduce((sum, i) => sum + (i.bocorProduksi || 0), 0);
      onSyncToMainReport(m + 1, d, grandForklift, grandPallet, grandProduksi, undefined, isRedHoliday);
    }

    showToast(`Tanggal disesuaikan ke ${dayName}, ${formatted}${isRedHoliday ? ' (Hari Libur / Latar Merah)' : ''}.`);
  };

  // Toggle Red Day / Hari Libur for Excel
  const handleToggleRedDay = (isRed: boolean) => {
    const updated = { ...report, isRedDay: isRed };
    updateReport(updated);

    const parts = report.tanggalStr.split('-');
    const mIdx = parts[1] ? parseInt(parts[1], 10) : 1;
    const dNum = parts[2] ? parseInt(parts[2], 10) : 1;

    if (onSyncToMainReport) {
      const grandForklift = report.items.reduce((sum, i) => sum + (i.bocorForklift || 0), 0);
      const grandPallet = report.items.reduce((sum, i) => sum + (i.bocorPallet || 0), 0);
      const grandProduksi = report.items.reduce((sum, i) => sum + (i.bocorProduksi || 0), 0);

      onSyncToMainReport(
        mIdx,
        dNum,
        grandForklift,
        grandPallet,
        grandProduksi,
        undefined,
        isRed
      );
    }

    if (isRed) {
      showToast(`Hari Libur / Off AKTIF untuk tanggal ${report.tanggalFormatted}! Latar merah diaktifkan pada Laporan Rekap Excel.`);
    } else {
      showToast(`Hari Libur / Off dinonaktifkan untuk tanggal ${report.tanggalFormatted}.`);
    }
  };

  // Save signature names as default for the selected month & year
  const handleSaveSignatureDefaultsForMonth = () => {
    const parts = report.tanggalStr.split('-');
    const yearMonthKey = `${parts[0]}-${parts[1]}`;
    const sigs = {
      dibuatOleh: report.dibuatOleh,
      disetujuiOleh: report.disetujuiOleh,
      diketahuiOleh: report.diketahuiOleh,
    };
    localStorage.setItem(`japfa_sigs_${yearMonthKey}`, JSON.stringify(sigs));
    showToast(`Penanggung Jawab (Dibuat: ${report.dibuatOleh}, Disetujui: ${report.disetujuiOleh}, Diketahui: ${report.diketahuiOleh}) disimpan sebagai default untuk bulan ${parts[1]}/${parts[0]}!`);
  };

  // Sync current report to localStorage
  const updateReport = (newReport: PetugasReport) => {
    setReport(newReport);
    localStorage.setItem('japfa_petugas_report', JSON.stringify(newReport));
    setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  // Show Toast
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Export Petugas Report to Excel (.xlsx) with Realtime Data
  const handleExportExcel = () => {
    try {
      exportPetugasReportToExcel(report, settings);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      showToast('Berhasil mengunduh Laporan Petugas ke file Excel (.xlsx) secara real-time!');
    } catch (err: any) {
      alert('Gagal mengunduh Excel: ' + (err.message || err));
    }
  };

  // Upload & Import Petugas Report from Excel (.xlsx)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    try {
      const importedItems = await importPetugasReportFromExcel(file);
      const updatedReport = {
        ...report,
        items: importedItems,
      };
      setReport(updatedReport);
      localStorage.setItem('japfa_petugas_report', JSON.stringify(updatedReport));

      // Calculate totals and sync directly to Main Monthly Excel Report
      const grandForklift = importedItems.reduce((sum, i) => sum + (i.bocorForklift || 0), 0);
      const grandPallet = importedItems.reduce((sum, i) => sum + (i.bocorPallet || 0), 0);
      const grandProduksi = importedItems.reduce((sum, i) => sum + (i.bocorProduksi || 0), 0);
      const grandTotalBocor = importedItems.reduce((sum, i) => sum + (i.totalBocor || 0), 0);

      const parts = updatedReport.tanggalStr.split('-');
      const mIdx = parts[1] ? parseInt(parts[1], 10) : 7;
      const dNum = parts[2] ? parseInt(parts[2], 10) : 18;

      if (onSyncToMainReport) {
        onSyncToMainReport(
          mIdx,
          dNum,
          grandForklift,
          grandPallet,
          grandProduksi,
          {
            date: updatedReport.tanggalStr,
            monthIndex: mIdx,
            day: dNum,
            forklift: grandForklift,
            pallet: grandPallet,
            bocorProduksi: grandProduksi,
            totalBocor: grandTotalBocor,
            shift: updatedReport.shift,
            operator: updatedReport.dibuatOleh,
            catatan: `Import Excel Petugas (${grandTotalBocor} karung - ${importedItems.length} jenis pakan)`,
          }
        );
      } else if (onSaveToMainLog) {
        onSaveToMainLog({
          date: updatedReport.tanggalStr,
          monthIndex: mIdx,
          day: dNum,
          forklift: grandForklift,
          pallet: grandPallet,
          bocorProduksi: grandProduksi,
          totalBocor: grandTotalBocor,
          shift: updatedReport.shift,
          operator: updatedReport.dibuatOleh,
          catatan: `Import Excel Petugas (${grandTotalBocor} karung)`,
        });
      }

      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      showToast(`Berhasil upload file Excel! ${importedItems.length} jenis pakan langsung tersinkron ke Laporan Utama Rekap Bulanan.`);
    } catch (err: any) {
      alert('Gagal mengimpor file Excel: ' + (err.message || err));
    } finally {
      setIsSyncing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Row field update handler
  const handleItemChange = (
    index: number,
    field: keyof FeedItemLeak,
    value: string | number
  ) => {
    const newItems = [...report.items];
    const item = { ...newItems[index] };

    if (
      field === 'bocorForklift' ||
      field === 'bocorPallet' ||
      field === 'bocorProduksi' ||
      field === 'totalBocor' ||
      field === 'stakAwal' ||
      field === 'totalJahit' ||
      field === 'gantiKarung' ||
      field === 'tidakGantiKarung' ||
      field === 'sisaAkhir'
    ) {
      const numVal = typeof value === 'number' ? value : parseInt(value, 10) || 0;
      (item as any)[field] = numVal;

      // Auto compute totalBocor = forklift + pallet + bocorProduksi when leak sources are changed
      if (
        field === 'bocorForklift' ||
        field === 'bocorPallet' ||
        field === 'bocorProduksi'
      ) {
        item.totalBocor =
          (field === 'bocorForklift' ? numVal : item.bocorForklift || 0) +
          (field === 'bocorPallet' ? numVal : item.bocorPallet || 0) +
          (field === 'bocorProduksi' ? numVal : item.bocorProduksi || 0);

        // Default totalJahit & gantiKarung to totalBocor if auto-filling
        if (!item.totalJahit || item.totalJahit === 0) {
          item.totalJahit = item.totalBocor;
        }
        if (!item.gantiKarung || item.gantiKarung === 0) {
          item.gantiKarung = item.totalBocor;
        }
      }
    } else {
      (item as any)[field] = value;
    }

    newItems[index] = item;
    updateReport({ ...report, items: newItems });
  };

  // Add new empty row
  const handleAddRow = () => {
    const nextNo = report.items.length + 1;
    const newItem: FeedItemLeak = {
      id: Date.now().toString(),
      no: nextNo,
      jenisPakan: '',
      stakAwal: 0,
      bocorForklift: 0,
      bocorPallet: 0,
      bocorProduksi: 0,
      totalBocor: 0,
      totalJahit: 0,
      gantiKarung: 0,
      tidakGantiKarung: 0,
      sisaAkhir: 0,
      keterangan: '',
    };
    updateReport({ ...report, items: [...report.items, newItem] });
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    if (report.items.length <= 1) return;
    const newItems = report.items.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      no: i + 1,
    }));
    updateReport({ ...report, items: newItems });
  };

  // Reset to photo sample (Sabtu 18.07.2026 - 109 Karung)
  const handleResetToPhotoSample = () => {
    updateReport(defaultPetugasReport);
    showToast('Form berhasil di-reset ke data sampel foto JAPFA (109 Karung - 18.07.2026)!');
  };

  // Clear all values
  const handleClearForm = () => {
    const clearedItems = report.items.map((item) => ({
      ...item,
      stakAwal: 0,
      bocorForklift: 0,
      bocorPallet: 0,
      bocorProduksi: 0,
      totalBocor: 0,
      totalJahit: 0,
      gantiKarung: 0,
      tidakGantiKarung: 0,
      sisaAkhir: 0,
      keterangan: '',
    }));
    updateReport({ ...report, items: clearedItems });
    showToast('Formulir berhasil dikosongkan.');
  };

  // Save report to history & optional main log sync
  const handleSaveReport = () => {
    const existingIndex = reportHistory.findIndex((h) => h.id === report.id);
    let updatedHistory: PetugasReport[];
    if (existingIndex >= 0) {
      updatedHistory = [...reportHistory];
      updatedHistory[existingIndex] = report;
    } else {
      updatedHistory = [report, ...reportHistory];
    }

    setReportHistory(updatedHistory);
    localStorage.setItem('japfa_petugas_history', JSON.stringify(updatedHistory));
    cacheService.set('japfa_petugas_history', updatedHistory);
    firestoreService.savePetugasReport(report);

    // Calculate totals
    const grandForklift = report.items.reduce((sum, i) => sum + (i.bocorForklift || 0), 0);
    const grandPallet = report.items.reduce((sum, i) => sum + (i.bocorPallet || 0), 0);
    const grandProduksi = report.items.reduce((sum, i) => sum + (i.bocorProduksi || 0), 0);
    const grandTotalBocor = report.items.reduce((sum, i) => sum + (i.totalBocor || 0), 0);

    // Sync to main monthly report and log
    const parts = report.tanggalStr.split('-');
    const mIdx = parts[1] ? parseInt(parts[1], 10) : 7;
    const dNum = parts[2] ? parseInt(parts[2], 10) : 18;

    if (onSyncToMainReport) {
      onSyncToMainReport(
        mIdx,
        dNum,
        grandForklift,
        grandPallet,
        grandProduksi,
        {
          date: report.tanggalStr,
          monthIndex: mIdx,
          day: dNum,
          forklift: grandForklift,
          pallet: grandPallet,
          bocorProduksi: grandProduksi,
          totalBocor: grandTotalBocor,
          shift: report.shift,
          operator: report.dibuatOleh,
          catatan: `Laporan Petugas JAPFA (${grandTotalBocor} karung - ${report.items.filter(i => i.totalBocor > 0).length} jenis pakan)`,
        },
        report.isRedDay
      );
    } else if (onSaveToMainLog) {
      onSaveToMainLog({
        date: report.tanggalStr,
        monthIndex: mIdx,
        day: dNum,
        forklift: grandForklift,
        pallet: grandPallet,
        bocorProduksi: grandProduksi,
        totalBocor: grandTotalBocor,
        shift: report.shift,
        operator: report.dibuatOleh,
        catatan: `Laporan Petugas JAPFA (${grandTotalBocor} karung - ${report.items.filter(i => i.totalBocor > 0).length} jenis pakan)`,
      });
    }

    setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    showToast(`Laporan Petugas berhasil disimpan & disinkronkan langsung ke Laporan Rekap Bulanan Excel (${grandTotalBocor} karung)!`);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Calculations for Column Grand Totals
  const sumForklift = report.items.reduce((acc, i) => acc + (i.bocorForklift || 0), 0);
  const sumPallet = report.items.reduce((acc, i) => acc + (i.bocorPallet || 0), 0);
  const sumProduksi = report.items.reduce((acc, i) => acc + (i.bocorProduksi || 0), 0);
  const sumTotalBocor = report.items.reduce((acc, i) => acc + (i.totalBocor || 0), 0);
  const sumTotalJahit = report.items.reduce((acc, i) => acc + (i.totalJahit || 0), 0);
  const sumGanti = report.items.reduce((acc, i) => acc + (i.gantiKarung || 0), 0);
  const sumTidakGanti = report.items.reduce((acc, i) => acc + (i.tidakGantiKarung || 0), 0);

  // Prepare chart data for damaged items
  const chartData = report.items
    .filter((i) => (i.totalBocor || 0) > 0 && i.jenisPakan.trim() !== '')
    .map((i) => ({
      name: i.jenisPakan,
      Forklift: i.bocorForklift || 0,
      Pallet: i.bocorPallet || 0,
      Produksi: i.bocorProduksi || 0,
      Total: i.totalBocor || 0,
    }))
    .sort((a, b) => b.Total - a.Total);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-900 text-white p-3 rounded-xl shadow-lg border border-emerald-700 text-xs font-semibold flex items-center justify-between animate-fade-in print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-300 hover:text-white text-xs font-bold px-2 py-0.5"
          >
            &times;
          </button>
        </div>
      )}

      {/* Action Toolbar Header (Hidden in Print) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-xs">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                DASBOR LAPORAN PETUGAS &bull; LEMBAR KERJA FG WH
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase border border-emerald-200">
                JAPFA FORM
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Lembar audit fisik karung bocor per jenis pakan ternak (pemeriksaan harian petugas gudang)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input for Excel Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            title="Upload data dari file Excel (.xlsx / .csv)"
          >
            <Upload className="w-4 h-4" />
            <span>{isSyncing ? 'Mengunggah...' : 'Upload Excel'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            title="Download Laporan Petugas ke File Excel (.xlsx) Realtime"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleResetToPhotoSample}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-extrabold shadow-xs transition-colors"
            title="Muat Ulang Sampel Foto JAPFA 18.07.2026 (109 Karung)"
          >
            <Sparkles className="w-4 h-4" />
            <span>Sampel Foto (109)</span>
          </button>

          <button
            onClick={handleSaveReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>Simpan & Sync Log</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Realtime Excel & Log Sync Status Banner (Print Hidden) */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 font-medium print:hidden">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
          <span className="font-bold text-emerald-950">Integrasi Realtime Laporan Excel Aktif</span>
          <span className="text-emerald-700 font-normal hidden md:inline">&bull; Data tersinkron otomatis ke Laporan Rekap Bulanan</span>
          {onNavigateToMainTable && (
            <button
              onClick={onNavigateToMainTable}
              className="ml-2 flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Buka Tampilan Laporan Excel Utama &rarr;</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">
          <Clock className="w-3.5 h-3.5 text-emerald-700" />
          <span>Update Terakhir: {lastSyncTime}</span>
        </div>
      </div>

      {/* Top Quick Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-900 shadow-xs flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">GRAND TOTAL BOCOR</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400">{formatNumberIndonesian(sumTotalBocor)}</span>
            <span className="text-xs text-slate-300 font-normal">karung</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Forklift: {sumForklift} | Pallet: {sumPallet} | Prod: {sumProduksi}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">TOTAL JAHIT ULANG</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{formatNumberIndonesian(sumTotalJahit)}</span>
            <span className="text-xs text-slate-500 font-normal">karung</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1">100% Karung ditangani jahit</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">GANTI KARUNG</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{formatNumberIndonesian(sumGanti)}</span>
            <span className="text-xs text-slate-500 font-normal">karung</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Tidak ganti: <strong className="text-amber-600">{sumTidakGanti} karung</strong></span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">PENYEBAB UTAMA</span>
          <div className="mt-1">
            <span className="text-sm font-extrabold text-slate-900 block truncate">
              {sumPallet >= sumForklift && sumPallet >= sumProduksi
                ? `Pallet (${Math.round((sumPallet / (sumTotalBocor || 1)) * 100)}%)`
                : sumForklift >= sumProduksi
                ? `Forklift (${Math.round((sumForklift / (sumTotalBocor || 1)) * 100)}%)`
                : `Bocor Produksi (${Math.round((sumProduksi / (sumTotalBocor || 1)) * 100)}%)`}
            </span>
            <span className="text-[10px] text-red-600 font-semibold mt-0.5 block">
              {sumPallet} karung tersengat paku pallet
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Control Panel: Tanggal & Penanggung Jawab (Per Tanggal / Bulan / Tahun) */}
      <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs print:hidden space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Pengaturan Tanggal & Penanggung Jawab Laporan
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Nama Petugas, Supervisor, dan Head Subdept dapat disesuaikan per tanggal, per bulan, dan per tahun
              </p>
            </div>
          </div>
          <button
            onClick={handleSaveSignatureDefaultsForMonth}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
            title="Simpan susunan nama ini untuk digunakan pada laporan bulan ini"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Default Bulan Ini</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tanggal / Date Picker */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Pilih Tanggal Laporan:
            </label>
            <input
              type="date"
              value={report.tanggalStr}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold px-0.5 pt-0.5">
              <span>{report.hari}, {report.tanggalFormatted}</span>
              <span className="text-blue-700 font-bold">Shift: {report.shift}</span>
            </div>
            {/* Red Day Toggle Checkbox */}
            <div className="pt-2 border-t border-slate-200">
              <label className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                report.isRedDay ? 'bg-red-500 text-white border-red-600 shadow-2xs' : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}>
                <input
                  type="checkbox"
                  checked={!!report.isRedDay}
                  onChange={(e) => handleToggleRedDay(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                />
                <span className="text-[11px] font-black uppercase tracking-tight">
                  {report.isRedDay ? '🔴 Hari Libur / Off (Latar Merah)' : '⚪ Hari Libur / Off (Aktifkan Latar Merah)'}
                </span>
              </label>
            </div>
          </div>

          {/* Dibuat Oleh */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Dibuat Oleh (Worker / Operator):
            </label>
            <div className="relative">
              <input
                type="text"
                list="worker-presets"
                value={report.dibuatOleh}
                onChange={(e) => updateReport({ ...report, dibuatOleh: e.target.value })}
                className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Petugas FG WH / Nama Operator"
              />
              <datalist id="worker-presets">
                {workerPresets.map((name, i) => (
                  <option key={i} value={name} />
                ))}
              </datalist>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Jabatan: FG WH Worker</span>
          </div>

          {/* Disetujui Oleh */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Disetujui Oleh (Supervisor):
            </label>
            <div className="relative">
              <input
                type="text"
                list="supervisor-presets"
                value={report.disetujuiOleh}
                onChange={(e) => updateReport({ ...report, disetujuiOleh: e.target.value })}
                className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="AMIN SODIK (FG WH Supervisor)"
              />
              <datalist id="supervisor-presets">
                {supervisorPresets.map((name, i) => (
                  <option key={i} value={name} />
                ))}
              </datalist>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Jabatan: FG WH Supervisor</span>
          </div>

          {/* Diketahui Oleh */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Diketahui Oleh (Head Subdept):
            </label>
            <div className="relative">
              <input
                type="text"
                list="head-presets"
                value={report.diketahuiOleh}
                onChange={(e) => updateReport({ ...report, diketahuiOleh: e.target.value })}
                className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="HERY SHAPRIANTO (Head of WH Subdept)"
              />
              <datalist id="head-presets">
                {headPresets.map((name, i) => (
                  <option key={i} value={name} />
                ))}
              </datalist>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Jabatan: Head of WH Subdept</span>
          </div>
        </div>
      </div>

      {/* Main Form Sheet (Designed to match JAPFA paper form exactly!) */}
      <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-xs print:p-0 print:border-none print:shadow-none space-y-5">
        {/* Paper Sheet Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-slate-900 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="border-2 border-slate-900 px-3 py-1 font-black text-xl tracking-tighter text-slate-900">
              JAPFA
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                LAPORAN KARUNG BOCOR
              </h1>
              <p className="text-xs text-slate-600 font-semibold">
                FINISHING & FINISHED GOODS WAREHOUSE (FG WH)
              </p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-800 font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Hari/Tanggal:</span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={report.hari}
                  onChange={(e) => updateReport({ ...report, hari: e.target.value })}
                  className="border border-slate-300 rounded px-2 py-0.5 font-bold text-xs bg-slate-50 focus:bg-white w-20 text-slate-900 print:border-none print:bg-transparent"
                  placeholder="Hari"
                />
                <span>/</span>
                <input
                  type="text"
                  value={report.tanggalFormatted}
                  onChange={(e) => updateReport({ ...report, tanggalFormatted: e.target.value })}
                  className="border border-slate-300 rounded px-2 py-0.5 font-bold text-xs bg-slate-50 focus:bg-white w-28 text-slate-900 print:border-none print:bg-transparent"
                  placeholder="DD.MM.YYYY"
                />
                <input
                  type="date"
                  value={report.tanggalStr}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-6 h-6 p-0 border border-slate-300 rounded text-transparent bg-slate-100 cursor-pointer print:hidden"
                  title="Pilih tanggal dari kalender"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Shift Kerja:</span>
              <select
                value={report.shift}
                onChange={(e) => updateReport({ ...report, shift: e.target.value })}
                className="border border-slate-300 rounded px-2 py-0.5 text-xs font-semibold bg-slate-50"
              >
                <option value="Shift 1">Shift 1 (07.00 - 15.00)</option>
                <option value="Shift 2">Shift 2 (15.00 - 23.00)</option>
                <option value="Shift 3">Shift 3 (23.00 - 07.00)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 print:hidden pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!report.isRedDay}
                  onChange={(e) => handleToggleRedDay(e.target.checked)}
                  className="w-3.5 h-3.5 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                />
                <span className={`text-[11px] font-bold ${report.isRedDay ? 'text-red-600 font-black' : 'text-slate-600'}`}>
                  {report.isRedDay ? '🔴 HARI LIBUR / OFF (LATAR MERAH EXCEL)' : 'Status: Hari Kerja Biasa'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Paper Sheet Worksheet Table */}
        <datalist id="pakan-options">
          {initialFeedTypes.filter(Boolean).map((feed, i) => (
            <option key={i} value={feed} />
          ))}
        </datalist>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse border border-slate-800 font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800 text-[10px] uppercase text-center">
                <th className="p-2 border border-slate-800 w-10">NO.</th>
                <th className="p-2 border border-slate-800 text-left min-w-[140px]">JENIS PAKAN TERNAK</th>
                <th className="p-2 border border-slate-800 w-20">Stok Awal</th>
                <th className="p-2 border border-slate-800 w-20 bg-amber-50/50">Bocor Forklift</th>
                <th className="p-2 border border-slate-800 w-20 bg-amber-50/50">Bocor Pallet</th>
                <th className="p-2 border border-slate-800 w-20 bg-amber-50/50">Bocor Produksi</th>
                <th className="p-2 border border-slate-800 w-24 bg-amber-100 text-amber-950 font-black">Total Bocor</th>
                <th className="p-2 border border-slate-800 w-20">Total Jahit</th>
                <th className="p-2 border border-slate-800 w-20">Ganti Karung</th>
                <th className="p-2 border border-slate-800 w-20">Tidak Ganti Karung</th>
                <th className="p-2 border border-slate-800 w-20">Sisa Akhir</th>
                <th className="p-2 border border-slate-800 text-left min-w-[120px]">Keterangan</th>
                <th className="p-2 border border-slate-800 w-10 print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {report.items.map((item, index) => {
                const isDamaged = (item.totalBocor || 0) > 0;
                return (
                  <tr
                    key={item.id || index}
                    className={`border-b border-slate-300 text-center hover:bg-slate-50 transition-colors ${
                      isDamaged ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="p-1.5 border border-slate-800 font-bold text-slate-700">
                      {index + 1}
                    </td>

                    <td className="p-1 border border-slate-800 text-left font-bold text-slate-900">
                      <input
                        type="text"
                        list="pakan-options"
                        value={item.jenisPakan}
                        onChange={(e) => handleItemChange(index, 'jenisPakan', e.target.value)}
                        placeholder="Pilih/ketik pakan..."
                        className="w-full px-1.5 py-0.5 font-bold text-slate-900 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 rounded uppercase"
                      />
                    </td>

                    <td className="p-1 border border-slate-800">
                      <input
                        type="number"
                        min="0"
                        value={item.stakAwal || ''}
                        onChange={(e) => handleItemChange(index, 'stakAwal', e.target.value)}
                        className="w-full text-center py-0.5 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 font-semibold text-slate-900"
                      />
                    </td>

                    <td className="p-1 border border-slate-800 bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        value={item.bocorForklift || ''}
                        onChange={(e) => handleItemChange(index, 'bocorForklift', e.target.value)}
                        className={`w-full text-center py-0.5 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 font-extrabold ${
                          item.bocorForklift ? 'text-slate-900 font-black' : 'text-slate-400'
                        }`}
                      />
                    </td>

                    <td className="p-1 border border-slate-800 bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        value={item.bocorPallet || ''}
                        onChange={(e) => handleItemChange(index, 'bocorPallet', e.target.value)}
                        className={`w-full text-center py-0.5 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 font-extrabold ${
                          item.bocorPallet ? 'text-slate-900 font-black' : 'text-slate-400'
                        }`}
                      />
                    </td>

                    <td className="p-1 border border-slate-800 bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        value={item.bocorProduksi || ''}
                        onChange={(e) => handleItemChange(index, 'bocorProduksi', e.target.value)}
                        className={`w-full text-center py-0.5 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 font-extrabold ${
                          item.bocorProduksi ? 'text-slate-900 font-black' : 'text-slate-400'
                        }`}
                      />
                    </td>

                    {/* Total Bocor Column (Editable & Auto-Calculated) */}
                    <td className="p-1 border border-slate-800 bg-amber-100/90">
                      <input
                        type="number"
                        min="0"
                        value={item.totalBocor || ''}
                        onChange={(e) => handleItemChange(index, 'totalBocor', e.target.value)}
                        className="w-full text-center py-0.5 font-black text-sm text-slate-950 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 rounded"
                      />
                    </td>

                    <td className="p-1 border border-slate-800">
                      <input
                        type="number"
                        min="0"
                        value={item.totalJahit || ''}
                        onChange={(e) => handleItemChange(index, 'totalJahit', e.target.value)}
                        className="w-full text-center py-0.5 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 font-semibold"
                      />
                    </td>

                    <td className="p-1 border border-slate-800">
                      <input
                        type="number"
                        min="0"
                        value={item.gantiKarung || ''}
                        onChange={(e) => handleItemChange(index, 'gantiKarung', e.target.value)}
                        className="w-full text-center py-0.5 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 font-semibold"
                      />
                    </td>

                    <td className="p-1 border border-slate-800">
                      <input
                        type="number"
                        min="0"
                        value={item.tidakGantiKarung || ''}
                        onChange={(e) => handleItemChange(index, 'tidakGantiKarung', e.target.value)}
                        className="w-full text-center py-0.5 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 font-semibold"
                      />
                    </td>

                    <td className="p-1 border border-slate-800">
                      <input
                        type="number"
                        min="0"
                        value={item.sisaAkhir || ''}
                        onChange={(e) => handleItemChange(index, 'sisaAkhir', e.target.value)}
                        className="w-full text-center py-0.5 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 font-semibold"
                      />
                    </td>

                    <td className="p-1 border border-slate-800 text-left">
                      <input
                        type="text"
                        value={item.keterangan || ''}
                        onChange={(e) => handleItemChange(index, 'keterangan', e.target.value)}
                        placeholder="..."
                        className="w-full px-1 py-0.5 text-xs text-slate-700 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
                      />
                    </td>

                    <td className="p-1 border border-slate-800 text-center print:hidden">
                      <button
                        onClick={() => handleDeleteRow(index)}
                        className="p-1 text-slate-300 hover:text-red-600 transition-colors"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Bottom Summary Row */}
              <tr className="bg-slate-900 text-white font-extrabold border-2 border-slate-900 text-center text-xs">
                <td colSpan={3} className="p-2 border border-slate-800 text-right uppercase tracking-wider">
                  JUMLAH TOTAL:
                </td>
                <td className="p-2 border border-slate-800 text-amber-300 font-black">{sumForklift || 0}</td>
                <td className="p-2 border border-slate-800 text-amber-300 font-black">{sumPallet || 0}</td>
                <td className="p-2 border border-slate-800 text-amber-300 font-black">{sumProduksi || 0}</td>

                {/* Circled Grand Total Bocor */}
                <td className="p-2 border border-slate-800 bg-amber-400 text-slate-950 font-black text-base relative">
                  <div className="inline-block px-2 py-0.5 border-2 border-slate-950 rounded-full font-black text-lg">
                    {sumTotalBocor || 0}
                  </div>
                </td>

                <td className="p-2 border border-slate-800">{sumTotalJahit || 0}</td>
                <td className="p-2 border border-slate-800">{sumGanti || 0}</td>
                <td className="p-2 border border-slate-800">{sumTidakGanti || 0}</td>
                <td className="p-2 border border-slate-800">-</td>
                <td className="p-2 border border-slate-800 text-left font-normal text-[10px] text-slate-300">
                  Form Laporan Fisik FG WH
                </td>
                <td className="p-2 border border-slate-800 print:hidden"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Form Controls below table */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition-colors"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              <span>Tambah Baris Pakan</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-300 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>Upload Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              <span>Unduh Excel Realtime</span>
            </button>
          </div>

          <button
            onClick={handleClearForm}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kosongkan Angka</span>
          </button>
        </div>

        {/* Paper Sheet Signatures Block */}
        <div className="pt-6 border-t border-slate-300 grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-xs">
          {/* Box 1: Dibuat Oleh */}
          <div className="border border-slate-400 rounded-lg p-3 bg-slate-50 flex flex-col justify-between h-40 shadow-2xs">
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block border-b border-slate-200 pb-1">
                DIBUAT OLEH:
              </span>
              <span className="text-[9px] text-slate-400 block pt-1">
                Tgl: {report.tanggalFormatted} ({report.hari})
              </span>
            </div>

            <div className="my-auto pt-2">
              <input
                type="text"
                list="worker-presets"
                value={report.dibuatOleh}
                onChange={(e) => updateReport({ ...report, dibuatOleh: e.target.value })}
                className="w-full text-center font-bold text-slate-900 border-b-2 border-slate-700 focus:outline-none focus:border-blue-600 bg-transparent text-xs py-1"
                placeholder="Petugas FG WH"
              />
              <span className="text-[10px] text-slate-500 block mt-1 font-semibold">
                FG WH Worker
              </span>
            </div>
          </div>

          {/* Box 2: Disetujui Oleh */}
          <div className="border border-slate-400 rounded-lg p-3 bg-slate-50 flex flex-col justify-between h-40 shadow-2xs">
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block border-b border-slate-200 pb-1">
                DISETUJUI OLEH:
              </span>
              <span className="text-[9px] text-slate-400 block pt-1">
                Tgl: {report.tanggalFormatted} ({report.hari})
              </span>
            </div>

            <div className="my-auto pt-2">
              <input
                type="text"
                list="supervisor-presets"
                value={report.disetujuiOleh}
                onChange={(e) => updateReport({ ...report, disetujuiOleh: e.target.value })}
                className="w-full text-center font-extrabold text-slate-900 border-b-2 border-slate-700 focus:outline-none focus:border-blue-600 bg-transparent text-xs py-1"
                placeholder="AMIN SODIK (FG WH Supervisor)"
              />
              <span className="text-[10px] text-slate-500 block mt-1 font-semibold">
                FG WH Supervisor
              </span>
            </div>
          </div>

          {/* Box 3: Diketahui Oleh */}
          <div className="border border-slate-400 rounded-lg p-3 bg-slate-50 flex flex-col justify-between h-40 shadow-2xs">
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block border-b border-slate-200 pb-1">
                DIKETAHUI OLEH:
              </span>
              <span className="text-[9px] text-slate-400 block pt-1">
                Tgl: {report.tanggalFormatted} ({report.hari})
              </span>
            </div>

            <div className="my-auto pt-2">
              <input
                type="text"
                list="head-presets"
                value={report.diketahuiOleh}
                onChange={(e) => updateReport({ ...report, diketahuiOleh: e.target.value })}
                className="w-full text-center font-extrabold text-slate-900 border-b-2 border-slate-700 focus:outline-none focus:border-blue-600 bg-transparent text-xs py-1"
                placeholder="HERY SHAPRIANTO (Head of WH Subdept)"
              />
              <span className="text-[10px] text-slate-500 block mt-1 font-semibold">
                Head of WH Subdept
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section by Jenis Pakan (Hidden in Print) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs print:hidden space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-slate-700" />
              ANALISIS KERUSAKAN PER JENIS PAKAN TERNAK
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Sebaran jumlah karung bocor berdasarkan varian pakan
            </p>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} karung`, 'Total Bocor']}
                />
                <Bar dataKey="Total" fill="#0f172a" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? '#f59e0b' : '#0f172a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">
            Belum ada data karung bocor yang diisi pada lembar kerja.
          </div>
        )}
      </div>
    </div>
  );
};
