import {
  MonthReport,
  WarehouseSettings,
  TanggalLaporanSettings,
  PenanggungJawabLaporan,
  PenanggungJawabProfile,
} from '../types';
import { defaultMasterFeedTypes } from './samplePetugasReport';

export function isIndonesianRedDay(year: number, monthIndex: number, day: number): boolean {
  // monthIndex is 1..12
  const dateObj = new Date(year, monthIndex - 1, day);
  if (dateObj.getDay() === 0) return true; // Sunday is always Red Day

  const holidays: Record<number, number[]> = {
    1: [1],          // 1 Jan: Tahun Baru 2026
    2: [17, 19],     // 17 Feb: Isra Mi'raj, 19 Feb: Imlek
    3: [19, 20, 21], // 19 Mar: Nyepi, 20-21 Mar: Idul Fitri
    4: [3],          // 3 Apr: Wafat Yesus Kristus
    5: [1, 14, 27],  // 1 Mei: Hari Buruh, 14 Mei: Kenaikan Yesus Kristus, 27 Mei: Waisak
    6: [1, 27],      // 1 Jun: Hari Lahir Pancasila, 27 Jun: Idul Adha
    7: [17],         // 17 Jul: Tahun Baru Islam
    8: [17, 26],     // 17 Ags: HUT RI, 26 Ags: Maulid Nabi
    12: [25],        // 25 Des: Natal
  };

  return (holidays[monthIndex] || []).includes(day);
}

export function createEmptyMonthReports(): MonthReport[] {
  const year = 2026;
  const monthNames = [
    '01 JANUARI', '02 FEBRUARI', '03 MARET', '04 APRIL',
    '05 MEI', '06 JUNI', '07 JULI', '08 AGUSTUS',
    '09 SEPTEMBER', '10 OKTOBER', '11 NOVEMBER', '12 DESEMBER'
  ];
  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return monthNames.map((name, idx) => {
    const monthIndex = idx + 1;
    const days = daysInMonths[idx];
    const dailyEntries: Record<number, any> = {};
    for (let d = 1; d <= days; d++) {
      const isRed = isIndonesianRedDay(year, monthIndex, d);
      const entry: any = {
        forklift: 0,
        pallet: 0,
        bocorProduksi: 0,
      };
      if (isRed) {
        entry.isRedDay = true;
      }
      dailyEntries[d] = entry;
    }
    return {
      monthIndex,
      monthName: name,
      penjualanKg: 30000000,
      dailyEntries,
    };
  });
}

export const emptyMonthReports = createEmptyMonthReports();

export const defaultTanggalSettings: TanggalLaporanSettings = {
  mode: 'custom',
  tanggalCustom: '2026-07-18',
  formatTanggal: 'DD.MM.YYYY',
  kotaPengesahan: 'Sidoarjo',
  tahunLaporan: 2026,
};

export const defaultPenanggungJawab: PenanggungJawabLaporan = {
  dibuatOleh: 'Petugas FG WH',
  jabatanDibuat: 'FG WH Worker',
  nikDibuat: 'WH-0492',

  disetujuiOleh: 'AMIN SODIK',
  jabatanDisetujui: 'FG WH Supervisor',
  nikDisetujui: 'SPV-0118',

  diketahuiOleh: 'HERY SHAPRIANTO',
  jabatanDiketahui: 'Head of WH Subdept',
  nikDiketahui: 'HOD-0023',
};

