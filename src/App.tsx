import React, { useState, useEffect, useMemo } from 'react';
import { FinancialRecord, ActiveTab, CurrencyConfig, CategoryBudget } from './types/finance';
import { 
  loadStoredRecords, 
  saveStoredRecords, 
  loadStoredCurrency, 
  saveStoredCurrency,
  loadStoredBudgets,
  saveStoredBudgets
} from './utils/storage';
import { getCurrentMonthStr } from './utils/formatters';
import { Navbar } from './components/Navbar';
import { MonthlyReportView } from './components/MonthlyReportView';
import { ManualRecordingView } from './components/ManualRecordingView';
import { ItemAnalyticsView } from './components/ItemAnalyticsView';
import { RecordModal } from './components/RecordModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [records, setRecords] = useState<FinancialRecord[]>(() => loadStoredRecords());
  const [currency, setCurrency] = useState<CurrencyConfig>(() => loadStoredCurrency());
  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => loadStoredBudgets());
  const [activeTab, setActiveTab] = useState<ActiveTab>('monthly_report');
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('finledger_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Calculate available months from records
  const availableMonths = useMemo(() => {
    const currentMonth = getCurrentMonthStr();
    const set = new Set<string>();
    set.add(currentMonth);
    records.forEach((r) => {
      if (r.month) set.add(r.month);
    });
    return Array.from(set).sort().reverse();
  }, [records]);

  // Selected Month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const current = getCurrentMonthStr();
    return current;
  });

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<Partial<FinancialRecord> | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('finledger_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('finledger_theme', 'light');
    }
  }, [isDarkMode]);

  // Persist records to storage on change
  useEffect(() => {
    saveStoredRecords(records);
  }, [records]);

  // Persist currency to storage on change
  useEffect(() => {
    saveStoredCurrency(currency);
  }, [currency]);

  // Persist category budgets to storage on change
  useEffect(() => {
    saveStoredBudgets(budgets);
  }, [budgets]);

  // Known item names for autocomplete datalist
  const knownItemNames = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.itemName) set.add(r.itemName);
    });
    return Array.from(set).sort();
  }, [records]);

  // Add or update record handler
  const handleSaveRecord = (
    recordData: Omit<FinancialRecord, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === existingId
            ? { ...r, ...recordData }
            : r
        )
      );
    } else {
      const newRecord: FinancialRecord = {
        ...recordData,
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: Date.now(),
      };
      setRecords((prev) => [newRecord, ...prev]);
      // If recorded for a different month, ensure selectedMonth can view it if needed
      if (recordData.month) {
        setSelectedMonth(recordData.month);
      }
    }
  };

  // Delete record handler
  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleOpenRecordModal = (initial?: Partial<FinancialRecord>) => {
    setModalInitialData(initial || null);
    setIsRecordModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors antialiased">
      {/* 3-Zone Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenRecordModal={() => handleOpenRecordModal()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currency={currency}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'monthly_report' && (
          <MonthlyReportView
            records={records}
            currency={currency}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            availableMonths={availableMonths}
            budgets={budgets}
          />
        )}

        {activeTab === 'recording' && (
          <ManualRecordingView
            records={records}
            currency={currency}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            availableMonths={availableMonths}
            onOpenRecordModal={handleOpenRecordModal}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {activeTab === 'items_analytics' && (
          <ItemAnalyticsView
            records={records}
            currency={currency}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            availableMonths={availableMonths}
            onOpenRecordModal={handleOpenRecordModal}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-xs text-slate-500 dark:text-slate-400 print:hidden transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Laporan Keuangan</span>
            <span>·</span>
            <span>Rekapitulasi Bulanan & Analisis Pembelian Barang</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Penyimpanan lokal luring (offline)</span>
            <span>·</span>
            <span>Pencatatan Jumlah & Harga Satuan</span>
          </div>
        </div>
      </footer>

      {/* Manual Recording Dialog Modal */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleSaveRecord}
        currency={currency}
        initialRecord={modalInitialData}
        knownItemNames={knownItemNames}
      />

      {/* Settings / Currency / Data Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currency={currency}
        onCurrencyChange={setCurrency}
        records={records}
        onRestoreRecords={setRecords}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />
    </div>
  );
}
