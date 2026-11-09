import React, { useState, useMemo } from 'react';
import { FinancialRecord, CurrencyConfig, TransactionType } from '../types/finance';
import { formatCurrency, formatQuantity, formatDateShort, formatMonthYear } from '../utils/formatters';
import { 
  Search, 
  Trash2, 
  Edit3, 
  Copy, 
  ArrowUpDown, 
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Coffee,
  PenTool,
  HardHat,
  Boxes
} from 'lucide-react';

interface ManualRecordingViewProps {
  records: FinancialRecord[];
  currency: CurrencyConfig;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: string[];
  onOpenRecordModal: (initialData?: Partial<FinancialRecord>) => void;
  onDeleteRecord: (id: string) => void;
}

export const ManualRecordingView: React.FC<ManualRecordingViewProps> = ({
  records,
  currency,
  selectedMonth,
  onSelectMonth,
  availableMonths,
  onOpenRecordModal,
  onDeleteRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'itemName' | 'quantity' | 'unitPrice' | 'totalPrice'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Available categories list
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

  // Map of total for all same items that have been purchased
  const sameItemTotals = useMemo(() => {
    const map = new Map<string, { totalQty: number; totalAmount: number; count: number }>();
    records.forEach((r) => {
      if (r.type === 'expense') {
        const key = r.itemName.trim().toLowerCase();
        const existing = map.get(key) || { totalQty: 0, totalAmount: 0, count: 0 };
        existing.totalQty += r.quantity;
        existing.totalAmount += r.totalPrice;
        existing.count += 1;
        map.set(key, existing);
      }
    });
    return map;
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedMonth !== 'all' && r.month !== selectedMonth) return false;
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.itemName.toLowerCase().includes(q);
        const matchesCategory = r.category.toLowerCase().includes(q);
        const matchesRef = r.invoiceRef ? r.invoiceRef.toLowerCase().includes(q) : false;
        const matchesNotes = r.notes ? r.notes.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesCategory && !matchesRef && !matchesNotes) return false;
      }

      return true;
    });
  }, [records, selectedMonth, filterType, filterCategory, searchQuery]);

  // Sort records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'itemName':
          comparison = a.itemName.localeCompare(b.itemName);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'unitPrice':
          comparison = a.unitPrice - b.unitPrice;
          break;
        case 'totalPrice':
          comparison = a.totalPrice - b.totalPrice;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [filteredRecords, sortField, sortOrder]);

  // Stats for the current view
  const viewStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalIncomeUnits = 0;
    let totalExpenseUnits = 0;

    filteredRecords.forEach((r) => {
      if (r.type === 'income') {
        totalIncome += r.totalPrice;
        totalIncomeUnits += r.quantity;
      } else {
        totalExpense += r.totalPrice;
        totalExpenseUnits += r.quantity;
      }
    });

    return {
      count: filteredRecords.length,
      income: totalIncome,
      expense: totalExpense,
      net: totalIncome - totalExpense,
      incomeUnits: totalIncomeUnits,
      expenseUnits: totalExpenseUnits,
    };
  }, [filteredRecords]);

  const toggleSort = (field: 'date' | 'itemName' | 'quantity' | 'unitPrice' | 'totalPrice') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
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
      {/* View Header & Action Toolbar in Indonesian */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Pencatatan Keuangan Manual
            </h2>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {viewStats.count} Transaksi Tercatat
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kategori: Gaji Karyawan, Konsumsi, Alat Tulis Kantor, Kebutuhan Pekerja, serta kalkulator perkalian jumlah × harga satuan.
          </p>
        </div>

        {/* Primary Action Buttons: Income & Expense */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenRecordModal({ type: 'income' })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Catat Pemasukan</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenRecordModal({ type: 'expense' })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Snapshot KPI Cards for Selected Scope */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Pemasukan
          </span>
          <div className="mt-1.5 text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(viewStats.income, currency)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500 font-mono">
            +{formatQuantity(viewStats.incomeUnits)} unit masuk
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Pengeluaran
          </span>
          <div className="mt-1.5 text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {formatCurrency(viewStats.expense, currency)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500 font-mono">
            -{formatQuantity(viewStats.expenseUnits)} unit keluar
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Saldo / Sisa Uang
          </span>
          <div className={`mt-1.5 text-xl font-bold font-mono tabular-nums ${
            viewStats.net >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(viewStats.net, currency)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500 font-mono">
            Arus kas periode ini
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Cakupan Periode
          </span>
          <div className="mt-1.5 text-xl font-bold text-slate-900 dark:text-slate-100">
            {selectedMonth === 'all' ? 'Semua Bulan' : formatMonthYear(selectedMonth)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            {viewStats.count} transaksi tampil
          </div>
        </div>
      </div>

      {/* Quick Category Selector Strip */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs text-xs">
        <span className="text-slate-400 dark:text-slate-500 font-medium px-2">Filter Kategori:</span>
        
        <button
          type="button"
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterCategory === 'all'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Semua
        </button>

        <button
          type="button"
          onClick={() => setFilterCategory('Gaji Karyawan')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterCategory === 'Gaji Karyawan'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Gaji Karyawan</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterCategory('Konsumsi')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterCategory === 'Konsumsi'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Konsumsi</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterCategory('Alat Tulis Kantor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterCategory === 'Alat Tulis Kantor'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Alat Tulis Kantor</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterCategory('Kebutuhan Pekerja')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterCategory === 'Kebutuhan Pekerja'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
          }`}
        >
          <HardHat className="w-3.5 h-3.5" />
          <span>Kebutuhan Pekerja</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterCategory('Anggaran / Budget')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterCategory === 'Anggaran / Budget'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Anggaran / Budget</span>
        </button>
      </div>

      {/* Filter and Control Bar in Indonesian */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Month Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Bulan Laporan
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Semua Bulan</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthYear(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Type Segmented Filter: Only Income & Expense */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Klasifikasi Transaksi
            </label>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700 h-[34px]">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterType('income')}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterType === 'income'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setFilterType('expense')}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterType === 'expense'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Pengeluaran
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Dropdown Kategori
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Semua Kategori ({categories.length})</option>
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
              Cari Nama / No. Ref
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi, no. faktur, catatan..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {sortedRecords.length === 0 ? (
            <div className="py-16 text-center">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Tidak ada transaksi yang cocok dengan filter saat ini
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Silakan ubah filter periode atau klik tombol di bawah untuk mencatat transaksi pemasukan atau pengeluaran baru.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenRecordModal({ type: 'income' })}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                >
                  Catat Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => onOpenRecordModal({ type: 'expense' })}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 transition-colors"
                >
                  Catat Pengeluaran
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-800/30">
                  <th
                    onClick={() => toggleSort('date')}
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>Tanggal</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">Klasifikasi</th>
                  <th
                    onClick={() => toggleSort('itemName')}
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                  >
                    <div className="flex items-center gap-1">
                      <span>Barang / Transaksi & Kategori</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('quantity')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Jumlah</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('unitPrice')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Harga Satuan</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('totalPrice')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Nilai</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">Pembayaran / Ref</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {sortedRecords.map((r) => {
                  const isConfirming = confirmDeleteId === r.id;
                  const itemKey = r.itemName.trim().toLowerCase();
                  const sameTotal = r.type === 'expense' ? sameItemTotals.get(itemKey) : null;

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                        {formatDateShort(r.date)}
                      </td>

                      {/* Type: Pemasukan / Pengeluaran */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                            r.type === 'income'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {r.type === 'income' ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          <span>{r.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
                        </span>
                      </td>

                      {/* Item & Category */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{r.itemName}</span>
                          {/* Indicator of total of all the same items purchased */}
                          {sameTotal && sameTotal.count > 1 && (
                            <span 
                              title={`Total barang yang sama telah dibeli: ${formatQuantity(sameTotal.totalQty)} ${r.unitOfMeasure === '-' ? '(-)' : r.unitOfMeasure} senilai ${formatCurrency(sameTotal.totalAmount, currency)}`}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap flex items-center gap-1"
                            >
                              <Boxes className="w-2.5 h-2.5" />
                              <span>Total: {formatQuantity(sameTotal.totalQty)} {r.unitOfMeasure === '-' ? '(-)' : r.unitOfMeasure}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="flex items-center gap-1">
                            {getCategoryIcon(r.category)}
                            <span>{r.category}</span>
                          </span>
                          {r.notes && (
                            <>
                              <span>·</span>
                              <span className="italic text-slate-400 truncate max-w-xs">
                                "{r.notes}"
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatQuantity(r.quantity, r.unitOfMeasure)}
                      </td>

                      {/* Unit Price */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatCurrency(r.unitPrice, currency)}
                        <span className="text-[10px] text-slate-400 ml-1">/{r.unitOfMeasure === '-' ? '(-)' : r.unitOfMeasure}</span>
                      </td>

                      {/* Total Price */}
                      <td
                        className={`py-2.5 px-3 text-right font-mono tabular-nums font-bold whitespace-nowrap ${
                          r.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {r.type === 'income' ? '+' : '-'}
                        {formatCurrency(r.totalPrice, currency)}
                      </td>

                      {/* Payment Method / Ref */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="text-slate-700 dark:text-slate-300">
                          {r.paymentMethod}
                        </div>
                        {r.invoiceRef && (
                          <div className="text-[10px] font-mono text-slate-400">
                            {r.invoiceRef}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isConfirming ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteRecord(r.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-semibold hover:bg-rose-700"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {/* Duplicate */}
                            <button
                              type="button"
                              onClick={() =>
                                onOpenRecordModal({
                                  type: r.type,
                                  itemName: r.itemName,
                                  category: r.category,
                                  quantity: r.quantity,
                                  unitOfMeasure: r.unitOfMeasure,
                                  unitPrice: r.unitPrice,
                                  paymentMethod: r.paymentMethod,
                                })
                              }
                              title="Duplikat transaksi ini"
                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => onOpenRecordModal(r)}
                              title="Ubah data transaksi ini"
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(r.id)}
                              title="Hapus transaksi ini"
                              className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