export const defaultProfilPenanggungJawab: PenanggungJawabProfile[] = [
  { id: '1', nama: 'Petugas FG WH', jabatan: 'FG WH Worker', peran: 'dibuat', nik: 'WH-0492', divisi: 'Gudang Jadi' },
  { id: '2', nama: 'Budi Santoso', jabatan: 'Operator Forklift & Gudang', peran: 'dibuat', nik: 'OP-0231', divisi: 'Gudang Jadi' },
  { id: '3', nama: 'AMIN SODIK', jabatan: 'FG WH Supervisor', peran: 'disetujui', nik: 'SPV-0118', divisi: 'Logistik & WH' },
  { id: '4', nama: 'Wahyu Andriansyah', jabatan: 'Supervisor Operasional GBJ', peran: 'disetujui', nik: 'SPV-0125', divisi: 'Logistik & WH' },
  { id: '5', nama: 'HERY SHAPRIANTO', jabatan: 'Head of WH Subdept', peran: 'diketahui', nik: 'HOD-0023', divisi: 'Warehouse Dept' },
  { id: '6', nama: 'Drs. Bambang Irawan', jabatan: 'Plant Manager / Kepala Pabrik', peran: 'diketahui', nik: 'MGR-0005', divisi: 'Management' },
];

export const defaultSettings: WarehouseSettings = {
  namaSistem: 'LAPORAN KARUNG BOCOR',
  subNamaSistem: 'GUDANG JADI (GBJ)',
  beratPerKarungKg: 50,
  targetToleransiPersen: 0.25,
  namaGudang: 'Gudang Jadi Utama - Divisi Packaging',
  pengaturanTanggal: defaultTanggalSettings,
  penanggungJawab: defaultPenanggungJawab,
  daftarProfilPenanggungJawab: defaultProfilPenanggungJawab,
  masterJenisPakan: defaultMasterFeedTypes,
};

