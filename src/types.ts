export interface DayEntry {
  forklift: number;
  pallet: number;
  bocorProduksi: number;
  isRedDay?: boolean;    // Red column highlight (e.g., Minggu / Hari Libur / Off)
  isYellowDay?: boolean; // Yellow column highlight (e.g., High leak / Audit day)
  note?: string;
}

export type HolidayCategory = 'nasional' | 'cuti_bersama' | 'pabrik_off' | 'khusus';

export interface HolidayItem {
  id: string;
  monthIndex: number; // 1 to 12
  day: number; // 1 to 31
  name: string;
  category: HolidayCategory;
  isRedDay: boolean;
  note?: string;
}

export interface MonthReport {
  monthIndex: number; // 1 to 12
  monthName: string;  // "01 Januari", "02 Februari", etc.
  penjualanKg: number; // Total Sales Volume in Kg
  dailyEntries: Record<number, DayEntry>; // day number (1..31) -> DayEntry
}

export interface LeakageRecord {
  id: string;
  date: string; // YYYY-MM-DD
  monthIndex: number;
  day: number;
  forklift: number;
  pallet: number;
  bocorProduksi: number;
  totalBocor: number;
  shift?: string;
  operator?: string;
  catatan?: string;
}

export interface FeedItemLeak {
  id: string;
  no: number;
  jenisPakan: string; // e.g. "Parli", "Par DOC", "SB 10"
  stakAwal?: number;
  bocorForklift: number;
  bocorPallet: number;
  bocorProduksi: number;
  totalBocor: number; // forklift + pallet + bocorProduksi
  totalJahit: number;
  gantiKarung: number;
  tidakGantiKarung: number;
  sisaAkhir?: number;
  keterangan?: string;
}

export interface PetugasReport {
  id: string;
  tanggalStr: string; // YYYY-MM-DD
  hari: string; // e.g. "Sabtu"
  tanggalFormatted: string; // e.g. "18.07.2026"
  shift: string;
  isRedDay?: boolean; // Hari Libur / Off (Latar Merah di Excel)
  dibuatOleh: string; // Worker
  disetujuiOleh: string; // Supervisor
  diketahuiOleh: string; // Head of WH
  statusApproval: 'Draft' | 'Diverifikasi' | 'Disetujui';
  items: FeedItemLeak[];
  catatanPetugas?: string;
  createdAt: string;
}

export interface WarehouseSettings {
  beratPerKarungKg: number; // Default 50 kg
  targetToleransiPersen: number; // Default 0.25%
  namaGudang: string; // e.g. "Gudang Jadi - Line A"
}
