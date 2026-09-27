'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatCurrency } from '@/lib/utils';
import type { SalesPoint } from '@/lib/adminApi';

const reportTypes = [
  { key: 'sales', label: 'Sales Report' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'orders', label: 'Orders' },
  { key: 'customers', label: 'Customers' },
  { key: 'products', label: 'Popular Products' },
  { key: 'commissions', label: 'Platform Commissions' },
  { key: 'refunds', label: 'Refunds' },
  { key: 'downloads', label: 'Downloads' },
];

export default function ReportsPage() {
  const [salesData, setSalesData] = useState<SalesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('sales');
  const [dateRange, setDateRange] = useState('2026-01-01_to_2026-12-31');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await adminApi.getSalesAnalytics();
        setSalesData(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = salesData.reduce((sum, s) => sum + s.revenue, 0);
  const totalOrders = salesData.reduce((sum, s) => sum + s.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const maxRevenue = Math.max(...salesData.map((s) => s.revenue), 1);
  const maxOrders = Math.max(...salesData.map((s) => s.orders), 1);

  const exportReport = (format: 'csv' | 'excel' | 'pdf') => {
    const rows = salesData.map((s) => `${s.month},${s.revenue},${s.orders}`).join('\n');
    const csv = `Month,Revenue,Orders\n${rows}`;
    if (format === 'csv') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learning-pack-report.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      alert(`${format.toUpperCase()} export coming soon — CSV download available now.`);
    }
  };

  if (loading) {
    return <div className="text-lg">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Reports & Analytics</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Detailed platform performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
          <button
            type="button"
            onClick={() => exportReport('csv')}
            className="px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => exportReport('excel')}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => exportReport('pdf')}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {reportTypes.map((type) => (
          <button
            key={type.key}
            type="button"
            onClick={() => setActiveReport(type.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeReport === type.key
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Total Revenue</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{formatCurrency(String(totalRevenue))}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Total Orders</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{totalOrders.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Avg Order Value</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{formatCurrency(String(avgOrderValue))}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Growth Rate</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">+18.3%</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          {reportTypes.find((t) => t.key === activeReport)?.label || 'Sales Report'}
        </h2>
        <div className="h-[320px]">
          <svg width="100%" height="100%" viewBox="0 0 720 260" preserveAspectRatio="xMidYMin meet">
            <defs>
              <linearGradient id="revGradientFull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B1F3A" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#0B1F3A" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <g transform="translate(50, 30)">
              <line x1="0" y1="220" x2="660" y2="220" stroke="currentColor" strokeWidth="1" opacity={0.2} />
              <line x1="0" y1="110" x2="660" y2="110" stroke="currentColor" strokeWidth="1" opacity={0.1} />
              {salesData.map((point, i) => {
                const barWidth = 38;
                const gap = 6;
                const x = i * (barWidth + gap);
                const barHeight = (point.revenue / maxRevenue) * 150;
                return (
                  <g key={point.month} transform="translate(0, 40)">
                    <rect x={x} y={180 - barHeight} width={barWidth} height={barHeight} fill="url(#revGradientFull)" rx="3" />
                    <text
                      x={x + barWidth / 2}
                      y={190}
                      textAnchor="middle"
                      className="text-[8px] fill-zinc-500 dark:fill-zinc-400"
                    >
                      {point.month}
                    </text>
                  </g>
                );
              })}
              <g transform="translate(0, 40)">
                {salesData.map((point, i) => {
                  const barWidth = 38;
                  const gap = 6;
                  const x = i * (barWidth + gap);
                  const dotHeight = (point.orders / maxOrders) * 150;
                  return (
                    <circle
                      key={point.month}
                      cx={x + barWidth / 2}
                      cy={180 - dotHeight}
                      r="4"
                      fill="currentColor"
                      opacity={0.5}
                    />
                  );
                })}
              </g>
            </g>
          </svg>
        </div>
        <div className="mt-4 flex gap-6 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-zinc-900 dark:bg-zinc-100" />
            <span>Revenue (KSh)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span>Orders</span>
          </div>
        </div>
      </div>
    </div>
  );
}
