import React, { useState, useMemo } from 'react';
import { FinancialRecord, CurrencyConfig, ItemSortKey, ItemSummary } from '../types/finance';
import { formatCurrency, formatQuantity, formatDateShort, formatMonthYear } from '../utils/formatters';
import { PurchaseReductionChart } from './PurchaseReductionChart';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Layers, 
  TrendingUp, 
  PlusCircle, 
  FileText,
  Package,
  Boxes,
  Users,
  Coffee,
  PenTool,
  HardHat,
  FileDown
} from 'lucide-react';

interface ItemAnalyticsViewProps {
  records: FinancialRecord[];
  currency: CurrencyConfig;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: string[];
  onOpenRecordModal: (initialData?: Partial<FinancialRecord>) => void;
}

export const ItemAnalyticsView: React.FC<ItemAnalyticsViewProps> = ({
  records,
  currency,
  selectedMonth,
  onSelectMonth,
  availableMonths,
  onOpenRecordModal,
}) => {
  const [sortKey, setSortKey] = useState<ItemSortKey>('purchasedQty_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Available categories in the records
  const categories = useMemo(() => {
    const defaultList = [
      'Gaji Karyawan',
      'Konsumsi',
      'Alat Tulis Kantor',
      'Kebutuhan Pekerja',
    ];
    const set = new Set<string>(defaultList);
    records.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [records]);

  // Filter records based on selected month (or all)
  const scopedRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedMonth !== 'all' && r.month !== selectedMonth) return false;
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
      return true;
    });
  }, [records, selectedMonth, selectedCategory]);

  // Aggregate items: calculate TOTAL OF ALL SAME ITEMS THAT HAVE BEEN PURCHASED
  const aggregatedPurchasedItems = useMemo(() => {
    const map = new Map<string, {
      itemName: string;
      category: string;
      unitOfMeasure: string;
      totalPurchasedQty: number; // akumulasi kuantitas barang yang sama
      totalPurchasedAmount: number; // akumulasi total uang yang dikeluarkan untuk barang yang sama
      unitPrices: number[];
      dates: string[];
      transactionCount: number; // berapa kali barang yang sama dibeli
      transactions: FinancialRecord[];
    }>();

    scopedRecords.forEach((r) => {
      // Focus on items purchased / expenses
      if (r.type === 'expense') {
        const key = r.itemName.trim().toLowerCase();
        const existing = map.get(key) || {
          itemName: r.itemName,
          category: r.category,
          unitOfMeasure: r.unitOfMeasure,
          totalPurchasedQty: 0,
          totalPurchasedAmount: 0,
          unitPrices: [],
          dates: [],
          transactionCount: 0,
          transactions: [],
        };

        existing.totalPurchasedQty += r.quantity;
        existing.totalPurchasedAmount += r.totalPrice;
        existing.unitPrices.push(r.unitPrice);
        existing.dates.push(r.date);
        existing.transactionCount += 1;
        existing.transactions.push(r);

        map.set(key, existing);
      }
    });

    const list: (ItemSummary & { transactions: FinancialRecord[] })[] = [];
    map.forEach((data) => {
      const sumPrices = data.unitPrices.reduce((a, b) => a + b, 0);
      const avgUnitPrice = data.unitPrices.length > 0 ? sumPrices / data.unitPrices.length : 0;
      const minUnitPrice = Math.min(...data.unitPrices);
      const maxUnitPrice = Math.max(...data.unitPrices);
      const lastDate = [...data.dates].sort().pop() || '';

      list.push({
        itemName: data.itemName,
        category: data.category,
        unitOfMeasure: data.unitOfMeasure,
        totalPurchasedQty: data.totalPurchasedQty,
        totalIncomeQty: 0,
        netQty: data.totalPurchasedQty,
        avgUnitPrice,
        minUnitPrice,
        maxUnitPrice,
        totalExpenseAmount: data.totalPurchasedAmount,
        totalIncomeAmount: 0,
        netAmount: data.totalPurchasedAmount,
        transactionCount: data.transactionCount,
        lastDate,
        transactions: data.transactions,
      });
    });

    return list;
  }, [scopedRecords]);

  // Apply sorting and search to the aggregated same items
  const sortedPurchasedItems = useMemo(() => {
    let result = [...aggregatedPurchasedItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.itemName.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      switch (sortKey) {
        case 'purchasedQty_desc':
          return b.totalPurchasedQty - a.totalPurchasedQty;
        case 'purchasedQty_asc':
          return a.totalPurchasedQty - b.totalPurchasedQty;
        case 'unitPrice_desc':
          return b.avgUnitPrice - a.avgUnitPrice;
        case 'unitPrice_asc':
          return a.avgUnitPrice - b.avgUnitPrice;
        case 'totalAmount_desc':
          return b.totalExpenseAmount - a.totalExpenseAmount;
        case 'totalAmount_asc':
          return a.totalExpenseAmount - b.totalExpenseAmount;
        case 'name_asc':
          return a.itemName.localeCompare(b.itemName);
        case 'name_desc':
          return b.itemName.localeCompare(a.itemName);
        case 'lastDate_desc':
          return b.lastDate.localeCompare(a.lastDate);
        default:
          return b.totalPurchasedQty - a.totalPurchasedQty;
      }
    });

    return result;
  }, [aggregatedPurchasedItems, sortKey, searchQuery]);

  // Category Total Summaries for Requested Categories
  const categoryStats = useMemo(() => {
    const stats: Record<string, { totalQty: number; totalAmount: number; count: number }> = {
      'Gaji Karyawan': { totalQty: 0, totalAmount: 0, count: 0 },
      'Konsumsi': { totalQty: 0, totalAmount: 0, count: 0 },
      'Alat Tulis Kantor': { totalQty: 0, totalAmount: 0, count: 0 },
      'Kebutuhan Pekerja': { totalQty: 0, totalAmount: 0, count: 0 },
    };

    scopedRecords.forEach((r) => {
      if (r.type === 'expense' && stats[r.category]) {
        stats[r.category].totalQty += r.quantity;
        stats[r.category].totalAmount += r.totalPrice;
        stats[r.category].count += 1;
      }
    });

    return stats;
  }, [scopedRecords]);

  // Overall Statistics for Same Items Purchased
  const totalSummaryStats = useMemo(() => {
    let grandTotalQty = 0;
    let grandTotalAmount = 0;
    let multiPurchaseItemCount = 0; // barang yang dibeli lebih dari 1 kali

    aggregatedPurchasedItems.forEach((item) => {
      grandTotalQty += item.totalPurchasedQty;
      grandTotalAmount += item.totalExpenseAmount;
      if (item.transactionCount > 1) {
        multiPurchaseItemCount += 1;
      }
    });

    return {
      distinctItemCount: aggregatedPurchasedItems.length,
      grandTotalQty,
      grandTotalAmount,
      multiPurchaseItemCount,
    };
  }, [aggregatedPurchasedItems]);

  const maxPurchasedQty = useMemo(() => {
    return Math.max(...aggregatedPurchasedItems.map((i) => i.totalPurchasedQty), 1);
  }, [aggregatedPurchasedItems]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Gaji Karyawan':
        return <Users className="w-4 h-4 text-indigo-500" />;
      case 'Konsumsi':
        return <Coffee className="w-4 h-4 text-amber-500" />;
      case 'Alat Tulis Kantor':
        return <PenTool className="w-4 h-4 text-blue-500" />;
      case 'Kebutuhan Pekerja':
        return <HardHat className="w-4 h-4 text-emerald-500" />;
      default:
        return <Package className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Menu Header & Scope Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Menu Barang & Rekapitulasi Pembelian
            </h2>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {totalSummaryStats.distinctItemCount} Jenis Barang
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pengelompokan berdasarkan Gaji Karyawan, Konsumsi, Alat Tulis Kantor, Kebutuhan Pekerja, serta <strong>total akumulasi semua barang yang sama yang telah dibeli</strong>.
          </p>
        </div>

        {/* Month selector & Quick Entry Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400 px-2 font-medium">Periode:</span>
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-medium rounded-md px-2.5 py-1.5 border-0 shadow-xs focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Semua Riwayat Tercatat</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthYear(m)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            title="Simpan atau cetak tampilan menu barang sebagai PDF"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Simpan PDF</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenRecordModal({ type: 'expense' })}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Catat Barang Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Requested Category Summary Cards: Gaji Karyawan, Konsumsi, Alat Tulis Kantor, Kebutuhan Pekerja */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Gaji Karyawan */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'Gaji Karyawan' ? 'all' : 'Gaji Karyawan')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            selectedCategory === 'Gaji Karyawan'
              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Gaji Karyawan</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {formatCurrency(categoryStats['Gaji Karyawan']?.totalAmount || 0, currency)}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
            {formatQuantity(categoryStats['Gaji Karyawan']?.totalQty || 0)} unit · {categoryStats['Gaji Karyawan']?.count || 0} transaksi
          </div>
        </div>

        {/* 2. Konsumsi */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'Konsumsi' ? 'all' : 'Konsumsi')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            selectedCategory === 'Konsumsi'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Konsumsi</span>
            <Coffee className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {formatCurrency(categoryStats['Konsumsi']?.totalAmount || 0, currency)}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
            {formatQuantity(categoryStats['Konsumsi']?.totalQty || 0)} unit · {categoryStats['Konsumsi']?.count || 0} transaksi
          </div>
        </div>

        {/* 3. Alat Tulis Kantor */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'Alat Tulis Kantor' ? 'all' : 'Alat Tulis Kantor')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            selectedCategory === 'Alat Tulis Kantor'
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Alat Tulis Kantor (ATK)</span>
            <PenTool className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {formatCurrency(categoryStats['Alat Tulis Kantor']?.totalAmount || 0, currency)}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
            {formatQuantity(categoryStats['Alat Tulis Kantor']?.totalQty || 0)} unit · {categoryStats['Alat Tulis Kantor']?.count || 0} transaksi
          </div>
        </div>

        {/* 4. Kebutuhan Pekerja */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'Kebutuhan Pekerja' ? 'all' : 'Kebutuhan Pekerja')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            selectedCategory === 'Kebutuhan Pekerja'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Kebutuhan Pekerja</span>
            <HardHat className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {formatCurrency(categoryStats['Kebutuhan Pekerja']?.totalAmount || 0, currency)}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
            {formatQuantity(categoryStats['Kebutuhan Pekerja']?.totalQty || 0)} unit · {categoryStats['Kebutuhan Pekerja']?.count || 0} transaksi
          </div>
        </div>
      </div>

      {/* The Income vs Expense Graph */}
      <PurchaseReductionChart
        records={records}
        currency={currency}
        selectedMonth={selectedMonth}
      />

      {/* SECTION: TOTAL OF ALL THE SAME ITEMS THAT HAVE BEEN PURCHASED */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Total Semua Barang yang Sama yang Telah Dibeli
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Menghitung akumulasi total kuantitas dan total nilai belanja untuk setiap barang sejenis dari seluruh transaksi
            </p>
          </div>

          {/* Quick Sort Shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1">Urutkan:</span>
            
            <button
              type="button"
              onClick={() => setSortKey('purchasedQty_desc')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                sortKey === 'purchasedQty_desc'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Total Kuantitas Terbanyak</span>
              <ArrowDown className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => setSortKey('totalAmount_desc')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                sortKey === 'totalAmount_desc'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Total Nilai Terbesar</span>
              <ArrowDown className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => setSortKey('name_asc')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                sortKey === 'name_asc'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Nama Barang A-Z</span>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Filter Bar with Category Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Sorting Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Menu Pengurutan Lengkap
            </label>
            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as ItemSortKey)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="purchasedQty_desc">Total Kuantitas Dibeli (Terbanyak → Tersedikit)</option>
                <option value="purchasedQty_asc">Total Kuantitas Dibeli (Tersedikit → Terbanyak)</option>
                <option value="totalAmount_desc">Total Pengeluaran Barang (Tertinggi → Terendah)</option>
                <option value="totalAmount_asc">Total Pengeluaran Barang (Terendah → Tertinggi)</option>
                <option value="unitPrice_desc">Harga Satuan (Tertinggi Dulu)</option>
                <option value="unitPrice_asc">Harga Satuan (Terendah Dulu)</option>
                <option value="name_asc">Nama Barang (Abjad A → Z)</option>
                <option value="name_desc">Nama Barang (Abjad Z → A)</option>
                <option value="lastDate_desc">Tanggal Pembelian Terbaru</option>
              </select>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Kategori Pengeluaran
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Cari Nama Barang
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kertas, kopi, seragam, dll..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg pl-8 pr-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Detailed Aggregation Table of Same Items */}
        <div className="overflow-x-auto pt-2">
          {sortedPurchasedItems.length === 0 ? (
            <div className="py-12 text-center">
              <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                Tidak ada data barang yang sesuai dengan filter
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Silakan ganti kategori atau pilih periode lainnya
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40">
                  <th className="py-2.5 px-3">Nama Barang yang Dibeli</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                  <th className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400 font-bold">
                    Total Kuantitas yang Telah Dibeli
                  </th>
                  <th className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400 font-bold">
                    Total Akumulasi Biaya
                  </th>
                  <th className="py-2.5 px-3 text-center">Frekuensi Beli</th>
                  <th className="py-2.5 px-3 text-right">Pembelian Terakhir</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {sortedPurchasedItems.map((item) => {
                  const isExpanded = expandedItem === item.itemName;
                  const purchasePct = (item.totalPurchasedQty / maxPurchasedQty) * 100;

                  return (
                    <React.Fragment key={item.itemName}>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                        {/* Nama Barang */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{item.itemName}</span>
                            {item.transactionCount > 1 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                {item.transactionCount}x Pembelian
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            {getCategoryIcon(item.category)}
                            <span>{item.category}</span>
                          </div>
                        </td>

                        {/* Harga Satuan */}
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          <div className="text-slate-900 dark:text-slate-100 font-medium">
                            {formatCurrency(item.avgUnitPrice, currency)}
                          </div>
                          {item.minUnitPrice !== item.maxUnitPrice && (
                            <div className="text-[10px] text-slate-400">
                              {formatCurrency(item.minUnitPrice, currency)} - {formatCurrency(item.maxUnitPrice, currency)}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400">per {item.unitOfMeasure === '-' ? '(-)' : item.unitOfMeasure}</div>
                        </td>

                        {/* TOTAL KUANTITAS YANG TELAH DIBELI */}
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {formatQuantity(item.totalPurchasedQty)} {item.unitOfMeasure === '-' ? '(-)' : item.unitOfMeasure}
                          </div>
                          {/* Mini visual volume meter */}
                          <div className="w-24 ml-auto h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${Math.min(purchasePct, 100)}%` }}
                            />
                          </div>
                        </td>

                        {/* TOTAL AKUMULASI BIAYA PEMBELIAN */}
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400 text-sm">
                          {formatCurrency(item.totalExpenseAmount, currency)}
                        </td>

                        {/* Frekuensi Pembelian */}
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                            {item.transactionCount} kali
                          </span>
                        </td>

                        {/* Tanggal Terakhir */}
                        <td className="py-3 px-3 text-right text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {formatDateShort(item.lastDate)}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setExpandedItem(isExpanded ? null : item.itemName)}
                              title="Lihat rincian transaksi barang ini"
                              className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onOpenRecordModal({
                                  type: 'expense',
                                  itemName: item.itemName,
                                  category: item.category,
                                  unitOfMeasure: item.unitOfMeasure,
                                  unitPrice: item.avgUnitPrice,
                                })
                              }
                              title="Catat pembelian lagi untuk barang ini"
                              className="p-1 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Transactions for this item */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 dark:bg-slate-800/30">
                          <td colSpan={8} className="py-3 px-6">
                            <div className="text-xs space-y-2">
                              <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                <span>Rincian Pembelian yang Membentuk Total untuk "{item.itemName}":</span>
                                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                  Akumulasi: {formatQuantity(item.totalPurchasedQty, item.unitOfMeasure)} = {formatCurrency(item.totalExpenseAmount, currency)}
                                </span>
                              </div>
                              <div className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                                {item.transactions.map((t, idx) => (
                                  <div
                                    key={t.id}
                                    className="p-2.5 flex items-center justify-between gap-4 text-[11px]"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-slate-400 w-4">{idx + 1}.</span>
                                      <span className="font-mono text-slate-600 dark:text-slate-400 font-medium">
                                        {formatDateShort(t.date)}
                                      </span>
                                      {t.invoiceRef && (
                                        <span className="text-slate-400 font-mono">
                                          (No. {t.invoiceRef})
                                        </span>
                                      )}
                                      {t.notes && (
                                        <span className="text-slate-500 italic max-w-xs truncate">
                                          "{t.notes}"
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 font-mono tabular-nums">
                                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                                        {formatQuantity(t.quantity, t.unitOfMeasure)} @ {formatCurrency(t.unitPrice, currency)}
                                      </span>
                                      <span className="font-bold text-rose-600 dark:text-rose-400">
                                        -{formatCurrency(t.totalPrice, currency)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              {/* Grand Total Footer */}
              <tfoot>
                <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-bold">
                  <td colSpan={3} className="py-3 px-3 text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs">
                    Grand Total Semua Barang yang Telah Dibeli
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-indigo-600 dark:text-indigo-400 text-sm">
                    {formatQuantity(totalSummaryStats.grandTotalQty)} total unit
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400 text-sm">
                    {formatCurrency(totalSummaryStats.grandTotalAmount, currency)}
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-right text-slate-500 text-xs font-normal">
                    {totalSummaryStats.distinctItemCount} jenis barang
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
