import React, { useState } from "react";
import {
  Store,
  DollarSign,
  Wifi,
  Users,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Server,
  Tag,
  Plus,
  Edit2
} from "lucide-react";
import { StoreSettings, User } from "../types";

interface SettingsViewProps {
  settings: StoreSettings;
  users: User[];
  currentUser?: User;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  categories?: string[];
  onOpenCategoryManager?: () => void;
  onEditStaff?: (user: User) => void;
  onAddStaff?: () => void;
  onUpdateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  onToggleOffline: () => void;
  onManualSync: () => void;
  onResetDemo: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  users,
  currentUser,
  isOnline,
  isSimulatedOffline,
  isSyncing,
  categories = [],
  onOpenCategoryManager,
  onEditStaff,
  onAddStaff,
  onUpdateSettings,
  onToggleOffline,
  onManualSync,
  onResetDemo
}) => {
  const [form, setForm] = useState<StoreSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-xl font-black text-zinc-900 tracking-tight">
          Store & System Configuration
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Business information, tax rules, invoice sequences, staff roles, and cloud sync settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Profile */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <Store className="w-5 h-5 text-zinc-700" />
            <h3 className="font-bold text-sm text-zinc-900">Business Profile (Appears on Invoices & Receipts)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Business Name</label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Tagline / Slogan</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Store Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Tax / VAT ID (EIN)</label>
              <input
                type="text"
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* Currency & Tax Rules */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <DollarSign className="w-5 h-5 text-zinc-700" />
            <h3 className="font-bold text-sm text-zinc-900">Tax, Currency & Invoice Sequence</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3.5 py-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Default Sales Tax (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.defaultTaxRate}
                onChange={(e) => setForm({ ...form, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={form.invoicePrefix}
                onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                className="w-full px-3.5 py-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Receipt Footer & Return Policy
              </label>
              <textarea
                rows={2}
                value={form.receiptFooter}
                onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* Cloud Sync & Offline Settings */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <Wifi className="w-5 h-5 text-zinc-700" />
            <h3 className="font-bold text-sm text-zinc-900">Cloud Data Synchronization & Offline Mode</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <div>
              <p className="text-xs font-bold text-zinc-900">Cloud Sync Status</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {isOnline
                  ? "Connected to cloud backend. Multi-device sync is active."
                  : "Running in Offline Mode. Sales and updates are queued locally."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleOffline}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                  isSimulatedOffline
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                }`}
              >
                {isSimulatedOffline ? "Disable Offline Simulation" : "Simulate Offline Mode"}
              </button>
              <button
                type="button"
                disabled={!isOnline || isSyncing}
                onClick={onManualSync}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer"
              >
                {isSyncing ? "Syncing..." : "Sync Cloud Now"}
              </button>
            </div>
          </div>
        </div>

        {/* Product Categories & Departments */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-zinc-700" />
              <div>
                <h3 className="font-bold text-sm text-zinc-900">Product Categories & Departments</h3>
                <p className="text-[11px] text-zinc-500">Configure catalog categories, rename departments, and reassign products</p>
              </div>
            </div>
            {onOpenCategoryManager && (
              <button
                type="button"
                onClick={onOpenCategoryManager}
                className="px-3 py-1.5 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Edit / Manage Categories</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {categories.map((c) => (
              <span
                key={c}
                className="px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-800 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Staff Profiles Overview */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-700" />
              <div>
                <h3 className="font-bold text-sm text-zinc-900">Active Staff Accounts & PIN Codes</h3>
                <p className="text-[11px] text-zinc-500">Edit employee names, assign permissions, or update cashier PINs</p>
              </div>
            </div>
            {onAddStaff && (
              <button
                id="add-staff-btn"
                type="button"
                onClick={onAddStaff}
                className="px-3 py-1.5 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Staff Member</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {users.map((u) => {
              const isCurrent = currentUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent ? "border-zinc-900 bg-zinc-50 shadow-xs" : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {u.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-zinc-900">{u.name}</p>
                          {isCurrent && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 text-white">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">
                          {u.role}
                        </span>
                      </div>
                    </div>

                    {onEditStaff && (
                      <button
                        type="button"
                        onClick={() => onEditStaff(u)}
                        title={`Edit ${u.name}`}
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-2 border-t border-zinc-200/60">
                    <span>Quick PIN: <strong className="text-zinc-900">{u.pin}</strong></span>
                    {onEditStaff && (
                      <button
                        type="button"
                        onClick={() => onEditStaff(u)}
                        className="text-[10px] font-bold text-zinc-600 hover:text-zinc-900 underline font-sans cursor-pointer"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save & Reset Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              if (confirm("Reset application to original sample demo data?")) {
                onResetDemo();
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Store</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Settings Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Store Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
