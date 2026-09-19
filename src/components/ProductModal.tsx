import React, { useState, useEffect } from "react";
import { X, Save, Barcode, Sparkles, Scan, DollarSign, Percent, AlertCircle, Tag, Edit3, AlertTriangle, TrendingUp, ShieldCheck, Scale } from "lucide-react";
import { Product } from "../types";
import { generateRandomBarcode } from "../utils/barcodeUtils";

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
  onOpenScanner?: () => void;
  scannedBarcode?: string | null;
  availableCategories?: string[];
  onOpenCategoryManager?: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
  onOpenScanner,
  scannedBarcode,
  availableCategories = [
    "Beverages",
    "Pantry",
    "Snacks",
    "Home & Kitchen",
    "Accessories",
    "Personal Care",
    "General"
  ],
  onOpenCategoryManager
}) => {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("General");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [askingRate, setAskingRate] = useState<number>(0);
  const [sellingRate, setSellingRate] = useState<number>(0);
  const [minSellingRate, setMinSellingRate] = useState<number>(0);
  const [retailPrice, setRetailPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [minAlertThreshold, setMinAlertThreshold] = useState<number>(5);
  const [unit, setUnit] = useState("pcs");
  const [supplier, setSupplier] = useState("");
  const [taxRate, setTaxRate] = useState<number>(8.5);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Combine available categories with current category if custom
  const allCategories = Array.from(
    new Set([...availableCategories, category].filter(Boolean))
  );

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setBarcode(product.barcode);
      setCategory(product.category);
      setIsCustomCategory(!availableCategories.includes(product.category));
      const ask = product.askingRate ?? product.retailPrice ?? 0;
      const sell = product.sellingRate ?? product.retailPrice ?? ask;
      const cost = product.costPrice ?? 0;
      const minSell = product.minSellingRate !== undefined ? product.minSellingRate : Math.max(cost, Math.round(sell * 0.85 * 100) / 100);
      setCostPrice(cost);
      setAskingRate(ask);
      setSellingRate(sell);
      setMinSellingRate(minSell);
      setRetailPrice(sell);
      setStock(product.stock);
      setMinAlertThreshold(product.minAlertThreshold);
      setUnit(product.unit);
      setSupplier(product.supplier || "");
      setTaxRate(product.taxRate || 8.5);
      setNotes(product.notes || "");
    } else {
      setName("");
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setBarcode(generateRandomBarcode());
      setCategory(availableCategories[0] || "Beverages");
      setIsCustomCategory(false);
      setCostPrice(5.0);
      setAskingRate(15.0);
      setSellingRate(12.0);
      setMinSellingRate(9.0);
      setRetailPrice(12.0);
      setStock(15);
      setMinAlertThreshold(5);
      setUnit("pcs");
      setSupplier("");
      setTaxRate(8.5);
      setNotes("");
    }
  }, [product, isOpen]);

  useEffect(() => {
    if (scannedBarcode) {
      setBarcode(scannedBarcode);
    }
  }, [scannedBarcode]);

  if (!isOpen) return null;

  // Pricing & Margin calculation
  const parsedCost = Number(costPrice) || 0;
  const parsedAsking = Number(askingRate) || 0;
  const parsedSelling = Number(sellingRate) || 0;
  const parsedMinSelling = Number(minSellingRate) || 0;

  const bargainRoom = Math.max(0, parsedAsking - parsedSelling);
  const bargainPct = parsedAsking > 0 ? ((bargainRoom / parsedAsking) * 100).toFixed(1) : "0.0";
  const sellingProfit = parsedSelling - parsedCost;
  const sellingMarginPercent = parsedSelling > 0 ? ((sellingProfit / parsedSelling) * 100).toFixed(1) : "0.0";
  const askingProfit = parsedAsking - parsedCost;
  const askingMarginPercent = parsedAsking > 0 ? ((askingProfit / parsedAsking) * 100).toFixed(1) : "0.0";

  const isBelowCost = parsedSelling < parsedCost;
  const isBelowFloor = parsedMinSelling > 0 && parsedSelling < parsedMinSelling;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !barcode.trim()) return;

    setIsSaving(true);
    const updated: Product = {
      id: product ? product.id : `prod-${Date.now()}`,
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: barcode.trim(),
      category: category.trim() || "General",
      costPrice: parsedCost,
      retailPrice: parsedSelling, // In sync with agreed selling rate
      askingRate: parsedAsking,
      sellingRate: parsedSelling,
      minSellingRate: parsedMinSelling,
      stock: Number(stock) || 0,
      minAlertThreshold: Number(minAlertThreshold) || 5,
      unit: unit.trim() || "pcs",
      supplier: supplier.trim(),
      taxRate: Number(taxRate) || 0,
      notes: notes.trim(),
      updatedAt: new Date().toISOString()
    };

    await onSave(updated);
    setIsSaving(false);
    onClose();
  };

  return (
    <div id="product-edit-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-50">
          <div>
            <h3 className="font-bold text-zinc-900 text-base">
              {product ? "Edit Product Catalog Item" : "Add New Inventory Product"}
            </h3>
            <p className="text-xs text-zinc-500">Log SKU, barcode, pricing, and stock alert rules</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Product Title / Name *
            </label>
            <input
              id="product-name-input"
              type="text"
              required
              placeholder="e.g. Organic Colombian Roast Coffee 500g"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-800"
            />
          </div>

          {/* Barcode & SKU Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-700">Barcode (EAN / UPC) *</label>
                <button
                  type="button"
                  onClick={() => setBarcode(generateRandomBarcode())}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Generate
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  id="product-barcode-input"
                  type="text"
                  required
                  placeholder="e.g. 890123456001"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full pl-3.5 pr-9 py-2 text-sm font-mono bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-800"
                />
                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    title="Scan using Camera"
                    className="absolute right-2 text-zinc-500 hover:text-zinc-900 p-1 rounded-md"
                  >
                    <Scan className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">SKU / Code</label>
              <input
                id="product-sku-input"
                type="text"
                placeholder="e.g. CF-COL-500"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-800"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-700">Category</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(!isCustomCategory);
                      if (!isCustomCategory && !category) {
                        setCategory("");
                      }
                    }}
                    className="text-[10px] text-zinc-600 hover:text-zinc-900 font-semibold underline cursor-pointer"
                  >
                    {isCustomCategory ? "Select from list" : "+ Custom category"}
                  </button>
                  {onOpenCategoryManager && (
                    <button
                      type="button"
                      onClick={onOpenCategoryManager}
                      className="text-[10px] text-zinc-700 hover:text-zinc-900 font-semibold flex items-center gap-0.5 bg-zinc-100 hover:bg-zinc-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      title="Manage and rename all store categories"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      Manage
                    </button>
                  )}
                </div>
              </div>

              {isCustomCategory ? (
                <div className="relative">
                  <input
                    id="product-custom-category-input"
                    type="text"
                    list="product-category-list"
                    placeholder="Type or edit category name..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-800"
                    autoFocus
                  />
                  <datalist id="product-category-list">
                    {allCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              ) : (
                <select
                  id="product-category-select"
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setIsCustomCategory(true);
                      setCategory("");
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-300 rounded-xl text-zinc-800 focus:outline-none focus:border-zinc-800"
                >
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__new__">+ Type Custom Category...</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Unit of Measure</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-300 rounded-xl text-zinc-800 focus:outline-none focus:border-zinc-800"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="bag">Bag</option>
                <option value="bottle">Bottle</option>
                <option value="jar">Jar</option>
                <option value="bar">Bar</option>
                <option value="box">Box</option>
                <option value="kg">Kilogram (kg)</option>
              </select>
            </div>
          </div>

          {/* Asking Rate & Selling Rate (Negotiable Pricing) Section */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                  Asking Rate & Selling Rate (Flexible Pricing)
                </span>
              </div>
              <span className="text-[10px] font-medium text-zinc-500 bg-zinc-200/70 px-2 py-0.5 rounded-full">
                Negotiable Rates
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Customers rarely buy at fixed prices. Define an <strong className="text-zinc-700">Asking Rate</strong> (quoted / tag price) and a <strong className="text-zinc-700">Selling Rate</strong> (target agreed transaction price), plus optional floor limits.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Asking Rate */}
              <div className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    Asking Rate (Tag Price) *
                  </label>
                  <span className="text-[10px] text-amber-700 font-mono font-medium">Initial Quote</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-mono font-bold text-zinc-400">$</span>
                  <input
                    id="product-asking-rate-input"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={askingRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setAskingRate(val);
                      // If selling rate is 0 or empty, default it
                      if (sellingRate === 0) setSellingRate(val);
                    }}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-1.5 text-sm font-mono font-bold bg-amber-50/40 border border-amber-300 rounded-lg text-amber-950 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Printed on price tags & quoted first</p>
              </div>

              {/* Selling Rate */}
              <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Selling Rate (Agreed Price) *
                  </label>
                  <span className="text-[10px] text-emerald-700 font-mono font-medium">Default Checkout</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-mono font-bold text-zinc-400">$</span>
                  <input
                    id="product-selling-rate-input"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sellingRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSellingRate(val);
                      setRetailPrice(val);
                    }}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-1.5 text-sm font-mono font-bold bg-emerald-50/40 border border-emerald-300 rounded-lg text-emerald-950 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Cashier can still adjust per-sale on POS</p>
              </div>
            </div>

            {/* Guardrails: Cost & Minimum Selling Floor */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Cost Price ($)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-xs font-mono text-zinc-400">$</span>
                  <input
                    id="product-cost-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-2.5 py-1.5 text-xs font-mono bg-white border border-zinc-300 rounded-lg text-zinc-900"
                  />
                </div>
                <span className="text-[9.5px] text-zinc-400">Wholesale purchase</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-zinc-500" />
                  Min Floor Rate ($)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-xs font-mono text-zinc-400">$</span>
                  <input
                    id="product-min-floor-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={minSellingRate}
                    onChange={(e) => setMinSellingRate(parseFloat(e.target.value) || 0)}
                    placeholder="Floor limit"
                    className="w-full pl-6 pr-2.5 py-1.5 text-xs font-mono bg-white border border-zinc-300 rounded-lg text-zinc-900"
                  />
                </div>
                <span className="text-[9.5px] text-zinc-400">Warns if negotiated lower</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Tax Rate (%)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-zinc-300 rounded-lg text-zinc-900"
                  />
                  <span className="absolute right-2.5 text-xs font-mono text-zinc-400">%</span>
                </div>
                <span className="text-[9.5px] text-zinc-400">Sales tax per item</span>
              </div>
            </div>

            {/* Bargain & Margin Analytics Bar */}
            <div className="bg-white p-3 rounded-xl border border-zinc-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 font-medium text-[11px]">Bargain Room:</span>
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                  -${bargainRoom.toFixed(2)} ({bargainPct}% room)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 font-medium text-[11px]">Profit at Selling Rate:</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[11px] ${
                  sellingProfit >= 0
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-red-700 bg-red-50 border-red-200"
                }`}>
                  ${sellingProfit.toFixed(2)} ({sellingMarginPercent}% margin)
                </span>
              </div>
            </div>

            {/* Warnings if below cost or below floor */}
            {isBelowCost && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Warning:</strong> Selling rate (${parsedSelling.toFixed(2)}) is lower than cost price (${parsedCost.toFixed(2)}). Every sale will lose money!
                </span>
              </div>
            )}

            {!isBelowCost && isBelowFloor && (
              <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Caution:</strong> Selling rate is below the set minimum floor rate (${parsedMinSelling.toFixed(2)}).
                </span>
              </div>
            )}
          </div>

          {/* Stock Levels & Alert Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Current On-Hand Stock
              </label>
              <input
                id="product-stock-input"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Low-Stock Alert Trigger Threshold
              </label>
              <input
                id="product-threshold-input"
                type="number"
                min="0"
                value={minAlertThreshold}
                onChange={(e) => setMinAlertThreshold(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-800"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                Alerts will trigger when stock drops to or below this amount.
              </span>
            </div>
          </div>

          {/* Supplier & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Supplier Name</label>
              <input
                type="text"
                placeholder="e.g. Acme Wholesale Corp"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-300 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Internal Notes</label>
              <input
                type="text"
                placeholder="Storage location, shelf #, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-300 rounded-xl text-zinc-900"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-product-btn"
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Product"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
