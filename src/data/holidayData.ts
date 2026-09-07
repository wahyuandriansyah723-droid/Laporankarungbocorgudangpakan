import { HolidayItem, HolidayCategory, MonthReport } from '../types';
import { getDaysInMonth } from '../utils/calculations';

export const DEFAULT_HOLIDAYS_2026: HolidayItem[] = [
  {
    id: 'hol-2026-01-01',
    monthIndex: 1,
    day: 1,
    name: 'Tahun Baru 2026 Masehi',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-02-16',
    monthIndex: 2,
    day: 16,
    name: "Cuti Bersama Isra Mi'raj",
    category: 'cuti_bersama',
    isRedDay: true,
  },
  {
    id: 'hol-2026-02-17',
    monthIndex: 2,
    day: 17,
    name: "Isra Mi'raj Nabi Muhammad SAW",
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-02-18',
    monthIndex: 2,
    day: 18,
    name: 'Cuti Bersama Tahun Baru Imlek 2577',
    category: 'cuti_bersama',
    isRedDay: true,
  },
  {
    id: 'hol-2026-02-19',
    monthIndex: 2,
    day: 19,
    name: 'Tahun Baru Imlek 2577 Kongzili',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-03-18',
    monthIndex: 3,
    day: 18,
    name: 'Cuti Bersama Hari Suci Nyepi',
    category: 'cuti_bersama',
    isRedDay: true,
  },
  {
    id: 'hol-2026-03-19',
    monthIndex: 3,
    day: 19,
    name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-03-20',
    monthIndex: 3,
    day: 20,
    name: 'Hari Raya Idul Fitri 1447 H - Hari Pertama',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-03-21',
    monthIndex: 3,
    day: 21,
    name: 'Hari Raya Idul Fitri 1447 H - Hari Kedua',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-03-22',
    monthIndex: 3,
    day: 22,
    name: 'Cuti Bersama Idul Fitri 1447 H',
    category: 'cuti_bersama',
    isRedDay: true,
  },
  {
    id: 'hol-2026-03-23',
    monthIndex: 3,
    day: 23,
    name: 'Cuti Bersama Idul Fitri 1447 H',
    category: 'cuti_bersama',
    isRedDay: true,
  },
  {
    id: 'hol-2026-03-24',
    monthIndex: 3,
    day: 24,
    name: 'Cuti Bersama Idul Fitri 1447 H',
    category: 'cuti_bersama',
    isRedDay: true,
  },
  {
    id: 'hol-2026-04-03',
    monthIndex: 4,
    day: 3,
    name: 'Wafat Yesus Kristus (Jumat Agung)',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-04-05',
    monthIndex: 4,
    day: 5,
    name: 'Hari Paskah (Kebangkitan Yesus Kristus)',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-05-01',
    monthIndex: 5,
    day: 1,
    name: 'Hari Buruh Internasional (May Day)',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-05-14',
    monthIndex: 5,
    day: 14,
    name: 'Kenaikan Yesus Kristus',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-05-15',
    monthIndex: 5,
    day: 15,
    name: 'Cuti Bersama Kenaikan Yesus Kristus',
    category: 'cuti_bersama',
    isRedDay: true,
  },
  {
    id: 'hol-2026-05-27',
    monthIndex: 5,
    day: 27,
    name: 'Hari Raya Waisak 2570 BE',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-05-28',
    monthIndex: 5,
    day: 28,
    name: 'Cuti Bersama Hari Raya Waisak',
    category: 'cuti_bersama',
    isRedDay: true,
  },
  {
    id: 'hol-2026-06-01',
    monthIndex: 6,
    day: 1,
    name: 'Hari Lahir Pancasila',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-06-27',
    monthIndex: 6,
    day: 27,
    name: 'Hari Raya Idul Adha 1447 H',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-07-17',
    monthIndex: 7,
    day: 17,
    name: 'Tahun Baru Islam 1448 Hijriah',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-08-17',
    monthIndex: 8,
    day: 17,
    name: 'Hari Kemerdekaan Republik Indonesia Ke-81',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-08-26',
    monthIndex: 8,
    day: 26,
    name: 'Maulid Nabi Muhammad SAW',
    category: 'nasional',
    isRedDay: true,
  },
  {
    id: 'hol-2026-12-24',
    monthIndex: 12,
    day: 24,
    name: 'Cuti Bersama Hari Raya Natal',
    category: 'cuti_bersama',
    isRedDay: true,
  },
  {
    id: 'hol-2026-12-25',
    monthIndex: 12,
    day: 25,
    name: 'Hari Raya Natal',
    category: 'nasional',
    isRedDay: true,
  },
];

