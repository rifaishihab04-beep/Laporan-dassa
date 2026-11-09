import React, { useState, useMemo } from 'react';
import { FinancialRecord, CurrencyConfig } from '../types/finance';
import { formatCurrency, formatQuantity } from '../utils/formatters';

interface PurchaseReductionChartProps {
  records: FinancialRecord[];
  currency: CurrencyConfig;
  selectedMonth: string; // "YYYY-MM" or "all"
}

export const PurchaseReductionChart: React.FC<PurchaseReductionChartProps> = ({
  records,
  currency,
  selectedMonth,
}) => {
  const [metricType, setMetricType] = useState<'amount' | 'quantity'>('amount');
  const [chartStyle, setChartStyle] = useState<'bar' | 'cumulative'>('bar');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group records either by day (if single month selected) or by month (if "all" selected)
  const chartData = useMemo(() => {
    if (selectedMonth !== 'all') {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const daysInMonth = new Date(year, month, 0).getDate();

      const daysMap: { [day: number]: { income: number; expense: number; label: string; dateStr: string } } = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const dStr = String(d).padStart(2, '0');
        daysMap[d] = {
          income: 0,
          expense: 0,
          label: `${d}/${month}`,
          dateStr: `${selectedMonth}-${dStr}`,
        };
      }

      records
        .filter((r) => r.month === selectedMonth)
        .forEach((r) => {
          const day = parseInt(r.date.split('-')[2], 10);
          if (daysMap[day]) {
            const val = metricType === 'amount' ? r.totalPrice : r.quantity;
            if (r.type === 'income') {
              daysMap[day].income += val;
            } else {
              daysMap[day].expense += val;
            }
          }
        });

      let cumulative = 0;
      return Object.keys(daysMap)
        .map(Number)
        .sort((a, b) => a - b)
        .map((day) => {
          const item = daysMap[day];
          const net = item.income - item.expense;
          cumulative += net;
          return {
            ...item,
            key: `day-${day}`,
            dayNum: day,
            net,
            cumulative,
          };
        });
    } else {
      const monthsMap: { [month: string]: { income: number; expense: number; label: string; dateStr: string } } = {};
      const allMonths = Array.from(new Set(records.map((r) => r.month))).sort();

      const INDONESIAN_SHORT_MONTHS = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
      ];

      allMonths.forEach((m) => {
        const [y, mm] = m.split('-');
        const monthIdx = parseInt(mm, 10) - 1;
        const monthName = INDONESIAN_SHORT_MONTHS[monthIdx] || mm;
        monthsMap[m] = {
          income: 0,
          expense: 0,
          label: `${monthName} '${y.slice(2)}`,
          dateStr: m,
        };
      });

      records.forEach((r) => {
        if (monthsMap[r.month]) {
          const val = metricType === 'amount' ? r.totalPrice : r.quantity;
          if (r.type === 'income') {
            monthsMap[r.month].income += val;
          } else {
            monthsMap[r.month].expense += val;
          }
        }
      });

      let cumulative = 0;
      return Object.keys(monthsMap)
        .sort()
        .map((m) => {
          const item = monthsMap[m];
          const net = item.income - item.expense;
          cumulative += net;
          return {
            ...item,
            key: m,
            dayNum: 0,
            net,
            cumulative,
          };
        });
    }
  }, [records, selectedMonth, metricType]);

  // Aggregates
  const totals = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    chartData.forEach((d) => {
      totalIncome += d.income;
      totalExpense += d.expense;
    });
    return {
      income: totalIncome,
      expense: totalExpense,
      net: totalIncome - totalExpense,
    };
  }, [chartData]);

  // SVG Chart dimensions
  const svgWidth = 840;
  const svgHeight = 240;
  const padding = { top: 20, right: 24, bottom: 32, left: 68 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // Max scale calculation
  const maxVal = useMemo(() => {
    if (chartStyle === 'cumulative') {
      const maxC = Math.max(...chartData.map((d) => Math.abs(d.cumulative)), 10);
      return Math.ceil(maxC * 1.15);
    } else {
      const maxP = Math.max(...chartData.map((d) => Math.max(d.income, d.expense)), 10);
      return Math.ceil(maxP * 1.2);
    }
  }, [chartData, chartStyle]);

  const getY = (val: number) => {
    if (maxVal === 0) return innerHeight;
    const clamped = Math.min(Math.max(val, 0), maxVal);
    return innerHeight - (clamped / maxVal) * innerHeight;
  };

  const formatVal = (val: number) => {
    return metricType === 'amount' ? formatCurrency(val, currency) : formatQuantity(val);
  };

  const formatAxisNumber = (val: number) => {
    if (metricType === 'amount') {
      if (val >= 1_000_000) {
        return `${(val / 1_000_000).toFixed(1)}jt`;
      }
      if (val >= 1_000) {
        return `${(val / 1_000).toFixed(0)}rb`;
      }
      return `${val}`;
    }
    return `${val}`;
  };

  const hoveredItem = hoveredIndex !== null && chartData[hoveredIndex] ? chartData[hoveredIndex] : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
      {/* Header with Title and Segmented Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Grafik Perbandingan Pemasukan & Pengeluaran
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {selectedMonth === 'all' ? 'Semua Bulan' : selectedMonth}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Analisis arus kas masuk (pemasukan) terhadap arus kas keluar (pengeluaran barang & operasional)
          </p>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Style toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setChartStyle('bar')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                chartStyle === 'bar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Berdampingan
            </button>
            <button
              type="button"
              onClick={() => setChartStyle('cumulative')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                chartStyle === 'cumulative'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tren Saldo Bersih
            </button>
          </div>

          {/* Metric toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMetricType('amount')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                metricType === 'amount'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Nilai ({currency.symbol.trim()})
            </button>
            <button
              type="button"
              onClick={() => setMetricType('quantity')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                metricType === 'quantity'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Jumlah (Unit)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Ticker Bar */}
      <div className="grid grid-cols-3 gap-3 py-3 border-b border-slate-100 dark:border-slate-800 text-xs">
        <div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            <span>Total Pemasukan</span>
          </div>
          <div className="text-sm font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
            {formatVal(totals.income)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
            <span>Total Pengeluaran</span>
          </div>
          <div className="text-sm font-semibold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">
            {formatVal(totals.expense)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 inline-block" />
            <span>Saldo / Laba Bersih</span>
          </div>
          <div className="text-sm font-semibold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-0.5">
            {formatVal(totals.net)}
          </div>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative pt-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[640px] select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = innerHeight - pct * innerHeight;
              const val = Math.round(pct * maxVal);
              return (
                <g key={i}>
                  <line
                    x1={0}
                    y1={y}
                    x2={innerWidth}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="1"
                  />
                  <text
                    x={-8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                  >
                    {formatAxisNumber(val)}
                  </text>
                </g>
              );
            })}

            {/* Bottom axis line */}
            <line
              x1={0}
              y1={innerHeight}
              x2={innerWidth}
              y2={innerHeight}
              stroke="currentColor"
              className="text-slate-300 dark:text-slate-700"
              strokeWidth="1.5"
            />

            {/* Render Bars or Trajectory */}
            {chartStyle === 'bar' ? (
              // Side-by-side Bar Chart
              chartData.map((d, idx) => {
                const colWidth = innerWidth / chartData.length;
                const barWidth = Math.max(colWidth * 0.35, 3);
                const xCenter = idx * colWidth + colWidth / 2;

                const iHeight = (d.income / maxVal) * innerHeight;
                const eHeight = (d.expense / maxVal) * innerHeight;

                const isHovered = hoveredIndex === idx;

                const showLabel =
                  chartData.length <= 15
                    ? true
                    : idx % Math.ceil(chartData.length / 10) === 0 || idx === chartData.length - 1;

                return (
                  <g
                    key={d.key}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    className="cursor-pointer transition-opacity"
                  >
                    {/* Hover column backdrop */}
                    <rect
                      x={idx * colWidth}
                      y={0}
                      width={colWidth}
                      height={innerHeight}
                      fill="transparent"
                      className={isHovered ? 'fill-slate-100/60 dark:fill-slate-800/40' : ''}
                    />

                    {/* Income Bar (Emerald) */}
                    {d.income > 0 && (
                      <rect
                        x={xCenter - barWidth - 1}
                        y={innerHeight - iHeight}
                        width={barWidth}
                        height={iHeight}
                        rx={2}
                        className={`transition-all duration-150 ${
                          isHovered
                            ? 'fill-emerald-400 dark:fill-emerald-400'
                            : 'fill-emerald-500 dark:fill-emerald-500'
                        }`}
                      />
                    )}

                    {/* Expense Bar (Rose) */}
                    {d.expense > 0 && (
                      <rect
                        x={xCenter + 1}
                        y={innerHeight - eHeight}
                        width={barWidth}
                        height={eHeight}
                        rx={2}
                        className={`transition-all duration-150 ${
                          isHovered
                            ? 'fill-rose-400 dark:fill-rose-400'
                            : 'fill-rose-500 dark:fill-rose-500'
                        }`}
                      />
                    )}

                    {/* X-axis tick & label */}
                    {showLabel && (
                      <text
                        x={xCenter}
                        y={innerHeight + 16}
                        textAnchor="middle"
                        className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                      >
                        {d.label}
                      </text>
                    )}
                  </g>
                );
              })
            ) : (
              // Cumulative Area / Trajectory
              (() => {
                const step = innerWidth / (chartData.length - 1 || 1);
                const points = chartData.map((d, idx) => {
                  const x = idx * step;
                  const y = getY(d.cumulative);
                  return `${x},${y}`;
                });

                const areaPath = `M 0,${innerHeight} L ${points.join(' L ')} L ${
                  (chartData.length - 1) * step
                },${innerHeight} Z`;
                const linePath = `M ${points.join(' L ')}`;

                return (
                  <g>
                    <path
                      d={areaPath}
                      className="fill-indigo-500/10 dark:fill-indigo-500/20"
                    />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                    {chartData.map((d, idx) => {
                      const x = idx * step;
                      const y = getY(d.cumulative);
                      const isHovered = hoveredIndex === idx;
                      const showLabel =
                        chartData.length <= 15
                          ? true
                          : idx % Math.ceil(chartData.length / 10) === 0 || idx === chartData.length - 1;

                      return (
                        <g
                          key={d.key}
                          onMouseEnter={() => setHoveredIndex(idx)}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 5 : 3}
                            className={`${
                              isHovered
                                ? 'fill-indigo-600 stroke-white stroke-2'
                                : 'fill-white stroke-indigo-600 stroke-2 dark:fill-slate-900'
                            } transition-all`}
                          />
                          {showLabel && (
                            <text
                              x={x}
                              y={innerHeight + 16}
                              textAnchor="middle"
                              className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                            >
                              {d.label}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })()
            )}
          </g>
        </svg>

        {/* Floating Tooltip details */}
        {hoveredItem && (
          <div className="absolute top-4 right-4 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xs text-white p-2.5 rounded-lg text-xs shadow-lg pointer-events-none border border-slate-700 font-mono min-w-[190px]">
            <div className="font-semibold text-slate-200 border-b border-slate-700/80 pb-1 mb-1.5 flex items-center justify-between">
              <span>{hoveredItem.dateStr || hoveredItem.label}</span>
              <span className="text-[10px] text-slate-400 uppercase font-sans">Rincian</span>
            </div>
            <div className="flex justify-between items-center text-emerald-400 py-0.5">
              <span className="flex items-center gap-1 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Pemasukan:
              </span>
              <span className="tabular-nums font-semibold">{formatVal(hoveredItem.income)}</span>
            </div>
            <div className="flex justify-between items-center text-rose-400 py-0.5">
              <span className="flex items-center gap-1 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Pengeluaran:
              </span>
              <span className="tabular-nums font-semibold">{formatVal(hoveredItem.expense)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-200 border-t border-slate-700/80 pt-1 mt-1 font-semibold">
              <span className="font-sans">Saldo Bersih:</span>
              <span className="tabular-nums">{formatVal(hoveredItem.net)}</span>
            </div>
            {chartStyle === 'cumulative' && (
              <div className="flex justify-between items-center text-indigo-300 pt-0.5 text-[11px]">
                <span className="font-sans">Akumulasi:</span>
                <span className="tabular-nums">{formatVal(hoveredItem.cumulative)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between pt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-emerald-500" />
            <span>Pemasukan (Income)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-rose-500" />
            <span>Pengeluaran (Expense)</span>
          </span>
          {chartStyle === 'cumulative' && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-0.5 bg-indigo-500" />
              <span>Tren Saldo Kas Akumulasi</span>
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          Arahkan kursor pada grafik untuk melihat rincian transaksi
        </div>
      </div>
    </div>
  );
};
