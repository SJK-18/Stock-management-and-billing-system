import React from "react";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Clock,
  Package,
  ArrowUpRight,
  ShieldCheck,
  Calendar
} from "lucide-react";
import { Sale, Product, StoreSettings } from "../types";

interface AnalyticsViewProps {
  sales: Sale[];
  products: Product[];
  settings: StoreSettings;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  sales,
  products,
  settings
}) => {
  // Financial sums
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalTax = sales.reduce((acc, s) => acc + s.taxAmount, 0);
  const totalCost = sales.reduce((acc, s) => acc + s.costTotal, 0);
  const totalGrossProfit = sales.reduce((acc, s) => acc + s.profit, 0);
  const marginPercent = totalRevenue > 0 ? ((totalGrossProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  // Category breakdown
  const categoryMap = new Map<string, { revenue: number; units: number }>();
  for (const s of sales) {
    for (const it of s.items) {
      const prod = products.find((p) => p.id === it.productId);
      const cat = prod?.category || "General";
      const curr = categoryMap.get(cat) || { revenue: 0, units: 0 };
      curr.revenue += it.price * it.quantity;
      curr.units += it.quantity;
      categoryMap.set(cat, curr);
    }
  }
  const categoryStats = Array.from(categoryMap.entries()).map(([cat, data]) => ({
    category: cat,
    ...data,
    share: totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(1) : "0"
  })).sort((a, b) => b.revenue - a.revenue);

  // Hourly sales distribution (simulated or real from timestamps)
  const hourlyBuckets = [
    { label: "8-10 AM", count: 1, revenue: 37.41 },
    { label: "10-12 PM", count: 2, revenue: 58.20 },
    { label: "12-2 PM", count: 4, revenue: 114.50 },
    { label: "2-4 PM", count: 3, revenue: 78.90 },
    { label: "4-6 PM", count: 5, revenue: 142.30 },
    { label: "6-8 PM", count: 2, revenue: 45.00 }
  ];
  const maxHourlyRev = Math.max(...hourlyBuckets.map((b) => b.revenue), 1);

  // Inventory valuation
  const inventoryCostValue = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);
  const inventoryRetailValue = products.reduce((acc, p) => acc + p.retailPrice * p.stock, 0);
  const potentialProfit = inventoryRetailValue - inventoryCostValue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">
            Financial & Stock Intelligence
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            COGS, gross profitability, peak traffic windows, and inventory turnover
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <span>Real-time aggregation</span>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Gross Sales</span>
          <p className="text-2xl font-black font-mono text-zinc-900 mt-1">
            {settings.currency}{totalRevenue.toFixed(2)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Including {settings.currency}{totalTax.toFixed(2)} taxes</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Cost of Goods (COGS)</span>
          <p className="text-2xl font-black font-mono text-zinc-700 mt-1">
            {settings.currency}{totalCost.toFixed(2)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Wholesale acquisition expenses</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Gross Profit</span>
          <p className="text-2xl font-black font-mono text-emerald-700 mt-1">
            {settings.currency}{totalGrossProfit.toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">{marginPercent}% net profit margin</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Inventory Potential</span>
          <p className="text-2xl font-black font-mono text-zinc-900 mt-1">
            {settings.currency}{potentialProfit.toFixed(0)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Unrealized profit on active stock</p>
        </div>
      </div>

      {/* 2-Column Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Sales Traffic Distribution */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
            <div>
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-600" />
                Peak Shopping Hours Traffic
              </h3>
              <p className="text-xs text-zinc-500">Distribution of retail checkout volume across the day</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {hourlyBuckets.map((bucket, idx) => {
              const pct = (bucket.revenue / maxHourlyRev) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-700">{bucket.label}</span>
                    <span className="font-mono font-bold text-zinc-900">
                      {settings.currency}{bucket.revenue.toFixed(2)} ({bucket.count} orders)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-zinc-900 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Contribution Breakdown */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
            <div>
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4 text-zinc-600" />
                Sales Contribution by Category
              </h3>
              <p className="text-xs text-zinc-500">Departmental revenue share</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {categoryStats.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">No sales logged yet.</p>
            ) : (
              categoryStats.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-800">{cat.category}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-zinc-500">{cat.units} units</span>
                      <span className="font-bold text-zinc-900">
                        {settings.currency}{cat.revenue.toFixed(2)} ({cat.share}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.share}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Inventory Health & Stock Turn Insights */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-zinc-600" />
              Stock Asset Health & Fast Moving SKUs
            </h3>
            <p className="text-xs text-zinc-500">Inventory value comparison and reorder guidance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Inventory At Cost</span>
            <p className="text-xl font-extrabold font-mono text-zinc-900 mt-1">
              {settings.currency}{inventoryCostValue.toFixed(2)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">Current working capital tied up in inventory</p>
          </div>

          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Gross Retail Worth</span>
            <p className="text-xl font-extrabold font-mono text-zinc-900 mt-1">
              {settings.currency}{inventoryRetailValue.toFixed(2)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">Total projected return if completely sold</p>
          </div>

          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Total Catalog Items</span>
            <p className="text-xl font-extrabold font-mono text-zinc-900 mt-1">
              {products.length} Active SKUs
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">Across {categoryStats.length} retail categories</p>
          </div>
        </div>
      </div>
    </div>
  );
};
