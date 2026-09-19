import React, { useState } from "react";
import {
  Search,
  Scan,
  Plus,
  Minus,
  Trash2,
  Tag,
  CreditCard,
  User,
  ShoppingBag,
  AlertCircle,
  Percent,
  Sparkles,
  RotateCcw,
  TrendingDown,
  AlertTriangle,
  Scale
} from "lucide-react";
import { Product, SaleItem, StoreSettings } from "../types";
import { soundManager } from "../utils/barcodeUtils";

interface POSViewProps {
  products: Product[];
  settings: StoreSettings;
  cashierName: string;
  onOpenScanner: () => void;
  onProceedToPayment: (cartData: {
    items: SaleItem[];
    subtotal: number;
    askingSubtotal?: number;
    bargainSavings?: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    costTotal: number;
  }) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  settings,
  cashierName,
  onOpenScanner,
  onProceedToPayment
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Extract unique categories
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.barcode.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      soundManager.playError();
      return;
    }

    soundManager.playBeep(2100, 0.05);

    const ask = product.askingRate !== undefined ? product.askingRate : product.retailPrice;
    const sell = product.sellingRate !== undefined ? product.sellingRate : product.retailPrice;

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        // Check stock availability
        if (existing.quantity >= product.stock) {
          alert(`Maximum available stock reached (${product.stock} ${product.unit}).`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: sell,
          askingRate: ask,
          sellingRate: sell,
          cost: product.costPrice,
          quantity: 1,
          taxRate: product.taxRate || settings.defaultTaxRate
        }
      ];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const product = products.find((p) => p.id === productId);
            const newQty = item.quantity + delta;
            if (product && newQty > product.stock) {
              alert(`Cannot add more than on-hand stock (${product.stock}).`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleUpdateItemSellingRate = (productId: string, newRate: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const rate = Math.max(0, newRate);
          return {
            ...item,
            sellingRate: rate,
            price: rate
          };
        }
        return item;
      })
    );
  };

  const handleResetToAskingRate = (productId: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const ask = item.askingRate !== undefined ? item.askingRate : item.price;
          return {
            ...item,
            sellingRate: ask,
            price: ask
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    if (cart.length > 0 && confirm("Are you sure you want to clear the current register cart?")) {
      setCart([]);
      setDiscountPercent(0);
    }
  };

  // Financial calculations
  const rawSubtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalAskingSubtotal = cart.reduce(
    (acc, i) => acc + (i.askingRate !== undefined ? i.askingRate : i.price) * i.quantity,
    0
  );
  const totalBargainSavings = Math.max(0, totalAskingSubtotal - rawSubtotal);

  const costTotal = cart.reduce((acc, i) => acc + i.cost * i.quantity, 0);
  const discountAmount = (rawSubtotal * discountPercent) / 100;
  const discountedSubtotal = Math.max(0, rawSubtotal - discountAmount);

  // Weighted average tax or item-by-item tax
  const taxAmount = cart.reduce((acc, i) => {
    const itemSub = i.price * i.quantity * (1 - discountPercent / 100);
    return acc + (itemSub * (i.taxRate || settings.defaultTaxRate)) / 100;
  }, 0);

  const grandTotal = discountedSubtotal + taxAmount;
  const totalItemCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    onProceedToPayment({
      items: cart,
      subtotal: rawSubtotal,
      askingSubtotal: totalAskingSubtotal,
      bargainSavings: totalBargainSavings,
      discountAmount,
      taxAmount,
      totalAmount: grandTotal,
      costTotal
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Product Catalog Grid (Left 7 Cols) */}
      <div className="w-full lg:flex-1 space-y-4">
        {/* Search & Barcode Scan Bar */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              id="pos-search-input"
              type="text"
              placeholder="Search product by title, SKU, or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
            />
          </div>

          <button
            id="pos-camera-scan-btn"
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            <span>Scan Barcode</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock <= product.minAlertThreshold && !isOutOfStock;

            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && handleAddToCart(product)}
                className={`border rounded-2xl p-4 flex flex-col justify-between transition-all select-none ${
                  isOutOfStock
                    ? "bg-zinc-50 border-zinc-200 opacity-60 cursor-not-allowed"
                    : "bg-white border-zinc-200 hover:border-zinc-900 hover:shadow-md cursor-pointer group"
                }`}
                style={{ minHeight: "155px" }}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider truncate">
                      {product.category}
                    </span>
                    {isOutOfStock ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 uppercase">
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase">
                        Low ({product.stock})
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {product.stock} {product.unit}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-zinc-900 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{product.sku}</p>
                </div>

                <div className="pt-2.5 border-t border-zinc-100 mt-2">
                  <div className="flex items-end justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                        <span className="uppercase text-[9px] font-bold text-amber-800">Ask:</span>
                        <span className="font-mono">{settings.currency}{(product.askingRate !== undefined ? product.askingRate : product.retailPrice).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-emerald-700 uppercase text-[9px]">Sell:</span>
                        <span className="text-sm font-extrabold font-mono text-zinc-900">
                          {settings.currency}{(product.sellingRate !== undefined ? product.sellingRate : product.retailPrice).toFixed(2)}
                        </span>
                        {product.askingRate !== undefined && product.sellingRate !== undefined && product.askingRate > product.sellingRate && (
                          <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            -{(product.askingRate - product.sellingRate).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      className="w-7 h-7 rounded-lg bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white text-zinc-700 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
            <ShoppingBag className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
            <p className="text-sm font-bold text-zinc-700">No products match your search</p>
            <p className="text-xs text-zinc-400 mt-1">Try searching another SKU or category</p>
          </div>
        )}
      </div>

      {/* Cart & Billing Checkout Register (Right 5 Cols) */}
      <div className="w-full lg:w-96 bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden sticky top-28 flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-900 text-white">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-sm">Register Checkout</h3>
              <p className="text-[11px] text-zinc-500">Cashier: {cashierName}</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="p-3.5 max-h-80 overflow-y-auto space-y-2.5 divide-y divide-zinc-100 flex-1">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
              <p className="text-xs font-semibold">Cart is currently empty</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Click products or scan barcode to add</p>
            </div>
          ) : (
            cart.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const ask = item.askingRate !== undefined ? item.askingRate : (product?.askingRate || item.price);
              const isDiscounted = item.price < ask;
              const discountDelta = ask - item.price;
              const discountPct = ask > 0 ? ((discountDelta / ask) * 100).toFixed(0) : "0";
              const isBelowCost = item.cost > 0 && item.price < item.cost;
              const isBelowFloor = product?.minSellingRate && item.price < product.minSellingRate;

              return (
                <div key={item.productId} className="pt-2.5 first:pt-0 space-y-1.5">
                  {/* Top row: Name & Qty */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate flex-1">
                      <p className="text-xs font-bold text-zinc-900 truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <span className="font-mono text-amber-800">Ask: {settings.currency}{ask.toFixed(2)}</span>
                        {isDiscounted && (
                          <span className="font-mono text-emerald-700 bg-emerald-50 px-1 rounded text-[9.5px]">
                            -{settings.currency}{discountDelta.toFixed(2)} ({discountPct}% off)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleUpdateQty(item.productId, -1)}
                        className="w-5 h-5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-xs text-zinc-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.productId, 1)}
                        className="w-5 h-5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="p-1 text-zinc-400 hover:text-red-600 transition-colors ml-0.5 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom row: Negotiated Selling Rate Input & Line Total */}
                  <div className="flex items-center justify-between gap-2 bg-zinc-50/80 p-1.5 rounded-lg border border-zinc-200/60">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase">Sell Rate:</span>
                      <div className="relative flex items-center w-24">
                        <span className="absolute left-2 text-[11px] font-mono text-zinc-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={(e) =>
                            handleUpdateItemSellingRate(item.productId, parseFloat(e.target.value) || 0)
                          }
                          className="w-full pl-5 pr-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-emerald-300 rounded text-emerald-950 focus:outline-none focus:border-emerald-600"
                          title="Click to negotiate selling price per unit"
                        />
                      </div>
                      {isDiscounted && (
                        <button
                          type="button"
                          onClick={() => handleResetToAskingRate(item.productId)}
                          className="text-[9.5px] text-zinc-400 hover:text-zinc-700 underline cursor-pointer"
                          title="Reset price back to asking rate"
                        >
                          Reset Ask
                        </button>
                      )}
                    </div>

                    <span className="text-xs font-mono font-extrabold text-zinc-900 shrink-0">
                      {settings.currency}{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Warning tags if below cost or below floor */}
                  {isBelowCost && (
                    <div className="flex items-center gap-1 text-[10px] text-red-600 font-medium pl-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Below cost (${item.cost.toFixed(2)})!</span>
                    </div>
                  )}
                  {!isBelowCost && isBelowFloor && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-700 font-medium pl-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Below min floor (${product?.minSellingRate?.toFixed(2)})</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Financial Breakdown & Discounts */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 space-y-3">
          {/* Quick Discount Selector */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600 font-medium">Extra Bill Discount:</span>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDiscountPercent(pct)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                    discountPercent === pct
                      ? "bg-zinc-900 border-zinc-900 text-white"
                      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {pct === 0 ? "None" : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            {totalBargainSavings > 0 && (
              <>
                <div className="flex justify-between text-zinc-500">
                  <span>Asking Total (MRP):</span>
                  <span className="font-mono">{settings.currency}{totalAskingSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Bargain Savings:
                  </span>
                  <span className="font-mono font-bold">-{settings.currency}{totalBargainSavings.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-zinc-600">
              <span>Agreed Subtotal ({totalItemCount} items):</span>
              <span className="font-mono">{settings.currency}{rawSubtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Extra Discount ({discountPercent}%):</span>
                <span className="font-mono">-{settings.currency}{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-600">
              <span>Est. Tax ({settings.defaultTaxRate}%):</span>
              <span className="font-mono">{settings.currency}{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-zinc-900 pt-2 border-t border-zinc-200">
              <span>Total Payable:</span>
              <span className="font-mono text-emerald-700 text-lg">
                {settings.currency}{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            id="pos-proceed-payment-btn"
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Charge & Invoice ({settings.currency}{grandTotal.toFixed(2)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
