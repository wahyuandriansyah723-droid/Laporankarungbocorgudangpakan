import React, { useState } from 'react';
import { WarehouseSettings } from '../types';
import { Settings, Save, RotateCcw, Building, Scale, Target, CheckCircle2 } from 'lucide-react';

interface SettingsViewProps {
  settings: WarehouseSettings;
  onSaveSettings: (newSettings: WarehouseSettings) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
}) => {
  const [namaGudang, setNamaGudang] = useState(settings.namaGudang);
  const [beratPerKarung, setBeratPerKarung] = useState(settings.beratPerKarungKg);
  const [targetToleransi, setTargetToleransi] = useState(settings.targetToleransiPersen);
  const [savedMsg, setSavedMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      namaGudang,
      beratPerKarungKg: beratPerKarung,
      targetToleransiPersen: targetToleransi,
    });
    setSavedMsg('Pengaturan sistem berhasil disimpan!');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
              PENGATURAN STANDAR GUDANG JADI
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Konfigurasi bobot kemasan, target rasio toleransi, dan identitas gudang
            </p>
          </div>
        </div>

        {savedMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{savedMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              Nama Gudang / Unit Operasional:
            </label>
            <input
              type="text"
              value={namaGudang}
              onChange={(e) => setNamaGudang(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

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
              Digunakan untuk konversi Total Penjualan (Kg) menjadi Jumlah Karung (Contoh: 29.705.800 Kg / 50 = 594.116 karung)
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
              Jika rasio kerusakan melebihi angka ini, indikator laporan akan berwarna merah/peringatan.
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Simpan Konfigurasi
          </button>
        </form>

        <div className="border-t border-slate-200 pt-5 mt-6">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            PULIHKAN DATA SAMPEL
          </h4>
          <p className="text-xs text-slate-500 font-medium mb-3">
            Kembalikan seluruh data tabel ke nilai sampel awal dari foto spreadsheet (Januari s/d Mei).
          </p>
          <button
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin memulihkan data ke sampel foto awal?')) {
                onResetData();
                alert('Data berhasil dipulihkan!');
              }
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset Data ke Sampel Foto
          </button>
        </div>
      </div>
    </div>
  );
};
