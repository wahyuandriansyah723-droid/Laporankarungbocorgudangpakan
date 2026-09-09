import { PetugasReport, FeedItemLeak, MasterJenisPakan } from '../types';

export const defaultMasterFeedTypes: MasterJenisPakan[] = [
  { id: 'pakan-1', kode: 'PRL', nama: 'Parli', kategori: 'Broiler Starter', beratKemasan: 50, isActive: true, urutan: 1, keterangan: 'Pakan broiler starter masa awal' },
  { id: 'pakan-2', kode: 'DOC', nama: 'Par DOC', kategori: 'DOC Pakan Awal', beratKemasan: 50, isActive: true, urutan: 2, keterangan: 'Pakan bibit ayam umur 1-7 hari' },
  { id: 'pakan-3', kode: 'PGL', nama: 'Par GOLD', kategori: 'Broiler Finisher', beratKemasan: 50, isActive: true, urutan: 3, keterangan: 'Pakan pedaging kualitas super gold' },
  { id: 'pakan-4', kode: 'SB10', nama: 'SB 10', kategori: 'Layer Starter', beratKemasan: 50, isActive: true, urutan: 4, keterangan: 'Pakan ayam petelur fase starter' },
  { id: 'pakan-5', kode: 'SB11', nama: 'SB 11 AC', kategori: 'Layer Grower', beratKemasan: 50, isActive: true, urutan: 5, keterangan: 'Pakan ayam petelur grower anti-clumping' },
  { id: 'pakan-6', kode: 'SB12', nama: 'SB 12', kategori: 'Layer Produksi', beratKemasan: 50, isActive: true, urutan: 6, keterangan: 'Pakan ayam petelur fase bertelur puncak' },
  { id: 'pakan-7', kode: 'KSUP', nama: 'KUK SUPRA', kategori: 'Konsentrat Petelur', beratKemasan: 50, isActive: true, urutan: 7, keterangan: 'Konsentrat protein tinggi petelur' },
  { id: 'pakan-8', kode: 'M11', nama: 'M11', kategori: 'Broiler Campuran', beratKemasan: 50, isActive: true, urutan: 8, keterangan: 'Pakan broiler ransum grower' },
  { id: 'pakan-9', kode: '6F511', nama: '6F511', kategori: 'Finisher Komersil', beratKemasan: 50, isActive: true, urutan: 9, keterangan: 'Pakan komplit pedaging akhir' },
  { id: 'pakan-10', kode: 'KLK', nama: 'KLK', kategori: 'Konsentrat Lapisan', beratKemasan: 50, isActive: true, urutan: 10, keterangan: 'Konsentrat layer khusus' },
  { id: 'pakan-11', kode: 'B1L', nama: 'B1L', kategori: 'Bebek / Unggas', beratKemasan: 50, isActive: true, urutan: 11, keterangan: 'Pakan unggas bebek petelur / pedaging' },
  { id: 'pakan-12', kode: 'ABS', nama: 'ABS', kategori: 'Spesial Formula', beratKemasan: 50, isActive: true, urutan: 12, keterangan: 'Pakan spesifikasi khusus GBJ' },
  { id: 'pakan-13', kode: 'SBDOC', nama: 'SB DOC', kategori: 'DOC Petelur', beratKemasan: 50, isActive: true, urutan: 13, keterangan: 'Pakan ayam petelur hari pertama' },
  { id: 'pakan-14', kode: 'BR1', nama: 'BR1', kategori: 'Broiler Pre-Starter', beratKemasan: 50, isActive: true, urutan: 14, keterangan: 'Pakan crumble starter pedaging' },
  { id: 'pakan-15', kode: 'BR1M', nama: 'BR1M', kategori: 'Broiler Mash', beratKemasan: 50, isActive: true, urutan: 15, keterangan: 'Pakan tepung mash starter' },
  { id: 'pakan-16', kode: 'BR11', nama: 'BR11', kategori: 'Broiler Pellet', beratKemasan: 50, isActive: true, urutan: 16, keterangan: 'Pakan pelet pedaging siap panen' },
];

export const initialFeedTypes = defaultMasterFeedTypes.map((f) => f.nama);

