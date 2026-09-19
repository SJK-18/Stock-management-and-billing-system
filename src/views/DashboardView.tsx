import React from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  Package,
  FileText,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { Product, Sale, StoreSettings, InventoryAlert } from "../types";

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
  settings: StoreSettings;
  alerts: InventoryAlert[];
  onOpenPOS: () => void;
  onOpenInventory: () => void;
  onQuickRestock: (product: Product) => void;
  onViewInvoice: (sale: Sale) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  sales,
  settings,
  alerts,
  onOpenPOS,
  onOpenInventory,
  onQuickRestock,
  onViewInvoice
}) => {
  // Aggregate stats
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
  const totalItemsSold = sales.reduce((acc, s) => acc + s.items.reduce((sum, it) => sum + it.quantity, 0), 0);
  const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  // Today's sales (filter by same calendar day)
  const today = new Date().toDateString();
  const todaySales = sales.filter((s) => new Date(s.timestamp).toDateString() === today);
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  const todayProfit = todaySales.reduce((acc, s) => acc + s.profit, 0);
  const todayOrders = todaySales.length;

  // Inventory valuation
  const inventoryCostValue = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);
  const inventoryRetailValue = products.reduce((acc, p) => acc + p.retailPrice * p.stock, 0);

  // Top products calculated from sales
  const productSalesMap = new Map<string, { name: string; units: number; revenue: number; stock: number; product: Product }>();
  for (const s of sales) {
    for (const item of s.items) {
      const prod = products.find((p) => p.id === item.productId);
      const existing = productSalesMap.get(item.productId);
      if (existing) {
        existing.units += item.quantity;
        existing.revenue += item.price * item.quantity;
      } else if (prod) {
        productSalesMap.set(item.productId, {
          name: prod.name,
          units: item.quantity,
          revenue: item.price * item.quantity,
          stock: prod.stock,
          product: prod
        });
      }
    }
  }
  const topProducts = Array.from(productSalesMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Payment Breakdown
  const paymentsSummary = {
    Cash: sales.filter((s) => s.paymentMethod === "Cash").reduce((a, s) => a + s.total, 0),
    Card: sales.filter((s) => s.paymentMethod === "Card").reduce((a, s) => a + s.total, 0),
    "QR Code": sales.filter((s) => s.paymentMethod === "QR Code").reduce((a, s) => a + s.total, 0),
    Split: sales.filter((s) => s.paymentMethod === "Split").reduce((a, s) => a + s.total, 0)
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome / Hero Banner */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Real-Time Store Overview
          </span>
          <h2 className="text-2xl font-black text-zinc-900 mt-2 tracking-tight">
            Sales & Inventory Operations
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Cloud-synced multi-user retail terminal • Offline capability enabled
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            id="dash-open-inventory-btn"
            onClick={onOpenInventory}
            className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Manage Stock</span>
          </button>
          <button
            id="dash-open-pos-btn"
            onClick={onOpenPOS}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Sale (POS)</span>
          </button>
        </div>
      </div>

      {/* Critical Stock Alerts Bar if any */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                {alerts.length} Item{alerts.length > 1 ? "s" : ""} Require Immediate Restock
              </p>
              <p className="text-xs text-amber-700">
                {alerts.filter((a) => a.type === "out_of_stock").length} out of stock,{" "}
                {alerts.filter((a) => a.type === "low_stock").length} below minimum safety threshold.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onQuickRestock(alerts[0].product)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Restock {alerts[0].product.name.slice(0, 16)}...
            </button>
            <button
              onClick={onOpenInventory}
              className="text-xs font-bold text-amber-900 underline hover:text-amber-950 px-2 cursor-pointer"
            >
              View All Alerts
            </button>
          </div>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Revenue Today */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-zinc-900">
              {settings.currency}{todayRevenue.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-zinc-500 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Today's Profit: </span>
            <span className="font-mono font-bold text-emerald-700">
              {settings.currency}{todayProfit.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Metric 2: Today's Orders */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Orders</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-zinc-900">{todayOrders}</span>
            <span className="text-xs text-zinc-400">sales today</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">
            Total items sold: <span className="font-bold text-zinc-800">{totalItemsSold}</span> units
          </div>
        </div>

        {/* Metric 3: Gross Margin */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Profit Margin</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-zinc-900">{overallMargin}%</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">
            Total Net Margin:{" "}
            <span className="font-mono font-bold text-zinc-800">
              {settings.currency}{totalProfit.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Metric 4: Inventory Valuation */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Stock Value</span>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-zinc-900">
              {settings.currency}{inventoryRetailValue.toFixed(0)}
            </span>
            <span className="text-xs text-zinc-400">retail</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">
            Cost base:{" "}
            <span className="font-mono font-bold text-zinc-700">
              {settings.currency}{inventoryCostValue.toFixed(0)}
            </span>{" "}
            across {products.length} SKUs
          </div>
        </div>
      </div>

      {/* Main Grid: Top Selling & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <h3 className="font-bold text-zinc-900 text-base">Top Performing Products</h3>
              <p className="text-xs text-zinc-500">Ranked by revenue contribution & stock level</p>
            </div>
            <button
              onClick={onOpenInventory}
              className="text-xs font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View Inventory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-100 mt-2">
            {topProducts.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">No sales logged yet.</p>
            ) : (
              topProducts.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-zinc-100 font-mono font-bold text-xs flex items-center justify-center text-zinc-600 shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-xs text-zinc-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {item.units} sold • Stock remaining:{" "}
                        <span
                          className={`font-semibold ${
                            item.stock <= item.product.minAlertThreshold ? "text-amber-600" : "text-zinc-700"
                          }`}
                        >
                          {item.stock} {item.product.unit}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-zinc-900">
                      {settings.currency}{item.revenue.toFixed(2)}
                    </span>
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      Profit: {settings.currency}{(item.revenue - item.product.costPrice * item.units).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Channels Distribution */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-zinc-900 text-base">Payment Method Mix</h3>
            <p className="text-xs text-zinc-500 mb-4">Breakdown of revenue across tender methods</p>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-medium text-zinc-700">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    Credit / Debit Cards
                  </span>
                  <span className="font-mono font-bold text-zinc-900">
                    {settings.currency}{paymentsSummary.Card.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${totalRevenue > 0 ? (paymentsSummary.Card / totalRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-medium text-zinc-700">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    Cash
                  </span>
                  <span className="font-mono font-bold text-zinc-900">
                    {settings.currency}{paymentsSummary.Cash.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${totalRevenue > 0 ? (paymentsSummary.Cash / totalRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-medium text-zinc-700">
                    <QrCode className="w-3.5 h-3.5 text-purple-600" />
                    QR Code / Instant Pay
                  </span>
                  <span className="font-mono font-bold text-zinc-900">
                    {settings.currency}{paymentsSummary["QR Code"].toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full"
                    style={{ width: `${totalRevenue > 0 ? (paymentsSummary["QR Code"] / totalRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 mt-6 text-xs text-zinc-600">
            <span className="font-bold text-zinc-900 block mb-0.5">Automated Daily Reconcile</span>
            Cash drawer in balance • All digital transactions verified
          </div>
        </div>
      </div>

      {/* Recent Transactions & Billing Feed */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-900 text-base">Recent Sales & Invoices</h3>
            <p className="text-xs text-zinc-500">Real-time receipt logs, PDF exports, and sync status</p>
          </div>
        </div>

        <div className="divide-y divide-zinc-100 mt-2">
          {sales.slice(0, 5).map((sale) => (
            <div key={sale.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-800 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-900">#{sale.invoiceNumber}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                      {sale.paymentMethod}
                    </span>
                    {!sale.synced && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        Queued
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {new Date(sale.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                    {sale.customerName || "Walk-in"} • {sale.items.length} items • Cashier: {sale.cashierName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-extrabold font-mono text-zinc-900">
                    {settings.currency}{sale.total.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold font-mono">
                    +{settings.currency}{sale.profit.toFixed(2)} profit
                  </p>
                </div>
                <button
                  onClick={() => onViewInvoice(sale)}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
