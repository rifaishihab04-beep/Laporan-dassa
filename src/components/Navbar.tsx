import React from 'react';
import { ActiveTab, CurrencyConfig } from '../types/finance';
import { Plus, Settings, Sun, Moon } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenRecordModal: () => void;
  onOpenSettings: () => void;
  currency: CurrencyConfig;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenRecordModal,
  onOpenSettings,
  currency,
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element, no adjacent badges or descriptors) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('monthly_report')}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              LK
            </div>
            <span>Laporan Keuangan</span>
          </button>
        </div>

        {/* Zone 2: Concise single-line navigation links in Indonesian */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onTabChange('monthly_report')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'monthly_report'
                ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            Laporan Bulanan
          </button>

          <button
            type="button"
            onClick={() => onTabChange('recording')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'recording'
                ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            Pencatatan Manual
          </button>

          <button
            type="button"
            onClick={() => onTabChange('items_analytics')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'items_analytics'
                ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            Menu Barang & Grafik
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Utility Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDarkMode ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Pengaturan & preferensi data"
          >
            <Settings className="w-4 h-4" />
          </button>

          <PWAInstallButton />

          <button
            type="button"
            onClick={onOpenRecordModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Barang</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          type="button"
          onClick={() => onTabChange('monthly_report')}
          className={`flex-1 py-1.5 text-center text-xs font-medium rounded-md ${
            activeTab === 'monthly_report'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-slate-100 dark:bg-slate-800'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Laporan Bulanan
        </button>
        <button
          type="button"
          onClick={() => onTabChange('recording')}
          className={`flex-1 py-1.5 text-center text-xs font-medium rounded-md ${
            activeTab === 'recording'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-slate-100 dark:bg-slate-800'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Pencatatan Manual
        </button>
        <button
          type="button"
          onClick={() => onTabChange('items_analytics')}
          className={`flex-1 py-1.5 text-center text-xs font-medium rounded-md ${
            activeTab === 'items_analytics'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-slate-100 dark:bg-slate-800'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Menu Barang & Grafik
        </button>
      </div>
    </header>
  );
};