export const sampleJapfaReportItems: FeedItemLeak[] = [
  { id: '1', no: 1, jenisPakan: 'Parli', stakAwal: 0, bocorForklift: 2, bocorPallet: 17, bocorProduksi: 0, totalBocor: 19, totalJahit: 19, gantiKarung: 19, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '2', no: 2, jenisPakan: 'Par DOC', stakAwal: 0, bocorForklift: 0, bocorPallet: 7, bocorProduksi: 0, totalBocor: 7, totalJahit: 7, gantiKarung: 7, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '3', no: 3, jenisPakan: 'Par GOLD', stakAwal: 0, bocorForklift: 0, bocorPallet: 2, bocorProduksi: 0, totalBocor: 2, totalJahit: 2, gantiKarung: 2, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '4', no: 4, jenisPakan: 'SB 10', stakAwal: 0, bocorForklift: 1, bocorPallet: 13, bocorProduksi: 2, totalBocor: 16, totalJahit: 16, gantiKarung: 16, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '5', no: 5, jenisPakan: 'SB 11 AC', stakAwal: 0, bocorForklift: 0, bocorPallet: 14, bocorProduksi: 0, totalBocor: 14, totalJahit: 14, gantiKarung: 14, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '6', no: 6, jenisPakan: 'SB 12', stakAwal: 0, bocorForklift: 0, bocorPallet: 12, bocorProduksi: 0, totalBocor: 12, totalJahit: 12, gantiKarung: 12, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '7', no: 7, jenisPakan: 'KUK SUPRA', stakAwal: 0, bocorForklift: 1, bocorPallet: 16, bocorProduksi: 2, totalBocor: 19, totalJahit: 19, gantiKarung: 19, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '8', no: 8, jenisPakan: 'M11', stakAwal: 0, bocorForklift: 0, bocorPallet: 1, bocorProduksi: 0, totalBocor: 1, totalJahit: 1, gantiKarung: 1, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '9', no: 9, jenisPakan: '6F511', stakAwal: 0, bocorForklift: 0, bocorPallet: 1, bocorProduksi: 0, totalBocor: 1, totalJahit: 1, gantiKarung: 1, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '10', no: 10, jenisPakan: 'KLK', stakAwal: 0, bocorForklift: 2, bocorPallet: 2, bocorProduksi: 0, totalBocor: 4, totalJahit: 4, gantiKarung: 2, tidakGantiKarung: 2, sisaAkhir: 0, keterangan: '' },
  { id: '11', no: 11, jenisPakan: 'B1L', stakAwal: 0, bocorForklift: 0, bocorPallet: 5, bocorProduksi: 0, totalBocor: 5, totalJahit: 5, gantiKarung: 5, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '12', no: 12, jenisPakan: 'ABS', stakAwal: 0, bocorForklift: 0, bocorPallet: 2, bocorProduksi: 0, totalBocor: 2, totalJahit: 2, gantiKarung: 2, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '13', no: 13, jenisPakan: 'SB DOC', stakAwal: 0, bocorForklift: 0, bocorPallet: 1, bocorProduksi: 0, totalBocor: 1, totalJahit: 1, gantiKarung: 1, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '14', no: 14, jenisPakan: 'BR1', stakAwal: 0, bocorForklift: 0, bocorPallet: 3, bocorProduksi: 0, totalBocor: 3, totalJahit: 3, gantiKarung: 3, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '15', no: 15, jenisPakan: 'BR1M', stakAwal: 0, bocorForklift: 0, bocorPallet: 1, bocorProduksi: 0, totalBocor: 1, totalJahit: 1, gantiKarung: 1, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '16', no: 16, jenisPakan: 'BR11', stakAwal: 0, bocorForklift: 0, bocorPallet: 2, bocorProduksi: 0, totalBocor: 2, totalJahit: 2, gantiKarung: 2, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '17', no: 17, jenisPakan: '', stakAwal: 0, bocorForklift: 0, bocorPallet: 0, bocorProduksi: 0, totalBocor: 0, totalJahit: 0, gantiKarung: 0, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '18', no: 18, jenisPakan: '', stakAwal: 0, bocorForklift: 0, bocorPallet: 0, bocorProduksi: 0, totalBocor: 0, totalJahit: 0, gantiKarung: 0, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '19', no: 19, jenisPakan: '', stakAwal: 0, bocorForklift: 0, bocorPallet: 0, bocorProduksi: 0, totalBocor: 0, totalJahit: 0, gantiKarung: 0, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
  { id: '20', no: 20, jenisPakan: '', stakAwal: 0, bocorForklift: 0, bocorPallet: 0, bocorProduksi: 0, totalBocor: 0, totalJahit: 0, gantiKarung: 0, tidakGantiKarung: 0, sisaAkhir: 0, keterangan: '' },
];

export const defaultPetugasReport: PetugasReport = {
  id: 'japfa-sample-01',
  tanggalStr: '2026-07-18',
  hari: 'Sabtu',
  tanggalFormatted: '18.07.2026',
  shift: 'Shift 1',
  dibuatOleh: 'Petugas FG WH',
  disetujuiOleh: 'AMIN SODIK (FG WH Supervisor)',
  diketahuiOleh: 'HERY SHAPRIANTO (Head of WH Subdept)',
  statusApproval: 'Disetujui',
  items: sampleJapfaReportItems,
  catatanPetugas: 'Pemeriksaan rutin sabtu pagi. Kerusakan terbanyak akibat gesekan pallet kayu lapuk.',
  createdAt: '2026-07-18T08:00:00.000Z',
};
