import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Scan,
  Printer,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Download,
  History,
  Tag,
  ArrowUpDown
} from "lucide-react";
import { Product, StoreSettings, StockLog } from "../types";

interface InventoryViewProps {
  products: Product[];
  settings: StoreSettings;
  stockLogs: StockLog[];
  onOpenProductModal: (product?: Product) => void;
  onOpenQuickStock: (product: Product) => void;
  onOpenBarcodeLabel: (product: Product) => void;
  onOpenScanner: () => void;
  onDeleteProduct: (productId: string) => void;
  focusedProductId?: string | null;
  onOpenCategoryManager?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  settings,
  stockLogs,
  onOpenProductModal,
  onOpenQuickStock,
  onOpenBarcodeLabel,
  onOpenScanner,
  onDeleteProduct,
  focusedProductId,
  onOpenCategoryManager
}) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "out">("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLogs, setShowLogs] = useState(false);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q);

    let matchesStatus = true;
    if (filterStatus === "out") {
      matchesStatus = p.stock <= 0;
    } else if (filterStatus === "low") {
      matchesStatus = p.stock > 0 && p.stock <= p.minAlertThreshold;
    }

    return matchesCat && matchesSearch && matchesStatus;
  });

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minAlertThreshold).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  const handleExportCSV = () => {
    const headers = "Name,SKU,Barcode,Category,Cost,Retail,Stock,MinThreshold,Unit,Supplier\n";
    const rows = products
      .map(
        (p) =>
          `"${p.name.replace(/"/g, '""')}","${p.sku}","${p.barcode}","${p.category}",${p.costPrice},${p.retailPrice},${p.stock},${p.minAlertThreshold},"${p.unit}","${p.supplier}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">
            Inventory & Stock Control
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time stock counts, price management, barcode stickers & threshold alerts
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="px-3 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-4 h-4" />
            <span>Audit History ({stockLogs.length})</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            id="inv-scan-lookup-btn"
            onClick={onOpenScanner}
            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            <span>Scan to Lookup</span>
          </button>
          <button
            id="add-new-product-btn"
            onClick={() => onOpenProductModal()}
            className="px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Audit Logs Drawer / Modal if active */}
      {showLogs && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-600" />
              Recent Stock Adjustment & Audit Log
            </h3>
            <button
              onClick={() => setShowLogs(false)}
              className="text-xs text-zinc-500 hover:text-zinc-800 font-semibold"
            >
              Hide Logs
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-zinc-100 text-xs">
            {stockLogs.length === 0 ? (
              <p className="text-zinc-400 py-4 text-center">No adjustment records yet.</p>
            ) : (
              stockLogs.slice(0, 10).map((log) => {
                const prod = products.find((p) => p.id === log.productId);
                return (
                  <div key={log.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-zinc-900">{prod ? prod.name : "Product"}</span>
                      <p className="text-[11px] text-zinc-500">
                        Reason: {log.reason} • By: {log.user}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold ${
                          log.delta > 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {log.delta > 0 ? `+${log.delta}` : log.delta} units
                      </span>
                      <p className="text-[10px] text-zinc-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === "all"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              All Items ({products.length})
            </button>
            <button
              onClick={() => setFilterStatus("low")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === "low"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              onClick={() => setFilterStatus("out")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === "out"
                  ? "bg-red-600 text-white"
                  : "bg-red-50 text-red-800 hover:bg-red-100"
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by title, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-zinc-100">
          <span className="text-[11px] font-semibold text-zinc-400 shrink-0">Category:</span>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === c
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {c}
            </button>
          ))}
          {onOpenCategoryManager && (
            <button
              id="inv-manage-categories-btn"
              onClick={onOpenCategoryManager}
              className="ml-auto text-[11px] font-bold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              title="Add, rename, or delete store categories"
            >
              <Tag className="w-3 h-3 text-zinc-500" />
              <span>Manage Categories</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Product / SKU</th>
                <th className="py-3.5 px-3">Barcode</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3 text-right">Cost</th>
                <th className="py-3.5 px-3 text-right text-amber-900">Asking Rate</th>
                <th className="py-3.5 px-3 text-right text-emerald-900">Selling Rate</th>
                <th className="py-3.5 px-3 text-right">Bargain / Margin</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {filteredProducts.map((p) => {
                const isFocused = focusedProductId === p.id;
                const isOut = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock <= p.minAlertThreshold;
                const ask = p.askingRate !== undefined ? p.askingRate : p.retailPrice;
                const sell = p.sellingRate !== undefined ? p.sellingRate : p.retailPrice;
                const bargainRoom = Math.max(0, ask - sell);
                const bargainPct = ask > 0 ? ((bargainRoom / ask) * 100).toFixed(0) : "0";
                const profitAtSell = sell - p.costPrice;
                const sellMargin = sell > 0 ? ((profitAtSell / sell) * 100).toFixed(0) : "0";

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-zinc-50/80 transition-colors ${
                      isFocused ? "bg-emerald-50/70 border-l-4 border-emerald-500" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-zinc-900 text-sm leading-snug">{p.name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">SKU: {p.sku}</p>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-zinc-600">
                      <button
                        onClick={() => onOpenBarcodeLabel(p)}
                        title="Click to print price tag"
                        className="hover:underline flex items-center gap-1 text-zinc-800"
                      >
                        <Tag className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{p.barcode}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono text-zinc-500">
                      {settings.currency}{p.costPrice.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-800">
                      {settings.currency}{ask.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <p className="font-mono font-extrabold text-emerald-800 text-sm">
                        {settings.currency}{sell.toFixed(2)}
                      </p>
                      {p.minSellingRate ? (
                        <p className="text-[9.5px] font-mono text-zinc-400">
                          Floor: {settings.currency}{p.minSellingRate.toFixed(2)}
                        </p>
                      ) : null}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      {bargainRoom > 0 ? (
                        <span className="inline-block font-mono text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          -{settings.currency}{bargainRoom.toFixed(2)} ({bargainPct}%)
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-mono">Fixed</span>
                      )}
                      <p className="text-[9.5px] font-mono text-emerald-700 mt-0.5">
                        +{settings.currency}{profitAtSell.toFixed(2)} ({sellMargin}%)
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono ${
                            isOut
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : isLow
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                        <span className="text-[9px] text-zinc-400 mt-0.5">Alert at ≤{p.minAlertThreshold}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenQuickStock(p)}
                          title="Quick Stock Adjustment"
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          +/- Stock
                        </button>
                        <button
                          onClick={() => onOpenBarcodeLabel(p)}
                          title="Print Barcode Tag"
                          className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenProductModal(p)}
                          title="Edit Details"
                          className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${p.name}?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          title="Delete Product"
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-zinc-400">
            <Package className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
            <p className="text-sm font-semibold text-zinc-700">No inventory products found</p>
            <p className="text-xs text-zinc-400 mt-0.5">Try clearing filters or click 'Add Product' above</p>
          </div>
        )}
      </div>
    </div>
  );
};