const HOLIDAYS_STORAGE_KEY = 'karung_bocor_holidays_2026';
const SUNDAYS_OFF_STORAGE_KEY = 'karung_bocor_sundays_off_2026';

export function loadStoredHolidays(): HolidayItem[] {
  try {
    const raw = localStorage.getItem(HOLIDAYS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Gagal membaca hari libur dari storage:', err);
  }
  return DEFAULT_HOLIDAYS_2026;
}

export function saveStoredHolidays(holidays: HolidayItem[]): void {
  try {
    localStorage.setItem(HOLIDAYS_STORAGE_KEY, JSON.stringify(holidays));
  } catch (err) {
    console.error('Gagal menyimpan hari libur:', err);
  }
}

export function loadSundaysOffSetting(): boolean {
  try {
    const raw = localStorage.getItem(SUNDAYS_OFF_STORAGE_KEY);
    if (raw !== null) {
      return raw === 'true';
    }
  } catch (err) {
    console.warn('Gagal membaca setting hari minggu:', err);
  }
  return true; // default true: Hari Minggu adalah Hari Libur / OFF
}

export function saveSundaysOffSetting(enabled: boolean): void {
  try {
    localStorage.setItem(SUNDAYS_OFF_STORAGE_KEY, String(enabled));
  } catch (err) {
    console.error('Gagal menyimpan setting hari minggu:', err);
  }
}

export function getHolidayInfo(
  holidays: HolidayItem[],
  sundaysOff: boolean,
  year: number,
  monthIndex: number,
  day: number
): { isRed: boolean; reason?: string; category?: HolidayCategory | 'minggu' } {
  // Check Sunday
  const dateObj = new Date(year, monthIndex - 1, day);
  const isSunday = dateObj.getDay() === 0;

  const foundHoliday = holidays.find(
    (h) => h.monthIndex === monthIndex && h.day === day && h.isRedDay !== false
  );

  if (foundHoliday) {
    return {
      isRed: true,
      reason: foundHoliday.name,
      category: foundHoliday.category,
    };
  }

  if (isSunday && sundaysOff) {
    return {
      isRed: true,
      reason: 'Hari Minggu (Hari Libur Rutin)',
      category: 'minggu',
    };
  }

  return {
    isRed: false,
  };
}

export function applyHolidaysToReports(
  reports: MonthReport[],
  holidays: HolidayItem[],
  sundaysOff: boolean,
  year: number = 2026
): MonthReport[] {
  return reports.map((r) => {
    const maxDays = getDaysInMonth(year, r.monthIndex);
    const updatedDailyEntries = { ...r.dailyEntries };

    for (let d = 1; d <= maxDays; d++) {
      const current = updatedDailyEntries[d] || { forklift: 0, pallet: 0, bocorProduksi: 0 };
      const info = getHolidayInfo(holidays, sundaysOff, year, r.monthIndex, d);

      updatedDailyEntries[d] = {
        ...current,
        isRedDay: info.isRed ? true : undefined,
        note: info.reason || current.note,
      };
    }

    return {
      ...r,
      dailyEntries: updatedDailyEntries,
    };
  });
}

export const CATEGORY_METADATA: Record<
  HolidayCategory | 'minggu',
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  nasional: {
    label: 'Hari Libur Nasional',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
    borderClass: 'border-red-300',
  },
  cuti_bersama: {
    label: 'Cuti Bersama',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-300',
  },
  pabrik_off: {
    label: 'Libur Pabrik / Gudang',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-800',
    borderClass: 'border-purple-300',
  },
  khusus: {
    label: 'Khusus / Maintenance',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-300',
  },
  minggu: {
    label: 'Hari Minggu',
    bgClass: 'bg-rose-100',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-300',
  },
};
