import { MonthReport, WarehouseSettings } from '../types';

export interface MonthCalculatedTotals {
  totalForklift: number;
  totalPallet: number;
  totalBocorProduksi: number;
  totalBocor: number;
  totalPenjualanKg: number;
  totalPenjualanKarung: number;
  rasioBocorPersen: number;
}

export function calculateMonthTotals(
  report: MonthReport,
  settings: WarehouseSettings
): MonthCalculatedTotals {
  let totalForklift = 0;
  let totalPallet = 0;
  let totalBocorProduksi = 0;

  for (let d = 1; d <= 31; d++) {
    const entry = report.dailyEntries[d];
    if (entry) {
      totalForklift += entry.forklift || 0;
      totalPallet += entry.pallet || 0;
      totalBocorProduksi += entry.bocorProduksi || 0;
    }
  }

  const totalBocor = totalForklift + totalPallet + totalBocorProduksi;
  const totalPenjualanKg = report.penjualanKg || 0;
  const beratPerKarung = settings.beratPerKarungKg || 50;
  const totalPenjualanKarung = beratPerKarung > 0 ? Math.round(totalPenjualanKg / beratPerKarung) : 0;
  
  const rasioBocorPersen = totalPenjualanKarung > 0 
    ? (totalBocor / totalPenjualanKarung) * 100 
    : 0;

  return {
    totalForklift,
    totalPallet,
    totalBocorProduksi,
    totalBocor,
    totalPenjualanKg,
    totalPenjualanKarung,
    rasioBocorPersen,
  };
}

export function formatNumberIndonesian(val: number): string {
  if (isNaN(val)) return '0';
  return new Intl.NumberFormat('id-ID').format(val);
}

export function formatPercentIndonesian(val: number): string {
  if (isNaN(val)) return '0.00%';
  return val.toFixed(2) + '%';
}

/**
 * Returns total days in the month for a specific year (e.g. 28 days for Feb 2026)
 */
export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex, 0).getDate();
}

/**
 * Returns short Indonesian day name (Min, Sen, Sel, Rab, Kam, Jum, Sab)
 */
export function getIndonesianDayName(year: number, monthIndex: number, day: number): string {
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const d = new Date(year, monthIndex - 1, day);
  return dayNames[d.getDay()];
}

/**
 * Returns full Indonesian day name (Minggu, Senin, Selasa, Rabu, Kamis, Jumat, Sabtu)
 */
export function getIndonesianFullDayName(year: number, monthIndex: number, day: number): string {
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const d = new Date(year, monthIndex - 1, day);
  return dayNames[d.getDay()];
}

export interface AnnualCalculatedTotals {
  grandTotalForklift: number;
  grandTotalPallet: number;
  grandTotalProduksi: number;
  grandTotalBocor: number;
  grandTotalPenjualanKg: number;
  grandTotalPenjualanKarung: number;
  grandRasioBocorPersen: number;
  monthlyBreakdown: Array<{
    monthIndex: number;
    monthName: string;
    totalForklift: number;
    totalPallet: number;
    totalBocorProduksi: number;
    totalBocor: number;
    totalPenjualanKg: number;
    totalPenjualanKarung: number;
    rasioBocorPersen: number;
    isOverTarget: boolean;
    kontribusiPersen: number;
  }>;
}

export function calculateAnnualTotals(
  reports: MonthReport[],
  settings: WarehouseSettings
): AnnualCalculatedTotals {
  let grandTotalForklift = 0;
  let grandTotalPallet = 0;
  let grandTotalProduksi = 0;
  let grandTotalBocor = 0;
  let grandTotalPenjualanKg = 0;
  let grandTotalPenjualanKarung = 0;

  const monthTotalsList = reports.map((r) => {
    const t = calculateMonthTotals(r, settings);
    grandTotalForklift += t.totalForklift;
    grandTotalPallet += t.totalPallet;
    grandTotalProduksi += t.totalBocorProduksi;
    grandTotalBocor += t.totalBocor;
    grandTotalPenjualanKg += t.totalPenjualanKg;
    grandTotalPenjualanKarung += t.totalPenjualanKarung;
    return {
      monthIndex: r.monthIndex,
      monthName: r.monthName,
      ...t,
      isOverTarget: t.rasioBocorPersen > settings.targetToleransiPersen,
      kontribusiPersen: 0,
    };
  });

  const grandRasioBocorPersen =
    grandTotalPenjualanKarung > 0
      ? (grandTotalBocor / grandTotalPenjualanKarung) * 100
      : 0;

  const monthlyBreakdown = monthTotalsList.map((m) => ({
    ...m,
    kontribusiPersen: grandTotalBocor > 0 ? (m.totalBocor / grandTotalBocor) * 100 : 0,
  }));

  return {
    grandTotalForklift,
    grandTotalPallet,
    grandTotalProduksi,
    grandTotalBocor,
    grandTotalPenjualanKg,
    grandTotalPenjualanKarung,
    grandRasioBocorPersen,
    monthlyBreakdown,
  };
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function formatReportDate(
  dateInput: Date | string,
  format: 'DD.MM.YYYY' | 'DD/MM/YYYY' | 'DD MMMM YYYY' | 'YYYY-MM-DD' = 'DD.MM.YYYY'
): string {
  let d: Date;
  if (typeof dateInput === 'string') {
    // Check if YYYY-MM-DD
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = dateInput;
  }

  if (isNaN(d.getTime())) {
    d = new Date();
  }

  const day = String(d.getDate()).padStart(2, '0');
  const monthNum = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const monthName = INDONESIAN_MONTHS[d.getMonth()] || '';

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${monthNum}/${year}`;
    case 'DD MMMM YYYY':
      return `${day} ${monthName} ${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${monthNum}-${day}`;
    case 'DD.MM.YYYY':
    default:
      return `${day}.${monthNum}.${year}`;
  }
}

