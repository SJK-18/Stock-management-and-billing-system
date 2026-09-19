import React, { useState, useEffect } from "react";
import { store, AppState } from "./services/storeService";
import { Product, Sale, SaleItem, User } from "./types";
import { Header, ActiveTab } from "./components/Header";
import { DashboardView } from "./views/DashboardView";
import { POSView } from "./views/POSView";
import { InventoryView } from "./views/InventoryView";
import { InvoicesView } from "./views/InvoicesView";
import { AnalyticsView } from "./views/AnalyticsView";
import { SettingsView } from "./views/SettingsView";
import { BarcodeScannerModal } from "./components/BarcodeScannerModal";
import { BarcodeLabelModal } from "./components/BarcodeLabelModal";
import { PaymentModal } from "./components/PaymentModal";
import { InvoicePreviewModal } from "./components/InvoicePreviewModal";
import { QuickStockModal } from "./components/QuickStockModal";
import { ProductModal } from "./components/ProductModal";
import { UserSwitchModal } from "./components/UserSwitchModal";
import { CustomInvoiceModal } from "./components/CustomInvoiceModal";
import { CategoryManagerModal } from "./components/CategoryManagerModal";
import { StaffModal } from "./components/StaffModal";
import { PinLoginPage } from "./components/PinLoginPage";
import { soundManager } from "./utils/barcodeUtils";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { ROLE_PERMISSIONS } from "./types";

