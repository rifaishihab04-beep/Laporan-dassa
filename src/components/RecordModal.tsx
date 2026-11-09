import React, { useState, useEffect } from 'react';
import { FinancialRecord, TransactionType, PaymentMethod, CurrencyConfig } from '../types/finance';
import { DEFAULT_CATEGORIES, DEFAULT_UNITS } from '../utils/storage';
import { formatCurrency, getTodayDateStr } from '../utils/formatters';
import { X, Calculator, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<FinancialRecord, 'id' | 'createdAt'>, existingId?: string) => void;
  currency: CurrencyConfig;
  initialRecord?: Partial<FinancialRecord> | null;
  knownItemNames?: string[];
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currency,
  initialRecord,
  knownItemNames = [],
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [unitOfMeasure, setUnitOfMeasure] = useState(DEFAULT_UNITS[0]);
  const [unitPrice, setUnitPrice] = useState<number | string>(0);
  const [date, setDate] = useState(getTodayDateStr());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer Bank');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [recordId, setRecordId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (initialRecord) {
      setType(initialRecord.type || 'expense');
      setItemName(initialRecord.itemName || '');
      setCategory(initialRecord.category || DEFAULT_CATEGORIES[0]);
      setQuantity(initialRecord.quantity !== undefined ? initialRecord.quantity : 1);
      setUnitOfMeasure(initialRecord.unitOfMeasure || DEFAULT_UNITS[0]);
      setUnitPrice(initialRecord.unitPrice !== undefined ? initialRecord.unitPrice : 0);
      setDate(initialRecord.date || getTodayDateStr());
      setPaymentMethod(initialRecord.paymentMethod || 'Transfer Bank');
      setInvoiceRef(initialRecord.invoiceRef || '');
      setNotes(initialRecord.notes || '');
      setIsEditing(Boolean(initialRecord.id));
      setRecordId(initialRecord.id);
    } else {
      setType('expense');
      setItemName('');
      setCategory(DEFAULT_CATEGORIES[0]);
      setQuantity(1);
      setUnitOfMeasure(DEFAULT_UNITS[0]);
      setUnitPrice(0);
      setDate(getTodayDateStr());
      setPaymentMethod('Transfer Bank');
      setInvoiceRef('');
      setNotes('');
      setIsEditing(false);
      setRecordId(undefined);
    }
  }, [initialRecord, isOpen]);

  if (!isOpen) return null;

  const numQty = typeof quantity === 'number' ? quantity : parseFloat(quantity) || 0;
  const numUnitPrice = typeof unitPrice === 'number' ? unitPrice : parseFloat(unitPrice) || 0;
  const calculatedTotal = Math.round(numQty * numUnitPrice * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    if (numQty <= 0) return;
    if (numUnitPrice < 0) return;

    const month = date.slice(0, 7); // YYYY-MM

    onSave(
      {
        type,
        itemName: itemName.trim(),
        category,
        quantity: numQty,
        unitOfMeasure,
        unitPrice: numUnitPrice,
        totalPrice: calculatedTotal,
        date,
        month,
        paymentMethod,
        invoiceRef: invoiceRef.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      recordId
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isEditing ? 'Ubah Data Transaksi' : 'Pencatatan Transaksi Manual'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pilih klasifikasi pemasukan atau pengeluaran, masukkan jumlah dan harga satuan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Klasifikasi Transaksi: Hanya Pemasukan & Pengeluaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Klasifikasi Transaksi
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                  type === 'income'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                <span>Pemasukan (Income)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                  type === 'expense'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
                <span>Pengeluaran (Expense)</span>
              </button>
            </div>
          </div>

          {/* Item Name with Datalist Autocomplete */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Barang / Transaksi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              list="known-items-list"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={
                type === 'income'
                  ? 'contoh: Penjualan Paket Komputer, Jasa Audit IT, Penjualan Produk Retail'
                  : 'contoh: Kertas HVS A4, Mouse Optik Nirkabel, Kardus Packing Corrugated'
              }
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800"
            />
            <datalist id="known-items-list">
              {knownItemNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          {/* Category & Unit of Measure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Satuan Ukuran
              </label>
              <select
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 font-mono"
              >
                {DEFAULT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u === '-' ? '- (Tanpa Satuan / -)' : u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity & Unit Price Calculation Strip */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Barang ({unitOfMeasure === '-' ? '(-)' : unitOfMeasure}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 text-sm font-mono tabular-nums focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Harga Satuan ({currency.symbol.trim()}) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">
                    {currency.symbol.trim()}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg pl-9 pr-3 py-1.5 text-sm font-mono tabular-nums focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Computed Total Price Preview */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Calculator className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  {numQty} {unitOfMeasure === '-' ? '(-)' : unitOfMeasure} × {formatCurrency(numUnitPrice, currency)} =
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 mr-1.5">
                  {type === 'income' ? 'Total Pemasukan:' : 'Total Pengeluaran:'}
                </span>
                <span
                  className={`text-base font-bold font-mono tabular-nums ${
                    type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {type === 'income' ? '+' : '-'}
                  {formatCurrency(calculatedTotal, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Date, Payment Method & Invoice Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Transaksi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Kartu Kredit">Kartu Kredit</option>
                <option value="Tunai">Tunai</option>
                <option value="Kartu Debit">Kartu Debit</option>
                <option value="Akun Perusahaan">Akun Perusahaan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. Faktur / Ref (Opsional)
              </label>
              <input
                type="text"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                placeholder="contoh: INV-2026-01"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan / Keterangan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="contoh: Penerimaan termin 1 proyek atau pembelian perlengkapan operasional"
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              {isEditing ? 'Simpan Perubahan' : 'Konfirmasi & Catat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
