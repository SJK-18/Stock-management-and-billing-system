import React, { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  UserCheck,
  AlertTriangle,
  ChevronDown,
  Lock
} from "lucide-react";
import { User, StoreSettings, InventoryAlert, ROLE_PERMISSIONS, TabId } from "../types";

export type ActiveTab = TabId;

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: StoreSettings;
  currentUser: User;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  offlineQueueCount: number;
  lastSyncTime: string;
  alerts: InventoryAlert[];
  onToggleOffline: () => void;
  onManualSync: () => void;
  onOpenUserSwitch: () => void;
  onLockTerminal: () => void;
  onSelectAlertProduct?: (productId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  currentUser,
  isOnline,
  isSimulatedOffline,
  isSyncing,
  offlineQueueCount,
  lastSyncTime,
  alerts,
  onToggleOffline,
  onManualSync,
  onOpenUserSwitch,
  onLockTerminal,
  onSelectAlertProduct
}) => {
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const permissions = ROLE_PERMISSIONS[currentUser.role] || ROLE_PERMISSIONS.cashier;
  const allowedTabs = permissions.allowedTabs;

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-2xs">
      {/* Top Banner for Offline Mode or Pending Queues */}
      {(!isOnline || offlineQueueCount > 0) && (
        <div className="bg-amber-500 text-zinc-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5" />
            <span>
              {!isOnline
                ? "Offline Mode Active — Operations run uninterrupted locally"
                : "Online with pending local sales to sync"}
            </span>
            {offlineQueueCount > 0 && (
              <span className="bg-zinc-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {offlineQueueCount} pending changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleOffline}
              className="text-[11px] underline font-bold hover:text-white transition-colors cursor-pointer"
            >
              {isSimulatedOffline ? "Turn Offline Simulation Off" : "Switch to Online"}
            </button>
            {isOnline && (
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1 font-bold shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Sync Now</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main App Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black tracking-wider text-sm shadow-sm border border-zinc-800">
              RF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base text-zinc-900 tracking-tight leading-none">
                  {settings.businessName}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                  Live Cloud
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                Sales • Inventory • Barcode POS & Invoicing
              </p>
            </div>
          </div>

          {/* Right Action Tools: Sync, Alerts, Active User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sync & Connectivity Pill */}
            <div className="flex items-center">
              <button
                id="cloud-sync-toggle-btn"
                onClick={onToggleOffline}
                title={isOnline ? "Click to simulate offline mode" : "Click to go online"}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isOnline
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                    : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                }`}
              >
                {isOnline ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden md:inline">Cloud Synced</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>Offline</span>
                  </>
                )}
              </button>

              {isOnline && (
                <button
                  id="manual-sync-btn"
                  onClick={onManualSync}
                  disabled={isSyncing}
                  title="Force refresh & sync with cloud server"
                  className="p-1.5 ml-1 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
                </button>
              )}
            </div>

            {/* Inventory Alerts Bell */}
            <div className="relative">
              <button
                id="inventory-alerts-btn"
                onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                className="relative p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* Alerts Dropdown */}
              {showAlertsDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 mb-2 px-1">
                    <span className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Inventory Alerts ({alerts.length})
                    </span>
                    <button
                      onClick={() => setShowAlertsDropdown(false)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-700"
                    >
                      Close
                    </button>
                  </div>

                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      All inventory levels are healthy!
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {alerts.map((al, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setShowAlertsDropdown(false);
                            if (onSelectAlertProduct) {
                              onSelectAlertProduct(al.product.id);
                            }
                            setActiveTab("inventory");
                          }}
                          className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 cursor-pointer transition-colors flex items-center justify-between text-xs"
                        >
                          <div className="truncate pr-2">
                            <p className="font-semibold text-zinc-900 truncate">{al.product.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">SKU: {al.product.sku}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                al.severity === "critical"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {al.product.stock <= 0 ? "OUT OF STOCK" : `${al.product.stock} LEFT`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Staff User Switcher */}
            <button
              id="user-profile-btn"
              onClick={onOpenUserSwitch}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white font-bold text-xs flex items-center justify-center">
                {currentUser.avatar}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-zinc-900 leading-tight">{currentUser.name}</p>
                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${permissions.badgeColor}`}>
                  {permissions.label}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
            </button>

            {/* Lock Terminal / Sign Out Button */}
            <button
              id="lock-terminal-btn"
              onClick={onLockTerminal}
              title="Lock Terminal & Enter PIN"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-700 font-bold text-xs border border-zinc-200 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-700" />
              <span className="hidden md:inline">Lock</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu (Role-Restricted) */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 border-t border-zinc-100">
          {allowedTabs.includes("dashboard") && (
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          )}

          {allowedTabs.includes("pos") && (
            <button
              id="nav-tab-pos"
              onClick={() => setActiveTab("pos")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "pos"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>POS Register</span>
            </button>
          )}

          {allowedTabs.includes("inventory") && (
            <button
              id="nav-tab-inventory"
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer relative ${
                activeTab === "inventory"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory & Stock</span>
              {alerts.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          )}

          {allowedTabs.includes("invoices") && (
            <button
              id="nav-tab-invoices"
              onClick={() => setActiveTab("invoices")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "invoices"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Billing & Invoices</span>
            </button>
          )}

          {allowedTabs.includes("analytics") && (
            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          )}

          {allowedTabs.includes("settings") && (
            <button
              id="nav-tab-settings"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "settings"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
