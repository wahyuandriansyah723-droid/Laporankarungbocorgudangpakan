import React from 'react';
import { MonthReport, WarehouseSettings } from '../types';
import { calculateMonthTotals, formatNumberIndonesian } from '../utils/calculations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';

interface AnalyticsViewProps {
  reports: MonthReport[];
  settings: WarehouseSettings;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ reports, settings }) => {
  // Prepare chart data
  const monthlyData = reports.map((r) => {
    const t = calculateMonthTotals(r, settings);
    return {
      name: r.monthName.split(' ')[1] || r.monthName, // e.g. "Januari", "Februari"
      fullName: r.monthName,
      Forklift: t.totalForklift,
      Pallet: t.totalPallet,
      'Bocor Produksi': t.totalBocorProduksi,
      'Total Bocor': t.totalBocor,
      'Rasio %': parseFloat(t.rasioBocorPersen.toFixed(2)),
      Target: settings.targetToleransiPersen,
    };
  });

  // Totals for Pie Chart
  let grandForklift = 0;
  let grandPallet = 0;
  let grandProduksi = 0;
  let grandTotal = 0;

  monthlyData.forEach((d) => {
    grandForklift += d.Forklift;
    grandPallet += d.Pallet;
    grandProduksi += d['Bocor Produksi'];
    grandTotal += d['Total Bocor'];
  });

  const pieData = [
    { name: 'Pallet (Paku/Kayu Rusak)', value: grandPallet, color: '#f59e0b' },
    { name: 'Forklift (Sengatan Garpu)', value: grandForklift, color: '#3b82f6' },
    { name: 'Bocor Produksi (Jahitan/Seal)', value: grandProduksi, color: '#ef4444' },
  ];

  // Find month with highest leakage
  const highestMonth = [...monthlyData].sort((a, b) => b['Total Bocor'] - a['Total Bocor'])[0];
  const lowestMonth = [...monthlyData].filter(m => m['Total Bocor'] > 0).sort((a, b) => a['Total Bocor'] - b['Total Bocor'])[0];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-900 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kerusakan Tertinggi</span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">{highestMonth?.fullName || '-'}</h4>
            <span className="text-xs font-semibold text-slate-700">
              {formatNumberIndonesian(highestMonth?.['Total Bocor'] || 0)} karung ({highestMonth?.['Rasio %']}% ratio)
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kerusakan Terendah</span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">{lowestMonth?.fullName || '-'}</h4>
            <span className="text-xs font-semibold text-emerald-700">
              {formatNumberIndonesian(lowestMonth?.['Total Bocor'] || 0)} karung ({lowestMonth?.['Rasio %']}% ratio)
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-700 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penyebab Dominan</span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">Kerusakan Akibat Pallet</h4>
            <span className="text-xs font-semibold text-red-600">
              {Math.round((grandPallet / (grandTotal || 1)) * 100)}% dari total seluruh kerusakan
            </span>
          </div>
        </div>
      </div>

      {/* Main Stacked Bar Chart: Leakage by Cause */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              TREND KARUNG BOCOR PER BULAN BERDASARKAN PENYEBAB
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Perbandingan akumulasi kerusakan oleh Forklift, Pallet, dan Bocor Produksi
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(value: any) => [`${formatNumberIndonesian(Number(value))} karung`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Pallet" stackId="a" fill="#f59e0b" name="Kerusakan Pallet" />
              <Bar dataKey="Forklift" stackId="a" fill="#3b82f6" name="Kerusakan Forklift" />
              <Bar dataKey="Bocor Produksi" stackId="a" fill="#ef4444" name="Bocor Produksi" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Ratio % Line Chart & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: Percentage vs Target */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                RASIO BOCOR VS TARGET TOLERANSI ({settings.targetToleransiPersen}%)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Laporan tren rasio (%) karung bocor terhadap total penjualan
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Rasio %" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="Rasio Bocor Realisasi (%)" />
                <Line type="monotone" dataKey="Target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Batas Maksimal Toleransi (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-slate-700" />
                PROPORSI PENYEBAB BOCOR
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Komposisi total kerusakan karung di gudang jadi
              </p>
            </div>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${formatNumberIndonesian(Number(val))} karung`, 'Jumlah']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Warehouse Recommendations Section */}
      <div className="bg-slate-900 text-white border border-slate-900 rounded-xl p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-800 text-amber-400 rounded-lg mt-0.5">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              REKOMENDASI PERBAIKAN OPERASIONAL GUDANG JADI
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside font-medium leading-relaxed">
              <li>
                <strong className="text-white">Standarisasi Pallet Kayu:</strong> Kerusakan terbanyak ({Math.round((grandPallet / (grandTotal || 1)) * 100)}%) disebabkan paku menonjol dan kayu lapuk pada pallet. Lakukan pemilahan (sorting) pallet sebelum stacking karung.
              </li>
              <li>
                <strong className="text-white">Evaluasi Operator Forklift:</strong> Pastikan garpu forklift memakai pelindung Karet Anti-Sengat (Fork Sleeves) dan atur kecepatan maksimal 10 km/jam di area staging.
              </li>
              <li>
                <strong className="text-white">Pengawasan Seal Line Produksi:</strong> Kebocoran akibat produksi ({Math.round((grandProduksi / (grandTotal || 1)) * 100)}%) mengindikasikan perlu kalibrasi temperatur mesin sealer bag.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
