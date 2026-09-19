import React, { useState } from "react";
import { X, Download, Printer, FileText, Check, Copy, Share2, Mail } from "lucide-react";
import { Sale, StoreSettings } from "../types";
import { downloadInvoicePDF, openPrintInvoice } from "../utils/pdfGenerator";
import { generateBarcodeBars } from "../utils/barcodeUtils";

interface InvoicePreviewModalProps {
  sale: Sale | null;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  sale,
  settings,
  isOpen,
  onClose
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen || !sale) return null;

  const handleDownloadPDF = () => {
    downloadInvoicePDF(sale, settings);
  };

  const handlePrint = () => {
    openPrintInvoice(sale, settings);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`Invoice #${sale.invoiceNumber} - Total ${settings.currency}${sale.total.toFixed(2)}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSimulateEmail = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const bars = generateBarcodeBars(sale.invoiceNumber);

  return (
    <div id="invoice-preview-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-2xl my-6 flex flex-col max-h-[90vh]">
        {/* Header with Quick Actions */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Invoice #{sale.invoiceNumber}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wider">
                  PAID
                </span>
                {!sale.synced && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500 text-white">
                    Offline Saved
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {new Date(sale.timestamp).toLocaleString()} • Register: {sale.cashierName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="download-invoice-pdf-btn"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Paper Document Render */}
        <div className="p-8 overflow-y-auto bg-zinc-100 flex-1">
          <div className="bg-white p-8 rounded-xl shadow-xs border border-zinc-200 space-y-6 max-w-xl mx-auto">
            {/* Store & Invoice Meta Header */}
            <div className="flex items-start justify-between pb-6 border-b border-zinc-200">
              <div>
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">{settings.businessName}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{settings.tagline}</p>
                <div className="text-xs text-zinc-600 mt-2 space-y-0.5">
                  <p>{settings.address}</p>
                  <p>Tel: {settings.phone} • Email: {settings.email}</p>
                  <p className="font-mono text-zinc-500">Tax ID: {settings.taxId}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-zinc-900 tracking-tight block">INVOICE</span>
                <span className="font-mono text-sm font-semibold text-zinc-600">#{sale.invoiceNumber}</span>
                <p className="text-xs text-zinc-500 mt-1">
                  Date: {new Date(sale.timestamp).toLocaleDateString()}
                </p>
                <p className="text-xs text-zinc-500">
                  Payment: <span className="font-medium text-zinc-800">{sale.paymentMethod}</span>
                </p>
              </div>
            </div>

            {/* Billed To Customer */}
            <div className="flex items-start justify-between text-xs">
              <div>
                <span className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">Billed To</span>
                <p className="font-bold text-zinc-900 text-sm">{sale.customerName || "Walk-in Retail Customer"}</p>
                {sale.customerEmail && <p className="text-zinc-600">{sale.customerEmail}</p>}
                {sale.customerPhone && <p className="text-zinc-600">{sale.customerPhone}</p>}
              </div>
              <div className="text-right">
                <span className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">Transaction Ref</span>
                <p className="font-mono text-zinc-800">
                  {sale.paymentDetails.authCode || sale.paymentDetails.refId || `ID: ${sale.id}`}
                </p>
                <p className="text-emerald-700 font-semibold mt-0.5">Status: Authorized & Cleared</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-800">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-zinc-50/50" : ""}>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-zinc-900">{item.name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">Tax: {item.taxRate}%</p>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-600">
                        {settings.currency}{item.price.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                        {settings.currency}{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Calculation */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{settings.currency}{sale.subtotal.toFixed(2)}</span>
                </div>
                {sale.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span className="font-mono">-{settings.currency}{sale.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-600">
                  <span>Tax ({settings.defaultTaxRate}%):</span>
                  <span className="font-mono">{settings.currency}{sale.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-zinc-900 pt-2 border-t border-zinc-200">
                  <span>Total Paid:</span>
                  <span className="font-mono text-emerald-700">{settings.currency}{sale.total.toFixed(2)}</span>
                </div>

                {sale.paymentMethod === "Cash" && sale.paymentDetails.tendered && (
                  <div className="pt-2 border-t border-dashed border-zinc-200 text-zinc-500 text-[11px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>Cash Tendered:</span>
                      <span className="font-mono">{settings.currency}{sale.paymentDetails.tendered.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-zinc-700">
                      <span>Change Given:</span>
                      <span className="font-mono">{settings.currency}{(sale.paymentDetails.change || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Barcode & Policy */}
            <div className="pt-6 border-t border-zinc-200 flex items-center justify-between">
              <div className="max-w-xs">
                <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wide">Store Policy</p>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{settings.receiptFooter}</p>
              </div>

              {/* Barcode Graphic */}
              <div className="text-right flex flex-col items-end">
                <svg viewBox="0 0 140 32" className="w-28 h-8" preserveAspectRatio="none">
                  {bars.slice(0, 32).map((b, i) => (
                    <rect
                      key={i}
                      x={i * 4}
                      y="0"
                      width={b.isBlack ? 2.5 : 0}
                      height="32"
                      fill="#18181b"
                    />
                  ))}
                </svg>
                <span className="text-[9px] font-mono text-zinc-400 mt-1">*{sale.invoiceNumber}*</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3.5 bg-zinc-50 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Copied!" : "Copy Details"}</span>
            </button>
            <button
              onClick={handleSimulateEmail}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg transition-colors"
            >
              {emailSent ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Mail className="w-3.5 h-3.5" />}
              <span>{emailSent ? "Email Sent to Client" : "Email Receipt"}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-200 hover:bg-zinc-300 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
