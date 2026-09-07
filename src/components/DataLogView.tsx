import React, { useState } from 'react';
import { LeakageRecord } from '../types';
import { formatNumberIndonesian } from '../utils/calculations';
import { Search, Trash2, Edit2, Download, Filter, Calendar } from 'lucide-react';

interface DataLogViewProps {
  logs: LeakageRecord[];
  onDeleteLog: (id: string) => void;
}

export const DataLogView: React.FC<DataLogViewProps> = ({ logs, onDeleteLog }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.date.includes(searchTerm) ||
      (log.operator && log.operator.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.catatan && log.catatan.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesShift = selectedShiftFilter === 'all' || log.shift === selectedShiftFilter;

    return matchesSearch && matchesShift;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
            LOG DETAIL CATATAN KARUNG BOCOR
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Daftar riwayat entri laporan harian gudang jadi
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tanggal, operator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 w-48 font-medium"
            />
          </div>

          <select
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 font-semibold text-slate-800"
          >
            <option value="all">Semua Shift</option>
            <option value="Shift 1">Shift 1</option>
            <option value="Shift 2">Shift 2</option>
            <option value="Shift 3">Shift 3</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold tracking-wider text-[10px] uppercase border-b border-slate-900">
              <th className="p-3 border-r border-slate-800">TANGGAL</th>
              <th className="p-3 border-r border-slate-800">SHIFT</th>
              <th className="p-3 border-r border-slate-800 text-center">FORKLIFT</th>
              <th className="p-3 border-r border-slate-800 text-center">PALLET</th>
              <th className="p-3 border-r border-slate-800 text-center">PRODUKSI</th>
              <th className="p-3 border-r border-slate-800 text-center font-black text-amber-400">
                TOTAL BOCOR
              </th>
              <th className="p-3 border-r border-slate-800">OPERATOR</th>
              <th className="p-3 border-r border-slate-800">CATATAN</th>
              <th className="p-3 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                  Tidak ada catatan log laporan yang sesuai.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-2.5 font-bold text-slate-900 border-r border-slate-100 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {log.date}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-700 uppercase">
                      {log.shift || 'Shift 1'}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-bold border-r border-slate-100 text-slate-800">
                    {log.forklift}
                  </td>
                  <td className="p-2.5 text-center font-bold border-r border-slate-100 text-slate-800">
                    {log.pallet}
                  </td>
                  <td className="p-2.5 text-center font-bold border-r border-slate-100 text-slate-800">
                    {log.bocorProduksi}
                  </td>
                  <td className="p-2.5 text-center font-black border-r border-slate-100 text-slate-900 bg-slate-50">
                    {log.totalBocor}
                  </td>
                  <td className="p-2.5 border-r border-slate-100 text-slate-800 font-medium">
                    {log.operator || '-'}
                  </td>
                  <td className="p-2.5 border-r border-slate-100 text-slate-600 max-w-xs truncate">
                    {log.catatan || '-'}
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Hapus Entri"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
