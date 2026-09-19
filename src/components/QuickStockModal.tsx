import React, { useState } from "react";
import { X, PackagePlus, ArrowUpRight, ArrowDownRight, AlertTriangle, Check } from "lucide-react";
import { Product } from "../types";

interface QuickStockModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjust: (productId: string, delta: number, reason: string) => Promise<void>;
}

export const QuickStockModal: React.FC<QuickStockModalProps> = ({
  product,
  isOpen,
  onClose,
  onAdjust
}) => {
  const [delta, setDelta] = useState<number>(10);
  const [reason, setReason] = useState<string>("Restock / Purchase Order delivery");
  const [customReason, setCustomReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !product) return null;

  const currentStock = product.stock;
  const newStock = Math.max(0, currentStock + delta);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (delta === 0) return;

    setIsSubmitting(true);
    const finalReason = reason === "Other" ? customReason.trim() || "Manual adjustment" : reason;
    await onAdjust(product.id, delta, finalReason);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div id="quick-stock-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-zinc-200 text-zinc-800">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-base">Quick Stock Adjustment</h3>
              <p className="text-xs text-zinc-500">Update inventory counts and audit history</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Product Card */}
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {product.category}
                </span>
                <p className="font-bold text-sm text-zinc-900 line-clamp-1">{product.name}</p>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">SKU: {product.sku}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Current Stock</span>
                <p className={`text-lg font-bold font-mono ${product.stock <= product.minAlertThreshold ? "text-amber-600" : "text-zinc-800"}`}>
                  {product.stock} {product.unit}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Increment Presets */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Adjustment Quantity
            </label>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {[-5, -1, +5, +10, +25].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDelta(val)}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                    delta === val
                      ? "bg-zinc-900 border-zinc-900 text-white"
                      : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {val > 0 ? `+${val}` : val}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input
                id="stock-delta-input"
                type="number"
                value={delta}
                onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
                className="flex-1 px-3.5 py-2 text-sm font-mono font-bold text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:border-zinc-800"
              />
              <div className="text-right shrink-0">
                <span className="text-xs text-zinc-500 block">New Level:</span>
                <span className="text-base font-bold font-mono text-emerald-700">
                  {newStock} {product.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Audit Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-xl text-zinc-800 focus:outline-none focus:border-zinc-800"
            >
              <option value="Restock / Purchase Order delivery">Restock / Purchase Order delivery</option>
              <option value="Physical audit inventory recount">Physical audit inventory recount</option>
              <option value="Customer return / exchange">Customer return / exchange</option>
              <option value="Damaged / Broken / Expired write-off">Damaged / Broken / Expired write-off</option>
              <option value="Store display / Tester unit">Store display / Tester unit</option>
              <option value="Other">Other reason...</option>
            </select>

            {reason === "Other" && (
              <input
                type="text"
                placeholder="Specify reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full mt-2 px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-800"
                required
              />
            )}
          </div>

          {newStock <= product.minAlertThreshold && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Resulting stock ({newStock}) will still be at or below minimum threshold ({product.minAlertThreshold}).</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-stock-adjust-btn"
              type="submit"
              disabled={isSubmitting || delta === 0}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
