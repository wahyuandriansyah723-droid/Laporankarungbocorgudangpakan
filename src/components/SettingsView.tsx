import React, { useState, useEffect } from 'react';
import { WarehouseSettings } from '../types';
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
} from 'lucide-react';

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

const LOCAL_STORAGE_KEY_CUSTOM_NAMES = 'karung_bocor_saved_system_names';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
}) => {
  // Active Form State
  const [namaSistem, setNamaSistem] = useState(
    settings.namaSistem !== undefined ? settings.namaSistem : 'LAPORAN KARUNG BOCOR'
  );
  const [subNamaSistem, setSubNamaSistem] = useState(
    settings.subNamaSistem !== undefined ? settings.subNamaSistem : 'GUDANG JADI (GBJ)'
  );
  const [namaGudang, setNamaGudang] = useState(settings.namaGudang);
  const [beratPerKarung, setBeratPerKarung] = useState(settings.beratPerKarungKg);
  const [targetToleransi, setTargetToleransi] = useState(settings.targetToleransiPersen);

  // Notification and confirmation states
  const [savedMsg, setSavedMsg] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  // Keep state synced when settings prop updates from Firestore
  useEffect(() => {
    if (settings.namaSistem !== undefined) {
      setNamaSistem(settings.namaSistem);
    }
    if (settings.subNamaSistem !== undefined) {
      setSubNamaSistem(settings.subNamaSistem);
    }
    setNamaGudang(settings.namaGudang);
    setBeratPerKarung(settings.beratPerKarungKg);
    setTargetToleransi(settings.targetToleransiPersen);
  }, [settings]);

  // Save custom names list to localStorage
  const persistSavedNames = (list: Array<{ id: string; nama: string; sub: string }>) => {
    setSavedNamesList(list);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOM_NAMES, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Simpan Nama Sistem & Pengaturan
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: WarehouseSettings = {
      namaSistem: namaSistem.trim(),
      subNamaSistem: subNamaSistem.trim(),
      namaGudang: namaGudang.trim(),
      beratPerKarungKg: beratPerKarung,
      targetToleransiPersen: targetToleransi,
    };
    onSaveSettings(updated);

    // Also auto-add to saved history list if unique
    if (namaSistem.trim()) {
      const exists = savedNamesList.some(
        (item) => item.nama.toLowerCase() === namaSistem.trim().toLowerCase()
      );
      if (!exists) {
        const newList = [
          { id: Date.now().toString(), nama: namaSistem.trim(), sub: subNamaSistem.trim() },
          ...savedNamesList,
        ].slice(0, 10);
        persistSavedNames(newList);
      }
    }

    setSavedMsg({
      text: `Nama sistem "${namaSistem.trim() || '(Tanpa Nama)'}" & konfigurasi berhasil disimpan!`,
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 4000);
  };

  // 2. Hapus / Kosongkan Nama Sistem (Set to Empty "")
  const handleClearSystemName = () => {
    setNamaSistem('');
    setSubNamaSistem('');
    const updated: WarehouseSettings = {
      ...settings,
      namaSistem: '',
      subNamaSistem: '',
      namaGudang,
      beratPerKarungKg: beratPerKarung,
      targetToleransiPersen: targetToleransi,
    };
    onSaveSettings(updated);
    setIsDeleteDialogOpen(false);
    setSavedMsg({
      text: 'Nama sistem telah dikosongkan (dihapus dari tampilan aplikasi & laporan).',
      type: 'danger',
    });
    setTimeout(() => setSavedMsg(null), 4500);
  };

  // 3. Reset Nama Sistem ke Standar Pabrik
  const handleResetToDefaultSystemName = () => {
    const defaultName = 'LAPORAN KARUNG BOCOR';
    const defaultSub = 'GUDANG JADI (GBJ)';
    setNamaSistem(defaultName);
    setSubNamaSistem(defaultSub);
    const updated: WarehouseSettings = {
      ...settings,
      namaSistem: defaultName,
      subNamaSistem: defaultSub,
      namaGudang,
      beratPerKarungKg: beratPerKarung,
      targetToleransiPersen: targetToleransi,
    };
    onSaveSettings(updated);
    setIsDeleteDialogOpen(false);
    setSavedMsg({
      text: `Nama sistem berhasil direset ke standar: "${defaultName}".`,
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 4500);
  };

  // 4. Terapkan Preset Nama Sistem
  const handleApplyPreset = (nama: string, sub: string) => {
    setNamaSistem(nama);
    setSubNamaSistem(sub);
    const updated: WarehouseSettings = {
      ...settings,
      namaSistem: nama,
      subNamaSistem: sub,
      namaGudang,
      beratPerKarungKg: beratPerKarung,
      targetToleransiPersen: targetToleransi,
    };
    onSaveSettings(updated);
    setSavedMsg({
      text: `Nama sistem berhasil diubah ke preset: "${nama}".`,
      type: 'success',
    });
    setTimeout(() => setSavedMsg(null), 4000);
  };

  // 5. Hapus item dari daftar nama tersimpan (Delete from saved names list)
  const handleDeleteFromSavedList = (id: string, name: string) => {
    const updated = savedNamesList.filter((item) => item.id !== id);
    persistSavedNames(updated);
    setSavedMsg({
      text: `Nama "${name}" telah dihapus dari daftar riwayat tersimpan.`,
      type: 'danger',
    });
    setTimeout(() => setSavedMsg(null), 3000);
  };

  // 6. Tambah nama saat ini ke daftar tersimpan secara manual
  const handleSaveCurrentToSavedList = () => {
    if (!namaSistem.trim()) return;
    const exists = savedNamesList.some(
      (item) => item.nama.toLowerCase() === namaSistem.trim().toLowerCase()
    );
    if (exists) {
      alert('Nama sistem ini sudah ada di daftar tersimpan.');
      return;
    }
    const newList = [
      { id: Date.now().toString(), nama: namaSistem.trim(), sub: subNamaSistem.trim() },
      ...savedNamesList,
    ];
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
      {/* CARD 1: PENGATURAN NAMA SISTEM (EDIT, SIMPAN, HAPUS)       */}
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

          {/* Riwayat Nama Sistem Tersimpan (Kelola & Hapus Per Item) */}
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
      {/* CARD 2: STANDAR BOBOT KEMASAN & TOLERANSI GUDANG          */}
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
            Simpan Seluruh Pengaturan
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
      {/* DIALOG / MODAL: KONFIRMASI HAPUS NAMA SISTEM              */}
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
              {/* Option 1: Kosongkan Nama */}
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

              {/* Option 2: Reset ke Default */}
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
    </div>
  );
};
