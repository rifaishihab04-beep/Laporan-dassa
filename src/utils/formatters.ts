import { CurrencyConfig } from '../types/finance';

export const DEFAULT_CURRENCIES: CurrencyConfig[] = [
  { code: 'IDR', symbol: 'Rp ', position: 'prefix', decimalPlaces: 0 },
  { code: 'USD', symbol: '$', position: 'prefix', decimalPlaces: 2 },
  { code: 'EUR', symbol: '€', position: 'prefix', decimalPlaces: 2 },
  { code: 'GBP', symbol: '£', position: 'prefix', decimalPlaces: 2 },
  { code: 'JPY', symbol: '¥', position: 'prefix', decimalPlaces: 0 },
  { code: 'SGD', symbol: 'S$', position: 'prefix', decimalPlaces: 2 },
  { code: 'MYR', symbol: 'RM ', position: 'prefix', decimalPlaces: 2 },
];

export function formatCurrency(
  amount: number,
  currency: CurrencyConfig = DEFAULT_CURRENCIES[0]
): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  
  // Use Indonesian locale formatting for IDR (points for thousands)
  const locale = currency.code === 'IDR' ? 'id-ID' : 'en-US';
  const formattedNumber = absVal.toLocaleString(locale, {
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  });

  const withSymbol =
    currency.position === 'prefix'
      ? `${currency.symbol}${formattedNumber}`
      : `${formattedNumber} ${currency.symbol}`;

  return isNegative ? `-${withSymbol}` : withSymbol;
}

export function formatQuantity(qty: number, unitOfMeasure?: string): string {
  const formatted = qty.toLocaleString('id-ID', {
    minimumFractionDigits: qty % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (!unitOfMeasure || unitOfMeasure === '-' || unitOfMeasure === '(-)') {
    return `${formatted} (-)`;
  }
  return `${formatted} ${unitOfMeasure}`;
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatMonthYear(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [yearStr, monthPart] = monthStr.split('-');
  const monthIdx = parseInt(monthPart, 10) - 1;
  const monthName = INDONESIAN_MONTHS[monthIdx] || monthPart;
  return `${monthName} ${yearStr}`;
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const [year, monthPart, dayPart] = dateStr.split('-');
  const monthIdx = parseInt(monthPart, 10) - 1;
  const monthName = INDONESIAN_MONTHS[monthIdx]?.slice(0, 3) || monthPart;
  return `${parseInt(dayPart, 10)} ${monthName} ${year}`;
}

export function getCurrentMonthStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

