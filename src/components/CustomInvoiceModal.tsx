import React, { useState } from "react";
import { X, Plus, Trash2, FileText, CheckCircle2 } from "lucide-react";
import { Product, SaleItem, StoreSettings, Sale } from "../types";

interface CustomInvoiceModalProps {
  products: Product[];
  settings: StoreSettings;
  cashierName: string;
  isOpen: boolean;
  onClose: () => void;
  onGenerateInvoice: (saleData: Omit<Sale, "id" | "invoiceNumber" | "synced" | "timestamp">) => Promise<Sale>;
  onShowReceipt: (sale: Sale) => void;
}

export const CustomInvoiceModal: React.FC<CustomInvoiceModalProps> = ({
  products,
  settings,
  cashierName,
  isOpen,
  onClose,
  onGenerateInvoice,
  onShowReceipt
}) => {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState<"Card" | "Cash" | "QR Code">("Card");

  const [items, setItems] = useState<SaleItem[]>([
    {
      productId: products[0]?.id || "custom-1",
      name: products[0]?.name || "Custom Item",
      price: products[0]?.retailPrice || 25.0,
      cost: products[0]?.costPrice || 10.0,
      quantity: 1,
      taxRate: settings.defaultTaxRate
    }
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const firstProd = products[0];
    setItems([
      ...items,
      {
        productId: firstProd?.id || `custom-${Date.now()}`,
        name: firstProd?.name || "New Item",
        price: firstProd?.retailPrice || 15.0,
        cost: firstProd?.costPrice || 6.0,
        quantity: 1,
        taxRate: settings.defaultTaxRate
      }
    ]);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newItems = [...items];
    newItems[index] = {
      productId: prod.id,
      name: prod.name,
      price: prod.retailPrice,
      cost: prod.costPrice,
      quantity: newItems[index].quantity,
      taxRate: prod.taxRate || settings.defaultTaxRate
    };
    setItems(newItems);
  };

  const handleUpdateItem = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const costTotal = items.reduce((acc, i) => acc + i.cost * i.quantity, 0);
  const taxAmount = items.reduce((acc, i) => acc + (i.price * i.quantity * i.taxRate) / 100, 0);
  const total = subtotal + taxAmount;
  const profit = total - taxAmount - costTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const payload: Omit<Sale, "id" | "invoiceNumber" | "synced" | "timestamp"> = {
      items,
      subtotal,
      discountAmount: 0,
      taxAmount,
      total,
      costTotal,
      profit,
      paymentMethod,
      paymentDetails: {
        authCode: `B2B-AUTH-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "completed"
      },
      customerName: clientName.trim() || "Corporate Client",
      customerEmail: clientEmail.trim() || undefined,
      customerPhone: clientPhone.trim() || undefined,
      customerAddress: clientAddress.trim() || undefined,
      cashierName,
      dueDate
    };

    const recorded = await onGenerateInvoice(payload);
    onClose();
    onShowReceipt(recorded);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-2xl my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-zinc-900 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-base">Create Custom B2B Invoice</h3>
              <p className="text-xs text-zinc-500">Itemize billing, specify payment terms, and export PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Client Details Grid */}
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Client Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  Company / Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Design Studios LLC"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  placeholder="billing@apexdesign.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  placeholder="742 Evergreen Terrace, Sector 4"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Invoice Line Items</h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2 border border-zinc-200 rounded-xl p-3 bg-zinc-50/50">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200">
                  <select
                    value={item.productId}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    className="flex-1 text-xs bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-zinc-900"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({settings.currency}{p.retailPrice.toFixed(2)})
                      </option>
                    ))}
                  </select>

                  <div className="w-16">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                      className="w-full text-center text-xs font-mono bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 text-zinc-900"
                    />
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => handleUpdateItem(idx, "price", parseFloat(e.target.value) || 0)}
                      className="w-full text-right text-xs font-mono bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 text-zinc-900"
                    />
                  </div>

                  <span className="w-20 text-right font-mono font-bold text-xs text-zinc-900">
                    {settings.currency}{(item.price * item.quantity).toFixed(2)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="p-1 text-zinc-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-60 space-y-1 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span className="font-mono">{settings.currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Estimated Tax:</span>
                <span className="font-mono">{settings.currency}{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-zinc-900 pt-2 border-t border-zinc-200">
                <span>Total Invoice:</span>
                <span className="font-mono text-emerald-700">{settings.currency}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Generate & View Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
