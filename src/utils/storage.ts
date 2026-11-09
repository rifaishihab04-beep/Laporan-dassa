import { FinancialRecord, CurrencyConfig, CategoryBudget } from '../types/finance';
import { DEFAULT_CURRENCIES } from './formatters';

const STORAGE_KEY_RECORDS = 'finledger_records_v4_categorized';
const STORAGE_KEY_CURRENCY = 'finledger_currency_idr_v2';
const STORAGE_KEY_BUDGETS = 'finledger_category_budgets_v1';

export const DEFAULT_CATEGORIES = [
  'Gaji Karyawan',
  'Konsumsi',
  'Alat Tulis Kantor',
  'Kebutuhan Pekerja',
  'Anggaran / Budget',
  'Pendapatan & Penjualan',
  'Operasional & Lain-lain',
];

export const DEFAULT_UNITS = [
  '-',
  'pcs',
  'unit',
  'orang',
  'porsi',
  'rim',
  'box',
  'stel',
  'pasang',
  'galon',
  'pack',
  'paket',
  'jam',
  'set',
  'lembar',
  'dus',
];

export const DEFAULT_CATEGORY_BUDGETS: CategoryBudget[] = [
  { category: 'Gaji Karyawan', monthlyBudget: 30000000, notes: 'Alokasi upah pokok & lembur 5 staff' },
  { category: 'Konsumsi', monthlyBudget: 2500000, notes: 'Makan siang & galon air mineral' },
  { category: 'Alat Tulis Kantor', monthlyBudget: 3000000, notes: 'Kertas HVS, tinta printer & alat tulis' },
  { category: 'Kebutuhan Pekerja', monthlyBudget: 5000000, notes: 'APD, seragam kerja & kotak P3K' },
  { category: 'Anggaran / Budget', monthlyBudget: 5000000, notes: 'Pos cadangan anggaran operasional' },
  { category: 'Operasional & Lain-lain', monthlyBudget: 4000000, notes: 'Biaya utilitas & tak terduga' },
];

