import * as XLSX from 'xlsx';
import { MonthReport, WarehouseSettings, PetugasReport, FeedItemLeak, HolidayItem } from '../types';
import {
  calculateMonthTotals,
  calculateAnnualTotals,
  getDaysInMonth,
  getIndonesianDayName,
  formatNumberIndonesian,
} from './calculations';
import { loadStoredHolidays, CATEGORY_METADATA } from '../data/holidayData';

export function exportReportsToExcel(
  reports: MonthReport[],
  settings: WarehouseSettings,
  customHolidays?: HolidayItem[]
) {
  const wb = XLSX.utils.book_new();
  const rows: any[][] = [];
  const year = 2026;
  const holidays = customHolidays || loadStoredHolidays();

  // Title row
  const systemTitle = settings.namaSistem ? settings.namaSistem.toUpperCase() : 'LAPORAN DATA KARUNG BOCOR';
  rows.push([`${systemTitle} - GUDANG JADI TAHUN 2026`]);
  rows.push([`Unit Gudang: ${settings.namaGudang} | Standar Kemasan: ${settings.beratPerKarungKg} Kg/Karung | Target Toleransi: ${settings.targetToleransiPersen}%`]);
  rows.push([`Periode: 01 Januari 2026 s/d 31 Desember 2026 | Tanggal Export: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`]);
  rows.push([]);

  // Loop through 12 Months
  reports.forEach((report) => {
    const totals = calculateMonthTotals(report, settings);
    const maxDays = getDaysInMonth(year, report.monthIndex);

    // Month Header
    rows.push([`${report.monthName.toUpperCase()} ${year}`]);

    // Row HARI: HARI | Kam | Jum | Sab | ... | TOTAL | | KETERANGAN
    const dayNameRow: any[] = ['HARI'];
    for (let d = 1; d <= 31; d++) {
      if (d <= maxDays) {
        const baseDayName = getIndonesianDayName(year, report.monthIndex, d);
        const entry = report.dailyEntries[d];
        const isRed = entry?.isRedDay;
        // If Red day / OFF, suffix with (OFF)
        dayNameRow.push(isRed ? `${baseDayName} (OFF)` : baseDayName);
      } else {
        dayNameRow.push('—');
      }
    }
    dayNameRow.push('');
    dayNameRow.push('');
    dayNameRow.push('RINGKASAN BULANAN');
    rows.push(dayNameRow);

    // Table Header Row: TANGGAL | 1..31 | TOTAL | | TOTAL PENJUALAN
    const headerRow: any[] = ['TANGGAL'];
    for (let d = 1; d <= 31; d++) {
      headerRow.push(d <= maxDays ? d : '—');
    }
    headerRow.push('TOTAL');
    headerRow.push('');
    headerRow.push('TOTAL PENJUALAN (KG)');
    rows.push(headerRow);

    // Row 1: FORKLIFT
    const forkliftRow: any[] = ['FORKLIFT'];
    for (let d = 1; d <= 31; d++) {
      if (d <= maxDays) {
        const val = report.dailyEntries[d]?.forklift;
        forkliftRow.push(val !== undefined && val !== 0 ? val : '');
      } else {
        forkliftRow.push('—');
      }
    }
    forkliftRow.push(totals.totalForklift);
    forkliftRow.push('');
    forkliftRow.push(totals.totalPenjualanKg);
    rows.push(forkliftRow);

    // Row 2: PALLET
    const palletRow: any[] = ['PALLET'];
    for (let d = 1; d <= 31; d++) {
      if (d <= maxDays) {
        const val = report.dailyEntries[d]?.pallet;
        palletRow.push(val !== undefined && val !== 0 ? val : '');
      } else {
        palletRow.push('—');
      }
    }
    palletRow.push(totals.totalPallet);
    palletRow.push('');
    palletRow.push(`Penjualan (Karung): ${totals.totalPenjualanKarung}`);
    rows.push(palletRow);

    // Row 3: BOCOR PRODUKSI
    const produksiRow: any[] = ['BOCOR PRODUKSI'];
    for (let d = 1; d <= 31; d++) {
      if (d <= maxDays) {
        const val = report.dailyEntries[d]?.bocorProduksi;
        produksiRow.push(val !== undefined && val !== 0 ? val : '');
      } else {
        produksiRow.push('—');
      }
    }
    produksiRow.push(totals.totalBocorProduksi);
    produksiRow.push('');
    produksiRow.push(`Rasio Kebocoran: ${totals.rasioBocorPersen.toFixed(2)}%`);
    rows.push(produksiRow);

    // Row 4: TOTAL BOCOR
    const totalRow: any[] = ['TOTAL BOCOR'];
    for (let d = 1; d <= 31; d++) {
      if (d <= maxDays) {
        const entry = report.dailyEntries[d];
        if (entry) {
          const sum = (entry.forklift || 0) + (entry.pallet || 0) + (entry.bocorProduksi || 0);
          totalRow.push(sum > 0 ? sum : '');
        } else {
          totalRow.push('');
        }
      } else {
        totalRow.push('—');
      }
    }
    totalRow.push(totals.totalBocor);
    totalRow.push('');
    totalRow.push(totals.rasioBocorPersen <= settings.targetToleransiPersen ? 'STATUS: MEMENUHI TARGET' : 'STATUS: MELEBIHI TARGET');
    rows.push(totalRow);

    // Blank row spacer
    rows.push([]);
    rows.push([]);
  });

  // ==========================================
  // REKAPAN PER TAHUN 2026 (DI SHEET 1)
  // ==========================================
  const annual = calculateAnnualTotals(reports, settings);

  rows.push(['========================================================================================']);
  rows.push(['REKAPITULASI TOTAL TAHUNAN 2026 (RINGKASAN BULANAN GUDANG JADI)']);
  rows.push([`Tahun: ${year} | Standar: ${settings.beratPerKarungKg} Kg/Karung | Target Toleransi: ${settings.targetToleransiPersen}%`]);
  rows.push([]);

  // Header Table Rekapan Tahunan
  rows.push([
    'NO',
    'BULAN',
    'BOCOR FORKLIFT',
    'BOCOR PALLET',
    'BOCOR PRODUKSI',
    'TOTAL BOCOR (KR)',
    'KONTRIBUSI (%)',
    'PENJUALAN (KG)',
    'PENJUALAN (KARUNG)',
    'RASIO BOCOR (%)',
    'TARGET (%)',
    'STATUS TOLERANSI',
  ]);

  annual.monthlyBreakdown.forEach((m, idx) => {
    rows.push([
      idx + 1,
      `${m.monthName} ${year}`,
      m.totalForklift,
      m.totalPallet,
      m.totalBocorProduksi,
      m.totalBocor,
      `${m.kontribusiPersen.toFixed(1)}%`,
      m.totalPenjualanKg,
      m.totalPenjualanKarung,
      `${m.rasioBocorPersen.toFixed(2)}%`,
      `${settings.targetToleransiPersen}%`,
      m.isOverTarget ? 'MELEBIHI TOLERANSI' : 'MEMENUHI TARGET',
    ]);
  });

  // Total Tahunan Row
  rows.push([
    'TOTAL',
    `TOTAL KESELURUHAN TAHUN ${year}`,
    annual.grandTotalForklift,
    annual.grandTotalPallet,
    annual.grandTotalProduksi,
    annual.grandTotalBocor,
    '100.0%',
    annual.grandTotalPenjualanKg,
    annual.grandTotalPenjualanKarung,
    `${annual.grandRasioBocorPersen.toFixed(2)}%`,
    `${settings.targetToleransiPersen}%`,
    annual.grandRasioBocorPersen <= settings.targetToleransiPersen ? 'MEMENUHI TARGET' : 'MELEBIHI TOLERANSI',
  ]);

  // Rata-rata per Bulan
  rows.push([
    'RATA2',
    'RATA-RATA PER BULAN',
    Math.round(annual.grandTotalForklift / 12),
    Math.round(annual.grandTotalPallet / 12),
    Math.round(annual.grandTotalProduksi / 12),
    Math.round(annual.grandTotalBocor / 12),
    '—',
    Math.round(annual.grandTotalPenjualanKg / 12),
    Math.round(annual.grandTotalPenjualanKarung / 12),
    `${annual.grandRasioBocorPersen.toFixed(2)}%`,
    `${settings.targetToleransiPersen}%`,
    '—',
  ]);

  rows.push([]);
  rows.push(['TANDA TANGAN PENGESAHAN TAHUNAN']);
  rows.push(['Dibuat Oleh:', 'Disetujui Oleh:', 'Diketahui Oleh:']);
  rows.push(['Petugas Gudang Jadi', 'Supervisor FG Warehouse', 'Kepala Bagian Logistik']);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 22 }, // Category / Month Name column
    ...Array(31).fill({ wch: 5 }), // Days 1 to 31
    { wch: 14 }, // Total column
    { wch: 3 },  // Spacer
    { wch: 28 }, // Sales Summary
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Laporan Bulanan ${year}`);

  // =========================================================================
  // SHEET 2: DEDICATED REKAPITULASI TAHUNAN 2026 (EXECUTIVE DASHBOARD SHEET)
  // =========================================================================
  const recapRows: any[][] = [];
  recapRows.push([`REKAPITULASI TAHUNAN KEBOCORAN KARUNG - TAHUN ${year}`]);
  recapRows.push([`PT. GUDANG JADI PACKAGING | UNIT: ${settings.namaGudang}`]);
  recapRows.push([`Standar Berat: ${settings.beratPerKarungKg} Kg/Karung | Target Toleransi Maksimum: ${settings.targetToleransiPersen}%`]);
  recapRows.push([`Waktu Dibuat: ${new Date().toLocaleString('id-ID')}`]);
  recapRows.push([]);

  // Highlight KPI Box
  recapRows.push(['RINGKASAN EKSEKUTIF TAHUNAN', '', '', '']);
  recapRows.push(['Total Kebocoran Karung:', `${formatNumberIndonesian(annual.grandTotalBocor)} Karung`, 'Rasio Kebocoran Rata-rata:', `${annual.grandRasioBocorPersen.toFixed(2)}%`]);
  recapRows.push(['Total Penjualan Pakan:', `${formatNumberIndonesian(annual.grandTotalPenjualanKg)} Kg`, 'Total Penjualan Karung:', `${formatNumberIndonesian(annual.grandTotalPenjualanKarung)} Karung`]);
  recapRows.push(['Total Bocor Pallet:', `${formatNumberIndonesian(annual.grandTotalPallet)} Karung (${annual.grandTotalBocor > 0 ? Math.round((annual.grandTotalPallet / annual.grandTotalBocor) * 100) : 0}%)`, 'Status KPI Tahunan:', annual.grandRasioBocorPersen <= settings.targetToleransiPersen ? 'MEMENUHI TARGET (AMAN)' : 'MELEBIHI TOLERANSI (PERLU EVALUASI)']);
  recapRows.push(['Total Bocor Forklift:', `${formatNumberIndonesian(annual.grandTotalForklift)} Karung (${annual.grandTotalBocor > 0 ? Math.round((annual.grandTotalForklift / annual.grandTotalBocor) * 100) : 0}%)`, 'Target Toleransi:', `<= ${settings.targetToleransiPersen}%`]);
  recapRows.push(['Total Bocor Produksi:', `${formatNumberIndonesian(annual.grandTotalProduksi)} Karung (${annual.grandTotalBocor > 0 ? Math.round((annual.grandTotalProduksi / annual.grandTotalBocor) * 100) : 0}%)`, '', '']);
  recapRows.push([]);

  // Table
  recapRows.push([
    'NO',
    'BULAN',
    'FORKLIFT (KR)',
    'PALLET (KR)',
    'PRODUKSI (KR)',
    'TOTAL BOCOR (KR)',
    '% FORKLIFT',
    '% PALLET',
    '% PRODUKSI',
    'KONTRIBUSI SETAHUN (%)',
    'PENJUALAN (KG)',
    'PENJUALAN (KARUNG)',
    'RASIO BOCOR (%)',
    'TARGET TOLERANSI',
    'STATUS KEPATUHAN',
  ]);

  annual.monthlyBreakdown.forEach((m, idx) => {
    const forkPct = m.totalBocor > 0 ? ((m.totalForklift / m.totalBocor) * 100).toFixed(1) + '%' : '0%';
    const pallPct = m.totalBocor > 0 ? ((m.totalPallet / m.totalBocor) * 100).toFixed(1) + '%' : '0%';
    const prodPct = m.totalBocor > 0 ? ((m.totalBocorProduksi / m.totalBocor) * 100).toFixed(1) + '%' : '0%';

    recapRows.push([
      idx + 1,
      `${m.monthName} ${year}`,
      m.totalForklift,
      m.totalPallet,
      m.totalBocorProduksi,
      m.totalBocor,
      forkPct,
      pallPct,
      prodPct,
      `${m.kontribusiPersen.toFixed(1)}%`,
      m.totalPenjualanKg,
      m.totalPenjualanKarung,
      `${m.rasioBocorPersen.toFixed(2)}%`,
      `<= ${settings.targetToleransiPersen}%`,
      m.isOverTarget ? 'MELEBIHI TOLERANSI' : 'MEMENUHI TARGET',
    ]);
  });

  // Grand Total
  const grandForkPct = annual.grandTotalBocor > 0 ? ((annual.grandTotalForklift / annual.grandTotalBocor) * 100).toFixed(1) + '%' : '0%';
  const grandPallPct = annual.grandTotalBocor > 0 ? ((annual.grandTotalPallet / annual.grandTotalBocor) * 100).toFixed(1) + '%' : '0%';
  const grandProdPct = annual.grandTotalBocor > 0 ? ((annual.grandTotalProduksi / annual.grandTotalBocor) * 100).toFixed(1) + '%' : '0%';

  recapRows.push([
    'TOTAL',
    `TOTAL KESELURUHAN TAHUN ${year}`,
    annual.grandTotalForklift,
    annual.grandTotalPallet,
    annual.grandTotalProduksi,
    annual.grandTotalBocor,
    grandForkPct,
    grandPallPct,
    grandProdPct,
    '100.0%',
    annual.grandTotalPenjualanKg,
    annual.grandTotalPenjualanKarung,
    `${annual.grandRasioBocorPersen.toFixed(2)}%`,
    `<= ${settings.targetToleransiPersen}%`,
    annual.grandRasioBocorPersen <= settings.targetToleransiPersen ? 'MEMENUHI TARGET' : 'MELEBIHI TOLERANSI',
  ]);

  // Rata-rata per bulan
  recapRows.push([
    'RATA2',
    'RATA-RATA PER BULAN',
    Math.round(annual.grandTotalForklift / 12),
    Math.round(annual.grandTotalPallet / 12),
    Math.round(annual.grandTotalProduksi / 12),
    Math.round(annual.grandTotalBocor / 12),
    '—',
    '—',
    '—',
    '—',
    Math.round(annual.grandTotalPenjualanKg / 12),
    Math.round(annual.grandTotalPenjualanKarung / 12),
    `${annual.grandRasioBocorPersen.toFixed(2)}%`,
    '—',
    '—',
  ]);

  recapRows.push([]);
  recapRows.push([]);
  recapRows.push(['LEMBAR PENGESAHAN LAPORAN TAHUNAN', '', '', '']);
  recapRows.push(['Dipersiapkan Oleh:', '', 'Diverifikasi Oleh:', '', 'Disahkan Oleh:']);
  recapRows.push(['', '', '', '', '']);
  recapRows.push(['( .................................... )', '', '( .................................... )', '', '( .................................... )']);
  recapRows.push(['Petugas / Admin Gudang', '', 'Supervisor Warehouse', '', 'Manager Logistik & Distribusi']);

  const wsRecap = XLSX.utils.aoa_to_sheet(recapRows);
  wsRecap['!cols'] = [
    { wch: 6 },  // NO
    { wch: 22 }, // BULAN
    { wch: 15 }, // FORKLIFT
    { wch: 14 }, // PALLET
    { wch: 15 }, // PRODUKSI
    { wch: 18 }, // TOTAL BOCOR
    { wch: 12 }, // % FORKLIFT
    { wch: 12 }, // % PALLET
    { wch: 12 }, // % PRODUKSI
    { wch: 22 }, // KONTRIBUSI SETAHUN
    { wch: 18 }, // PENJUALAN KG
    { wch: 20 }, // PENJUALAN KARUNG
    { wch: 16 }, // RASIO BOCOR
    { wch: 18 }, // TARGET
    { wch: 22 }, // STATUS
  ];

  XLSX.utils.book_append_sheet(wb, wsRecap, `Rekapitulasi Tahunan ${year}`);

  // ==========================================
  // SHEET 3: DAFTAR HARI LIBUR & TANGGAL MERAH 2026
  // ==========================================
  const holidayRows: any[][] = [];
  holidayRows.push([`DAFTAR HARI LIBUR NASIONAL, CUTI BERSAMA & TANGGAL MERAH TAHUN ${year}`]);
  holidayRows.push([`Unit: ${settings.namaGudang} | Kalender Acuan: Resmi RI & Kebijakan Gudang Jadi 2026`]);
  holidayRows.push([`Waktu Dibuat: ${new Date().toLocaleString('id-ID')}`]);
  holidayRows.push([]);

  holidayRows.push([
    'NO',
    'TANGGAL',
    'HARI',
    'BULAN',
    'NAMA HARI LIBUR / AGENDA',
    'KATEGORI',
    'STATUS TANGGAL MERAH',
    'KETERANGAN',
  ]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April',
    'Mei', 'Juni', 'Juli', 'Agustus',
    'September', 'Oktober', 'November', 'Desember'
  ];

  const sortedHolidays = [...holidays].sort((a, b) => {
    if (a.monthIndex !== b.monthIndex) return a.monthIndex - b.monthIndex;
    return a.day - b.day;
  });

  sortedHolidays.forEach((h, idx) => {
    const dayName = getIndonesianDayName(year, h.monthIndex, h.day);
    const dateFormatted = `${String(h.day).padStart(2, '0')}/${String(h.monthIndex).padStart(2, '0')}/${year}`;
    const catLabel = CATEGORY_METADATA[h.category]?.label || h.category;

    holidayRows.push([
      idx + 1,
      dateFormatted,
      dayName,
      monthNames[h.monthIndex - 1],
      h.name,
      catLabel,
      h.isRedDay ? 'MERAH (OFF / LIBUR)' : 'NORMAL (KERJA)',
      h.note || 'Tercatat di Kalender Pabrik 2026',
    ]);
  });

  holidayRows.push([]);
  holidayRows.push(['* Catatan: Semua hari Minggu otomatis menjadi hari libur rutin (OFF) bila pengaturan aktif.']);

  const wsHolidays = XLSX.utils.aoa_to_sheet(holidayRows);
  wsHolidays['!cols'] = [
    { wch: 6 },  // NO
    { wch: 14 }, // TANGGAL
    { wch: 12 }, // HARI
    { wch: 14 }, // BULAN
    { wch: 38 }, // NAMA LIBUR
    { wch: 25 }, // KATEGORI
    { wch: 22 }, // STATUS
    { wch: 35 }, // KETERANGAN
  ];

  XLSX.utils.book_append_sheet(wb, wsHolidays, `Daftar Hari Libur ${year}`);

  XLSX.writeFile(wb, `Laporan_Karung_Bocor_Gudang_Jadi_${year}.xlsx`);
}

/**
 * Export detailed Petugas Report (JAPFA Form) to Excel (.xlsx) with Realtime Timestamps
 */
export function exportPetugasReportToExcel(report: PetugasReport, settings: WarehouseSettings) {
  const wb = XLSX.utils.book_new();
  const rows: any[][] = [];

  const now = new Date();
  const timestampStr = now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' });

  // Header Title
  rows.push(['JAPFA - LAPORAN KARUNG BOCOR (PETUGAS GUDANG JADI)']);
  rows.push([`Unit / Gudang: ${settings.namaGudang}`]);
  rows.push([`Waktu Export Realtime: ${timestampStr}`]);
  rows.push([]);

  // Report Meta Metadata
  rows.push(['Hari / Tanggal:', `${report.hari} / ${report.tanggalFormatted}`, '', 'Shift:', report.shift]);
  rows.push(['Dibuat Oleh:', report.dibuatOleh, '', 'Status Approval:', report.statusApproval]);
  rows.push(['Disetujui Oleh:', report.disetujuiOleh, '', 'Diketahui Oleh:', report.diketahuiOleh]);
  rows.push([]);

  // Table Headers
  const tableHeader = [
    'NO',
    'JENIS PAKAN TERNAK',
    'STOK AWAL',
    'BOCOR FORKLIFT',
    'BOCOR PALLET',
    'BOCOR PRODUKSI',
    'TOTAL BOCOR',
    'TOTAL JAHIT',
    'GANTI KARUNG',
    'TIDAK GANTI KARUNG',
    'SISA AKHIR',
    'KETERANGAN',
  ];
  rows.push(tableHeader);

  // Accumulator totals
  let sumStokAwal = 0;
  let sumForklift = 0;
  let sumPallet = 0;
  let sumProduksi = 0;
  let sumTotalBocor = 0;
  let sumTotalJahit = 0;
  let sumGanti = 0;
  let sumTidakGanti = 0;
  let sumSisaAkhir = 0;

  // Items
  report.items.forEach((item, idx) => {
    sumStokAwal += item.stakAwal || 0;
    sumForklift += item.bocorForklift || 0;
    sumPallet += item.bocorPallet || 0;
    sumProduksi += item.bocorProduksi || 0;
    sumTotalBocor += item.totalBocor || 0;
    sumTotalJahit += item.totalJahit || 0;
    sumGanti += item.gantiKarung || 0;
    sumTidakGanti += item.tidakGantiKarung || 0;
    sumSisaAkhir += item.sisaAkhir || 0;

    rows.push([
      idx + 1,
      item.jenisPakan || '-',
      item.stakAwal || 0,
      item.bocorForklift || 0,
      item.bocorPallet || 0,
      item.bocorProduksi || 0,
      item.totalBocor || 0,
      item.totalJahit || 0,
      item.gantiKarung || 0,
      item.tidakGantiKarung || 0,
      item.sisaAkhir || 0,
      item.keterangan || '',
    ]);
  });

  // Grand Total Row
  rows.push([
    'TOTAL',
    'JUMLAH KESELURUHAN',
    sumStokAwal,
    sumForklift,
    sumPallet,
    sumProduksi,
    sumTotalBocor,
    sumTotalJahit,
    sumGanti,
    sumTidakGanti,
    sumSisaAkhir,
    'Laporan Resmi FG WH',
  ]);

  rows.push([]);
  rows.push([]);

  // Approval Signatures Block
  rows.push(['TANDA TANGAN & PERSETUJUAN']);
  rows.push(['Dibuat Oleh:', 'Disetujui Oleh:', 'Diketahui Oleh:']);
  rows.push([report.dibuatOleh, report.disetujuiOleh, report.diketahuiOleh]);
  rows.push(['FG WH Worker', 'FG WH Supervisor', 'Head of WH Subdept']);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 6 },  // NO
    { wch: 22 }, // JENIS PAKAN
    { wch: 12 }, // STOK AWAL
    { wch: 15 }, // BOCOR FORKLIFT
    { wch: 14 }, // BOCOR PALLET
    { wch: 16 }, // BOCOR PRODUKSI
    { wch: 14 }, // TOTAL BOCOR
    { wch: 14 }, // TOTAL JAHIT
    { wch: 14 }, // GANTI KARUNG
    { wch: 18 }, // TIDAK GANTI KARUNG
    { wch: 12 }, // SISA AKHIR
    { wch: 25 }, // KETERANGAN
  ];

  const filenameDate = report.tanggalFormatted.replace(/\./g, '-');
  const fileName = `Laporan_Petugas_JAPFA_${filenameDate}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}.xlsx`;

  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Petugas');
  XLSX.writeFile(wb, fileName);
}

/**
 * Import Petugas Report items from uploaded Excel file (.xlsx or .csv)
 */
export function importPetugasReportFromExcel(file: File): Promise<FeedItemLeak[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const items: FeedItemLeak[] = [];
        let headerFound = false;
        let pakanColIdx = 1;
        let forkliftColIdx = 3;
        let palletColIdx = 4;
        let prodColIdx = 5;

        for (let r = 0; r < json.length; r++) {
          const row = json[r];
          if (!row || row.length === 0) continue;

          // Search for header row
          const rowStr = row.join(' ').toUpperCase();
          if (rowStr.includes('PAKAN') || rowStr.includes('JENIS PAKAN') || rowStr.includes('FORKLIFT')) {
            headerFound = true;
            // Map column indices
            row.forEach((cellVal: any, cIdx: number) => {
              const str = String(cellVal || '').toUpperCase();
              if (str.includes('PAKAN')) pakanColIdx = cIdx;
              if (str.includes('FORKLIFT')) forkliftColIdx = cIdx;
              if (str.includes('PALLET')) palletColIdx = cIdx;
              if (str.includes('PRODUKSI')) prodColIdx = cIdx;
            });
            continue;
          }

          if (headerFound || r > 5) {
            const pakanName = String(row[pakanColIdx] || row[1] || '').trim();
            if (!pakanName || pakanName.toUpperCase().includes('TOTAL') || pakanName.toUpperCase().includes('JUMLAH')) {
              continue;
            }

            const forklift = parseInt(row[forkliftColIdx] || row[3] || '0', 10) || 0;
            const pallet = parseInt(row[palletColIdx] || row[4] || '0', 10) || 0;
            const prod = parseInt(row[prodColIdx] || row[5] || '0', 10) || 0;
            const total = forklift + pallet + prod;

            items.push({
              id: `${Date.now()}-${r}`,
              no: items.length + 1,
              jenisPakan: pakanName,
              stakAwal: parseInt(row[2] || '0', 10) || 0,
              bocorForklift: forklift,
              bocorPallet: pallet,
              bocorProduksi: prod,
              totalBocor: total,
              totalJahit: parseInt(row[7] || String(total), 10) || total,
              gantiKarung: parseInt(row[8] || String(total), 10) || total,
              tidakGantiKarung: parseInt(row[9] || '0', 10) || 0,
              sisaAkhir: parseInt(row[10] || '0', 10) || 0,
              keterangan: String(row[11] || ''),
            });
          }
        }

        if (items.length > 0) {
          resolve(items);
        } else {
          reject(new Error('Tidak dapat menemukan data pakan ternak dari file Excel. Pastikan format tabel sesuai.'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

