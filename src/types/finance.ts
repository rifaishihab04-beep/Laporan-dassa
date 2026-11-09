export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 
  | 'Transfer Bank'
  | 'Kartu Kredit'
  | 'Tunai'
  | 'Kartu Debit'
  | 'Akun Perusahaan';

export interface FinancialRecord {
  id: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  type: TransactionType;
  itemName: string;
  category: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalPrice: number; // quantity * unitPrice
  paymentMethod: PaymentMethod;
  invoiceRef?: string;
  notes?: string;
  createdAt: number;
}

export interface ItemSummary {
  itemName: string;
  category: string;
  unitOfMeasure: string;
  totalPurchasedQty: number; // Qty pengeluaran/pembelian
  totalIncomeQty: number;    // Qty pemasukan/penjualan
  netQty: number;
  avgUnitPrice: number;
  minUnitPrice: number;
  maxUnitPrice: number;
  totalExpenseAmount: number;
  totalIncomeAmount: number;
  netAmount: number;
  transactionCount: number;
  lastDate: string;
}

export type ItemSortKey = 
  | 'purchasedQty_desc'
  | 'purchasedQty_asc'
  | 'incomeQty_desc'
  | 'incomeQty_asc'
  | 'netQty_desc'
  | 'netQty_asc'
  | 'unitPrice_desc'
  | 'unitPrice_asc'
  | 'totalAmount_desc'
  | 'totalAmount_asc'
  | 'name_asc'
  | 'name_desc'
  | 'lastDate_desc';

export interface CategorySummary {
  category: string;
  incomeTotal: number;
  expenseTotal: number;
  netTotal: number;
  itemCount: number;
  percentage: number;
}

export interface CategoryBudget {
  category: string;
  monthlyBudget: number;
  notes?: string;
}

export type ActiveTab = 'monthly_report' | 'recording' | 'items_analytics';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  position: 'prefix' | 'suffix';
  decimalPlaces: number;
}
