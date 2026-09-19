import React, { useState } from "react";
import { X, CreditCard, Banknote, QrCode, Split, CheckCircle2, ArrowRight, User, Mail, Phone, Loader2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { PaymentMethod, PaymentDetails, StoreSettings, SaleItem, Sale } from "../types";
import { soundManager } from "../utils/barcodeUtils";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  costTotal: number;
  items: SaleItem[];
  askingSubtotal?: number;
  bargainSavings?: number;
  settings: StoreSettings;
  cashierName: string;
  onPaymentComplete: (saleData: Omit<Sale, "id" | "invoiceNumber" | "synced" | "timestamp">) => Promise<Sale>;
  onShowReceipt: (sale: Sale) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  subtotal,
  askingSubtotal,
  bargainSavings,
  taxAmount,
  discountAmount,
  costTotal,
  items,
  settings,
  cashierName,
  onPaymentComplete,
  onShowReceipt
}) => {
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [cashTendered, setCashTendered] = useState<string>(Math.ceil(totalAmount).toString());
  const [cardType, setCardType] = useState<string>("Visa");
  const [last4, setLast4] = useState<string>("4242");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  
  // Split payment state
  const [splitCash, setSplitCash] = useState<string>((totalAmount / 2).toFixed(2));

  if (!isOpen) return null;

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - totalAmount);
  const isCashSufficient = tenderedNum >= totalAmount;

  const splitCashNum = parseFloat(splitCash) || 0;
  const splitCardNum = Math.max(0, totalAmount - splitCashNum);

  const handleCashTenderPreset = (amount: number) => {
    setCashTendered(amount.toFixed(2));
  };

  const handleProcessTransaction = async () => {
    setIsProcessing(true);

    // Simulate payment gateway delay (contactless / chip / UPI validation)
    await new Promise((resolve) => setTimeout(resolve, 800));

    let paymentDetails: PaymentDetails = { status: "completed" };

    if (method === "Cash") {
      paymentDetails = {
        tendered: tenderedNum,
        change: changeDue,
        status: "completed"
      };
    } else if (method === "Card") {
      paymentDetails = {
        cardType,
        last4,
        authCode: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
        status: "completed"
      };
    } else if (method === "QR Code") {
      paymentDetails = {
        provider: "Instant Pay / UPI",
        refId: `TXN-QR-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "completed"
      };
    } else if (method === "Split") {
      paymentDetails = {
        splitDetails: {
          cashAmount: splitCashNum,
          cardAmount: splitCardNum
        },
        authCode: `SPLIT-${Math.floor(10000 + Math.random() * 90000)}`,
        status: "completed"
      };
    }

    const profit = totalAmount - taxAmount - costTotal;

    const salePayload: Omit<Sale, "id" | "invoiceNumber" | "synced" | "timestamp"> = {
      items,
      subtotal,
      askingSubtotal,
      bargainSavings,
      discountAmount,
      taxAmount,
      total: totalAmount,
      costTotal,
      profit,
      paymentMethod: method,
      paymentDetails,
      customerName: customerName.trim() || "Walk-in Customer",
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      cashierName
    };

    try {
      const recorded = await onPaymentComplete(salePayload);
      soundManager.playSuccess();
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 }
      });
      setIsProcessing(false);
      onClose();
      onShowReceipt(recorded);
    } catch (err) {
      setIsProcessing(false);
      soundManager.playError();
      alert("Payment processing error. Please try again.");
    }
  };

  return (
    <div id="payment-processing-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-50/70">
          <div>
            <h3 className="font-bold text-zinc-900 text-lg">Process Payment</h3>
            <p className="text-xs text-zinc-500">Select payment method and finalize checkout</p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Due Banner */}
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Total Payable</p>
            <p className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
              {settings.currency}{totalAmount.toFixed(2)}
            </p>
            {bargainSavings !== undefined && bargainSavings > 0 && (
              <p className="text-[11px] text-amber-300 font-medium mt-0.5 flex items-center gap-1">
                <span>Negotiated: Saved {settings.currency}{bargainSavings.toFixed(2)} off asking price</span>
              </p>
            )}
          </div>
          <div className="text-right text-xs text-zinc-400">
            <p>{items.reduce((acc, i) => acc + i.quantity, 0)} Items</p>
            {askingSubtotal !== undefined && askingSubtotal > totalAmount && (
              <p className="line-through text-zinc-500 font-mono">Ask: {settings.currency}{askingSubtotal.toFixed(2)}</p>
            )}
            <p>Tax: {settings.currency}{taxAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              id="pay-method-cash"
              onClick={() => setMethod("Cash")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                method === "Cash"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span>Cash</span>
            </button>

            <button
              type="button"
              id="pay-method-card"
              onClick={() => setMethod("Card")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                method === "Card"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Card</span>
            </button>

            <button
              type="button"
              id="pay-method-qr"
              onClick={() => setMethod("QR Code")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                method === "QR Code"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span>QR / UPI</span>
            </button>

            <button
              type="button"
              id="pay-method-split"
              onClick={() => setMethod("Split")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                method === "Split"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <Split className="w-5 h-5" />
              <span>Split</span>
            </button>
          </div>

          {/* Tab Specific Content */}
          {method === "Cash" && (
            <div className="space-y-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Cash Tendered</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-zinc-500 font-semibold">{settings.currency}</span>
                  <input
                    id="cash-tendered-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-zinc-300 rounded-xl font-mono text-lg font-bold text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Fast Tender Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium">Quick tender:</span>
                {[totalAmount, Math.ceil(totalAmount), 20, 50, 100].map((amt, idx) => {
                  if (amt < totalAmount && idx > 1) return null;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCashTenderPreset(amt)}
                      className="px-2.5 py-1 text-xs font-mono font-semibold bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg text-zinc-700 transition-colors"
                    >
                      {settings.currency}{amt.toFixed(idx === 0 ? 2 : 0)}
                    </button>
                  );
                })}
              </div>

              {/* Change Calculation Box */}
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-600">Change Due:</span>
                <span className={`text-xl font-bold font-mono ${isCashSufficient ? "text-emerald-600" : "text-amber-600"}`}>
                  {isCashSufficient ? `${settings.currency}${changeDue.toFixed(2)}` : "Insufficient Tender"}
                </span>
              </div>
            </div>
          )}

          {method === "Card" && (
            <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-700">Payment Terminal Simulation</span>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Terminal Ready (Contactless / Chip)
                </span>
              </div>

              <div className="p-4 bg-zinc-900 rounded-xl text-white shadow-inner flex flex-col justify-between h-28 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs tracking-widest text-zinc-400 font-mono uppercase">Retail POS Reader</span>
                  <span className="text-xs font-bold text-amber-400">{cardType}</span>
                </div>
                <div className="flex items-center gap-2 my-auto">
                  <div className="w-8 h-6 rounded bg-amber-400/30 border border-amber-400/50 flex items-center justify-center text-[9px] text-amber-200 font-mono">CHIP</div>
                  <span className="font-mono text-sm tracking-widest text-zinc-300">•••• •••• •••• {last4}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>TAP / INSERT / SWIPE</span>
                  <span className="text-emerald-400 font-mono">{settings.currency}{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[11px] text-zinc-500 font-medium">Card Network</label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-700"
                  >
                    <option value="Visa">Visa Credit/Debit</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">American Express</option>
                    <option value="Apple Pay">Apple Pay / Contactless</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 font-medium">Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={last4}
                    onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
                    className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg font-mono text-zinc-800"
                  />
                </div>
              </div>
            </div>
          )}

          {method === "QR Code" && (
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-center space-y-3">
              <p className="text-xs font-semibold text-zinc-700">Dynamic Instant Pay QR Code</p>
              
              {/* Dynamic QR Graphic */}
              <div className="w-36 h-36 mx-auto bg-white p-2.5 rounded-xl border border-zinc-300 shadow-xs flex items-center justify-center relative">
                {/* SVG QR Code Pattern */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-zinc-900">
                  <path fill="currentColor" d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z" />
                  <path fill="currentColor" d="M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z" />
                  <path fill="currentColor" d="M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z" />
                  <rect x="40" y="5" width="20" height="8" fill="currentColor" />
                  <rect x="45" y="20" width="10" height="15" fill="currentColor" />
                  <rect x="5" y="40" width="25" height="10" fill="currentColor" />
                  <rect x="35" y="40" width="30" height="20" fill="currentColor" />
                  <rect x="75" y="45" width="20" height="10" fill="currentColor" />
                  <rect x="40" y="70" width="15" height="25" fill="currentColor" />
                  <rect x="65" y="70" width="30" height="12" fill="currentColor" />
                  <rect x="65" y="88" width="20" height="8" fill="currentColor" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shadow">
                    PAY
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-500">
                <p className="font-semibold text-zinc-800">Scan via UPI, Cash App, Venmo, or Mobile Banking</p>
                <p className="font-mono text-[11px] text-zinc-400 mt-0.5">Amount: {settings.currency}{totalAmount.toFixed(2)} • TXN: QR-{Date.now().toString().slice(-4)}</p>
              </div>
            </div>
          )}

          {method === "Split" && (
            <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <p className="text-xs font-semibold text-zinc-700">Split Between Cash and Card</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-600">Cash Portion</label>
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-2 text-xs text-zinc-500">{settings.currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      max={totalAmount}
                      value={splitCash}
                      onChange={(e) => setSplitCash(e.target.value)}
                      className="w-full pl-6 pr-3 py-1.5 text-sm font-mono font-semibold bg-white border border-zinc-300 rounded-lg text-zinc-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-600">Card Remainder</label>
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-2 text-xs text-zinc-500">{settings.currency}</span>
                    <input
                      type="text"
                      disabled
                      value={splitCardNum.toFixed(2)}
                      className="w-full pl-6 pr-3 py-1.5 text-sm font-mono font-semibold bg-zinc-100 border border-zinc-300 rounded-lg text-zinc-600 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Details for Invoice */}
          <div className="pt-2 border-t border-zinc-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700">Customer & Invoice Details</span>
              <span className="text-[11px] text-zinc-400">(Optional for Walk-in)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative">
                <User className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Client Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400"
                />
              </div>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="email"
                  placeholder="Client Email (PDF)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400"
                />
              </div>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-6 py-4 bg-zinc-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            id="complete-payment-btn"
            type="button"
            disabled={isProcessing || (method === "Cash" && !isCashSufficient)}
            onClick={handleProcessTransaction}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-sm transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Sale ({settings.currency}{totalAmount.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