export const INITIAL_RECORDS: FinancialRecord[] = [
  // Bulan Berjalan: November 2026
  // 1. Pemasukan Kas Awal
  {
    id: 'rec-202611-01',
    date: '2026-11-01',
    month: '2026-11',
    type: 'income',
    itemName: 'Pendapatan Kontrak Operasional Klien',
    category: 'Pendapatan & Penjualan',
    quantity: 1,
    unitOfMeasure: 'paket',
    unitPrice: 55000000,
    totalPrice: 55000000,
    paymentMethod: 'Transfer Bank',
    invoiceRef: 'INV-INCOME-101',
    notes: 'Penerimaan dana termin proyek operasional bulanan',
    createdAt: 1793500800000,
  },

  // 2. Gaji Karyawan
  {
    id: 'rec-202611-02',
    date: '2026-11-02',
    month: '2026-11',
    type: 'expense',
    itemName: 'Gaji Pokok Karyawan Tetap',
    category: 'Gaji Karyawan',
    quantity: 5,
    unitOfMeasure: 'orang',
    unitPrice: 4500000,
    totalPrice: 22500000,
    paymentMethod: 'Transfer Bank',
    invoiceRef: 'PAYROLL-202611-01',
    notes: 'Pembayaran gaji pokok 5 staff operasional & teknisi',
    createdAt: 1793587200000,
  },
  {
    id: 'rec-202611-03',
    date: '2026-11-02',
    month: '2026-11',
    type: 'expense',
    itemName: 'Tunjangan Transport & Kinerja Karyawan',
    category: 'Gaji Karyawan',
    quantity: 5,
    unitOfMeasure: 'orang',
    unitPrice: 850000,
    totalPrice: 4250000,
    paymentMethod: 'Transfer Bank',
    invoiceRef: 'PAYROLL-202611-02',
    notes: 'Tunjangan kehadiran dan transport bulanan staff',
    createdAt: 1793590800000,
  },

  // 3. Alat Tulis Kantor (Batch 1 - Kertas HVS)
  {
    id: 'rec-202611-04',
    date: '2026-11-03',
    month: '2026-11',
    type: 'expense',
    itemName: 'Kertas HVS A4 80gr',
    category: 'Alat Tulis Kantor',
    quantity: 25,
    unitOfMeasure: 'rim',
    unitPrice: 54000,
    totalPrice: 1350000,
    paymentMethod: 'Transfer Bank',
    invoiceRef: 'ATK-2026-081',
    notes: 'Pembelian pertama kertas cetak laporan administrasi',
    createdAt: 1793673600000,
  },

  // 4. Konsumsi (Batch 1 - Makan Siang)
  {
    id: 'rec-202611-05',
    date: '2026-11-03',
    month: '2026-11',
    type: 'expense',
    itemName: 'Makan Siang Karyawan',
    category: 'Konsumsi',
    quantity: 20,
    unitOfMeasure: 'porsi',
    unitPrice: 25000,
    totalPrice: 500000,
    paymentMethod: 'Tunai',
    invoiceRef: 'KNS-2026-012',
    notes: 'Konsumsi makan siang tim proyek lembur shift siang',
    createdAt: 1793677200000,
  },

  // 5. Konsumsi (Batch 1 - Air Mineral)
  {
    id: 'rec-202611-06',
    date: '2026-11-04',
    month: '2026-11',
    type: 'expense',
    itemName: 'Air Mineral Galon',
    category: 'Konsumsi',
    quantity: 8,
    unitOfMeasure: 'galon',
    unitPrice: 20000,
    totalPrice: 160000,
    paymentMethod: 'Tunai',
    invoiceRef: 'KNS-2026-018',
    notes: 'Pengisian ulang galon air minum dispenser kantor',
    createdAt: 1793760000000,
  },

  // 6. Kebutuhan Pekerja
  {
    id: 'rec-202611-07',
    date: '2026-11-04',
    month: '2026-11',
    type: 'expense',
    itemName: 'Seragam Kerja Lapangan Karyawan',
    category: 'Kebutuhan Pekerja',
    quantity: 10,
    unitOfMeasure: 'stel',
    unitPrice: 180000,
    totalPrice: 1800000,
    paymentMethod: 'Transfer Bank',
    invoiceRef: 'KBT-2026-004',
    notes: 'Pengadaan pakaian dinas seragam kerja lapangan baru',
    createdAt: 1793763600000,
  },
  {
    id: 'rec-202611-08',
    date: '2026-11-05',
    month: '2026-11',
    type: 'expense',
    itemName: 'Sepatu Safety Pelindung Karyawan',
    category: 'Kebutuhan Pekerja',
    quantity: 5,
    unitOfMeasure: 'pasang',
    unitPrice: 320000,
    totalPrice: 1600000,
    paymentMethod: 'Kartu Kredit',
    invoiceRef: 'KBT-2026-009',
    notes: 'Alat pelindung diri sepatu safety teknisi lapangan',
    createdAt: 1793846400000,
  },

  // 7. Alat Tulis Kantor (Pulpen Gel Box)
  {
    id: 'rec-202611-09',
    date: '2026-11-05',
    month: '2026-11',
    type: 'expense',
    itemName: 'Pulpen Gel Hitam 0.5mm',
    category: 'Alat Tulis Kantor',
    quantity: 8,
    unitOfMeasure: 'box',
    unitPrice: 36000,
    totalPrice: 288000,
    paymentMethod: 'Tunai',
    invoiceRef: 'ATK-2026-092',
    notes: 'Stok alat tulis pulpen untuk meja administrasi kantor',
    createdAt: 1793850000000,
  },

  // 8. Alat Tulis Kantor (Batch 2 - KERTAS HVS DIBELI LAGI UNTUK MEMPERLIHATKAN TOTAL BARANG YANG SAMA)
  {
    id: 'rec-202611-10',
    date: '2026-11-06',
    month: '2026-11',
    type: 'expense',
    itemName: 'Kertas HVS A4 80gr',
    category: 'Alat Tulis Kantor',
    quantity: 15,
    unitOfMeasure: 'rim',
    unitPrice: 54000,
    totalPrice: 810000,
    paymentMethod: 'Transfer Bank',
    invoiceRef: 'ATK-2026-105',
    notes: 'Pembelian tambahan kertas HVS A4 untuk berkas tender akhir pekan',
    createdAt: 1793932800000,
  },

  // 9. Konsumsi (Batch 2 - MAKAN SIANG DIBELI LAGI UNTUK TOTAL BARANG YANG SAMA)
  {
    id: 'rec-202611-11',
    date: '2026-11-06',
    month: '2026-11',
    type: 'expense',
    itemName: 'Makan Siang Karyawan',
    category: 'Konsumsi',
    quantity: 25,
    unitOfMeasure: 'porsi',
    unitPrice: 25000,
    totalPrice: 625000,
    paymentMethod: 'Tunai',
    invoiceRef: 'KNS-2026-031',
    notes: 'Makan siang karyawan sesi briefing koordinasi lapangan',
    createdAt: 1793936400000,
  },

  // 10. Konsumsi (Batch 2 - AIR MINERAL DIBELI LAGI UNTUK TOTAL BARANG YANG SAMA)
  {
    id: 'rec-202611-12',
    date: '2026-11-07',
    month: '2026-11',
    type: 'expense',
    itemName: 'Air Mineral Galon',
    category: 'Konsumsi',
    quantity: 6,
    unitOfMeasure: 'galon',
    unitPrice: 20000,
    totalPrice: 120000,
    paymentMethod: 'Tunai',
    invoiceRef: 'KNS-2026-045',
    notes: 'Restok galon air minum ruangan kerja',
    createdAt: 1794019200000,
  },

  // 11. Kebutuhan Pekerja (Kotak P3K & Masker)
  {
    id: 'rec-202611-13',
    date: '2026-11-08',
    month: '2026-11',
    type: 'expense',
    itemName: 'Masker Medis & Kebutuhan K3 Pekerja',
    category: 'Kebutuhan Pekerja',
    quantity: 12,
    unitOfMeasure: 'box',
    unitPrice: 42000,
    totalPrice: 504000,
    paymentMethod: 'Kartu Debit',
    invoiceRef: 'KBT-2026-017',
    notes: 'Perlengkapan sanitasi dan kesehatan harian pekerja',
    createdAt: 1794105600000,
  },

  // 12. Gaji Karyawan (Upah Lembur Pekerja)
  {
    id: 'rec-202611-14',
    date: '2026-11-08',
    month: '2026-11',
    type: 'expense',
    itemName: 'Upah Lembur Pekerja Proyek',
    category: 'Gaji Karyawan',
    quantity: 16,
    unitOfMeasure: 'jam',
    unitPrice: 50000,
    totalPrice: 800000,
    paymentMethod: 'Transfer Bank',
    invoiceRef: 'PAYROLL-202611-08',
    notes: 'Insentif lembur penyelesaian target proyek akhir pekan',
    createdAt: 1794109200000,
  },

  // 13. Konsumsi (Kopi & Gula Pantri)
  {
    id: 'rec-202611-15',
    date: '2026-11-09',
    month: '2026-11',
    type: 'expense',
    itemName: 'Kopi & Teh Pantri Kantor',
    category: 'Konsumsi',
    quantity: 10,
    unitOfMeasure: 'pack',
    unitPrice: 35000,
    totalPrice: 350000,
    paymentMethod: 'Tunai',
    invoiceRef: 'KNS-2026-059',
    notes: 'Persediaan minuman pantri karyawan',
    createdAt: 1794192000000,
  },

  // Bulan Sebelumnya: Oktober 2026
  {
    id: 'rec-202610-01',
    date: '2026-10-01',
    month: '2026-10',
    type: 'income',
    itemName: 'Pendapatan Kontrak Operasional Klien',
    category: 'Pendapatan & Penjualan',
    quantity: 1,
    unitOfMeasure: 'paket',
    unitPrice: 50000000,
    totalPrice: 50000000,
    paymentMethod: 'Transfer Bank',
    invoiceRef: 'INV-OCT-01',
    notes: 'Pemasukan kontrak bulan Oktober',
    createdAt: 1790832000000,
  },
  {
    id: 'rec-202610-02',
    date: '2026-10-02',
    month: '2026-10',
    type: 'expense',
    itemName: 'Gaji Pokok Karyawan Tetap',
    category: 'Gaji Karyawan',
    quantity: 5,
    unitOfMeasure: 'orang',
    unitPrice: 4500000,
    totalPrice: 22500000,
    paymentMethod: 'Transfer Bank',
    invoiceRef: 'PAY-OCT-01',
    notes: 'Gaji pokok staff Oktober',
    createdAt: 1790918400000,
  },
  {
    id: 'rec-202610-03',
    date: '2026-10-05',
    month: '2026-10',
    type: 'expense',
    itemName: 'Kertas HVS A4 80gr',
    category: 'Alat Tulis Kantor',
    quantity: 30,
    unitOfMeasure: 'rim',
    unitPrice: 53000,
    totalPrice: 1590000,
    paymentMethod: 'Transfer Bank',
    invoiceRef: 'ATK-OCT-01',
    notes: 'Pembelian kertas HVS bulan Oktober',
    createdAt: 1791177600000,
  },
  {
    id: 'rec-202610-04',
    date: '2026-10-10',
    month: '2026-10',
    type: 'expense',
    itemName: 'Makan Siang Karyawan',
    category: 'Konsumsi',
    quantity: 40,
    unitOfMeasure: 'porsi',
    unitPrice: 25000,
    totalPrice: 1000000,
    paymentMethod: 'Tunai',
    invoiceRef: 'KNS-OCT-01',
    notes: 'Konsumsi kegiatan workshop karyawan',
    createdAt: 1791609600000,
  },
];

export function loadStoredRecords(): FinancialRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading stored records:', err);
    return INITIAL_RECORDS;
  }
}

export function saveStoredRecords(records: FinancialRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving records to localStorage:', err);
  }
}

export function loadStoredCurrency(): CurrencyConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CURRENCY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // fallback
  }
  return DEFAULT_CURRENCIES[0]; // IDR
}

export function saveStoredCurrency(currency: CurrencyConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENCY, JSON.stringify(currency));
  } catch (err) {
    console.error('Error saving currency:', err);
  }
}

export function loadStoredBudgets(): CategoryBudget[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_BUDGETS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(DEFAULT_CATEGORY_BUDGETS));
      return DEFAULT_CATEGORY_BUDGETS;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(DEFAULT_CATEGORY_BUDGETS));
      return DEFAULT_CATEGORY_BUDGETS;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading stored budgets:', err);
    return DEFAULT_CATEGORY_BUDGETS;
  }
}

export function saveStoredBudgets(budgets: CategoryBudget[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
  } catch (err) {
    console.error('Error saving budgets to localStorage:', err);
  }
}
