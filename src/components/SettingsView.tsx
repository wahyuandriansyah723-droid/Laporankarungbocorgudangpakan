import React, { useState, useEffect } from 'react';
import {
  WarehouseSettings,
  TanggalLaporanSettings,
  PenanggungJawabLaporan,
  PenanggungJawabProfile,
  MasterJenisPakan,
} from '../types';
import {
  Settings,
  Save,
  RotateCcw,
  Building,
  Scale,
  Target,
  CheckCircle2,
  Trash2,
  Edit3,
  Sparkles,
  PackageCheck,
  Eye,
  AlertTriangle,
  Bookmark,
  Check,
  X,
  Calendar,
  CalendarDays,
  UserCheck,
  Users,
  UserPlus,
  Clock,
  MapPin,
  FileSpreadsheet,
  CheckCheck,
  ShieldCheck,
  Plus,
  Layers,
  Search,
} from 'lucide-react';
import { formatReportDate } from '../utils/calculations';
import {
  defaultTanggalSettings,
  defaultPenanggungJawab,
  defaultProfilPenanggungJawab,
} from '../data/initialData';
import { defaultMasterFeedTypes } from '../data/samplePetugasReport';
import { MasterPakanModal } from './MasterPakanModal';

interface SettingsViewProps {
  settings: WarehouseSettings;
  onSaveSettings: (newSettings: WarehouseSettings) => void;
  onResetData: () => void;
}

const DEFAULT_SYSTEM_PRESETS = [
  {
    nama: 'LAPORAN KARUNG BOCOR',
    sub: 'GUDANG JADI (GBJ)',
    desc: 'Standar pelaporan resmi gudang jadi pakan ternak',
  },
  {
    nama: 'SISTEM MONITORING KARUNG BOCOR',
    sub: 'DIVISI PACKAGING & GUDANG',
    desc: 'Monitoring realtime kebocoran akibat forklift, pallet, dan produksi',
  },
  {
    nama: 'KONTROL KEBOCORAN PACKAGING GUDANG',
    sub: 'QUALITY CONTROL (QC)',
    desc: 'Pengawasan kualitas dan toleransi rasio kemasan pakan',
  },
  {
    nama: 'SISTEM PENCATATAN KARUNG RUSAK',
    sub: 'FINISHED GOODS WAREHOUSE',
    desc: 'Pencatatan harian, bulanan, dan tahunan karung ganti/jahit',
  },
  {
    nama: 'JAPFA FEED - SACK DAMAGE CONTROL',
    sub: 'UNIT GUDANG JADI',
    desc: 'Sistem operasional standar unit produksi & logistik',
  },
];

const QUICK_KOTA_OPTIONS = ['Sidoarjo', 'Surabaya', 'Gresik', 'Pasuruan', 'Mojokerto', 'Jakarta', 'Semarang', 'Medan'];

