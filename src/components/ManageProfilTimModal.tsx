import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  X,
  Save,
  RotateCcw,
  Search,
  Check,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Building,
} from 'lucide-react';
import { PenanggungJawabProfile } from '../types';
import { defaultProfilPenanggungJawab } from '../data/initialData';

interface ManageProfilTimModalProps {
  isOpen: boolean;
  onClose: () => void;
  profilList: PenanggungJawabProfile[];
  onSaveProfiles: (updatedList: PenanggungJawabProfile[]) => void;
  onSelectProfileForRole?: (profile: PenanggungJawabProfile, role: 'dibuat' | 'disetujui' | 'diketahui') => void;
}

export const ManageProfilTimModal: React.FC<ManageProfilTimModalProps> = ({
  isOpen,
  onClose,
  profilList,
  onSaveProfiles,
  onSelectProfileForRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'dibuat' | 'disetujui' | 'diketahui' | 'umum'>('all');

  // Edit / Add modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PenanggungJawabProfile | null>(null);
  const [formNama, setFormNama] = useState('');
  const [formJabatan, setFormJabatan] = useState('');
  const [formPeran, setFormPeran] = useState<'dibuat' | 'disetujui' | 'diketahui' | 'umum'>('dibuat');
  const [formNik, setFormNik] = useState('');
  const [formDivisi, setFormDivisi] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // In-app Delete confirmation dialog (replaces blocked window.confirm)
  const [profileToDelete, setProfileToDelete] = useState<PenanggungJawabProfile | null>(null);

  // In-app Reset confirmation dialog (replaces blocked window.confirm)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  if (!isOpen) return null;

  const showToast = (text: string, type: 'success' | 'danger' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 3200);
  };

  // Open modal for Adding a new profile
  const handleOpenAdd = (defaultPeran: 'dibuat' | 'disetujui' | 'diketahui' | 'umum' = 'dibuat') => {
    setEditingProfile(null);
    setFormNama('');
    setFormJabatan('');
    setFormPeran(defaultPeran);
    setFormNik('');
    setFormDivisi('');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open modal for Editing an existing profile
  const handleOpenEdit = (p: PenanggungJawabProfile) => {
    setEditingProfile(p);
    setFormNama(p.nama);
    setFormJabatan(p.jabatan);
    setFormPeran(p.peran);
    setFormNik(p.nik || '');
    setFormDivisi(p.divisi || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Save profile handler (Add or Edit)
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) {
      setFormError('Nama lengkap penanggung jawab wajib diisi.');
      return;
    }

    let updatedList: PenanggungJawabProfile[];
    if (editingProfile) {
      // Edit existing profile
      updatedList = profilList.map((p) =>
        p.id === editingProfile.id
          ? {
              ...p,
              nama: formNama.trim(),
              jabatan: formJabatan.trim(),
              peran: formPeran,
              nik: formNik.trim(),
              divisi: formDivisi.trim(),
            }
          : p
      );
      showToast(`Profil "${formNama.trim()}" berhasil diperbarui!`, 'success');
    } else {
      // Add new profile
      const newProfile: PenanggungJawabProfile = {
        id: 'prof_' + Date.now(),
        nama: formNama.trim(),
        jabatan: formJabatan.trim(),
        peran: formPeran,
        nik: formNik.trim(),
        divisi: formDivisi.trim(),
      };
      updatedList = [...profilList, newProfile];
      showToast(`Profil "${formNama.trim()}" berhasil ditambahkan!`, 'success');
    }

    onSaveProfiles(updatedList);
    setIsFormOpen(false);
  };

  // Confirm delete handler (replaces blocked window.confirm)
  const handleConfirmDelete = () => {
    if (!profileToDelete) return;
    const targetName = profileToDelete.nama;
    const updatedList = profilList.filter((p) => p.id !== profileToDelete.id);
    onSaveProfiles(updatedList);
    setProfileToDelete(null);
    showToast(`Profil "${targetName}" berhasil dihapus dari daftar.`, 'danger');
  };

  // Confirm reset handler (replaces blocked window.confirm)
  const handleConfirmReset = () => {
    onSaveProfiles(defaultProfilPenanggungJawab);
    setIsResetConfirmOpen(false);
    showToast('Daftar profil penanggung jawab berhasil dipulihkan ke default pabrik!', 'success');
  };

  // Filtered profiles
  const filteredProfiles = profilList.filter((p) => {
    const matchesSearch =
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.jabatan && p.jabatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.nik && p.nik.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.divisi && p.divisi.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || p.peran === roleFilter;

    return matchesSearch && matchesRole;
  });

  const countDibuat = profilList.filter((p) => p.peran === 'dibuat').length;
  const countDisetujui = profilList.filter((p) => p.peran === 'disetujui').length;
  const countDiketahui = profilList.filter((p) => p.peran === 'diketahui').length;
  const countUmum = profilList.filter((p) => p.peran === 'umum').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                  Kelola Profil Tim Penanggung Jawab
                </h3>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {profilList.length} Staf
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Tambah, edit, dan hapus nama petugas periksa, supervisor, dan kepala bagian gudang.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification Banner */}
        {toastMsg && (
          <div
            className={`px-4 py-2 text-xs font-bold flex items-center justify-between transition-all ${
              toastMsg.type === 'danger'
                ? 'bg-red-50 text-red-800 border-b border-red-200'
                : 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
            }`}
          >
            <span>{toastMsg.text}</span>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-slate-400 hover:text-slate-700 ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* Search, Filter, and Action Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, jabatan, NIK, atau divisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 bg-white rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Kembalikan daftar staf ke default standar pabrik"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Reset Default</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAdd('dibuat')}
                className="px-3.5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tambah Profil</span>
              </button>
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer text-[11px] whitespace-nowrap ${
                roleFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Semua ({profilList.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('dibuat')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer text-[11px] whitespace-nowrap ${
                roleFilter === 'dibuat'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              Dibuat Oleh / Worker ({countDibuat})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('disetujui')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer text-[11px] whitespace-nowrap ${
                roleFilter === 'disetujui'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Disetujui Oleh / Spv ({countDisetujui})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('diketahui')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer text-[11px] whitespace-nowrap ${
                roleFilter === 'diketahui'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Diketahui Oleh / Head ({countDiketahui})
            </button>
            {countUmum > 0 && (
              <button
                type="button"
                onClick={() => setRoleFilter('umum')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer text-[11px] whitespace-nowrap ${
                  roleFilter === 'umum'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Umum ({countUmum})
              </button>
            )}
          </div>
        </div>

        {/* Profiles Grid / List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 max-h-[50vh]">
          {filteredProfiles.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Tidak ada profil penanggung jawab yang sesuai.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Coba ubah kata kunci pencarian atau klik "+ Tambah Profil" untuk mendaftarkan staf baru.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProfiles.map((prof) => (
                <div
                  key={prof.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-900 truncate">
                          {prof.nama}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            prof.peran === 'dibuat'
                              ? 'bg-blue-100 text-blue-800'
                              : prof.peran === 'disetujui'
                              ? 'bg-amber-100 text-amber-900'
                              : prof.peran === 'diketahui'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-100 text-slate-800'
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
                        {prof.jabatan || 'Staf Operasional'}
                        {prof.divisi && ` \u2022 ${prof.divisi}`}
                      </p>
                      {prof.nik && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          NIK: {prof.nik}
                        </span>
                      )}
                    </div>

                    {/* ACTIVE ACTION BUTTONS: EDIT & HAPUS */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(prof)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        title={`Edit profil ${prof.nama}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setProfileToDelete(prof)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-900 border border-red-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        title={`Hapus profil ${prof.nama} dari daftar`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Select for Role in Report (if callback provided) */}
                  {onSelectProfileForRole && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-medium">Gunakan Sebagai:</span>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProfileForRole(prof, 'dibuat');
                          showToast(`"${prof.nama}" dipilih sebagai Dibuat Oleh!`);
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded transition-colors cursor-pointer"
                      >
                        Dibuat
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProfileForRole(prof, 'disetujui');
                          showToast(`"${prof.nama}" dipilih sebagai Disetujui Oleh!`);
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded transition-colors cursor-pointer"
                      >
                        Disetujui
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProfileForRole(prof, 'diketahui');
                          showToast(`"${prof.nama}" dipilih sebagai Diketahui Oleh!`);
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded transition-colors cursor-pointer"
                      >
                        Diketahui
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Perubahan otomatis tersinkronisasi ke seluruh HP, Komputer, dan Laptop.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* SUB-MODAL 1: FORM TAMBAH / EDIT PROFIL                     */}
      {/* ========================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                  {editingProfile ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingProfile ? 'Edit Profil Penanggung Jawab' : 'Tambah Penanggung Jawab Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingProfile
                      ? `Perbarui informasi staf "${editingProfile.nama}"`
                      : 'Data staf ini akan tersimpan di daftar profil penanggung jawab'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="font-bold">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => {
                    setFormNama(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Contoh: Muhammad Rizki"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Peran / Otoritas:
                  </label>
                  <select
                    value={formPeran}
                    onChange={(e) =>
                      setFormPeran(
                        e.target.value as 'dibuat' | 'disetujui' | 'diketahui' | 'umum'
                      )
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs"
                  >
                    <option value="dibuat">Dibuat Oleh (Worker)</option>
                    <option value="disetujui">Disetujui Oleh (Supervisor)</option>
                    <option value="diketahui">Diketahui Oleh (Head Dept)</option>
                    <option value="umum">Umum / Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIK / NIP (Opsional):
                  </label>
                  <input
                    type="text"
                    value={formNik}
                    onChange={(e) => setFormNik(e.target.value)}
                    placeholder="Contoh: WH-0520"
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jabatan / Posisi:
                </label>
                <input
                  type="text"
                  value={formJabatan}
                  onChange={(e) => setFormJabatan(e.target.value)}
                  placeholder="Contoh: FG WH Worker atau Supervisor Logistik"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Divisi / Departemen (Opsional):
                </label>
                <input
                  type="text"
                  value={formDivisi}
                  onChange={(e) => setFormDivisi(e.target.value)}
                  placeholder="Contoh: Gudang Jadi (GBJ) / Warehouse Dept"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingProfile ? 'Simpan Perubahan' : 'Tambah Profil'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUB-MODAL 2: IN-APP KONFIRMASI HAPUS PROFIL                */}
      {/* (Menggantikan window.confirm yang terblokir di iframe)     */}
      {/* ========================================================== */}
      {profileToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Profil Penanggung Jawab?
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini akan menghapus data staf ini dari daftar penanggung jawab.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50/70 rounded-xl border border-red-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">
                  {profileToDelete.nama}
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 uppercase">
                  {profileToDelete.peran}
                </span>
              </div>
              <p className="text-slate-600">
                Jabatan: <strong className="text-slate-800">{profileToDelete.jabatan || '-'}</strong>
              </p>
              {profileToDelete.nik && (
                <p className="text-slate-500 font-mono text-[10px]">
                  NIK: {profileToDelete.nik}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProfileToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Profil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUB-MODAL 3: IN-APP KONFIRMASI RESET DEFAULT               */}
      {/* (Menggantikan window.confirm yang terblokir di iframe)     */}
      {/* ========================================================== */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reset Profil ke Standar Default?
                </h3>
                <p className="text-xs text-slate-500">
                  Pulihkan seluruh daftar staf ke konfigurasi resmi awal pabrik.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Daftar staf yang akan dipulihkan:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                <li>Petugas FG WH (FG WH Worker)</li>
                <li>Budi Santoso (Operator Forklift & Gudang)</li>
                <li>AMIN SODIK (FG WH Supervisor)</li>
                <li>Wahyu Andriansyah (Supervisor Operasional GBJ)</li>
                <li>HERY SHAPRIANTO (Head of WH Subdept)</li>
                <li>Drs. Bambang Irawan (Plant Manager)</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ya, Reset ke Standar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
