import React, { useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  Calendar,
  DollarSign,
  User as UserIcon,
  CreditCard,
  CloudCheck,
  CloudOff,
  UserCheck
} from "lucide-react";
import { Sale, StoreSettings, Product, User } from "../types";
import { downloadInvoicePDF, openPrintInvoice } from "../utils/pdfGenerator";

interface InvoicesViewProps {
  sales: Sale[];
  settings: StoreSettings;
  products: Product[];
  currentUser?: User;
  onViewInvoice: (sale: Sale) => void;
  onCreateCustomInvoice: () => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  sales,
  settings,
  currentUser,
  onViewInvoice,
  onCreateCustomInvoice
}) => {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [staffFilter, setStaffFilter] = useState<string>("All");

  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      s.invoiceNumber.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.customerEmail && s.customerEmail.toLowerCase().includes(q)) ||
      (s.cashierName && s.cashierName.toLowerCase().includes(q));
    const matchesMethod = methodFilter === "All" || s.paymentMethod === methodFilter;
    const matchesStaff =
      staffFilter === "All" ||
      (staffFilter === "mine" && currentUser && s.cashierName === currentUser.name) ||
      s.cashierName === staffFilter;
    return matchesSearch && matchesMethod && matchesStaff;
  });

  const mySalesCount = currentUser
    ? sales.filter((s) => s.cashierName === currentUser.name).length
    : 0;

  const totalBilled = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const avgOrder = filteredSales.length > 0 ? (totalBilled / filteredSales.length).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">
            Billing & Invoices
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Client invoices, instant PDF downloads, thermal slips, and cloud receipts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="create-b2b-invoice-btn"
            onClick={onCreateCustomInvoice}
            className="px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Custom Invoice</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Invoiced</span>
          <p className="text-2xl font-black font-mono text-zinc-900 mt-1">
            {settings.currency}{totalBilled.toFixed(2)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Across {sales.length} issued invoices</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Average Ticket</span>
          <p className="text-2xl font-black font-mono text-zinc-900 mt-1">
            {settings.currency}{avgOrder}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Average transaction size</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">PDF Export Engine</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <p className="text-sm font-bold text-emerald-800">Direct Vector PDF</p>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Includes tax compliance, barcode, and store return terms</p>
        </div>
      </div>

      {/* Search & Method Filters */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice #, client, cashier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Staff filter */}
          {currentUser && (
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setStaffFilter("All")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  staffFilter === "All" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                All Staff
              </button>
              <button
                type="button"
                onClick={() => setStaffFilter("mine")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  staffFilter === "mine" ? "bg-zinc-900 text-white shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>My Sales ({mySalesCount})</span>
              </button>
            </div>
          )}

          {/* Payment Method filter */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {["All", "Cash", "Card", "QR Code", "Split"].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  methodFilter === m
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Client / Customer</th>
                <th className="py-3.5 px-3">Staff / Cashier</th>
                <th className="py-3.5 px-3">Tender</th>
                <th className="py-3.5 px-3">Items</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-center">Sync</th>
                <th className="py-3.5 px-4 text-right">PDF Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-zinc-900 font-mono text-sm">
                      #{sale.invoiceNumber}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-zinc-500">
                    <p className="font-medium text-zinc-700">
                      {new Date(sale.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {new Date(sale.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-bold text-zinc-900">{sale.customerName || "Walk-in Customer"}</p>
                    {sale.customerEmail && (
                      <p className="text-[10px] text-zinc-400 truncate max-w-[150px]">
                        {sale.customerEmail}
                      </p>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded-md text-[11px]">
                      {sale.cashierName}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700">
                      {sale.paymentMethod}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 font-mono text-zinc-600">
                    {sale.items.reduce((acc, i) => acc + i.quantity, 0)} units
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-zinc-900">
                    {settings.currency}{sale.total.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {sale.synced ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Queued
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewInvoice(sale)}
                        title="Preview Digital Invoice"
                        className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadInvoicePDF(sale, settings)}
                        title="Download Vector PDF"
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => openPrintInvoice(sale, settings)}
                        title="Print Invoice"
                        className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSales.length === 0 && (
          <div className="p-12 text-center text-zinc-400">
            <FileText className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
            <p className="text-sm font-semibold text-zinc-700">No invoices match your search</p>
            <p className="text-xs text-zinc-400 mt-0.5">Completed checkout sales will generate invoices here</p>
          </div>
        )}
      </div>
    </div>
  );
};
