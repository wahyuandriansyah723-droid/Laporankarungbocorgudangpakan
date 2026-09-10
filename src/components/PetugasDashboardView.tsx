import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  ChevronLeft,
  Upload,
  Download,
  RefreshCw,
  Layers,
  Smartphone,
  Monitor,
  Laptop,
  Wifi,
  Users,
} from 'lucide-react';
import { PetugasReport, FeedItemLeak, LeakageRecord, WarehouseSettings, MasterJenisPakan, PenanggungJawabProfile } from '../types';
import { defaultPetugasReport, sampleJapfaReportItems, initialFeedTypes, defaultMasterFeedTypes } from '../data/samplePetugasReport';
import { isIndonesianRedDay, defaultProfilPenanggungJawab } from '../data/initialData';
import { formatNumberIndonesian } from '../utils/calculations';
import { exportPetugasReportToExcel, importPetugasReportFromExcel } from '../utils/excelExport';
import { firestoreService, currentClientId, getDeviceTypeLabel, subscribeToBroadcastChannel } from '../firebase/firestoreService';
import { cacheService } from '../firebase/cacheService';
import { MasterPakanModal } from './MasterPakanModal';
import { ManageProfilTimModal } from './ManageProfilTimModal';
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
  onUpdateSettings?: (newSettings: WarehouseSettings) => void;
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
  onUpdateSettings,
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
  const [remoteSyncNotice, setRemoteSyncNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const reportRef = useRef<PetugasReport>(report);
  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  const activeReportId = report.id || `petugas_${report.tanggalStr}`;

  // 1. Synchronize all Petugas reports from cloud Firestore & local cache across devices in real-time
  useEffect(() => {
    cacheService.get<PetugasReport[]>('japfa_petugas_history', [defaultPetugasReport]).then((cached) => {
      if (cached && cached.length > 0) {
        setReportHistory(cached);
      }
    });

    const unsub = firestoreService.subscribePetugasReports((cloudReports) => {
      if (cloudReports && cloudReports.length > 0) {
        setReportHistory(cloudReports);

        // Check if the currently active date was updated remotely by another device (HP, PC, laptop)
        const currentActive = reportRef.current;
        const matchingDoc = cloudReports.find(
          (c) =>
            (c.id === currentActive.id || c.tanggalStr === currentActive.tanggalStr) &&
            c.lastModifiedByClientId &&
            c.lastModifiedByClientId !== currentClientId
        );

        if (matchingDoc) {
          const isUserTyping =
            typeof document !== 'undefined' &&
            document.activeElement &&
            document.activeElement.tagName === 'INPUT';

          if (!isUserTyping) {
            setReport(matchingDoc);
            localStorage.setItem('japfa_petugas_report', JSON.stringify(matchingDoc));
            setLastSyncTime(
              new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
            setRemoteSyncNotice(`⚡ Pembaruan otomatis diterima dari ${matchingDoc.lastModifiedDevice || 'perangkat lain'}`);
            setTimeout(() => setRemoteSyncNotice(null), 4000);
          }
        }
      }
    });

    return () => {
      unsub();
    };
  }, []);

  // 2. Direct real-time document listener specifically for the active date sheet
  useEffect(() => {
    if (!activeReportId) return;

    const unsubDoc = firestoreService.subscribeSinglePetugasReport(activeReportId, (cloudReport) => {
      if (!cloudReport) return;

      // Only update if authored by another device/session
      if (cloudReport.lastModifiedByClientId && cloudReport.lastModifiedByClientId !== currentClientId) {
        const isUserTyping =
          typeof document !== 'undefined' &&
          document.activeElement &&
          document.activeElement.tagName === 'INPUT';

        if (!isUserTyping) {
          setReport(cloudReport);
          localStorage.setItem('japfa_petugas_report', JSON.stringify(cloudReport));
          setLastSyncTime(
            new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
          setRemoteSyncNotice(
            `⚡ Data diperbarui real-time dari ${cloudReport.lastModifiedDevice || 'perangkat lain'} (${cloudReport.tanggalFormatted || cloudReport.tanggalStr})`
          );
          setTimeout(() => setRemoteSyncNotice(null), 4000);
        }
      }
    });

    return () => {
      unsubDoc();
    };
  }, [activeReportId]);

  // 3. Local cross-tab broadcast listener (0ms instant sync for multiple browser tabs/windows on the same computer)
  useEffect(() => {
    const unsubBroadcast = subscribeToBroadcastChannel((msg) => {
      if (msg.type === 'petugas' && msg.data) {
        const incoming = msg.data as PetugasReport;
        const currentActive = reportRef.current;
        if (incoming.id === currentActive.id || incoming.tanggalStr === currentActive.tanggalStr) {
          const isUserTyping =
            typeof document !== 'undefined' &&
            document.activeElement &&
            document.activeElement.tagName === 'INPUT';

          if (!isUserTyping) {
            setReport(incoming);
            localStorage.setItem('japfa_petugas_report', JSON.stringify(incoming));
            setLastSyncTime(
              new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
            setRemoteSyncNotice('⚡ Pembaruan instan disinkronkan dari tab lain');
            setTimeout(() => setRemoteSyncNotice(null), 3000);
          }
        }
      }
    });

    return () => {
      unsubBroadcast();
    };
  }, []);

  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const indonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Preset choices for signatures (populated from settings & defaults)
  const workerPresets = Array.from(
    new Set([
      settings.penanggungJawab?.dibuatOleh,
      ...(settings.daftarProfilPenanggungJawab
        ?.filter((p) => p.peran === 'dibuat' || p.peran === 'umum')
        .map((p) => p.nama) || []),
      'Petugas FG WH',
      'Hardi (Worker)',
      'Budi (Worker)',
      'Slamet (Worker)',
      'Ahmad (Worker)',
      'Wahyu (Worker)',
    ])
  ).filter(Boolean) as string[];

  const supervisorPresets = Array.from(
    new Set([
      settings.penanggungJawab?.disetujuiOleh,
      ...(settings.daftarProfilPenanggungJawab
        ?.filter((p) => p.peran === 'disetujui' || p.peran === 'umum')
        .map((p) => p.nama) || []),
      'AMIN SODIK (FG WH Supervisor)',
      'AMIN SODIK',
      'BAMBANG S. (FG WH Supervisor)',
      'AGUS TRIONO (FG WH Supervisor)',
    ])
  ).filter(Boolean) as string[];

  const headPresets = Array.from(
    new Set([
      settings.penanggungJawab?.diketahuiOleh,
      ...(settings.daftarProfilPenanggungJawab
        ?.filter((p) => p.peran === 'diketahui' || p.peran === 'umum')
        .map((p) => p.nama) || []),
      'HERY SHAPRIANTO (Head of WH Subdept)',
      'HERY SHAPRIANTO',
      'ANTONIUS (Head of WH Subdept)',
      'EKO PURWANTO (Head of WH Subdept)',
    ])
  ).filter(Boolean) as string[];

  const handleLoadFromSystemSettings = () => {
    let updated = { ...report };
    if (settings.penanggungJawab) {
      if (settings.penanggungJawab.dibuatOleh) updated.dibuatOleh = settings.penanggungJawab.dibuatOleh;
      if (settings.penanggungJawab.disetujuiOleh) updated.disetujuiOleh = settings.penanggungJawab.disetujuiOleh;
      if (settings.penanggungJawab.diketahuiOleh) updated.diketahuiOleh = settings.penanggungJawab.diketahuiOleh;
    }
    if (settings.pengaturanTanggal?.mode === 'custom' && settings.pengaturanTanggal.tanggalCustom) {
      handleDateChange(settings.pengaturanTanggal.tanggalCustom);
    }
    updateReport(updated);
    setNotification('Data penanggung jawab & tanggal berhasil dimuat dari Pengaturan Sistem!');
    setTimeout(() => setNotification(null), 3500);
  };

  const handleClearSignatures = () => {
    updateReport({
      ...report,
      dibuatOleh: '',
      disetujuiOleh: '',
      diketahuiOleh: '',
    });
    setNotification('Penanggung jawab laporan dikosongkan.');
    setTimeout(() => setNotification(null), 3000);
  };

  // Team Signatory Profiles Modal & Handlers
  const [isManageProfilModalOpen, setIsManageProfilModalOpen] = useState(false);

  const profilTimList: PenanggungJawabProfile[] = useMemo(() => {
    if (settings.daftarProfilPenanggungJawab && settings.daftarProfilPenanggungJawab.length > 0) {
      return settings.daftarProfilPenanggungJawab;
    }
    return defaultProfilPenanggungJawab;
  }, [settings.daftarProfilPenanggungJawab]);

  const handleSaveProfilTim = async (newList: PenanggungJawabProfile[]) => {
    const updatedSettings: WarehouseSettings = {
      ...settings,
      daftarProfilPenanggungJawab: newList,
    };
    if (onUpdateSettings) {
      onUpdateSettings(updatedSettings);
    } else {
      await firestoreService.saveSettings(updatedSettings);
      await cacheService.set('karung_bocor_settings', updatedSettings);
    }
    setNotification('Daftar profil tim penanggung jawab berhasil diperbarui dan disinkronkan ke cloud!');
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSelectProfileForSignatory = (
    profile: PenanggungJawabProfile,
    role: 'dibuat' | 'disetujui' | 'diketahui'
  ) => {
    if (role === 'dibuat') {
      updateReport({ ...report, dibuatOleh: profile.nama });
    } else if (role === 'disetujui') {
      const formatted = profile.jabatan ? `${profile.nama} (${profile.jabatan})` : profile.nama;
      updateReport({ ...report, disetujuiOleh: formatted });
    } else if (role === 'diketahui') {
      const formatted = profile.jabatan ? `${profile.nama} (${profile.jabatan})` : profile.nama;
      updateReport({ ...report, diketahuiOleh: formatted });
    }
    setNotification(
      `Profil "${profile.nama}" berhasil dipilih sebagai ${
        role === 'dibuat' ? 'Dibuat Oleh' : role === 'disetujui' ? 'Disetujui Oleh' : 'Diketahui Oleh'
      }!`
    );
    setTimeout(() => setNotification(null), 3000);
  };

  // Master Data Modal & Feeds List
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  const masterPakanList: MasterJenisPakan[] = useMemo(() => {
    if (settings.masterJenisPakan && settings.masterJenisPakan.length > 0) {
      return settings.masterJenisPakan;
    }
    return defaultMasterFeedTypes;
  }, [settings.masterJenisPakan]);

  const activeMasterPakan = useMemo(() => {
    return masterPakanList.filter((f) => f.isActive);
  }, [masterPakanList]);

  // Fast lookup map from feed name to Master item (for displaying codes / metadata)
  const masterFeedMap = useMemo(() => {
    const map = new Map<string, MasterJenisPakan>();
    masterPakanList.forEach((m) => {
      map.set(m.nama.toLowerCase().trim(), m);
    });
    return map;
  }, [masterPakanList]);

  const handleSaveMasterPakan = async (newList: MasterJenisPakan[]) => {
    const updatedSettings: WarehouseSettings = {
      ...settings,
      masterJenisPakan: newList,
    };
    if (onUpdateSettings) {
      onUpdateSettings(updatedSettings);
    } else {
      await firestoreService.saveSettings(updatedSettings);
      await cacheService.set('karung_bocor_settings', updatedSettings);
    }
    setNotification('Master data jenis pakan berhasil disimpan & disinkronkan!');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApplyMasterToActiveReport = (activeFeedNames: string[]) => {
    if (!activeFeedNames || activeFeedNames.length === 0) return;

    const existingByFeed = new Map<string, FeedItemLeak>();
    report.items.forEach((item) => {
      if (item.jenisPakan && item.jenisPakan.trim()) {
        existingByFeed.set(item.jenisPakan.trim().toLowerCase(), item);
      }
    });

    const newRows: FeedItemLeak[] = activeFeedNames.map((name, index) => {
      const existing = existingByFeed.get(name.trim().toLowerCase());
      if (existing) {
        return {
          ...existing,
          no: index + 1,
          jenisPakan: name,
        };
      }
      return {
        id: `item_${Date.now()}_${index + 1}`,
        no: index + 1,
        jenisPakan: name,
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
    });

    // Ensure at least 20 rows
    const finalRows = [...newRows];
    while (finalRows.length < 20) {
      const idx = finalRows.length + 1;
      finalRows.push({
        id: `item_${Date.now()}_${idx}`,
        no: idx,
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
      });
    }

    updateReport({
      ...report,
      items: finalRows,
    });
    setNotification(`Berhasil menerapkan ${activeFeedNames.length} jenis pakan aktif ke lembar hari ini!`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper to generate empty feed items (preserving pakan names but zeroing all quantities)
  const createEmptyFeedItems = (baseItems?: FeedItemLeak[]): FeedItemLeak[] => {
    let feedNames: string[] = [];
    if (baseItems && baseItems.length > 0) {
      feedNames = baseItems.map((i) => i.jenisPakan);
    } else {
      feedNames = activeMasterPakan.length > 0 ? activeMasterPakan.map((f) => f.nama) : initialFeedTypes;
    }

    if (feedNames.length === 0) {
      feedNames = initialFeedTypes;
    }

    const rows = feedNames.map((name, index) => ({
      id: `item_${Date.now()}_${index + 1}`,
      no: index + 1,
      jenisPakan: name || '',
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

    while (rows.length < 20) {
      const idx = rows.length + 1;
      rows.push({
        id: `item_${Date.now()}_${idx}`,
        no: idx,
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
      });
    }

    return rows;
  };

  // Quick Day Shifter (H-1 / H+1)
  const handleShiftDay = (deltaDays: number) => {
    const parts = report.tanggalStr.split('-');
    if (parts.length !== 3) return;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d + deltaDays);
    if (isNaN(dateObj.getTime())) return;
    const nextY = dateObj.getFullYear();
    const nextM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nextD = String(dateObj.getDate()).padStart(2, '0');
    handleDateChange(`${nextY}-${nextM}-${nextD}`);
  };

  // Parse typed DD.MM.YYYY string
  const handleFormattedDateBlur = (val: string) => {
    const match = val.trim().match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})$/);
    if (match) {
      const d = match[1].padStart(2, '0');
      const m = match[2].padStart(2, '0');
      const y = match[3];
      handleDateChange(`${y}-${m}-${d}`);
    }
  };

  // Handle Date Selection (Per Tanggal, Per Bulan, Per Tahun)
  const handleDateChange = (newDateStr: string) => {
    if (!newDateStr) return;
    if (newDateStr === report.tanggalStr) return;

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

    // 1. Simpan laporan aktif hari saat ini ke history lokal agar data tidak hilang jika kembali ke tanggal ini
    let updatedHistory = [...reportHistory];
    const existingCurrentIdx = updatedHistory.findIndex(
      (h) => h.id === report.id || h.tanggalStr === report.tanggalStr
    );
    if (existingCurrentIdx >= 0) {
      updatedHistory[existingCurrentIdx] = report;
    } else {
      updatedHistory = [report, ...updatedHistory];
    }
    setReportHistory(updatedHistory);
    localStorage.setItem('japfa_petugas_history', JSON.stringify(updatedHistory));

    // 2. Cek apakah tanggal tujuan SUDAH memiliki data tersimpan di history/cloud
    const existingTargetReport = updatedHistory.find(
      (h) => h.tanggalStr === newDateStr || h.id === `petugas_${newDateStr}`
    );

    if (existingTargetReport) {
      // Muat data laporan yang sudah pernah disimpan pada tanggal ini
      const restored: PetugasReport = {
        ...existingTargetReport,
        dibuatOleh: existingTargetReport.dibuatOleh || sigs.dibuatOleh || 'Petugas FG WH',
        disetujuiOleh: existingTargetReport.disetujuiOleh || sigs.disetujuiOleh || '',
        diketahuiOleh: existingTargetReport.diketahuiOleh || sigs.diketahuiOleh || '',
      };
      updateReport(restored);
      const totalBocorRestored = restored.items.reduce((sum, i) => sum + (i.totalBocor || 0), 0);
      showToast(`Pindah ke ${dayName}, ${formatted}: Memuat data tersimpan (${totalBocorRestored} karung bocor).`);
    } else {
      // Tanggal baru: Data hari sebelumnya TIDAK IKUT / POSISI KOSONG (0 / blank)
      const emptyReport: PetugasReport = {
        id: `petugas_${newDateStr}`,
        tanggalStr: newDateStr,
        hari: dayName,
        tanggalFormatted: formatted,
        shift: report.shift || 'Shift 1',
        dibuatOleh: sigs.dibuatOleh || report.dibuatOleh || 'Petugas FG WH',
        disetujuiOleh: sigs.disetujuiOleh || report.disetujuiOleh || '',
        diketahuiOleh: sigs.diketahuiOleh || report.diketahuiOleh || '',
        statusApproval: 'Draft',
        items: createEmptyFeedItems(report.items),
        catatanPetugas: '',
        isRedDay: isRedHoliday,
        createdAt: new Date().toISOString(),
      };
      updateReport(emptyReport);
      showToast(`Pindah ke ${dayName}, ${formatted}: Tabel karung bocor dalam posisi kosong (bersih).`);
    }
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

  // Sync current report to state, localStorage & Cloud Firestore (with auto-sync across all devices)
  const updateReport = (newReport: PetugasReport, autoSyncToCloud: boolean = true) => {
    const enrichedReport: PetugasReport = {
      ...newReport,
      updatedAtStr: new Date().toISOString(),
      lastModifiedByClientId: currentClientId,
      lastModifiedDevice: getDeviceTypeLabel(),
    };

    setReport(enrichedReport);
    reportRef.current = enrichedReport;
    localStorage.setItem('japfa_petugas_report', JSON.stringify(enrichedReport));
    setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    if (autoSyncToCloud) {
      // 1. Debounced save to Firestore (600ms) - syncs to all phones, PCs, and laptops
      firestoreService.savePetugasReport(enrichedReport, 600);

      // 2. Also update monthly grand totals so Main Table (Excel) updates in real-time
      const parts = enrichedReport.tanggalStr.split('-');
      const mIdx = parts[1] ? parseInt(parts[1], 10) : 1;
      const dNum = parts[2] ? parseInt(parts[2], 10) : 1;
      if (onSyncToMainReport) {
        const grandForklift = enrichedReport.items.reduce((sum, i) => sum + (i.bocorForklift || 0), 0);
        const grandPallet = enrichedReport.items.reduce((sum, i) => sum + (i.bocorPallet || 0), 0);
        const grandProduksi = enrichedReport.items.reduce((sum, i) => sum + (i.bocorProduksi || 0), 0);
        onSyncToMainReport(
          mIdx,
          dNum,
          grandForklift,
          grandPallet,
          grandProduksi,
          undefined,
          enrichedReport.isRedDay
        );
      }
    }
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

  // Save report to database & sync to main report Excel
  const handleSaveReport = async () => {
    setIsSyncing(true);

    const finalReport: PetugasReport = {
      ...report,
      id: report.id || `petugas_${report.tanggalStr}`,
    };

    const existingIndex = reportHistory.findIndex((h) => h.id === finalReport.id || h.tanggalStr === finalReport.tanggalStr);
    let updatedHistory: PetugasReport[];
    if (existingIndex >= 0) {
      updatedHistory = [...reportHistory];
      updatedHistory[existingIndex] = finalReport;
    } else {
      updatedHistory = [finalReport, ...reportHistory];
    }

    setReportHistory(updatedHistory);
    localStorage.setItem('japfa_petugas_history', JSON.stringify(updatedHistory));
    await cacheService.set('japfa_petugas_history', updatedHistory);

    // Calculate totals accurately across all rows
    const grandForklift = finalReport.items.reduce((sum, i) => sum + (i.bocorForklift || 0), 0);
    const grandPallet = finalReport.items.reduce((sum, i) => sum + (i.bocorPallet || 0), 0);
    const grandProduksi = finalReport.items.reduce((sum, i) => sum + (i.bocorProduksi || 0), 0);
    const sumCalculated = grandForklift + grandPallet + grandProduksi;
    const explicitSum = finalReport.items.reduce((sum, i) => sum + (i.totalBocor || 0), 0);
    const grandTotalBocor = explicitSum > 0 ? explicitSum : sumCalculated;

    // Save report to Firestore collection 'petugas_reports' with immediate write (0ms debounce)
    await firestoreService.savePetugasReport(finalReport, 0);

    // Sync to main monthly report and log
    const parts = finalReport.tanggalStr.split('-');
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
          date: finalReport.tanggalStr,
          monthIndex: mIdx,
          day: dNum,
          forklift: grandForklift,
          pallet: grandPallet,
          bocorProduksi: grandProduksi,
          totalBocor: grandTotalBocor,
          shift: finalReport.shift,
          operator: finalReport.dibuatOleh,
          catatan: `Laporan Petugas JAPFA (${grandTotalBocor} karung [Forklift: ${grandForklift}, Pallet: ${grandPallet}, Produksi: ${grandProduksi}])`,
        },
        finalReport.isRedDay
      );
    } else if (onSaveToMainLog) {
      onSaveToMainLog({
        date: finalReport.tanggalStr,
        monthIndex: mIdx,
        day: dNum,
        forklift: grandForklift,
        pallet: grandPallet,
        bocorProduksi: grandProduksi,
        totalBocor: grandTotalBocor,
        shift: finalReport.shift,
        operator: finalReport.dibuatOleh,
        catatan: `Laporan Petugas JAPFA (${grandTotalBocor} karung [Forklift: ${grandForklift}, Pallet: ${grandPallet}, Produksi: ${grandProduksi}])`,
      });
    }

    setIsSyncing(false);
    setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    showToast(`Tabel Laporan Karung Bocor Berhasil Disimpan & Disinkronkan! Bocor Forklift: ${grandForklift}, Bocor Pallet: ${grandPallet}, Bocor Produksi: ${grandProduksi} (Total: ${grandTotalBocor} karung) telah tersinkronisasi ke Tampilan Laporan Excel secara Real-time.`);
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
            onClick={() => setIsMasterModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Kelola Master Data Nama Jenis Pakan Ternak JAPFA"
          >
            <Layers className="w-4 h-4 text-indigo-200" />
            <span>Master Data Pakan ({activeMasterPakan.length})</span>
          </button>

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
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-60"
            title="Simpan Laporan Petugas dan sinkronkan ke Laporan Excel Bulanan"
          >
            <Save className="w-4 h-4 text-emerald-200" />
            <span>{isSyncing ? 'Menyimpan...' : 'Simpan & Sync ke Excel'}</span>
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

      {/* Realtime Multi-Device Sync Status Banner (Print Hidden) */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300/90 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-950 font-medium shadow-2xs print:hidden">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
          <div className="flex items-center gap-1.5 font-bold text-emerald-950">
            <Wifi className="w-3.5 h-3.5 text-emerald-700" />
            <span>Sinkronisasi Real-Time Multi-Device Aktif</span>
          </div>
          <span className="text-emerald-700 font-normal hidden lg:inline">&bull;</span>
          <span className="text-emerald-800 text-[11px] hidden sm:inline">
            Terhubung live ke semua pengguna (HP, Komputer & Laptop)
          </span>

          {/* Current Device Badge */}
          <span className="inline-flex items-center gap-1 bg-white/90 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-300">
            {getDeviceTypeLabel().includes('HP') ? (
              <Smartphone className="w-3 h-3 text-emerald-600" />
            ) : getDeviceTypeLabel().includes('Laptop') ? (
              <Laptop className="w-3 h-3 text-emerald-600" />
            ) : (
              <Monitor className="w-3 h-3 text-emerald-600" />
            )}
            <span>Perangkat: {getDeviceTypeLabel()}</span>
          </span>

          {/* Remote modification source if available */}
          {report.lastModifiedDevice && (
            <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200 hidden md:inline">
              Diedit via: <strong className="text-emerald-900">{report.lastModifiedDevice}</strong>
            </span>
          )}

          {onNavigateToMainTable && (
            <button
              onClick={onNavigateToMainTable}
              className="ml-1 flex items-center gap-1 font-bold text-emerald-900 hover:text-emerald-950 underline cursor-pointer bg-white/90 hover:bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300 text-[11px] transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Lihat Rekap Excel Bulanan &rarr;</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {remoteSyncNotice && (
            <span className="bg-emerald-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
              <span>{remoteSyncNotice}</span>
            </span>
          )}
          <div className="flex items-center gap-1 text-[11px] text-emerald-900 font-semibold bg-white/90 px-2.5 py-1 rounded-md border border-emerald-300">
            <Clock className="w-3.5 h-3.5 text-emerald-700" />
            <span>Update: {lastSyncTime}</span>
          </div>
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLoadFromSystemSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              title="Muat tanggal dan nama penanggung jawab dari Pengaturan Sistem"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Muat dari Pengaturan</span>
            </button>
            <button
              onClick={handleClearSignatures}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Kosongkan nama penanggung jawab"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>
            <button
              onClick={handleSaveSignatureDefaultsForMonth}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              title="Simpan susunan nama ini untuk digunakan pada laporan bulan ini"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Default Bulan Ini</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tanggal / Date Picker */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Pilih Tanggal Laporan:
              </label>
              <span className="text-[10px] text-slate-500 font-medium">(Pindah Hari = Posisi Kosong)</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleShiftDay(-1)}
                className="px-2 py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg cursor-pointer transition-colors flex items-center gap-0.5"
                title="Pindah ke hari sebelumnya (H-1)"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>H-1</span>
              </button>
              <input
                type="date"
                value={report.tanggalStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
              />
              <button
                type="button"
                onClick={() => handleShiftDay(1)}
                className="px-2 py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg cursor-pointer transition-colors flex items-center gap-0.5"
                title="Pindah ke hari berikutnya (H+1)"
              >
                <span>H+1</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
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
                  onBlur={(e) => handleFormattedDateBlur(e.target.value)}
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
          {activeMasterPakan.map((feed) => (
            <option key={feed.id} value={feed.nama}>
              {feed.kode ? `[${feed.kode}] ` : ''}{feed.kategori ? `(${feed.kategori})` : ''}
            </option>
          ))}
        </datalist>

        {/* Dynamic Datalists for Signatories based on profilTimList */}
        <datalist id="worker-presets">
          {profilTimList
            .filter((p) => p.peran === 'dibuat' || p.peran === 'umum')
            .map((p) => (
              <option key={p.id} value={p.nama}>
                {p.jabatan ? `${p.jabatan}${p.divisi ? ` - ${p.divisi}` : ''}` : 'Petugas FG WH'}
              </option>
            ))}
        </datalist>

        <datalist id="supervisor-presets">
          {profilTimList
            .filter((p) => p.peran === 'disetujui' || p.peran === 'umum')
            .map((p) => (
              <option
                key={p.id}
                value={p.jabatan ? `${p.nama} (${p.jabatan})` : p.nama}
              >
                {p.jabatan || 'FG WH Supervisor'}
              </option>
            ))}
        </datalist>

        <datalist id="head-presets">
          {profilTimList
            .filter((p) => p.peran === 'diketahui' || p.peran === 'umum')
            .map((p) => (
              <option
                key={p.id}
                value={p.jabatan ? `${p.nama} (${p.jabatan})` : p.nama}
              >
                {p.jabatan || 'Head of WH Subdept'}
              </option>
            ))}
        </datalist>

        {/* Dedicated Save & Excel Sync Action Bar for Tabel Laporan Karung Bocor */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-300 rounded-xl p-3.5 shadow-xs print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-lg font-black shadow-xs flex-shrink-0">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Tabel Laporan Karung Bocor FG WH
                </span>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Sinkron Otomatis Real-time
                </span>
              </div>
              <p className="text-[11px] text-slate-700 mt-0.5 font-medium">
                Data kerusakan: <span className="font-bold text-slate-900">Forklift ({sumForklift})</span>, <span className="font-bold text-slate-900">Pallet ({sumPallet})</span>, <span className="font-bold text-slate-900">Produksi ({sumProduksi})</span> &rarr; Total <span className="font-extrabold text-amber-800 text-xs">{sumTotalBocor} Karung</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMasterModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Kelola Master Data Nama Jenis Pakan Ternak JAPFA"
            >
              <Layers className="w-4 h-4 text-indigo-200" />
              <span>Master Data Pakan ({activeMasterPakan.length})</span>
            </button>

            <button
              onClick={handleSaveReport}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg text-xs font-black shadow-md transition-all cursor-pointer hover:shadow-lg disabled:opacity-60"
              title="Simpan tabel karung bocor ke database dan sinkronkan Forklift, Pallet, dan Produksi ke Laporan Excel"
            >
              <Save className="w-4 h-4 text-emerald-200" />
              <span>{isSyncing ? 'Menyimpan & Menyinkronkan...' : 'SIMPAN TABEL KARUNG BOCOR & SYNC KE EXCEL'}</span>
            </button>

            {onNavigateToMainTable && (
              <button
                onClick={() => {
                  handleSaveReport();
                  onNavigateToMainTable();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Simpan dan langsung lihat di Tampilan Laporan Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Lihat di Excel &rarr;</span>
              </button>
            )}
          </div>
        </div>

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
                const matchedFeed = masterFeedMap.get((item.jenisPakan || '').toLowerCase().trim());

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
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          list="pakan-options"
                          value={item.jenisPakan}
                          onChange={(e) => handleItemChange(index, 'jenisPakan', e.target.value)}
                          placeholder="Pilih/ketik pakan..."
                          className="w-full px-1.5 py-0.5 font-bold text-slate-900 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 rounded uppercase"
                        />
                        {matchedFeed && matchedFeed.kode && (
                          <span
                            className="text-[9px] font-mono font-black bg-blue-100 text-blue-800 px-1 py-0.5 rounded border border-blue-200 print:hidden flex-shrink-0"
                            title={`Kode: ${matchedFeed.kode} | Kategori: ${matchedFeed.kategori || '-'} | Kemasan: ${matchedFeed.beratKemasan || 50}kg`}
                          >
                            {matchedFeed.kode}
                          </span>
                        )}
                      </div>
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveReport}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg text-xs font-black shadow-md transition-all cursor-pointer hover:shadow-lg disabled:opacity-60"
              title="Simpan tabel karung bocor ke database dan sinkronkan Forklift, Pallet, dan Produksi ke Laporan Excel"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{isSyncing ? 'Menyimpan...' : 'SIMPAN TABEL KARUNG BOCOR'}</span>
            </button>

            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              <span>Tambah Baris Pakan</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-300 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>Upload Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Unduh Excel Realtime</span>
            </button>

            {onNavigateToMainTable && (
              <button
                onClick={() => {
                  handleSaveReport();
                  onNavigateToMainTable();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Buka buku spreadsheet laporan Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Buka Tampilan Excel &rarr;</span>
              </button>
            )}
          </div>

          <button
            onClick={handleClearForm}
            className="flex items-center gap-1 px-3 py-2 text-xs text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kosongkan Angka</span>
          </button>
        </div>

        {/* Paper Sheet Signatures Block */}
        <div className="pt-6 border-t border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span>Tanda Tangan & Penanggung Jawab Laporan</span>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {profilTimList.length} Staf Terdaftar
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 font-normal">
                Pilih profil staf penanggung jawab dari daftar tersimpan atau ketik manual. Anda juga dapat mengedit dan menghapus profil.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsManageProfilModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer print:hidden hover:shadow-xs self-start sm:self-auto"
              title="Buka panel kelola profil tim: edit, hapus, tambah, atau pulihkan profil staf"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Kelola Profil Tim (Edit / Hapus / Tambah)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-xs">
            {/* Box 1: Dibuat Oleh */}
            <div className="border border-slate-400 rounded-lg p-3 bg-slate-50 flex flex-col justify-between min-h-[160px] shadow-2xs">
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

              {/* Quick Select from Profil Tim */}
              <div className="pt-2 border-t border-slate-200 print:hidden">
                <select
                  onChange={(e) => {
                    const prof = profilTimList.find((p) => p.id === e.target.value);
                    if (prof) handleSelectProfileForSignatory(prof, 'dibuat');
                  }}
                  value=""
                  className="w-full text-[10px] border border-slate-300 rounded px-1.5 py-0.5 bg-white text-slate-600 font-medium focus:outline-none cursor-pointer"
                  title="Pilih profil staf untuk bagian Dibuat Oleh"
                >
                  <option value="">&darr; Pilih dari Profil Tim...</option>
                  {profilTimList
                    .filter((p) => p.peran === 'dibuat' || p.peran === 'umum')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} ({p.jabatan || 'Worker'})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Box 2: Disetujui Oleh */}
            <div className="border border-slate-400 rounded-lg p-3 bg-slate-50 flex flex-col justify-between min-h-[160px] shadow-2xs">
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

              {/* Quick Select from Profil Tim */}
              <div className="pt-2 border-t border-slate-200 print:hidden">
                <select
                  onChange={(e) => {
                    const prof = profilTimList.find((p) => p.id === e.target.value);
                    if (prof) handleSelectProfileForSignatory(prof, 'disetujui');
                  }}
                  value=""
                  className="w-full text-[10px] border border-slate-300 rounded px-1.5 py-0.5 bg-white text-slate-600 font-medium focus:outline-none cursor-pointer"
                  title="Pilih profil staf untuk bagian Disetujui Oleh"
                >
                  <option value="">&darr; Pilih dari Profil Tim...</option>
                  {profilTimList
                    .filter((p) => p.peran === 'disetujui' || p.peran === 'umum')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} ({p.jabatan || 'Supervisor'})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Box 3: Diketahui Oleh */}
            <div className="border border-slate-400 rounded-lg p-3 bg-slate-50 flex flex-col justify-between min-h-[160px] shadow-2xs">
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

              {/* Quick Select from Profil Tim */}
              <div className="pt-2 border-t border-slate-200 print:hidden">
                <select
                  onChange={(e) => {
                    const prof = profilTimList.find((p) => p.id === e.target.value);
                    if (prof) handleSelectProfileForSignatory(prof, 'diketahui');
                  }}
                  value=""
                  className="w-full text-[10px] border border-slate-300 rounded px-1.5 py-0.5 bg-white text-slate-600 font-medium focus:outline-none cursor-pointer"
                  title="Pilih profil staf untuk bagian Diketahui Oleh"
                >
                  <option value="">&darr; Pilih dari Profil Tim...</option>
                  {profilTimList
                    .filter((p) => p.peran === 'diketahui' || p.peran === 'umum')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} ({p.jabatan || 'Head Dept'})
                      </option>
                    ))}
                </select>
              </div>
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

      {/* Master Data Pakan Management Modal */}
      <MasterPakanModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        masterPakanList={masterPakanList}
        onSaveMasterPakan={handleSaveMasterPakan}
        onApplyToActiveReport={handleApplyMasterToActiveReport}
      />

      {/* Manage Profil Tim Penanggung Jawab Modal */}
      <ManageProfilTimModal
        isOpen={isManageProfilModalOpen}
        onClose={() => setIsManageProfilModalOpen(false)}
        profilList={profilTimList}
        onSaveProfiles={handleSaveProfilTim}
        onSelectProfileForRole={handleSelectProfileForSignatory}
      />
    </div>
  );
};
