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
  updatedAtStr?: string;
  lastModifiedByClientId?: string;
  lastModifiedDevice?: string; // 'HP / Smartphone' | 'Komputer / Laptop' | 'Tablet'
}

export interface PenanggungJawabProfile {
  id: string;
  nama: string;
  jabatan: string; // e.g. "FG WH Worker", "FG WH Supervisor", "Head of WH Subdept"
  peran: 'dibuat' | 'disetujui' | 'diketahui' | 'umum';
  nik?: string; // NIP/NIK karyawan
  divisi?: string; // Bagian / Dept
}

export interface TanggalLaporanSettings {
  mode: 'realtime' | 'custom'; // Realtime (hari ini) atau tanggal khusus yang ditentukan
  tanggalCustom?: string; // YYYY-MM-DD (e.g. 2026-07-18)
  formatTanggal: 'DD.MM.YYYY' | 'DD/MM/YYYY' | 'DD MMMM YYYY' | 'YYYY-MM-DD';
  kotaPengesahan: string; // e.g. "Sidoarjo", "Surabaya", "Jakarta"
  tahunLaporan: number; // e.g. 2026
}

export interface PenanggungJawabLaporan {
  dibuatOleh: string;
  jabatanDibuat: string;
  nikDibuat?: string;

  disetujuiOleh: string;
  jabatanDisetujui: string;
  nikDisetujui?: string;

  diketahuiOleh: string;
  jabatanDiketahui: string;
  nikDiketahui?: string;
}

export interface MasterJenisPakan {
  id: string;
  kode?: string;
  nama: string; // e.g. "Parli", "Par DOC", "SB 10"
  kategori?: string; // e.g. "Broiler", "Layer", "DOC", "Konsentrat", "Bebek", "Umum"
  beratKemasan?: number; // default 50 (kg)
  keterangan?: string;
  isActive: boolean;
  urutan: number;
}

export interface WarehouseSettings {
  namaSistem?: string; // e.g. "LAPORAN KARUNG BOCOR" (Customizable system title)
  subNamaSistem?: string; // e.g. "GUDANG JADI (GBJ)" (Sub-title / unit badge)
  beratPerKarungKg: number; // Default 50 kg
  targetToleransiPersen: number; // Default 0.25%
  namaGudang: string; // e.g. "Gudang Jadi - Line A"

  // Pengaturan Tanggal & Penanggung Jawab Laporan
  pengaturanTanggal?: TanggalLaporanSettings;
  penanggungJawab?: PenanggungJawabLaporan;
  daftarProfilPenanggungJawab?: PenanggungJawabProfile[];

  // Master Data Jenis Pakan Ternak (Tabel Petugas JAPFA)
  masterJenisPakan?: MasterJenisPakan[];
}