export default function App() {
  const [state, setState] = useState<AppState>(store.getState());
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Modals state
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [scannerContext, setScannerContext] = useState<"pos" | "inventory" | "product_edit">("pos");
  const [scannedBarcodeForEdit, setScannedBarcodeForEdit] = useState<string | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [cartCheckoutData, setCartCheckoutData] = useState<{
    items: SaleItem[];
    subtotal: number;
    askingSubtotal?: number;
    bargainSavings?: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    costTotal: number;
  } | null>(null);

  const [previewSale, setPreviewSale] = useState<Sale | null>(null);
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState<boolean>(false);

  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [barcodeLabelProduct, setBarcodeLabelProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState<boolean>(false);
  const [editingStaffUser, setEditingStaffUser] = useState<User | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);

  const [isUserSwitchOpen, setIsUserSwitchOpen] = useState<boolean>(false);
  const [isCustomInvoiceOpen, setIsCustomInvoiceOpen] = useState<boolean>(false);

  const [focusedProductId, setFocusedProductId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "warning" } | null>(null);

  useEffect(() => {
    const unsub = store.subscribe((newState) => {
      setState(newState);
    });
    store.init();
    return () => unsub();
  }, []);

  const showToast = (text: string, type: "success" | "info" | "warning" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Enforce role permissions on active tab whenever user or tab changes
  useEffect(() => {
    if (isAuthenticated && state.currentUser) {
      const perms = ROLE_PERMISSIONS[state.currentUser.role] || ROLE_PERMISSIONS.cashier;
      if (!perms.allowedTabs.includes(activeTab)) {
        setActiveTab(perms.defaultTab || "pos");
      }
    }
  }, [isAuthenticated, state.currentUser, activeTab]);

  const handleLoginSuccess = (user: User) => {
    store.setCurrentUser(user);
    setIsAuthenticated(true);
    const perms = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.cashier;
    setActiveTab(perms.defaultTab || "pos");
    showToast(`Logged in as ${user.name} (${perms.label})`);
  };

  const handleLockTerminal = () => {
    setIsAuthenticated(false);
    showToast("Terminal locked. Please enter PIN to access.", "info");
  };

  // Barcode Detection Handler
  const handleBarcodeDetected = (barcode: string) => {
    if (scannerContext === "product_edit") {
      setScannedBarcodeForEdit(barcode);
      showToast(`Scanned barcode: ${barcode}`);
      return;
    }

    const found = state.products.find((p) => p.barcode === barcode || p.sku === barcode);

    if (found) {
      if (activeTab === "inventory" || scannerContext === "inventory") {
        setFocusedProductId(found.id);
        setActiveTab("inventory");
        showToast(`Located in inventory: ${found.name}`);
        soundManager.playSuccess();
      } else {
        // POS mode
        setActiveTab("pos");
        showToast(`Scanned item: ${found.name} (${state.settings.currency}${found.retailPrice.toFixed(2)})`);
        soundManager.playSuccess();
      }
    } else {
      soundManager.playError();
      showToast(`No product found matching barcode "${barcode}"`, "warning");
    }
  };

  const handleProceedToPayment = (cartData: {
    items: SaleItem[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    costTotal: number;
  }) => {
    setCartCheckoutData(cartData);
    setPaymentModalOpen(true);
  };

  const handlePaymentComplete = async (
    saleData: Omit<Sale, "id" | "invoiceNumber" | "synced" | "timestamp">
  ): Promise<Sale> => {
    const recorded = await store.recordSale(saleData);
    showToast(`Sale #${recorded.invoiceNumber} recorded! Total: ${state.settings.currency}${recorded.total.toFixed(2)}`);
    return recorded;
  };

  const handleShowReceipt = (sale: Sale) => {
    setPreviewSale(sale);
    setIsInvoicePreviewOpen(true);
  };

  const handleStockAdjust = async (productId: string, delta: number, reason: string) => {
    await store.adjustStock(productId, delta, reason);
    showToast(`Stock updated by ${delta > 0 ? `+${delta}` : delta} units`);
  };

  const handleSaveProduct = async (product: Product) => {
    await store.saveProduct(product);
    showToast(`Saved product: ${product.name}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    await store.deleteProduct(productId);
    showToast("Product deleted from catalog", "info");
  };

  const handleAddCategory = async (name: string) => {
    await store.addCategory(name);
    showToast(`Category "${name}" created!`);
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    await store.renameCategory(oldName, newName);
    showToast(`Renamed category "${oldName}" to "${newName}" across inventory!`);
  };

  const handleDeleteCategory = async (name: string, fallback?: string) => {
    await store.deleteCategory(name, fallback);
    showToast(`Category "${name}" removed`);
  };

  const handleSaveStaff = async (userData: Partial<User> & { name: string; pin: string }) => {
    const saved = await store.saveUser(userData);
    showToast(userData.id ? `Updated staff profile for ${saved.name}!` : `Added new staff member ${saved.name}!`);
  };

  const handleDeleteStaff = async (userId: string) => {
    const userToDelete = state.users.find((u) => u.id === userId);
    const success = await store.deleteUser(userId);
    if (success) {
      showToast(`Removed staff account ${userToDelete?.name || ""}`);
    } else {
      showToast("Cannot delete the only remaining staff account", "warning");
    }
  };

  const alerts = store.getInventoryAlerts();

  // If not authenticated, render the dedicated PIN login page first
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <PinLoginPage
          users={state.users}
          settings={state.settings}
          isOnline={state.isOnline}
          onLoginSuccess={handleLoginSuccess}
          onOpenAddStaff={() => {
            setEditingStaffUser(null);
            setIsStaffModalOpen(true);
          }}
        />

        <StaffModal
          isOpen={isStaffModalOpen}
          onClose={() => {
            setIsStaffModalOpen(false);
            setEditingStaffUser(null);
          }}
          staffUser={editingStaffUser}
          onSave={handleSaveStaff}
          onDelete={handleDeleteStaff}
          totalStaffCount={state.users.length}
          currentUserId={state.currentUser.id}
        />

        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-zinc-900 text-white rounded-2xl shadow-xl border border-zinc-700 text-xs font-semibold animate-in slide-in-from-bottom-3">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={state.settings}
        currentUser={state.currentUser}
        isOnline={state.isOnline}
        isSimulatedOffline={state.isSimulatedOffline}
        isSyncing={state.isSyncing}
        offlineQueueCount={state.offlineQueueCount}
        lastSyncTime={state.lastSyncTime}
        alerts={alerts}
        onToggleOffline={() => {
          store.toggleSimulatedOffline();
          showToast(
            state.isSimulatedOffline
              ? "Reconnected to Cloud Server"
              : "Offline mode simulation active — changes queued locally",
            "info"
          );
        }}
        onManualSync={async () => {
          const success = await store.syncWithCloud();
          if (success) {
            showToast("Cloud synchronization complete!");
          } else {
            showToast("Cloud sync could not complete (check network)", "warning");
          }
        }}
        onOpenUserSwitch={() => setIsUserSwitchOpen(true)}
        onLockTerminal={handleLockTerminal}
        onSelectAlertProduct={(prodId) => setFocusedProductId(prodId)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-16">
        {activeTab === "dashboard" && (
          <DashboardView
            products={state.products}
            sales={state.sales}
            settings={state.settings}
            alerts={alerts}
            onOpenPOS={() => setActiveTab("pos")}
            onOpenInventory={() => setActiveTab("inventory")}
            onQuickRestock={(p) => {
              setQuickStockProduct(p);
            }}
            onViewInvoice={(sale) => {
              setPreviewSale(sale);
              setIsInvoicePreviewOpen(true);
            }}
          />
        )}

        {activeTab === "pos" && (
          <POSView
            products={state.products}
            settings={state.settings}
            cashierName={state.currentUser.name}
            onOpenScanner={() => {
              setScannerContext("pos");
              setScannerOpen(true);
            }}
            onProceedToPayment={handleProceedToPayment}
          />
        )}

        {activeTab === "inventory" && (
          <InventoryView
            products={state.products}
            settings={state.settings}
            stockLogs={state.stockLogs}
            focusedProductId={focusedProductId}
            onOpenProductModal={(p) => {
              setEditingProduct(p || null);
              setIsProductModalOpen(true);
            }}
            onOpenQuickStock={(p) => setQuickStockProduct(p)}
            onOpenBarcodeLabel={(p) => setBarcodeLabelProduct(p)}
            onOpenScanner={() => {
              setScannerContext("inventory");
              setScannerOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
          />
        )}

        {activeTab === "invoices" && (
          <InvoicesView
            sales={state.sales}
            settings={state.settings}
            products={state.products}
            currentUser={state.currentUser}
            onViewInvoice={(sale) => {
              setPreviewSale(sale);
              setIsInvoicePreviewOpen(true);
            }}
            onCreateCustomInvoice={() => setIsCustomInvoiceOpen(true)}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsView
            sales={state.sales}
            products={state.products}
            settings={state.settings}
          />
        )}

        {activeTab === "settings" && (
          <SettingsView
            settings={state.settings}
            users={state.users}
            currentUser={state.currentUser}
            isOnline={state.isOnline}
            isSimulatedOffline={state.isSimulatedOffline}
            isSyncing={state.isSyncing}
            categories={store.getCategories()}
            onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
            onEditStaff={(u) => {
              setEditingStaffUser(u);
              setIsStaffModalOpen(true);
            }}
            onAddStaff={() => {
              setEditingStaffUser(null);
              setIsStaffModalOpen(true);
            }}
            onUpdateSettings={async (newSettings) => {
              await store.updateSettings(newSettings);
              showToast("Store settings saved!");
            }}
            onToggleOffline={() => store.toggleSimulatedOffline()}
            onManualSync={() => store.syncWithCloud()}
            onResetDemo={() => {
              store.resetDemo();
              showToast("Reset to sample demo store data");
            }}
          />
        )}
      </main>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-zinc-900 text-white rounded-2xl shadow-xl border border-zinc-700 text-xs font-semibold animate-in slide-in-from-bottom-3">
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onBarcodeDetected={handleBarcodeDetected}
        sampleProducts={state.products}
      />

      {cartCheckoutData && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setCartCheckoutData(null);
          }}
          totalAmount={cartCheckoutData.totalAmount}
          subtotal={cartCheckoutData.subtotal}
          askingSubtotal={cartCheckoutData.askingSubtotal}
          bargainSavings={cartCheckoutData.bargainSavings}
          taxAmount={cartCheckoutData.taxAmount}
          discountAmount={cartCheckoutData.discountAmount}
          costTotal={cartCheckoutData.costTotal}
          items={cartCheckoutData.items}
          settings={state.settings}
          cashierName={state.currentUser.name}
          onPaymentComplete={handlePaymentComplete}
          onShowReceipt={handleShowReceipt}
        />
      )}

      <InvoicePreviewModal
        sale={previewSale}
        settings={state.settings}
        isOpen={isInvoicePreviewOpen}
        onClose={() => {
          setIsInvoicePreviewOpen(false);
          setPreviewSale(null);
        }}
      />

      <QuickStockModal
        product={quickStockProduct}
        isOpen={!!quickStockProduct}
        onClose={() => setQuickStockProduct(null)}
        onAdjust={handleStockAdjust}
      />

      <BarcodeLabelModal
        product={barcodeLabelProduct}
        settings={state.settings}
        isOpen={!!barcodeLabelProduct}
        onClose={() => setBarcodeLabelProduct(null)}
      />

      <ProductModal
        product={editingProduct}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
          setScannedBarcodeForEdit(null);
        }}
        onSave={handleSaveProduct}
        onOpenScanner={() => {
          setScannerContext("product_edit");
          setScannerOpen(true);
        }}
        scannedBarcode={scannedBarcodeForEdit}
        availableCategories={store.getCategories()}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
      />

      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={store.getCategories()}
        products={state.products}
        onAddCategory={handleAddCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => {
          setIsStaffModalOpen(false);
          setEditingStaffUser(null);
        }}
        staffUser={editingStaffUser}
        onSave={handleSaveStaff}
        onDelete={handleDeleteStaff}
        totalStaffCount={state.users.length}
        currentUserId={state.currentUser.id}
      />

      <UserSwitchModal
        users={state.users}
        currentUser={state.currentUser}
        isOpen={isUserSwitchOpen}
        onClose={() => setIsUserSwitchOpen(false)}
        onSelectUser={(user: User) => {
          store.setCurrentUser(user);
          const perms = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.cashier;
          if (!perms.allowedTabs.includes(activeTab)) {
            setActiveTab(perms.defaultTab || "pos");
          }
          showToast(`Switched terminal profile to ${user.name} (${perms.label})`);
        }}
        onEditUser={(user: User) => {
          setEditingStaffUser(user);
          setIsStaffModalOpen(true);
        }}
        onAddNewUser={() => {
          setEditingStaffUser(null);
          setIsStaffModalOpen(true);
        }}
      />

      <CustomInvoiceModal
        products={state.products}
        settings={state.settings}
        cashierName={state.currentUser.name}
        isOpen={isCustomInvoiceOpen}
        onClose={() => setIsCustomInvoiceOpen(false)}
        onGenerateInvoice={handlePaymentComplete}
        onShowReceipt={handleShowReceipt}
      />
    </div>
  );
}
