import React, { useState } from 'react';
import { MonthReport, WarehouseSettings, LeakageRecord } from '../types';
import { PlusCircle, Save, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

interface InputDataFormProps {
  reports: MonthReport[];
  settings: WarehouseSettings;
  onAddLogEntry: (record: Omit<LeakageRecord, 'id'>) => void;
  onUpdateCellStatus: (monthIndex: number, day: number, isRed: boolean, isYellow: boolean) => void;
}

export const InputDataForm: React.FC<InputDataFormProps> = ({
  reports,
  settings,
  onAddLogEntry,
  onUpdateCellStatus,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [dateStr, setDateStr] = useState(todayStr);
  const [forklift, setForklift] = useState<number | ''>(0);
  const [pallet, setPallet] = useState<number | ''>(0);
  const [bocorProduksi, setBocorProduksi] = useState<number | ''>(0);
  const [shift, setShift] = useState('Shift 1');
  const [operator, setOperator] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isRedDay, setIsRedDay] = useState(false);
  const [isYellowDay, setIsYellowDay] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parts = dateStr.split('-').map(Number);
    const monthIndex = parts[1] || 1; // 1..12
    const day = parts[2] || 1;

    const fkVal = typeof forklift === 'number' ? forklift : 0;
    const plVal = typeof pallet === 'number' ? pallet : 0;
    const prVal = typeof bocorProduksi === 'number' ? bocorProduksi : 0;
    const total = fkVal + plVal + prVal;

    onAddLogEntry({
      date: dateStr,
      monthIndex,
      day,
      forklift: fkVal,
      pallet: plVal,
      bocorProduksi: prVal,
      totalBocor: total,
      shift,
      operator,
      catatan,
    });

    onUpdateCellStatus(monthIndex, day, isRedDay, isYellowDay);

    setSuccessMessage(`Data tanggal ${dateStr} berhasil disimpan! Total Karung Bocor: ${total}`);
    setTimeout(() => setSuccessMessage(''), 4000);

    // Reset form
    setForklift(0);
    setPallet(0);
    setBocorProduksi(0);
    setCatatan('');
  };

  const currentTotal = (typeof forklift === 'number' ? forklift : 0) +
                     (typeof pallet === 'number' ? pallet : 0) +
                     (typeof bocorProduksi === 'number' ? bocorProduksi : 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-xs">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
              INPUT LAPORAN KARUNG BOCOR HARIAN
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Catat jumlah karung bocor berdasarkan penyebab kerusakan dan shift kerja
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Date & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tanggal Laporan:
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Shift Kerja:
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold text-slate-800"
              >
                <option value="Shift 1">Shift 1 (07:00 - 15:00)</option>
                <option value="Shift 2">Shift 2 (15:00 - 23:00)</option>
                <option value="Shift 3">Shift 3 (23:00 - 07:00)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Quantities */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              Jumlah Karung Bocor Berdasarkan Penyebab
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Forklift */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  FORKLIFT
                </label>
                <input
                  type="number"
                  min="0"
                  value={forklift}
                  onChange={(e) => setForklift(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full text-lg font-black text-slate-900 border border-slate-300 rounded-lg p-2 text-center bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">Tersengat garpu/gesekan</span>
              </div>

              {/* Pallet */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  PALLET
                </label>
                <input
                  type="number"
                  min="0"
                  value={pallet}
                  onChange={(e) => setPallet(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full text-lg font-black text-slate-900 border border-slate-300 rounded-lg p-2 text-center bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">Paku pallet menonjol/lapuk</span>
              </div>

              {/* Bocor Produksi */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  BOCOR PRODUKSI
                </label>
                <input
                  type="number"
                  min="0"
                  value={bocorProduksi}
                  onChange={(e) => setBocorProduksi(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full text-lg font-black text-slate-900 border border-slate-300 rounded-lg p-2 text-center bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">Jahitan lepas/seal bocor</span>
              </div>
            </div>

            {/* Total Indicator */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">TOTAL KARUNG BOCOR HARI INI:</span>
              <span className="text-sm font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-300 shadow-2xs">
                {currentTotal} karung
              </span>
            </div>
          </div>

          {/* Row 3: Operator & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nama Operator / Petugas:
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Catatan / Keterangan Tambahan:
              </label>
              <input
                type="text"
                placeholder="Contoh: Pallet kayu banyak paku tajam di Line 2"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Row 4: Status Day Colors */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center gap-6 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider">Format Sel:</span>
            <label className="flex items-center gap-2 cursor-pointer bg-red-50 hover:bg-red-100 p-2 rounded-lg border border-red-200 transition-colors">
              <input
                type="checkbox"
                checked={isRedDay}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsRedDay(checked);
                  if (checked) setIsYellowDay(false);
                  const dateObj = new Date(dateStr);
                  if (!isNaN(dateObj.getTime())) {
                    onUpdateCellStatus(dateObj.getMonth() + 1, dateObj.getDate(), checked, false);
                  }
                }}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
              />
              <span className="font-extrabold text-red-700">Hari Libur / Off (Latar Merah Aktif di Excel)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isYellowDay}
                onChange={(e) => {
                  setIsYellowDay(e.target.checked);
                  if (e.target.checked) setIsRedDay(false);
                }}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <span className="font-semibold text-amber-800">Sorot Khusus / Audit (Latar Kuning)</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Simpan Laporan Harian
          </button>
        </form>
      </div>
    </div>
  );
};
