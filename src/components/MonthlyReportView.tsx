import React, { useMemo } from 'react';
import { FinancialRecord, CurrencyConfig, CategoryBudget } from '../types/finance';
import { formatCurrency, formatQuantity, formatMonthYear, formatDateShort } from '../utils/formatters';
import { 
  FileDown,
  Printer, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet,
  FileSpreadsheet,
  Boxes,
  Users,
  Coffee,
  PenTool,
  HardHat,
  PieChart
} from 'lucide-react';

interface MonthlyReportViewProps {
  records: FinancialRecord[];
  currency: CurrencyConfig;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: string[];
  budgets?: CategoryBudget[];
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  records,
  currency,
  selectedMonth,
  onSelectMonth,
  availableMonths,
  budgets = [],
}) => {
  // Filter records for the selected month and sort chronologically
  const monthlyRecords = useMemo(() => {
    return records
      .filter((r) => r.month === selectedMonth)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records, selectedMonth]);

  // Aggregate monthly figures: ONLY Uang Masuk, Uang Keluar, Sisa Uang
  const reportStats = useMemo(() => {
    let uangMasuk = 0;
    let uangKeluar = 0;
    let countMasuk = 0;
    let countKeluar = 0;

    monthlyRecords.forEach((r) => {
      if (r.type === 'income') {
        uangMasuk += r.totalPrice;
        countMasuk += 1;
      } else {
        uangKeluar += r.totalPrice;
        countKeluar += 1;
      }
    });

    const sisaUang = uangMasuk - uangKeluar;

    return {
      uangMasuk,
      uangKeluar,
      sisaUang,
      countMasuk,
      countKeluar,
      totalTransaksi: monthlyRecords.length,
    };
  }, [monthlyRecords]);

  // Running balance calculation for chronological ledger
  const ledgerWithRunningBalance = useMemo(() => {
    let runningBalance = 0;
    return monthlyRecords.map((r) => {
      const masuk = r.type === 'income' ? r.totalPrice : 0;
      const keluar = r.type === 'expense' ? r.totalPrice : 0;
      runningBalance += masuk - keluar;
      return {
        ...r,
        uangMasuk: masuk,
        uangKeluar: keluar,
        sisaUangBerjalan: runningBalance,
      };
    });
  }, [monthlyRecords]);

  // Category breakdown focused on Uang Masuk, Uang Keluar, and Sisa Uang with Budget
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { masuk: number; keluar: number }>();

    monthlyRecords.forEach((r) => {
      const existing = map.get(r.category) || { masuk: 0, keluar: 0 };
      if (r.type === 'income') {
        existing.masuk += r.totalPrice;
      } else {
        existing.keluar += r.totalPrice;
      }
      map.set(r.category, existing);
    });

    budgets.forEach((b) => {
      if (!map.has(b.category)) {
        map.set(b.category, { masuk: 0, keluar: 0 });
      }
    });

    return Array.from(map.entries())
      .map(([kategori, data]) => {
        const budgetObj = budgets.find((b) => b.category === kategori);
        const budgetAmount = budgetObj ? budgetObj.monthlyBudget : 0;
        const sisaAnggaran = budgetAmount > 0 ? budgetAmount - data.keluar : 0;
        const percentUsed = budgetAmount > 0 ? (data.keluar / budgetAmount) * 100 : 0;

        return {
          kategori,
          budget: budgetAmount,
          uangMasuk: data.masuk,
          uangKeluar: data.keluar,
          sisaUang: data.masuk - data.keluar,
          sisaAnggaran,
          percentUsed,
        };
      })
      .sort((a, b) => (b.uangMasuk + b.uangKeluar) - (a.uangMasuk + a.uangKeluar));
  }, [monthlyRecords, budgets]);

  // TOTAL OF ALL SAME ITEMS THAT HAVE BEEN PURCHASED THIS MONTH
  const samePurchasedItemsMonthly = useMemo(() => {
    const map = new Map<string, {
      itemName: string;
      category: string;
      unitOfMeasure: string;
      totalQty: number;
      totalAmount: number;
      unitPrices: number[];
      count: number;
    }>();

    monthlyRecords.forEach((r) => {
      if (r.type === 'expense') {
        const key = r.itemName.trim().toLowerCase();
        const existing = map.get(key) || {
          itemName: r.itemName,
          category: r.category,
          unitOfMeasure: r.unitOfMeasure,
          totalQty: 0,
          totalAmount: 0,
          unitPrices: [],
          count: 0,
        };
        existing.totalQty += r.quantity;
        existing.totalAmount += r.totalPrice;
        existing.unitPrices.push(r.unitPrice);
        existing.count += 1;
        map.set(key, existing);
      }
    });

    return Array.from(map.values())
      .map((item) => {
        const avgPrice = item.unitPrices.length > 0 
          ? item.unitPrices.reduce((a, b) => a + b, 0) / item.unitPrices.length 
          : 0;
        return {
          ...item,
          avgPrice,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [monthlyRecords]);

  // Grand total of all same items
  const sameItemsTotals = useMemo(() => {
    let grandQty = 0;
    let grandAmount = 0;
    samePurchasedItemsMonthly.forEach((i) => {
      grandQty += i.totalQty;
      grandAmount += i.totalAmount;
    });
    return {
      grandQty,
      grandAmount,
      distinctCount: samePurchasedItemsMonthly.length,
    };
  }, [samePurchasedItemsMonthly]);

  // Navigation handlers
  const currentMonthIndex = availableMonths.indexOf(selectedMonth);
  const handlePrevMonth = () => {
    if (currentMonthIndex < availableMonths.length - 1) {
      onSelectMonth(availableMonths[currentMonthIndex + 1]);
    }
  };
  const handleNextMonth = () => {
    if (currentMonthIndex > 0) {
      onSelectMonth(availableMonths[currentMonthIndex - 1]);
    }
  };

  // CSV Export strictly highlighting Uang Masuk, Uang Keluar, and Sisa Uang
  const handleExportCSV = () => {
    const headers = [
      'Tanggal',
      'Deskripsi Barang / Transaksi',
      'Jumlah',
      'Satuan',
      'Harga Satuan',
      'Uang Masuk',
      'Uang Keluar',
      'Sisa Uang Berjalan',
      'Kategori',
      'Metode Pembayaran',
      'No. Referensi',
      'Catatan',
    ];

    const rows = ledgerWithRunningBalance.map((r) => [
      `"${r.date}"`,
      `"${r.itemName.replace(/"/g, '""')}"`,
      r.quantity,
      `"${r.unitOfMeasure}"`,
      r.unitPrice,
      r.uangMasuk > 0 ? r.uangMasuk : 0,
      r.uangKeluar > 0 ? r.uangKeluar : 0,
      r.sisaUangBerjalan,
      `"${r.category.replace(/"/g, '""')}"`,
      `"${r.paymentMethod}"`,
      `"${r.invoiceRef || ''}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    rows.push([
      '"TOTAL"',
      '"Ringkasan Laporan Bulanan"',
      '',
      '',
      '',
      reportStats.uangMasuk,
      reportStats.uangKeluar,
      reportStats.sisaUang,
      '',
      '',
      '',
      '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_keuangan_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Gaji Karyawan':
        return <Users className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Konsumsi':
        return <Coffee className="w-3.5 h-3.5 text-amber-500" />;
      case 'Alat Tulis Kantor':
        return <PenTool className="w-3.5 h-3.5 text-blue-500" />;
      case 'Kebutuhan Pekerja':
        return <HardHat className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Laporan Keuangan Bulanan
            </h2>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {formatMonthYear(selectedMonth)}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Rekapitulasi keuangan bulanan terfokus: Uang Masuk, Uang Keluar, dan Sisa Uang.
          </p>
        </div>

        {/* Month Selector & Export / Print Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={currentMonthIndex >= availableMonths.length - 1}
              className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-md px-3 py-1 border-0 shadow-xs focus:ring-1 focus:ring-indigo-500"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthYear(m)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={currentMonthIndex <= 0}
              className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            title="Simpan atau cetak laporan keuangan bulanan sebagai PDF"
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow-sm active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            <span>Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:bg-white print:text-black">
        {/* Formal Report Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">
              LAPORAN KEUANGAN BULANAN
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Ringkasan Uang Masuk, Uang Keluar & Sisa Uang
            </h1>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span>Periode: {formatMonthYear(selectedMonth)}</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{reportStats.totalTransaksi} transaksi</span>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono">
            <div className="text-xs text-slate-400">Sisa Uang Akhir Periode</div>
            <div className={`text-2xl font-bold tabular-nums ${
              reportStats.sisaUang >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(reportStats.sisaUang, currency)}
            </div>
          </div>
        </div>

        {/* The 3 Core Pillars: HANYA UANG MASUK, UANG KELUAR, DAN SISA UANG */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Uang Masuk */}
          <div className="p-5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40">
            <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
              <span>1. Uang Masuk</span>
              <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
              +{formatCurrency(reportStats.uangMasuk, currency)}
            </div>
            <div className="mt-2 text-xs text-emerald-700/80 dark:text-emerald-300/80 flex items-center justify-between border-t border-emerald-200/60 dark:border-emerald-800/40 pt-2 font-mono">
              <span>Total Penerimaan:</span>
              <span>{reportStats.countMasuk} transaksi</span>
            </div>
          </div>

          {/* 2. Uang Keluar */}
          <div className="p-5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40">
            <div className="flex items-center justify-between text-xs text-rose-800 dark:text-rose-300 font-semibold">
              <span>2. Uang Keluar</span>
              <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400">
              -{formatCurrency(reportStats.uangKeluar, currency)}
            </div>
            <div className="mt-2 text-xs text-rose-700/80 dark:text-rose-300/80 flex items-center justify-between border-t border-rose-200/60 dark:border-rose-800/40 pt-2 font-mono">
              <span>Total Pengeluaran:</span>
              <span>{reportStats.countKeluar} transaksi</span>
            </div>
          </div>

          {/* 3. Sisa Uang */}
          <div className="p-5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/40">
            <div className="flex items-center justify-between text-xs text-indigo-800 dark:text-indigo-300 font-semibold">
              <span>3. Sisa Uang</span>
              <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className={`mt-3 text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
              reportStats.sisaUang >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(reportStats.sisaUang, currency)}
            </div>
            <div className="mt-2 text-xs text-indigo-700/80 dark:text-indigo-300/80 flex items-center justify-between border-t border-indigo-200/60 dark:border-indigo-800/40 pt-2 font-mono">
              <span>Uang Masuk - Uang Keluar</span>
              <span>{reportStats.sisaUang >= 0 ? 'Surplus Kas' : 'Defisit Kas'}</span>
            </div>
          </div>
        </div>

        {/* Ringkasan Saldo Arus Kas Sederhana */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
            Perhitungan Sisa Uang Bulan {formatMonthYear(selectedMonth)}
          </h3>
          <div className="space-y-2.5 max-w-lg text-xs font-mono">
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="font-sans">Total Uang Masuk:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{formatCurrency(reportStats.uangMasuk, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="font-sans">Total Uang Keluar:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                -{formatCurrency(reportStats.uangKeluar, currency)}
              </span>
            </div>
            <div className="border-t-2 border-slate-300 dark:border-slate-700 pt-2 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-slate-100">
              <span className="font-sans">Sisa Uang Bersih:</span>
              <span className={`tabular-nums ${
                reportStats.sisaUang >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatCurrency(reportStats.sisaUang, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION: TOTAL SEMUA BARANG SEJENIS YANG TELAH DIBELI BULAN INI */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Total Semua Barang yang Sama yang Telah Dibeli Bulan Ini
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {sameItemsTotals.distinctCount} Barang Sejenis
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            {samePurchasedItemsMonthly.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada pengeluaran barang yang tercatat pada bulan ini.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3">Nama Barang yang Dibeli</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-right">Rata-rata Harga Satuan</th>
                    <th className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400 font-bold">
                      Total Kuantitas yang Telah Dibeli
                    </th>
                    <th className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400 font-bold">
                      Total Uang Keluar (Biaya)
                    </th>
                    <th className="py-2.5 px-3 text-center">Frekuensi Beli</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                  {samePurchasedItemsMonthly.map((item) => (
                    <tr key={item.itemName} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {item.itemName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(item.category)}
                          <span>{item.category}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {formatCurrency(item.avgPrice, currency)} / {item.unitOfMeasure === '-' ? '(-)' : item.unitOfMeasure}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                        {formatQuantity(item.totalQty)} {item.unitOfMeasure === '-' ? '(-)' : item.unitOfMeasure}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                        -{formatCurrency(item.totalAmount, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {item.count}x transaksi
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-bold">
                    <td colSpan={3} className="py-2.5 px-3 text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs">
                      Grand Total Pembelian Barang
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                      {formatQuantity(sameItemsTotals.grandQty)} total unit
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400">
                      -{formatCurrency(sameItemsTotals.grandAmount, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                      {sameItemsTotals.distinctCount} barang
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Buku Kas Bulanan Terinci dengan Sisa Uang Berjalan */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Buku Kas Terinci (Catatan Uang Masuk, Keluar & Sisa Uang Berjalan)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Kronologis transaksi
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            {ledgerWithRunningBalance.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Belum ada transaksi uang masuk atau uang keluar pada bulan ini</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Deskripsi Barang / Transaksi</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">Uang Masuk (+)</th>
                    <th className="py-2.5 px-3 text-right text-rose-700 dark:text-rose-400">Uang Keluar (-)</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">Sisa Uang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                  {ledgerWithRunningBalance.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      {/* Tanggal */}
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateShort(r.date)}
                      </td>

                      {/* Deskripsi Barang & Harga Satuan */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {r.itemName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{formatQuantity(r.quantity, r.unitOfMeasure)}</span>
                          <span>@</span>
                          <span>{formatCurrency(r.unitPrice, currency)}</span>
                          {r.invoiceRef && <span>· No: {r.invoiceRef}</span>}
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(r.category)}
                          <span>{r.category}</span>
                        </div>
                      </td>

                      {/* Uang Masuk */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {r.uangMasuk > 0 ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(r.uangMasuk, currency)}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">—</span>
                        )}
                      </td>

                      {/* Uang Keluar */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {r.uangKeluar > 0 ? (
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            -{formatCurrency(r.uangKeluar, currency)}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">—</span>
                        )}
                      </td>

                      {/* Sisa Uang Berjalan */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold whitespace-nowrap text-slate-900 dark:text-slate-100">
                        {formatCurrency(r.sisaUangBerjalan, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Total Baris Bawah */}
                <tfoot>
                  <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-bold">
                    <td colSpan={3} className="py-3 px-3 text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs">
                      Total Periode {formatMonthYear(selectedMonth)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 text-sm">
                      +{formatCurrency(reportStats.uangMasuk, currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400 text-sm">
                      -{formatCurrency(reportStats.uangKeluar, currency)}
                    </td>
                    <td className={`py-3 px-3 text-right font-mono tabular-nums text-sm ${
                      reportStats.sisaUang >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatCurrency(reportStats.sisaUang, currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Rincian Kategori: Anggaran, Uang Masuk, Uang Keluar & Sisa Uang */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-500" />
              <span>Rincian Kategori & Anggaran (Gaji Karyawan, Konsumsi, ATK, Kebutuhan Pekerja, Anggaran)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {categoryBreakdown.length} Kategori
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/40">
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right">Target Anggaran</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">Uang Masuk</th>
                  <th className="py-2.5 px-3 text-right text-rose-700 dark:text-rose-400">Uang Keluar</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Sisa Uang</th>
                  <th className="py-2.5 px-3 text-center">Penyerapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {categoryBreakdown.map((cat) => (
                  <tr key={cat.kategori} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(cat.kategori)}
                        <span>{cat.kategori}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {cat.budget > 0 ? formatCurrency(cat.budget, currency) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                      {cat.uangMasuk > 0 ? `+${formatCurrency(cat.uangMasuk, currency)}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400 font-medium">
                      {cat.uangKeluar > 0 ? `-${formatCurrency(cat.uangKeluar, currency)}` : '—'}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono tabular-nums font-bold ${
                      cat.sisaUang >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatCurrency(cat.sisaUang, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-500">
                      {cat.budget > 0 ? `${cat.percentUsed.toFixed(0)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Footer Note */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            Laporan Keuangan Bulanan · Fokus Uang Masuk, Uang Keluar & Sisa Uang
          </div>
          <div>Periode Laporan: {formatMonthYear(selectedMonth)}</div>
        </div>
      </div>
    </div>
  );
};
