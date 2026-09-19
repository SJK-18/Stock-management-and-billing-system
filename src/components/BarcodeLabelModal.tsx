import React, { useState } from "react";
import { X, Printer, Tag, Copy, Check } from "lucide-react";
import { Product, StoreSettings } from "../types";
import { generateBarcodeBars } from "../utils/barcodeUtils";

interface BarcodeLabelModalProps {
  product: Product | null;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  product,
  settings,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [printCount, setPrintCount] = useState<number>(4);

  if (!isOpen || !product) return null;

  const bars = generateBarcodeBars(product.barcode);

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(product.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="barcode-label-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-2xl print:shadow-none print:border-none print:max-w-none">
        {/* Header - Hidden during print */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-base">Print Product Barcode Labels</h3>
              <p className="text-xs text-zinc-500">Retail shelf price tag & barcode format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 bg-zinc-50 print:bg-white print:p-2 space-y-5">
          <div className="flex items-center justify-between print:hidden">
            <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
              Preview (Showing {printCount} labels)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Label count:</span>
              <select
                value={printCount}
                onChange={(e) => setPrintCount(Number(e.target.value))}
                className="text-xs font-medium bg-white border border-zinc-300 rounded-lg px-2 py-1 text-zinc-700"
              >
                <option value={1}>1 Tag</option>
                <option value={4}>4 Tags (Row)</option>
                <option value={8}>8 Tags (Sheet)</option>
                <option value={12}>12 Tags (Full Sheet)</option>
              </select>
            </div>
          </div>

          {/* Render Labels Grid */}
          <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto p-2 border border-dashed border-zinc-300 rounded-xl bg-white print:border-none print:max-h-none print:grid-cols-2 print:gap-4">
            {Array.from({ length: printCount }).map((_, idx) => (
              <div
                key={idx}
                className="border border-zinc-300 rounded-lg p-3 bg-white flex flex-col items-center justify-between text-center shadow-xs"
                style={{ minHeight: "140px" }}
              >
                <div className="w-full">
                  <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase truncate">
                    {settings.businessName}
                  </p>
                  <p className="text-xs font-bold text-zinc-900 leading-tight line-clamp-1 mt-0.5">
                    {product.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">SKU: {product.sku}</p>
                </div>

                {/* SVG Barcode */}
                <div className="my-1.5 w-full flex flex-col items-center">
                  <svg
                    viewBox="0 0 160 48"
                    className="w-full max-w-[170px] h-11"
                    preserveAspectRatio="none"
                  >
                    <rect width="160" height="48" fill="#ffffff" />
                    <g transform="translate(10, 2)">
                      {bars.map((bar, bIdx) => {
                        // calculate offset
                        const prevOffset = bars.slice(0, bIdx).reduce((acc, curr) => acc + curr.width, 0);
                        return bar.isBlack ? (
                          <rect
                            key={bIdx}
                            x={prevOffset}
                            y="0"
                            width={bar.width}
                            height="38"
                            fill="#000000"
                          />
                        ) : null;
                      })}
                    </g>
                  </svg>
                  <span className="text-[11px] font-mono tracking-widest text-zinc-800 font-semibold">
                    {product.barcode}
                  </span>
                </div>

                <div className="w-full pt-1 border-t border-zinc-100 flex items-center justify-between px-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Price</span>
                  <span className="text-sm font-extrabold text-zinc-900 font-mono">
                    {settings.currency}{product.retailPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 bg-zinc-100 p-3 rounded-xl print:hidden">
            <span className="font-mono">Barcode: {product.barcode}</span>
            <button
              onClick={handleCopyBarcode}
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Code"}
            </button>
          </div>
        </div>

        {/* Action Buttons - Hidden during print */}
        <div className="flex items-center justify-end gap-2.5 border-t border-zinc-200 px-5 py-4 bg-white print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            id="print-labels-btn"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Price Labels
          </button>
        </div>
      </div>
    </div>
  );
};
