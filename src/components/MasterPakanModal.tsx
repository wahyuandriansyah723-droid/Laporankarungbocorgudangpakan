import React, { useState, useMemo } from 'react';
import { MasterJenisPakan } from '../types';
import { defaultMasterFeedTypes } from '../data/samplePetugasReport';
import {
  X,
  Plus,
  Search,
  Check,
  Edit3,
  Trash2,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Layers,
  Package,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface MasterPakanModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterPakanList: MasterJenisPakan[];
  onSaveMasterPakan: (newList: MasterJenisPakan[]) => void;
  onApplyToActiveReport?: (activeFeedNames: string[]) => void;
}

const CATEGORY_PRESETS = [
  'Semua Kategori',
  'Broiler Starter',
  'Broiler Finisher',
  'DOC Pakan Awal',
  'Layer Starter',
  'Layer Grower',
  'Layer Produksi',
  'Konsentrat Petelur',
  'Bebek / Unggas',
  'Spesial Formula',
  'Lainnya',
];

export const MasterPakanModal: React.FC<MasterPakanModalProps> = ({
  isOpen,
  onClose,
  masterPakanList,
  onSaveMasterPakan,
  onApplyToActiveReport,
}) => {
  const [list, setList] = useState<MasterJenisPakan[]>(() => {
    if (masterPakanList && masterPakanList.length > 0) {
      return masterPakanList;
    }
    return defaultMasterFeedTypes;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formKode, setFormKode] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formKategori, setFormKategori] = useState('Broiler Starter');
  const [formBerat, setFormBerat] = useState<number>(50);
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Bulk Paste / Quick Import State
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Notification / Toast
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  if (!isOpen) return null;

  // Filtered list based on search and category
  const filteredList = list.filter((item) => {
    const matchesSearch =
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.kode && item.kode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'Semua Kategori' ||
      (item.kategori && item.kategori.toLowerCase().includes(selectedCategory.toLowerCase()));

    return matchesSearch && matchesCategory;
  });

  const activeFeedsCount = list.filter((f) => f.isActive).length;

  const resetForm = () => {
    setFormKode('');
    setFormNama('');
    setFormKategori('Broiler Starter');
    setFormBerat(50);
    setFormKeterangan('');
    setFormIsActive(true);
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleStartAdd = () => {
    resetForm();
    setShowAddForm(true);
    setShowBulkPaste(false);
  };

  const handleStartEdit = (item: MasterJenisPakan) => {
    setEditingId(item.id);
    setFormKode(item.kode || '');
    setFormNama(item.nama);
    setFormKategori(item.kategori || 'Broiler Starter');
    setFormBerat(item.beratKemasan || 50);
    setFormKeterangan(item.keterangan || '');
    setFormIsActive(item.isActive);
    setShowAddForm(true);
    setShowBulkPaste(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNama = formNama.trim();
    if (!cleanNama) {
      showNotification('Nama jenis pakan wajib diisi!');
      return;
    }

    let updated: MasterJenisPakan[];

    if (editingId) {
      // Edit existing
      updated = list.map((item) =>
        item.id === editingId
          ? {
              ...item,
              kode: formKode.trim().toUpperCase() || undefined,
              nama: cleanNama,
              kategori: formKategori.trim(),
              beratKemasan: formBerat > 0 ? formBerat : 50,
              keterangan: formKeterangan.trim(),
              isActive: formIsActive,
            }
          : item
      );
      showNotification(`Jenis pakan "${cleanNama}" berhasil diperbarui!`);
    } else {
      // Check duplicate
      const isExist = list.some((i) => i.nama.toLowerCase() === cleanNama.toLowerCase());
      if (isExist) {
        showNotification(`Pakan dengan nama "${cleanNama}" sudah ada dalam master data!`);
        return;
      }

      const newItem: MasterJenisPakan = {
        id: `pakan_${Date.now()}`,
        kode: formKode.trim().toUpperCase() || undefined,
        nama: cleanNama,
        kategori: formKategori.trim(),
        beratKemasan: formBerat > 0 ? formBerat : 50,
        keterangan: formKeterangan.trim(),
        isActive: formIsActive,
        urutan: list.length + 1,
      };
      updated = [...list, newItem];
      showNotification(`Jenis pakan baru "${cleanNama}" berhasil ditambahkan ke master data!`);
    }

    setList(updated);
    onSaveMasterPakan(updated);
    resetForm();
  };

  const handleDelete = (id: string, nama: string) => {
    if (confirm(`Hapus jenis pakan "${nama}" dari master data?`)) {
      const updated = list
        .filter((item) => item.id !== id)
        .map((item, idx) => ({ ...item, urutan: idx + 1 }));
      setList(updated);
      onSaveMasterPakan(updated);
      showNotification(`Jenis pakan "${nama}" telah dihapus.`);
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = list.map((item) =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    setList(updated);
    onSaveMasterPakan(updated);
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const updated = [...list];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((item, idx) => ({ ...item, urutan: idx + 1 }));
    setList(reordered);
    onSaveMasterPakan(reordered);
  };

  const handleResetToDefault = () => {
    if (
      confirm(
        'Kembalikan master data pakan ke 16 jenis pakan standar JAPFA (Parli, Par DOC, SB 10, KUK SUPRA, dll)?'
      )
    ) {
      setList(defaultMasterFeedTypes);
      onSaveMasterPakan(defaultMasterFeedTypes);
      showNotification('Master data pakan berhasil direset ke standar pabrik JAPFA!');
    }
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) {
      showNotification('Masukkan atau tempel daftar nama pakan terlebih dahulu!');
      return;
    }

    // Support comma separated, or newline separated
    const rawLines = bulkText
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawLines.length === 0) {
      showNotification('Tidak ada nama pakan yang valid terdeteksi.');
      return;
    }

    const currentNames = new Set(list.map((i) => i.nama.toLowerCase()));
    const newItems: MasterJenisPakan[] = [];

    rawLines.forEach((name, i) => {
      if (!currentNames.has(name.toLowerCase())) {
        currentNames.add(name.toLowerCase());
        newItems.push({
          id: `pakan_bulk_${Date.now()}_${i}`,
          nama: name,
          kategori: 'Broiler Starter',
          beratKemasan: 50,
          isActive: true,
          urutan: list.length + newItems.length + 1,
        });
      }
    });

    if (newItems.length === 0) {
      showNotification('Semua pakan yang ditempel sudah ada dalam daftar.');
    } else {
      const combined = [...list, ...newItems];
      setList(combined);
      onSaveMasterPakan(combined);
      setBulkText('');
      setShowBulkPaste(false);
      showNotification(`Berhasil menambahkan ${newItems.length} jenis pakan baru dari teks!`);
    }
  };

  const handleApplyToTable = () => {
    if (!onApplyToActiveReport) return;
    const activeNames = list.filter((f) => f.isActive).map((f) => f.nama);
    onApplyToActiveReport(activeNames);
    showNotification(`Daftar ${activeNames.length} jenis pakan aktif berhasil diterapkan ke tabel laporan hari ini!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide uppercase">
                  Master Data Jenis Pakan Ternak
                </h2>
                <span className="bg-blue-500/30 text-blue-200 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Unit GBJ JAPFA
                </span>
              </div>
              <p className="text-xs text-blue-200/80 font-medium mt-0.5">
                Pusat kelola nama pakan, kode sak, kategori ternak, dan urutan untuk Tabel Petugas FG WH
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shadow-xs animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Controls & Quick Action Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari jenis pakan / kode..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-700"
            >
              {CATEGORY_PRESETS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!showAddForm && (
              <button
                type="button"
                onClick={handleStartAdd}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pakan</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowBulkPaste(!showBulkPaste);
                setShowAddForm(false);
              }}
              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Tempel daftar nama pakan sekaligus (Bulk Paste)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Impor Cepat</span>
            </button>

            {onApplyToActiveReport && (
              <button
                type="button"
                onClick={handleApplyToTable}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                title="Terapkan urutan pakan master ini ke baris tabel laporan petugas hari ini"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Terapkan ke Tabel</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetToDefault}
              className="p-1.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-600 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              title="Reset ke Standar JAPFA (16 Jenis Pakan)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bulk Paste Area */}
        {showBulkPaste && (
          <div className="p-4 bg-blue-50/70 border-b border-blue-200 flex flex-col gap-2 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Tempel Nama Pakan Sekaligus (Baris per baris atau dipisah koma):
              </span>
              <button
                onClick={() => setShowBulkPaste(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Tutup
              </button>
            </div>
            <textarea
              rows={3}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Contoh:&#10;Parli&#10;Par DOC&#10;SB 10&#10;KUK SUPRA"
              className="w-full p-2 text-xs border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkPaste(false)}
                className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-md"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                className="px-3 py-1 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-md flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Tambahkan ke Master</span>
              </button>
            </div>
          </div>
        )}

        {/* Add / Edit Form Modal Segment */}
        {showAddForm && (
          <form onSubmit={handleSaveForm} className="p-4 bg-amber-50/60 border-b border-amber-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
                <Package className="w-4 h-4 text-amber-700" />
                {editingId ? 'Edit Data Jenis Pakan' : 'Tambah Jenis Pakan Baru'}
              </span>
              <button
                type="button"
                onClick={resetForm}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold"
              >
                Batal
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Nama Pakan */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase">
                  Nama Jenis Pakan: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="e.g. Parli, SB 10"
                  className="w-full px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Kode Pakan */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase">
                  Kode Kemasan / Sak:
                </label>
                <input
                  type="text"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value)}
                  placeholder="e.g. PRL, SB10"
                  className="w-full px-2.5 py-1 text-xs font-bold uppercase border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Kategori */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase">
                  Kategori Ternak:
                </label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  placeholder="Pilih / ketik kategori..."
                  className="w-full px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-amber-500"
                />
                <datalist id="category-suggestions">
                  {CATEGORY_PRESETS.filter((c) => c !== 'Semua Kategori').map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* Berat Kemasan (Kg) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase">
                  Berat Kemasan (Kg/Sak):
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formBerat}
                  onChange={(e) => setFormBerat(parseFloat(e.target.value) || 50)}
                  className="w-full px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Keterangan */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase">
                  Keterangan / Spesifikasi:
                </label>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="e.g. Pakan crumble starter pedaging kualitas premium"
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Status Aktif & Submit */}
              <div className="sm:col-span-2 flex items-center justify-between pt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Aktif (Otomatis tampil di lembar laporan harian)
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-md"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-black rounded-md flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingId ? 'Simpan Perubahan' : 'Tambah ke Master'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Master Feeds Table / List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Daftar Master Jenis Pakan ({filteredList.length} dari {list.length} terdaftar &bull;{' '}
              <span className="text-emerald-700">{activeFeedsCount} Aktif</span>)
            </span>
            <span className="text-[11px] text-slate-500">
              Gunakan tanda panah &uarr;&darr; untuk menyusun urutan baris di lembar kerja
            </span>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-[10px] font-black uppercase">
                  <th className="p-2.5 text-center w-12">No</th>
                  <th className="p-2.5 text-center w-20">Urutan</th>
                  <th className="p-2.5 w-24">Kode</th>
                  <th className="p-2.5 min-w-[160px]">Jenis Pakan Ternak</th>
                  <th className="p-2.5 w-36">Kategori</th>
                  <th className="p-2.5 text-center w-20">Kemasan</th>
                  <th className="p-2.5 min-w-[160px]">Keterangan</th>
                  <th className="p-2.5 text-center w-24">Status</th>
                  <th className="p-2.5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-xs">Tidak ada jenis pakan yang cocok dengan filter pencarian.</p>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, index) => {
                    const originalIndex = list.findIndex((l) => l.id === item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          !item.isActive ? 'opacity-60 bg-slate-50/50' : ''
                        }`}
                      >
                        {/* No */}
                        <td className="p-2 text-center font-bold text-slate-500">
                          {index + 1}
                        </td>

                        {/* Reorder Buttons */}
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              disabled={originalIndex === 0}
                              onClick={() => handleMoveOrder(originalIndex, 'up')}
                              className="p-1 hover:bg-slate-200 text-slate-600 rounded disabled:opacity-20 cursor-pointer"
                              title="Pindahkan urutan ke atas"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={originalIndex === list.length - 1}
                              onClick={() => handleMoveOrder(originalIndex, 'down')}
                              className="p-1 hover:bg-slate-200 text-slate-600 rounded disabled:opacity-20 cursor-pointer"
                              title="Pindahkan urutan ke bawah"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Kode */}
                        <td className="p-2">
                          <span className="font-mono text-[10px] font-extrabold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-300">
                            {item.kode || '-'}
                          </span>
                        </td>

                        {/* Nama */}
                        <td className="p-2">
                          <span className="font-black text-slate-900 text-xs uppercase tracking-wide">
                            {item.nama}
                          </span>
                        </td>

                        {/* Kategori */}
                        <td className="p-2">
                          <span className="text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-block">
                            {item.kategori || 'Umum'}
                          </span>
                        </td>

                        {/* Kemasan */}
                        <td className="p-2 text-center font-bold text-slate-700">
                          {item.beratKemasan || 50} kg
                        </td>

                        {/* Keterangan */}
                        <td className="p-2 text-[11px] text-slate-500 truncate max-w-[200px]" title={item.keterangan}>
                          {item.keterangan || '-'}
                        </td>

                        {/* Status Aktif Switch */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(item.id)}
                            className={`px-2 py-0.5 text-[10px] font-black rounded-full border cursor-pointer transition-colors ${
                              item.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {item.isActive ? 'Aktif' : 'Non-Aktif'}
                          </button>
                        </td>

                        {/* Aksi */}
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1 hover:bg-blue-100 text-blue-700 rounded transition-colors cursor-pointer"
                              title="Edit Jenis Pakan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, item.nama)}
                              className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                              title="Hapus Jenis Pakan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <Package className="w-4 h-4 text-blue-600" />
            <span>
              Perubahan master data otomatis tersinkronisasi ke Firebase Firestore & Pengaturan Sistem.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