export const initialMonthReports: MonthReport[] = [
  {
    monthIndex: 1,
    monthName: '01 Januari',
    penjualanKg: 29705800,
    dailyEntries: {
      1: { forklift: 0, pallet: 0, bocorProduksi: 0, isYellowDay: true },
      2: { forklift: 9, pallet: 105, bocorProduksi: 10, isYellowDay: true },
      3: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      4: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      5: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      6: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      7: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      8: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      9: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      10: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      11: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      12: { forklift: 43, pallet: 47, bocorProduksi: 51 },
      13: { forklift: 53, pallet: 60, bocorProduksi: 7 },
      14: { forklift: 24, pallet: 41, bocorProduksi: 12 },
      15: { forklift: 30, pallet: 33, bocorProduksi: 18 },
      16: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      17: { forklift: 64, pallet: 64, bocorProduksi: 36 },
      18: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      19: { forklift: 40, pallet: 54, bocorProduksi: 50 },
      20: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      21: { forklift: 8, pallet: 78, bocorProduksi: 20 },
      22: { forklift: 39, pallet: 64, bocorProduksi: 46 },
      23: { forklift: 35, pallet: 40, bocorProduksi: 47 },
      24: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      25: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      26: { forklift: 9, pallet: 97, bocorProduksi: 8, isYellowDay: true },
      27: { forklift: 8, pallet: 118, bocorProduksi: 14, isYellowDay: true },
      28: { forklift: 7, pallet: 107, bocorProduksi: 10, isYellowDay: true },
      29: { forklift: 8, pallet: 111, bocorProduksi: 11, isYellowDay: true },
      30: { forklift: 7, pallet: 70, bocorProduksi: 11 },
      31: { forklift: 8, pallet: 75, bocorProduksi: 10 },
    },
  },
  {
    monthIndex: 2,
    monthName: '02 Februari',
    penjualanKg: 28975150,
    dailyEntries: {
      1: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      2: { forklift: 6, pallet: 57, bocorProduksi: 26 },
      3: { forklift: 6, pallet: 70, bocorProduksi: 28 },
      4: { forklift: 6, pallet: 84, bocorProduksi: 26 },
      5: { forklift: 6, pallet: 85, bocorProduksi: 19 },
      6: { forklift: 3, pallet: 80, bocorProduksi: 20 },
      7: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      8: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      9: { forklift: 29, pallet: 43, bocorProduksi: 6 },
      10: { forklift: 43, pallet: 36, bocorProduksi: 14 },
      11: { forklift: 38, pallet: 63, bocorProduksi: 28 },
      12: { forklift: 30, pallet: 39, bocorProduksi: 17 },
      13: { forklift: 46, pallet: 47, bocorProduksi: 27 },
      14: { forklift: 33, pallet: 38, bocorProduksi: 23 },
      15: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      16: { forklift: 41, pallet: 57, bocorProduksi: 37 },
      17: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      18: { forklift: 7, pallet: 100, bocorProduksi: 10 },
      19: { forklift: 6, pallet: 109, bocorProduksi: 9 },
      20: { forklift: 8, pallet: 88, bocorProduksi: 11 },
      21: { forklift: 5, pallet: 85, bocorProduksi: 9 },
      22: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      23: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      24: { forklift: 7, pallet: 100, bocorProduksi: 9 },
      25: { forklift: 6, pallet: 111, bocorProduksi: 8 },
      26: { forklift: 9, pallet: 110, bocorProduksi: 7 },
      27: { forklift: 10, pallet: 101, bocorProduksi: 9 },
      28: { forklift: 6, pallet: 103, bocorProduksi: 9 },
    },
  },
  {
    monthIndex: 3,
    monthName: '03 Maret',
    penjualanKg: 38493500,
    dailyEntries: {
      1: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      2: { forklift: 11, pallet: 77, bocorProduksi: 19 },
      3: { forklift: 8, pallet: 71, bocorProduksi: 16 },
      4: { forklift: 3, pallet: 65, bocorProduksi: 11 },
      5: { forklift: 26, pallet: 33, bocorProduksi: 30 },
      6: { forklift: 7, pallet: 115, bocorProduksi: 22 },
      7: { forklift: 0, pallet: 31, bocorProduksi: 8 },
      8: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      9: { forklift: 56, pallet: 51, bocorProduksi: 20 },
      10: { forklift: 4, pallet: 86, bocorProduksi: 5 },
      11: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      12: { forklift: 35, pallet: 50, bocorProduksi: 22 },
      13: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      14: { forklift: 21, pallet: 25, bocorProduksi: 8 },
      15: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      16: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      17: { forklift: 40, pallet: 46, bocorProduksi: 58 },
      18: { forklift: 30, pallet: 32, bocorProduksi: 52 },
      19: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      20: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      21: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      22: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      23: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      24: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      25: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      26: { forklift: 56, pallet: 51, bocorProduksi: 15 },
      27: { forklift: 47, pallet: 48, bocorProduksi: 20 },
      28: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      29: { forklift: 2, pallet: 97, bocorProduksi: 38 },
      30: { forklift: 11, pallet: 100, bocorProduksi: 26, isYellowDay: true },
      31: { forklift: 0, pallet: 0, bocorProduksi: 0 },
    },
  },
  {
    monthIndex: 4,
    monthName: '04 APRIL',
    penjualanKg: 27835700,
    dailyEntries: {
      1: { forklift: 4, pallet: 83, bocorProduksi: 27 },
      2: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      3: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      4: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      5: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      6: { forklift: 57, pallet: 46, bocorProduksi: 19 },
      7: { forklift: 26, pallet: 36, bocorProduksi: 9 },
      8: { forklift: 48, pallet: 53, bocorProduksi: 35 },
      9: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      10: { forklift: 50, pallet: 50, bocorProduksi: 18 },
      11: { forklift: 42, pallet: 54, bocorProduksi: 27 },
      12: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      13: { forklift: 3, pallet: 24, bocorProduksi: 4 },
      14: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      15: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      16: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      17: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      18: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      19: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      20: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      21: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      22: { forklift: 4, pallet: 70, bocorProduksi: 6 },
      23: { forklift: 4, pallet: 90, bocorProduksi: 7 },
      24: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      25: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      26: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      27: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      28: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      29: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      30: { forklift: 0, pallet: 0, bocorProduksi: 0 },
    },
  },
  {
    monthIndex: 5,
    monthName: '05 MEI',
    penjualanKg: 30719200,
    dailyEntries: {
      1: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      2: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      3: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      4: { forklift: 33, pallet: 44, bocorProduksi: 18 },
      5: { forklift: 56, pallet: 60, bocorProduksi: 22 },
      6: { forklift: 33, pallet: 48, bocorProduksi: 15 },
      7: { forklift: 32, pallet: 40, bocorProduksi: 12 },
      8: { forklift: 19, pallet: 40, bocorProduksi: 10 },
      9: { forklift: 12, pallet: 39, bocorProduksi: 8 },
      10: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      11: { forklift: 9, pallet: 53, bocorProduksi: 14 },
      12: { forklift: 7, pallet: 73, bocorProduksi: 16 },
      13: { forklift: 3, pallet: 61, bocorProduksi: 9 },
      14: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      15: { forklift: 15, pallet: 68, bocorProduksi: 20 },
      16: { forklift: 0, pallet: 43, bocorProduksi: 11 },
      17: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      18: { forklift: 6, pallet: 116, bocorProduksi: 25 },
      19: { forklift: 6, pallet: 109, bocorProduksi: 24 },
      20: { forklift: 29, pallet: 31, bocorProduksi: 18 },
      21: { forklift: 3, pallet: 72, bocorProduksi: 14 },
      22: { forklift: 4, pallet: 112, bocorProduksi: 22 },
      23: { forklift: 4, pallet: 88, bocorProduksi: 19 },
      24: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      25: { forklift: 5, pallet: 73, bocorProduksi: 15 },
      26: { forklift: 5, pallet: 86, bocorProduksi: 17 },
      27: { forklift: 0, pallet: 0, bocorProduksi: 0 },
      28: { forklift: 6, pallet: 66, bocorProduksi: 12 },
      29: { forklift: 7, pallet: 63, bocorProduksi: 14 },
      30: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
      31: { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true },
    },
  },
  {
    monthIndex: 6,
    monthName: '06 JUNI',
    penjualanKg: 31500000,
    dailyEntries: generateSampleMonthData(6, 30),
  },
  {
    monthIndex: 7,
    monthName: '07 JULI',
    penjualanKg: 32000000,
    dailyEntries: generateSampleMonthData(7, 31),
  },
  {
    monthIndex: 8,
    monthName: '08 AGUSTUS',
    penjualanKg: 30800000,
    dailyEntries: generateSampleMonthData(8, 31),
  },
  {
    monthIndex: 9,
    monthName: '09 SEPTEMBER',
    penjualanKg: 29900000,
    dailyEntries: generateSampleMonthData(9, 30),
  },
  {
    monthIndex: 10,
    monthName: '10 OKTOBER',
    penjualanKg: 33100000,
    dailyEntries: generateSampleMonthData(10, 31),
  },
  {
    monthIndex: 11,
    monthName: '11 NOVEMBER',
    penjualanKg: 31200000,
    dailyEntries: generateSampleMonthData(11, 30),
  },
  {
    monthIndex: 12,
    monthName: '12 DESEMBER',
    penjualanKg: 34500000,
    dailyEntries: generateSampleMonthData(12, 31),
  },
];

function generateSampleMonthData(month: number, daysInMonth: number) {
  const entries: Record<number, any> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    // Sundays around 7, 14, 21, 28
    const isSun = d % 7 === 0 || d % 7 === 1;
    if (isSun) {
      entries[d] = { forklift: 0, pallet: 0, bocorProduksi: 0, isRedDay: true };
    } else {
      // Semi-random consistent values
      const fk = (d * 3 + month * 5) % 25 + 2;
      const pl = (d * 7 + month * 11) % 60 + 30;
      const pr = (d * 2 + month * 3) % 20 + 5;
      entries[d] = { forklift: fk, pallet: pl, bocorProduksi: pr };
    }
  }
  return entries;
}