const LOCAL_STORAGE_KEY_CUSTOM_NAMES = 'karung_bocor_saved_system_names';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
}) => {
  // --- Active State: System Name & Parameters ---
  const [namaSistem, setNamaSistem] = useState(
    settings.namaSistem !== undefined ? settings.namaSistem : 'LAPORAN KARUNG BOCOR'
  );
  const [subNamaSistem, setSubNamaSistem] = useState(
    settings.subNamaSistem !== undefined ? settings.subNamaSistem : 'GUDANG JADI (GBJ)'
  );
  const [namaGudang, setNamaGudang] = useState(settings.namaGudang);
  const [beratPerKarung, setBeratPerKarung] = useState(settings.beratPerKarungKg);
  const [targetToleransi, setTargetToleransi] = useState(settings.targetToleransiPersen);

  // --- Active State: Date Settings (Pengaturan Tanggal) ---
  const initialTanggal: TanggalLaporanSettings = settings.pengaturanTanggal || defaultTanggalSettings;
  const [tanggalMode, setTanggalMode] = useState<'realtime' | 'custom'>(initialTanggal.mode || 'custom');
  const [tanggalCustom, setTanggalCustom] = useState<string>(initialTanggal.tanggalCustom || '2026-07-18');
  const [formatTanggal, setFormatTanggal] = useState<'DD.MM.YYYY' | 'DD/MM/YYYY' | 'DD MMMM YYYY' | 'YYYY-MM-DD'>(
    initialTanggal.formatTanggal || 'DD.MM.YYYY'
  );
  const [kotaPengesahan, setKotaPengesahan] = useState<string>(initialTanggal.kotaPengesahan || 'Sidoarjo');
  const [tahunLaporan, setTahunLaporan] = useState<number>(initialTanggal.tahunLaporan || 2026);

  // --- Active State: Report Signatories (Penanggung Jawab Laporan) ---
  const initialPJ: PenanggungJawabLaporan = settings.penanggungJawab || defaultPenanggungJawab;
  const [namaDibuat, setNamaDibuat] = useState(initialPJ.dibuatOleh || 'Petugas FG WH');
  const [jabatanDibuat, setJabatanDibuat] = useState(initialPJ.jabatanDibuat || 'FG WH Worker');
  const [nikDibuat, setNikDibuat] = useState(initialPJ.nikDibuat || 'WH-0492');

  const [namaDisetujui, setNamaDisetujui] = useState(initialPJ.disetujuiOleh || 'AMIN SODIK');
  const [jabatanDisetujui, setJabatanDisetujui] = useState(initialPJ.jabatanDisetujui || 'FG WH Supervisor');
  const [nikDisetujui, setNikDisetujui] = useState(initialPJ.nikDisetujui || 'SPV-0118');

  const [namaDiketahui, setNamaDiketahui] = useState(initialPJ.diketahuiOleh || 'HERY SHAPRIANTO');
  const [jabatanDiketahui, setJabatanDiketahui] = useState(initialPJ.jabatanDiketahui || 'Head of WH Subdept');
  const [nikDiketahui, setNikDiketahui] = useState(initialPJ.nikDiketahui || 'HOD-0023');

  // --- Active State: Profiles List (Daftar Profil Penanggung Jawab) ---
  const [profilList, setProfilList] = useState<PenanggungJawabProfile[]>(
    settings.daftarProfilPenanggungJawab || defaultProfilPenanggungJawab
  );

  // --- Active State: Master Data Jenis Pakan Ternak ---
  const [masterPakanList, setMasterPakanList] = useState<MasterJenisPakan[]>(
    settings.masterJenisPakan && settings.masterJenisPakan.length > 0
      ? settings.masterJenisPakan
      : defaultMasterFeedTypes
  );
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  // Modals & UI States
  const [savedMsg, setSavedMsg] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteDateModalOpen, setIsDeleteDateModalOpen] = useState(false);
  const [isDeleteSignatoriesModalOpen, setIsDeleteSignatoriesModalOpen] = useState(false);
  
  // Profile Editor & Management State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PenanggungJawabProfile | null>(null);
  const [profileFormNama, setProfileFormNama] = useState('');
  const [profileFormJabatan, setProfileFormJabatan] = useState('');
  const [profileFormPeran, setProfileFormPeran] = useState<'dibuat' | 'disetujui' | 'diketahui' | 'umum'>('dibuat');
  const [profileFormNik, setProfileFormNik] = useState('');
  const [profileFormDivisi, setProfileFormDivisi] = useState('');
  const [profileFormError, setProfileFormError] = useState<string | null>(null);

  // In-app Delete & Reset Confirmation Modals (Replaces blocked window.confirm)
  const [profileToDelete, setProfileToDelete] = useState<PenanggungJawabProfile | null>(null);
  const [isResetProfilesModalOpen, setIsResetProfilesModalOpen] = useState(false);

  // Filter & Search states for Card 3 Profile list
  const [searchProfilQuery, setSearchProfilQuery] = useState('');
  const [filterProfilRole, setFilterProfilRole] = useState<'all' | 'dibuat' | 'disetujui' | 'diketahui' | 'umum'>('all');

  // Custom Saved System Names List in LocalStorage
  const [savedNamesList, setSavedNamesList] = useState<Array<{ id: string; nama: string; sub: string }>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOM_NAMES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: '1', nama: 'LAPORAN KARUNG BOCOR', sub: 'GUDANG JADI (GBJ)' },
      { id: '2', nama: 'SISTEM MONITORING KARUNG BOCOR', sub: 'DIVISI PACKAGING & GUDANG' },
      { id: '3', nama: 'KONTROL KEBOCORAN PACKAGING GUDANG', sub: 'QUALITY CONTROL (QC)' },
    ];
  });

  // Keep state synced when settings prop updates
  useEffect(() => {
    if (settings.namaSistem !== undefined) setNamaSistem(settings.namaSistem);
    if (settings.subNamaSistem !== undefined) setSubNamaSistem(settings.subNamaSistem);
    if (settings.namaGudang !== undefined) setNamaGudang(settings.namaGudang);
    if (settings.beratPerKarungKg !== undefined) setBeratPerKarung(settings.beratPerKarungKg);
    if (settings.targetToleransiPersen !== undefined) setTargetToleransi(settings.targetToleransiPersen);

    if (settings.pengaturanTanggal) {
      setTanggalMode(settings.pengaturanTanggal.mode || 'custom');
      setTanggalCustom(settings.pengaturanTanggal.tanggalCustom || '2026-07-18');
      setFormatTanggal(settings.pengaturanTanggal.formatTanggal || 'DD.MM.YYYY');
      setKotaPengesahan(settings.pengaturanTanggal.kotaPengesahan || 'Sidoarjo');
      setTahunLaporan(settings.pengaturanTanggal.tahunLaporan || 2026);
    }

    if (settings.penanggungJawab) {
      setNamaDibuat(settings.penanggungJawab.dibuatOleh || '');
      setJabatanDibuat(settings.penanggungJawab.jabatanDibuat || '');
      setNikDibuat(settings.penanggungJawab.nikDibuat || '');

      setNamaDisetujui(settings.penanggungJawab.disetujuiOleh || '');
      setJabatanDisetujui(settings.penanggungJawab.jabatanDisetujui || '');
      setNikDisetujui(settings.penanggungJawab.nikDisetujui || '');

      setNamaDiketahui(settings.penanggungJawab.diketahuiOleh || '');
      setJabatanDiketahui(settings.penanggungJawab.jabatanDiketahui || '');
      setNikDiketahui(settings.penanggungJawab.nikDiketahui || '');
    }

    if (settings.daftarProfilPenanggungJawab) {
      setProfilList(settings.daftarProfilPenanggungJawab);
    }

    if (settings.masterJenisPakan && settings.masterJenisPakan.length > 0) {
      setMasterPakanList(settings.masterJenisPakan);
    }
  }, [settings]);

  // Calculated display date based on current setting
  const effectiveDate = tanggalMode === 'realtime' ? new Date() : (tanggalCustom || '2026-07-18');
  const formattedPreviewDate = formatReportDate(effectiveDate, formatTanggal);

  // Helper: Build the combined new settings object
  const buildCombinedSettings = (
    overrides?: Partial<WarehouseSettings>
  ): WarehouseSettings => {
    const updatedTanggal: TanggalLaporanSettings = {
      mode: tanggalMode,
      tanggalCustom,
      formatTanggal,
      kotaPengesahan: kotaPengesahan.trim() || 'Sidoarjo',
      tahunLaporan: Number(tahunLaporan) || 2026,
    };

    const updatedPJ: PenanggungJawabLaporan = {
      dibuatOleh: namaDibuat.trim(),
      jabatanDibuat: jabatanDibuat.trim(),
      nikDibuat: nikDibuat.trim(),

      disetujuiOleh: namaDisetujui.trim(),
      jabatanDisetujui: jabatanDisetujui.trim(),
      nikDisetujui: nikDisetujui.trim(),

      diketahuiOleh: namaDiketahui.trim(),
      jabatanDiketahui: jabatanDiketahui.trim(),
      nikDiketahui: nikDiketahui.trim(),
    };

    return {
      namaSistem: namaSistem.trim(),
      subNamaSistem: subNamaSistem.trim(),
      namaGudang: namaGudang.trim(),
      beratPerKarungKg: Number(beratPerKarung) || 50,
      targetToleransiPersen: Number(targetToleransi) || 0.25,
      pengaturanTanggal: updatedTanggal,
      penanggungJawab: updatedPJ,
      daftarProfilPenanggungJawab: profilList,
      masterJenisPakan: masterPakanList,
      ...overrides,
    };
  };

  // --- HANDLER: SIMPAN MASTER DATA PAKAN DARI PENGATURAN ---
  const handleSaveMasterPakanFromSettings = (newList: MasterJenisPakan[]) => {
    setMasterPakanList(newList);
    const newSettings = buildCombinedSettings({ masterJenisPakan: newList });
    onSaveSettings(newSettings);
    setSavedMsg({
      text: `Master Data Jenis Pakan (${newList.length} pakan) berhasil disimpan dan disinkronkan!`,
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 3500);
  };

  // --- HANDLER: SIMPAN SELURUH PENGATURAN ---
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newSettings = buildCombinedSettings();
    onSaveSettings(newSettings);
    setSavedMsg({
      text: 'Semua pengaturan sistem, tanggal, dan penanggung jawab berhasil disimpan!',
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 3500);
  };

  // --- HANDLER: SIMPAN PENGATURAN TANGGAL ---
  const handleSaveTanggal = () => {
    const newSettings = buildCombinedSettings();
    onSaveSettings(newSettings);
    setSavedMsg({
      text: `Pengaturan tanggal laporan berhasil disimpan! Format: ${formattedPreviewDate} (${kotaPengesahan})`,
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 3500);
  };

  // --- HANDLER: HAPUS / RESET TANGGAL LAPORAN ---
  const handleResetTanggal = () => {
    setTanggalMode('realtime');
    setFormatTanggal('DD.MM.YYYY');
    setKotaPengesahan('Sidoarjo');
    setTahunLaporan(2026);
    setIsDeleteDateModalOpen(false);

    const newSettings = buildCombinedSettings({
      pengaturanTanggal: {
        mode: 'realtime',
        tanggalCustom: '',
        formatTanggal: 'DD.MM.YYYY',
        kotaPengesahan: 'Sidoarjo',
        tahunLaporan: 2026,
      },
    });
    onSaveSettings(newSettings);
    setSavedMsg({
      text: 'Pengaturan tanggal direset ke mode Realtime (Hari Ini)!',
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 3500);
  };

  const handleClearTanggalCustom = () => {
    setTanggalCustom('');
    setTanggalMode('realtime');
    setIsDeleteDateModalOpen(false);
    const newSettings = buildCombinedSettings({
      pengaturanTanggal: {
        mode: 'realtime',
        tanggalCustom: '',
        formatTanggal,
        kotaPengesahan,
        tahunLaporan,
      },
    });
    onSaveSettings(newSettings);
    setSavedMsg({
      text: 'Tanggal custom dikosongkan. Sistem beralih ke tanggal realtime.',
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 3500);
  };

  // --- HANDLER: SIMPAN PENANGGUNG JAWAB ---
  const handleSavePenanggungJawab = () => {
    const newSettings = buildCombinedSettings();
    onSaveSettings(newSettings);
    setSavedMsg({
      text: 'Pengaturan penanggung jawab laporan (Dibuat, Disetujui, Diketahui) berhasil disimpan!',
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 3500);
  };

  // --- HANDLER: HAPUS / KOSONGKAN PENANGGUNG JAWAB ---
  const handleClearAllPenanggungJawab = () => {
    setNamaDibuat('');
    setJabatanDibuat('');
    setNikDibuat('');

    setNamaDisetujui('');
    setJabatanDisetujui('');
    setNikDisetujui('');

    setNamaDiketahui('');
    setJabatanDiketahui('');
    setNikDiketahui('');

    setIsDeleteSignatoriesModalOpen(false);

    const newSettings = buildCombinedSettings({
      penanggungJawab: {
        dibuatOleh: '',
        jabatanDibuat: '',
        nikDibuat: '',
        disetujuiOleh: '',
        jabatanDisetujui: '',
        nikDisetujui: '',
        diketahuiOleh: '',
        jabatanDiketahui: '',
        nikDiketahui: '',
      },
    });
    onSaveSettings(newSettings);
    setSavedMsg({
      text: 'Seluruh penanggung jawab laporan telah dihapus / dikosongkan.',
      type: 'danger',
    });
    setTimeout(() => setSavedMsg(null), 3500);
  };

  // --- HANDLER: RESET PENANGGUNG JAWAB KE STANDAR PABRIK ---
  const handleResetPenanggungJawabDefault = () => {
    setNamaDibuat(defaultPenanggungJawab.dibuatOleh);
    setJabatanDibuat(defaultPenanggungJawab.jabatanDibuat);
    setNikDibuat(defaultPenanggungJawab.nikDibuat || '');

    setNamaDisetujui(defaultPenanggungJawab.disetujuiOleh);
    setJabatanDisetujui(defaultPenanggungJawab.jabatanDisetujui);
    setNikDisetujui(defaultPenanggungJawab.nikDisetujui || '');

    setNamaDiketahui(defaultPenanggungJawab.diketahuiOleh);
    setJabatanDiketahui(defaultPenanggungJawab.jabatanDiketahui);
    setNikDiketahui(defaultPenanggungJawab.nikDiketahui || '');

    setIsDeleteSignatoriesModalOpen(false);

    const newSettings = buildCombinedSettings({
      penanggungJawab: defaultPenanggungJawab,
    });
    onSaveSettings(newSettings);
    setSavedMsg({
      text: 'Penanggung jawab laporan berhasil dipulihkan ke standar default pabrik!',
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 3500);
  };

  // --- HANDLERS: CRUD DAFTAR PROFIL PENANGGUNG JAWAB ---
  const handleOpenAddProfile = (defaultPeran: 'dibuat' | 'disetujui' | 'diketahui' | 'umum' = 'dibuat') => {
    setEditingProfile(null);
    setProfileFormNama('');
    setProfileFormJabatan('');
    setProfileFormPeran(defaultPeran);
    setProfileFormNik('');
    setProfileFormDivisi('');
    setProfileFormError(null);
    setIsProfileModalOpen(true);
  };

  const handleOpenEditProfile = (p: PenanggungJawabProfile) => {
    setEditingProfile(p);
    setProfileFormNama(p.nama);
    setProfileFormJabatan(p.jabatan);
    setProfileFormPeran(p.peran);
    setProfileFormNik(p.nik || '');
    setProfileFormDivisi(p.divisi || '');
    setProfileFormError(null);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFormNama.trim()) {
      setProfileFormError('Nama lengkap penanggung jawab tidak boleh kosong.');
      return;
    }

    let updatedList: PenanggungJawabProfile[];
    if (editingProfile) {
      // Edit existing profile
      updatedList = profilList.map((p) =>
        p.id === editingProfile.id
          ? {
              ...p,
              nama: profileFormNama.trim(),
              jabatan: profileFormJabatan.trim(),
              peran: profileFormPeran,
              nik: profileFormNik.trim(),
              divisi: profileFormDivisi.trim(),
            }
          : p
      );
    } else {
      // Add new profile
      const newProfile: PenanggungJawabProfile = {
        id: 'prof_' + Date.now(),
        nama: profileFormNama.trim(),
        jabatan: profileFormJabatan.trim(),
        peran: profileFormPeran,
        nik: profileFormNik.trim(),
        divisi: profileFormDivisi.trim(),
      };
      updatedList = [...profilList, newProfile];
    }

    setProfilList(updatedList);
    setIsProfileModalOpen(false);
    setProfileFormError(null);

    const newSettings = buildCombinedSettings({
      daftarProfilPenanggungJawab: updatedList,
    });
    onSaveSettings(newSettings);
    setSavedMsg({
      text: editingProfile
        ? `Profil penanggung jawab "${profileFormNama.trim()}" berhasil diperbarui!`
        : `Profil penanggung jawab "${profileFormNama.trim()}" berhasil ditambahkan!`,
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 3000);
  };

  // In-app Confirm Delete (Replaces blocked window.confirm)
  const handleConfirmDeleteProfile = () => {
    if (!profileToDelete) return;
    const targetName = profileToDelete.nama;
    const updatedList = profilList.filter((p) => p.id !== profileToDelete.id);
    setProfilList(updatedList);
    const newSettings = buildCombinedSettings({
      daftarProfilPenanggungJawab: updatedList,
    });
    onSaveSettings(newSettings);
    setProfileToDelete(null);
    setSavedMsg({
      text: `Profil penanggung jawab "${targetName}" berhasil dihapus dari sistem.`,
      type: 'danger',
    });
    setTimeout(() => setSavedMsg(null), 3000);
  };

  // In-app Confirm Reset to Default (Replaces blocked window.confirm)
  const handleConfirmResetProfilesList = () => {
    setProfilList(defaultProfilPenanggungJawab);
    const newSettings = buildCombinedSettings({
      daftarProfilPenanggungJawab: defaultProfilPenanggungJawab,
    });
    onSaveSettings(newSettings);
    setIsResetProfilesModalOpen(false);
    setSavedMsg({
      text: 'Daftar profil penanggung jawab berhasil dipulihkan ke default pabrik!',
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 3000);
  };

  // Quick apply profile to active signatory role
  const handleApplyProfileToSignatory = (
    profile: PenanggungJawabProfile,
    targetRole: 'dibuat' | 'disetujui' | 'diketahui'
  ) => {
    if (targetRole === 'dibuat') {
      setNamaDibuat(profile.nama);
      setJabatanDibuat(profile.jabatan);
      setNikDibuat(profile.nik || '');
    } else if (targetRole === 'disetujui') {
      setNamaDisetujui(profile.nama);
      setJabatanDisetujui(profile.jabatan);
      setNikDisetujui(profile.nik || '');
    } else if (targetRole === 'diketahui') {
      setNamaDiketahui(profile.nama);
      setJabatanDiketahui(profile.jabatan);
      setNikDiketahui(profile.nik || '');
    }

    setSavedMsg({
      text: `Profil "${profile.nama}" berhasil diterapkan sebagai [${
        targetRole === 'dibuat' ? 'Dibuat Oleh' : targetRole === 'disetujui' ? 'Disetujui Oleh' : 'Diketahui Oleh'
      }]! Klik "Simpan Penanggung Jawab" untuk mempermanenkan.`,
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 3500);
  };

  // --- SYSTEM NAME HANDLERS ---
  const handleApplyPreset = (presetNama: string, presetSub: string) => {
    setNamaSistem(presetNama);
    setSubNamaSistem(presetSub);
    const newSettings = buildCombinedSettings({
      namaSistem: presetNama,
      subNamaSistem: presetSub,
    });
    onSaveSettings(newSettings);
    setSavedMsg({
      text: `Nama sistem diperbarui menjadi "${presetNama}"!`,
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 3000);
  };

  const handleClearSystemName = () => {
    setNamaSistem('');
    setSubNamaSistem('');
    setIsDeleteDialogOpen(false);
    const newSettings = buildCombinedSettings({
      namaSistem: '',
      subNamaSistem: '',
    });
    onSaveSettings(newSettings);
    setSavedMsg({
      text: 'Nama sistem berhasil dihapus / dikosongkan.',
      type: 'danger',
    });
    setTimeout(() => setSavedMsg(null), 3000);
  };

  const handleResetToDefaultSystemName = () => {
    setNamaSistem('LAPORAN KARUNG BOCOR');
    setSubNamaSistem('GUDANG JADI (GBJ)');
    setIsDeleteDialogOpen(false);
    const newSettings = buildCombinedSettings({
      namaSistem: 'LAPORAN KARUNG BOCOR',
      subNamaSistem: 'GUDANG JADI (GBJ)',
    });
    onSaveSettings(newSettings);
    setSavedMsg({
      text: 'Nama sistem dipulihkan ke default pabrik: LAPORAN KARUNG BOCOR',
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 3000);
  };

  const persistSavedNames = (list: Array<{ id: string; nama: string; sub: string }>) => {
    setSavedNamesList(list);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOM_NAMES, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFromSavedList = (id: string, nama: string) => {
    const newList = savedNamesList.filter((item) => item.id !== id);
    persistSavedNames(newList);
    setSavedMsg({
      text: `"${nama}" dihapus dari riwayat tersimpan.`,
      type: 'danger',
    });
    setTimeout(() => setSavedMsg(null), 2500);
  };

  const handleSaveCurrentToSavedList = () => {
    if (!namaSistem.trim()) {
      alert('Nama sistem tidak boleh kosong untuk disimpan.');
      return;
    }
    const exists = savedNamesList.some(
      (item) => item.nama.toLowerCase() === namaSistem.trim().toLowerCase()
    );
    if (exists) {
      setSavedMsg({
        text: `Nama "${namaSistem.trim()}" sudah ada di daftar riwayat tersimpan.`,
        type: 'danger',
      });
      setTimeout(() => setSavedMsg(null), 3000);
      return;
    }
    const newItem = {
      id: String(Date.now()),
      nama: namaSistem.trim(),
      sub: subNamaSistem.trim(),
    };
    const newList = [newItem, ...savedNamesList];
    persistSavedNames(newList);
    setSavedMsg({
      text: `"${namaSistem.trim()}" disimpan ke daftar pilihan tersimpan!`,
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast / Notification Banner */}
      {savedMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm transition-all animate-in fade-in ${
            savedMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {savedMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span>{savedMsg.text}</span>
          </div>
          <button
            onClick={() => setSavedMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================== */}
      {/* CARD 1: PENGATURAN TANGGAL LAPORAN (EDIT, SIMPAN, HAPUS)    */}
      {/* ========================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                Pengaturan Tanggal Laporan
                <span className="bg-blue-400/20 text-blue-200 border border-blue-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Dokumen & Excel
                </span>
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Edit tanggal cetak, format tampilan, tahun periode, kota pengesahan, dan simpan atau hapus/reset tanggal laporan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsDeleteDateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Hapus atau reset tanggal laporan"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus / Reset Tanggal</span>
            </button>

            <button
              type="button"
              onClick={handleSaveTanggal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Simpan pengaturan tanggal"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Tanggal</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Live Preview Box for Date */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-lg font-bold">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Pratinjau Tanggal Pengesahan Laporan:
                </span>
                <p className="text-base font-extrabold text-slate-900">
                  {kotaPengesahan}, {formattedPreviewDate}
                </p>
                <span className="text-[11px] text-slate-500 block">
                  Mode: <strong className="text-slate-700">{tanggalMode === 'realtime' ? 'Realtime (Hari Ini)' : 'Tanggal Manual / Khusus'}</strong> &bull; Tahun: <strong>{tahunLaporan}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Sinkron ke Excel & Dokumen
              </span>
            </div>
          </div>

          {/* Form Date Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field 1: Mode Tanggal */}
            <div>
              <label className="block font-bold text-slate-700 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Mode Penentuan Tanggal:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTanggalMode('realtime')}
                  className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                    tanggalMode === 'realtime'
                      ? 'bg-blue-900 text-white border-blue-900 ring-2 ring-blue-500/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div>
                    <span>Realtime (Hari Ini)</span>
                    <span className="block text-[10px] font-normal opacity-80">Otomatis update tiap hari</span>
                  </div>
                  {tanggalMode === 'realtime' && <Check className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTanggalMode('custom')}
                  className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                    tanggalMode === 'custom'
                      ? 'bg-blue-900 text-white border-blue-900 ring-2 ring-blue-500/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div>
                    <span>Tanggal Khusus / Manual</span>
                    <span className="block text-[10px] font-normal opacity-80">Tentukan tanggal tetap</span>
                  </div>
                  {tanggalMode === 'custom' && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Field 2: Tanggal Custom Input */}
            <div>
              <label className="block font-bold text-slate-700 text-xs uppercase tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Tanggal Laporan (Khusus):
                </span>
                {tanggalMode === 'realtime' && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-normal">
                    Terkunci di Realtime
                  </span>
                )}
              </label>
              <input
                type="date"
                value={tanggalCustom}
                disabled={tanggalMode === 'realtime'}
                onChange={(e) => setTanggalCustom(e.target.value)}
                className={`w-full border rounded-lg p-2.5 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors ${
                  tanggalMode === 'realtime'
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                }`}
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400">Pintas Cepat:</span>
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    setTanggalCustom(todayStr);
                    setTanggalMode('custom');
                  }}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTanggalCustom('2026-07-18');
                    setTanggalMode('custom');
                  }}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
                >
                  18 Juli 2026 (Sampel)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTanggalCustom('2026-12-31');
                    setTanggalMode('custom');
                  }}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  31 Des 2026 (Akhir Tahun)
                </button>
              </div>
            </div>

            {/* Field 3: Format Tanggal */}
            <div>
              <label className="block font-bold text-slate-700 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                Format Tampilan Tanggal:
              </label>
              <select
                value={formatTanggal}
                onChange={(e) =>
                  setFormatTanggal(
                    e.target.value as 'DD.MM.YYYY' | 'DD/MM/YYYY' | 'DD MMMM YYYY' | 'YYYY-MM-DD'
                  )
                }
                className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
              >
                <option value="DD.MM.YYYY">DD.MM.YYYY (Contoh: 18.07.2026 - Standar JAPFA)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (Contoh: 18/07/2026)</option>
                <option value="DD MMMM YYYY">DD MMMM YYYY (Contoh: 18 Juli 2026 - Resmi Formal)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (Contoh: 2026-07-18 - ISO Standard)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Format yang digunakan pada kop laporan, footer tanda tangan, dan sheet Excel.
              </span>
            </div>

            {/* Field 4: Kota Pengesahan & Tahun */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Kota Pengesahan:
                </label>
                <input
                  type="text"
                  value={kotaPengesahan}
                  onChange={(e) => setKotaPengesahan(e.target.value)}
                  placeholder="Contoh: Sidoarjo"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                />
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {QUICK_KOTA_OPTIONS.slice(0, 4).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKotaPengesahan(k)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${
                        kotaPengesahan.toLowerCase() === k.toLowerCase()
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Tahun Periode Laporan:
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2050"
                  value={tahunLaporan}
                  onChange={(e) => setTahunLaporan(parseInt(e.target.value, 10) || 2026)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Tahun pembukuan aktif (default 2026).
                </span>
              </div>
            </div>
          </div>

          {/* Action Row for Date */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteDateModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Tanggal ke Realtime</span>
            </button>

            <button
              type="button"
              onClick={handleSaveTanggal}
              className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Simpan Pengaturan Tanggal</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* CARD 2: PENANGGUNG JAWAB LAPORAN (EDIT, SIMPAN, HAPUS)     */}
      {/* ========================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                Pengaturan Penanggung Jawab Laporan
                <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  3 Pihak Pengesah
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Edit, simpan, atau hapus nama penanggung jawab (Dibuat Oleh, Disetujui Oleh, Diketahui Oleh) yang tercetak di laporan resmi dan Excel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsDeleteSignatoriesModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Hapus atau kosongkan nama penanggung jawab"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus / Kosongkan</span>
            </button>

            <button
              type="button"
              onClick={handleSavePenanggungJawab}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Simpan nama penanggung jawab"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Penanggung Jawab</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Official Signature Preview Card */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                Pratinjau Lembar Pengesahan Tanda Tangan Resmi
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {kotaPengesahan}, {formattedPreviewDate}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Box 1: Dibuat Oleh */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between h-44 text-center">
                <div>
                  <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block border-b border-slate-100 pb-1">
                    DIBUAT OLEH
                  </span>
                  <span className="text-[9px] text-slate-400 block pt-0.5">Petugas / Operator</span>
                </div>
                <div className="my-auto py-2">
                  <div className="w-24 h-9 mx-auto border-b border-dashed border-slate-300 flex items-center justify-center">
                    <span className="text-[10px] text-slate-300 italic font-mono">[Tanda Tangan]</span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-xs mt-1.5">
                    {namaDibuat || <span className="text-red-400 italic">(Belum diisi)</span>}
                  </p>
                  {nikDibuat && (
                    <span className="text-[9px] text-slate-500 font-mono block">NIK: {nikDibuat}</span>
                  )}
                  <span className="text-[10px] text-slate-600 font-medium block">
                    {jabatanDibuat || 'FG WH Worker'}
                  </span>
                </div>
              </div>

              {/* Box 2: Disetujui Oleh */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between h-44 text-center">
                <div>
                  <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block border-b border-slate-100 pb-1">
                    DISETUJUI OLEH
                  </span>
                  <span className="text-[9px] text-slate-400 block pt-0.5">Supervisor Gudang</span>
                </div>
                <div className="my-auto py-2">
                  <div className="w-24 h-9 mx-auto border-b border-dashed border-slate-300 flex items-center justify-center">
                    <span className="text-[10px] text-slate-300 italic font-mono">[Tanda Tangan]</span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-xs mt-1.5">
                    {namaDisetujui || <span className="text-red-400 italic">(Belum diisi)</span>}
                  </p>
                  {nikDisetujui && (
                    <span className="text-[9px] text-slate-500 font-mono block">NIK: {nikDisetujui}</span>
                  )}
                  <span className="text-[10px] text-slate-600 font-medium block">
                    {jabatanDisetujui || 'FG WH Supervisor'}
                  </span>
                </div>
              </div>

              {/* Box 3: Diketahui Oleh */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between h-44 text-center">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block border-b border-slate-100 pb-1">
                    DIKETAHUI OLEH
                  </span>
                  <span className="text-[9px] text-slate-400 block pt-0.5">Head of WH Subdept</span>
                </div>
                <div className="my-auto py-2">
                  <div className="w-24 h-9 mx-auto border-b border-dashed border-slate-300 flex items-center justify-center">
                    <span className="text-[10px] text-slate-300 italic font-mono">[Tanda Tangan]</span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-xs mt-1.5">
                    {namaDiketahui || <span className="text-red-400 italic">(Belum diisi)</span>}
                  </p>
                  {nikDiketahui && (
                    <span className="text-[9px] text-slate-500 font-mono block">NIK: {nikDiketahui}</span>
                  )}
                  <span className="text-[10px] text-slate-600 font-medium block">
                    {jabatanDiketahui || 'Head of WH Subdept'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Signatories Inputs */}
          <div className="space-y-6">
            {/* PIHAK 1: DIBUAT OLEH */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  1. Dibuat Oleh (Pembuat Laporan / Petugas Lapangan)
                </h4>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNamaDibuat('');
                      setNikDibuat('');
                    }}
                    className="text-[10px] text-red-600 hover:text-red-800 font-semibold px-2 py-0.5 rounded hover:bg-red-50"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nama Lengkap:
                  </label>
                  <input
                    type="text"
                    value={namaDibuat}
                    onChange={(e) => setNamaDibuat(e.target.value)}
                    placeholder="Contoh: Petugas FG WH"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Jabatan:
                  </label>
                  <input
                    type="text"
                    value={jabatanDibuat}
                    onChange={(e) => setJabatanDibuat(e.target.value)}
                    placeholder="Contoh: FG WH Worker"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    NIK / NIP (Opsional):
                  </label>
                  <input
                    type="text"
                    value={nikDibuat}
                    onChange={(e) => setNikDibuat(e.target.value)}
                    placeholder="Contoh: WH-0492"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* PIHAK 2: DISETUJUI OLEH */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  2. Disetujui Oleh (Pemeriksa / Supervisor Gudang)
                </h4>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNamaDisetujui('');
                      setNikDisetujui('');
                    }}
                    className="text-[10px] text-red-600 hover:text-red-800 font-semibold px-2 py-0.5 rounded hover:bg-red-50"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nama Lengkap:
                  </label>
                  <input
                    type="text"
                    value={namaDisetujui}
                    onChange={(e) => setNamaDisetujui(e.target.value)}
                    placeholder="Contoh: AMIN SODIK"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Jabatan:
                  </label>
                  <input
                    type="text"
                    value={jabatanDisetujui}
                    onChange={(e) => setJabatanDisetujui(e.target.value)}
                    placeholder="Contoh: FG WH Supervisor"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    NIK / NIP (Opsional):
                  </label>
                  <input
                    type="text"
                    value={nikDisetujui}
                    onChange={(e) => setNikDisetujui(e.target.value)}
                    placeholder="Contoh: SPV-0118"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono bg-white text-slate-900 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* PIHAK 3: DIKETAHUI OLEH */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  3. Diketahui Oleh (Pimpinan / Head of Warehouse)
                </h4>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNamaDiketahui('');
                      setNikDiketahui('');
                    }}
                    className="text-[10px] text-red-600 hover:text-red-800 font-semibold px-2 py-0.5 rounded hover:bg-red-50"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nama Lengkap:
                  </label>
                  <input
                    type="text"
                    value={namaDiketahui}
                    onChange={(e) => setNamaDiketahui(e.target.value)}
                    placeholder="Contoh: HERY SHAPRIANTO"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Jabatan:
                  </label>
                  <input
                    type="text"
                    value={jabatanDiketahui}
                    onChange={(e) => setJabatanDiketahui(e.target.value)}
                    placeholder="Contoh: Head of WH Subdept"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    NIK / NIP (Opsional):
                  </label>
                  <input
                    type="text"
                    value={nikDiketahui}
                    onChange={(e) => setNikDiketahui(e.target.value)}
                    placeholder="Contoh: HOD-0023"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Row for Signatories */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteSignatoriesModalOpen(true)}
                className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus / Kosongkan</span>
              </button>

              <button
                type="button"
                onClick={handleResetPenanggungJawabDefault}
                className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar Pabrik</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSavePenanggungJawab}
              className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Simpan Penanggung Jawab</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* CARD 3: DAFTAR PROFIL PENANGGUNG JAWAB (MANAJEMEN CRUD)    */}
      {/* ========================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-xl border border-purple-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                Daftar Profil Tim Penanggung Jawab
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {profilList.length} Staf Terdaftar
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Kelola daftar nama petugas, supervisor, dan kepala bagian. Anda dapat menambah, mengedit, menghapus, atau memilih langsung untuk penanggung jawab aktif.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsResetProfilesModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Pulihkan daftar staf ke default pabrik"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAddProfile('dibuat')}
              className="px-3.5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Tambah Penanggung Jawab</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, jabatan, NIK, atau divisi..."
              value={searchProfilQuery}
              onChange={(e) => setSearchProfilQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            {searchProfilQuery && (
              <button
                type="button"
                onClick={() => setSearchProfilQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => setFilterProfilRole('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterProfilRole === 'all'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Semua ({profilList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterProfilRole('dibuat')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterProfilRole === 'dibuat'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              Dibuat ({profilList.filter((p) => p.peran === 'dibuat').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterProfilRole('disetujui')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterProfilRole === 'disetujui'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Disetujui ({profilList.filter((p) => p.peran === 'disetujui').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterProfilRole('diketahui')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterProfilRole === 'diketahui'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Diketahui ({profilList.filter((p) => p.peran === 'diketahui').length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {profilList.filter((p) => {
            const matchesSearch =
              p.nama.toLowerCase().includes(searchProfilQuery.toLowerCase()) ||
              (p.jabatan && p.jabatan.toLowerCase().includes(searchProfilQuery.toLowerCase())) ||
              (p.nik && p.nik.toLowerCase().includes(searchProfilQuery.toLowerCase())) ||
              (p.divisi && p.divisi.toLowerCase().includes(searchProfilQuery.toLowerCase()));
            const matchesRole = filterProfilRole === 'all' || p.peran === filterProfilRole;
            return matchesSearch && matchesRole;
          }).length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Tidak ada profil penanggung jawab yang cocok.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Coba ubah kata kunci pencarian atau tambah profil baru.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profilList
                .filter((p) => {
                  const matchesSearch =
                    p.nama.toLowerCase().includes(searchProfilQuery.toLowerCase()) ||
                    (p.jabatan && p.jabatan.toLowerCase().includes(searchProfilQuery.toLowerCase())) ||
                    (p.nik && p.nik.toLowerCase().includes(searchProfilQuery.toLowerCase())) ||
                    (p.divisi && p.divisi.toLowerCase().includes(searchProfilQuery.toLowerCase()));
                  const matchesRole = filterProfilRole === 'all' || p.peran === filterProfilRole;
                  return matchesSearch && matchesRole;
                })
                .map((prof) => (
                  <div
                    key={prof.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 group shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900 truncate">{prof.nama}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              prof.peran === 'dibuat'
                                ? 'bg-blue-100 text-blue-800'
                                : prof.peran === 'disetujui'
                                ? 'bg-amber-100 text-amber-800'
                                : prof.peran === 'diketahui'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {prof.peran === 'dibuat'
                              ? 'Dibuat Oleh'
                              : prof.peran === 'disetujui'
                              ? 'Disetujui Oleh'
                              : prof.peran === 'diketahui'
                              ? 'Diketahui Oleh'
                              : 'Umum'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5 truncate">
                          {prof.jabatan}
                          {prof.divisi && ` \u2022 ${prof.divisi}`}
                        </p>
                        {prof.nik && (
                          <span className="text-[10px] text-slate-400 font-mono block">NIK: {prof.nik}</span>
                        )}
                      </div>

                      {/* ACTIVE ACTION BUTTONS: EDIT & HAPUS */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProfile(prof)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title="Edit data profil staf ini"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfileToDelete(prof)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-900 border border-red-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title="Hapus data profil staf ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Assign Buttons */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-medium">Gunakan Sebagai:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyProfileToSignatory(prof, 'dibuat')}
                        className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition-colors cursor-pointer"
                      >
                        Dibuat
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyProfileToSignatory(prof, 'disetujui')}
                        className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded transition-colors cursor-pointer"
                      >
                        Disetujui
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyProfileToSignatory(prof, 'diketahui')}
                        className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded transition-colors cursor-pointer"
                      >
                        Diketahui
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* CARD 4: PENGATURAN NAMA SISTEM (EDIT, SIMPAN, HAPUS)       */}
      {/* ========================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                Pengaturan Nama Sistem
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Identitas Aplikasi
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Edit, simpan, atau hapus nama sistem yang muncul pada header aplikasi, lembar Excel, dan laporan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Hapus atau reset nama sistem"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Nama Sistem</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Simpan nama sistem saat ini"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Nama</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Live Preview Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                Live Preview Tampilan Header & Dokumen
              </span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                Realtime Synchronized
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
              <div className="p-2 bg-slate-900 text-white rounded-lg font-bold">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 uppercase truncate">
                    {namaSistem.trim() || (
                      <span className="text-slate-400 italic font-normal">(Nama Sistem Kosong / Dihapus)</span>
                    )}
                  </span>
                  {subNamaSistem.trim() && (
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                      {subNamaSistem.trim()}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {namaGudang || 'Gudang Operasional'} &bull; Standar: {beratPerKarung} Kg/Karung
                </p>
              </div>
            </div>
          </div>

          {/* Form Edit Input Fields */}
          <form onSubmit={handleSaveAll} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field 1: Nama Sistem */}
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 text-xs uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    Nama Sistem / Judul Aplikasi:
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {namaSistem.length} karakter
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={namaSistem}
                    onChange={(e) => setNamaSistem(e.target.value)}
                    placeholder="Contoh: LAPORAN KARUNG BOCOR atau SISTEM MONITORING KEBOCORAN"
                    className="w-full border border-slate-300 rounded-lg p-2.5 pr-8 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                  />
                  {namaSistem && (
                    <button
                      type="button"
                      onClick={() => setNamaSistem('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title="Bersihkan input nama"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nama ini akan menjadi judul utama aplikasi pada header atas dan baris judul laporan Excel (.xlsx).
                </p>
              </div>

              {/* Field 2: Sub-Nama / Label Unit */}
              <div>
                <label className="block font-bold text-slate-700 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                  Sub-Nama / Badge Unit:
                </label>
                <input
                  type="text"
                  value={subNamaSistem}
                  onChange={(e) => setSubNamaSistem(e.target.value)}
                  placeholder="Contoh: GUDANG JADI (GBJ) atau DIVISI PACKAGING"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Badge kecil di samping nama sistem (opsional, bisa dikosongkan).
                </p>
              </div>

              {/* Field 3: Nama Gudang */}
              <div>
                <label className="block font-bold text-slate-700 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  Nama Gudang / Unit Operasional:
                </label>
                <input
                  type="text"
                  value={namaGudang}
                  onChange={(e) => setNamaGudang(e.target.value)}
                  placeholder="Contoh: Gudang Jadi Utama - Divisi Packaging"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Identitas unit gudang yang dicetak di baris sub-header laporan.
                </p>
              </div>
            </div>

            {/* Action Bar for System Name */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCurrentToSavedList}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-300"
                  title="Simpan nama ini ke daftar favorit untuk dipakai lagi nanti"
                >
                  <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                  <span>Simpan ke Riwayat Favorit</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="Hapus atau kosongkan nama sistem"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Hapus Nama</span>
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Simpan Perubahan Nama</span>
                </button>
              </div>
            </div>
          </form>

          {/* Preset Rekomendasi Pilihan Cepat */}
          <div className="border-t border-slate-200 pt-5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Pilihan Cepat Nama Sistem (Preset Industri):
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Klik salah satu preset di bawah ini untuk langsung mengisi dan menerapkan nama sistem:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_SYSTEM_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset.nama, preset.sub)}
                  className={`text-left p-2.5 rounded-lg border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                    namaSistem.trim().toUpperCase() === preset.nama.toUpperCase()
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>{preset.nama}</span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold mt-0.5 inline-block ${
                        namaSistem.trim().toUpperCase() === preset.nama.toUpperCase()
                          ? 'text-amber-300'
                          : 'text-slate-500'
                      }`}
                    >
                      [{preset.sub}] &bull; {preset.desc}
                    </span>
                  </div>
                  {namaSistem.trim().toUpperCase() === preset.nama.toUpperCase() && (
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Riwayat Nama Sistem Tersimpan */}
          {savedNamesList.length > 0 && (
            <div className="border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                  Daftar Riwayat Nama Tersimpan ({savedNamesList.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Klik "Gunakan" untuk menerapkan, atau ikon tempat sampah untuk menghapus
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {savedNamesList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.nama}
                      </p>
                      {item.sub && (
                        <p className="text-[10px] text-slate-500 font-medium">
                          Badge: <span className="font-semibold text-slate-700">{item.sub}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(item.nama, item.sub || '')}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors"
                      >
                        Gunakan
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFromSavedList(item.id, item.nama)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        title="Hapus nama ini dari riwayat tersimpan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* CARD 5: MASTER DATA NAMA-NAMA JENIS PAKAN (JAPFA WH)       */}
      {/* ========================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                  Master Data Jenis Pakan Ternak
                </h3>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-200">
                  {masterPakanList.filter((f) => f.isActive).length} Aktif / {masterPakanList.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Daftar referensi resmi nama jenis pakan untuk input autocomplete dan tabel di Laporan Petugas JAPFA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMasterModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Layers className="w-4 h-4 text-indigo-200" />
            <span>Kelola Master Data Pakan</span>
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Quick Preview Chips of Feeds */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Pratinjau Varian Pakan Aktif:
              </span>
              <button
                type="button"
                onClick={() => setIsMasterModalOpen(true)}
                className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
              >
                + Tambah / Edit / Urutkan &rarr;
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              {masterPakanList.map((feed, idx) => (
                <span
                  key={feed.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                    feed.isActive
                      ? 'bg-white text-slate-800 border-slate-300 shadow-2xs'
                      : 'bg-slate-200/60 text-slate-400 border-slate-300 line-through'
                  }`}
                >
                  <span className="font-mono text-[9px] text-slate-400 font-bold">{idx + 1}.</span>
                  <span className="font-bold">{feed.nama}</span>
                  {feed.kode && (
                    <span className="bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded text-[9px] font-mono font-bold">
                      {feed.kode}
                    </span>
                  )}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Perubahan pada master data pakan akan otomatis memperbarui daftar pilihan dan autocomplete pada lembar kerja petugas FG WH.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* CARD 6: STANDAR BOBOT KEMASAN & TOLERANSI GUDANG          */}
      {/* ========================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
              Parameter Standar Bobot & Toleransi Gudang
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Konfigurasi konversi berat per karung dan target toleransi kebocoran
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                Standar Berat Per Karung (Kg):
              </label>
              <input
                type="number"
                min="1"
                value={beratPerKarung}
                onChange={(e) => setBeratPerKarung(parseFloat(e.target.value) || 50)}
                className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                Digunakan untuk konversi Total Penjualan (Kg) menjadi Jumlah Karung.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                Batas Toleransi Rasio Bocor (%):
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={targetToleransi}
                onChange={(e) => setTargetToleransi(parseFloat(e.target.value) || 0.25)}
                className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                Target kepatuhan KPI pabrik (standar default &le; 0.25%).
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            Simpan Seluruh Pengaturan Sistem
          </button>
        </div>

        {/* Reset Data Sample */}
        <div className="bg-slate-50 border-t border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              PULIHKAN DATA SAMPEL BULANAN
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Kembalikan seluruh isi tabel spreadsheet ke nilai sampel foto awal.
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin memulihkan seluruh data tabel ke sampel foto awal?')) {
                onResetData();
                alert('Data berhasil dipulihkan!');
              }
            }}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset Data ke Sampel Foto
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODAL 1: KONFIRMASI HAPUS / RESET TANGGAL LAPORAN         */}
      {/* ========================================================== */}
      {isDeleteDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus atau Reset Tanggal Laporan?
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih opsi reset tanggal yang diinginkan:
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="text-slate-500">Tanggal laporan aktif saat ini:</p>
              <p className="font-bold text-slate-900 text-sm">
                {kotaPengesahan}, {formattedPreviewDate} ({tanggalMode === 'realtime' ? 'Realtime' : 'Manual'})
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleResetTanggal}
                className="w-full text-left p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-bold text-blue-900">
                    Beralih ke Tanggal Realtime (Hari Ini)
                  </p>
                  <p className="text-[11px] text-blue-700">
                    Sistem akan otomatis menggunakan tanggal saat dokumen dibuka atau dicetak.
                  </p>
                </div>
                <RotateCcw className="w-4 h-4 text-blue-600 flex-shrink-0" />
              </button>

              <button
                type="button"
                onClick={handleClearTanggalCustom}
                className="w-full text-left p-3 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-bold text-red-800">
                    Hapus Tanggal Custom
                  </p>
                  <p className="text-[11px] text-red-600">
                    Mengosongkan tanggal manual dan mengembalikan ke tanggal sistem berjalan.
                  </p>
                </div>
                <Trash2 className="w-4 h-4 text-red-600 flex-shrink-0" />
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteDateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 2: KONFIRMASI HAPUS / KOSONGKAN PENANGGUNG JAWAB     */}
      {/* ========================================================== */}
      {isDeleteSignatoriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus atau Kosongkan Penanggung Jawab?
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih tindakan untuk nama penanggung jawab laporan:
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleClearAllPenanggungJawab}
                className="w-full text-left p-3 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-bold text-red-800">
                    Kosongkan Seluruh Penanggung Jawab
                  </p>
                  <p className="text-[11px] text-red-600">
                    Menghapus nama dan jabatan pada Dibuat Oleh, Disetujui Oleh, dan Diketahui Oleh.
                  </p>
                </div>
                <Trash2 className="w-4 h-4 text-red-600 flex-shrink-0" />
              </button>

              <button
                type="button"
                onClick={handleResetPenanggungJawabDefault}
                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Reset ke Standar Default Pabrik
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Kembalikan ke petugas standar JAPFA: Petugas FG WH, AMIN SODIK, dan HERY SHAPRIANTO.
                  </p>
                </div>
                <RotateCcw className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteSignatoriesModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 3: TAMBAH / EDIT PROFIL PENANGGUNG JAWAB             */}
      {/* ========================================================== */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingProfile ? 'Edit Profil Penanggung Jawab' : 'Tambah Penanggung Jawab Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Data staf ini akan tersimpan di daftar profil penanggung jawab
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              {profileFormError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span>{profileFormError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileFormNama}
                  onChange={(e) => setProfileFormNama(e.target.value)}
                  placeholder="Contoh: Muhammad Rizki"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Peran / Otoritas:
                  </label>
                  <select
                    value={profileFormPeran}
                    onChange={(e) =>
                      setProfileFormPeran(
                        e.target.value as 'dibuat' | 'disetujui' | 'diketahui' | 'umum'
                      )
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="dibuat">Dibuat Oleh (Worker)</option>
                    <option value="disetujui">Disetujui Oleh (Supervisor)</option>
                    <option value="diketahui">Diketahui Oleh (Head Dept)</option>
                    <option value="umum">Umum / Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIK / NIP:
                  </label>
                  <input
                    type="text"
                    value={profileFormNik}
                    onChange={(e) => setProfileFormNik(e.target.value)}
                    placeholder="Contoh: WH-0520"
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jabatan / Posisi:
                </label>
                <input
                  type="text"
                  value={profileFormJabatan}
                  onChange={(e) => setProfileFormJabatan(e.target.value)}
                  placeholder="Contoh: FG WH Worker atau Supervisor Logistik"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Divisi / Departemen (Opsional):
                </label>
                <input
                  type="text"
                  value={profileFormDivisi}
                  onChange={(e) => setProfileFormDivisi(e.target.value)}
                  placeholder="Contoh: Gudang Jadi (GBJ) / Warehouse Dept"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Profil</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 3B: KONFIRMASI HAPUS PROFIL PENANGGUNG JAWAB         */}
      {/* ========================================================== */}
      {profileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Profil Penanggung Jawab?
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini akan menghapus profil dari daftar tim penanggung jawab.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nama Lengkap:</span>
                <span className="font-extrabold text-slate-900 text-sm">{profileToDelete.nama}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Jabatan:</span>
                <span className="font-bold text-slate-700">{profileToDelete.jabatan || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Peran:</span>
                <span className="font-bold text-purple-700 uppercase text-[10px]">
                  {profileToDelete.peran === 'dibuat'
                    ? 'Dibuat Oleh'
                    : profileToDelete.peran === 'disetujui'
                    ? 'Disetujui Oleh'
                    : profileToDelete.peran === 'diketahui'
                    ? 'Diketahui Oleh'
                    : 'Umum'}
                </span>
              </div>
              {profileToDelete.nik && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">NIK:</span>
                  <span className="font-mono text-slate-700">{profileToDelete.nik}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProfileToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProfile}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Profil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 3C: KONFIRMASI RESET PROFIL KE STANDAR PABRIK        */}
      {/* ========================================================== */}
      {isResetProfilesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reset Daftar Profil ke Default?
                </h3>
                <p className="text-xs text-slate-500">
                  Kembalikan daftar nama penanggung jawab ke daftar standar bawaan pabrik.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
              Seluruh data profil yang telah ditambahkan atau diubah secara manual akan digantikan dengan {defaultProfilPenanggungJawab.length} profil standar pabrik.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetProfilesModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetProfilesList}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ya, Reset ke Standar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 4: KONFIRMASI HAPUS NAMA SISTEM                      */}
      {/* ========================================================== */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus atau Reset Nama Sistem?
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih opsi penghapusan yang Anda inginkan:
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="text-slate-500">Nama sistem saat ini:</p>
              <p className="font-bold text-slate-900 text-sm">
                "{namaSistem || '(Sudah Kosong)'}"
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleClearSystemName}
                className="w-full text-left p-3 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-bold text-red-800 group-hover:text-red-900">
                    Kosongkan Nama Sistem
                  </p>
                  <p className="text-[11px] text-red-600">
                    Menghapus nama sistem sepenuhnya sehingga tampilan menjadi bersih tanpa judul sistem kustom.
                  </p>
                </div>
                <Trash2 className="w-4 h-4 text-red-600 flex-shrink-0" />
              </button>

              <button
                type="button"
                onClick={handleResetToDefaultSystemName}
                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                    Reset ke Nama Standar Pabrik
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Kembalikan ke nama default resmi: <strong>LAPORAN KARUNG BOCOR</strong>.
                  </p>
                </div>
                <RotateCcw className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Data Pakan Modal */}
      <MasterPakanModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        masterPakanList={masterPakanList}
        onSaveMasterPakan={handleSaveMasterPakanFromSettings}
      />
    </div>
  );
};
