import { Product, Sale, StoreSettings, User, StockLog, InventoryAlert, OfflineQueueItem } from "../types";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot
} from "firebase/firestore";

const LOCAL_STORAGE_KEY = "retailflow_data_v1";
const OFFLINE_QUEUE_KEY = "retailflow_offline_queue_v1";
const OFFLINE_SIM_KEY = "retailflow_offline_sim";

export interface AppState {
  products: Product[];
  sales: Sale[];
  settings: StoreSettings;
  users: User[];
  stockLogs: StockLog[];
  currentUser: User;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  offlineQueueCount: number;
  lastSyncTime: string;
}

export function normalizeProduct(p: any): Product {
  const askingRate = Number(p.askingRate ?? p.retailPrice ?? 0);
  const sellingRate = Number(p.sellingRate ?? p.retailPrice ?? askingRate);
  const costPrice = Number(p.costPrice ?? 0);
  const minSellingRate = p.minSellingRate !== undefined ? Number(p.minSellingRate) : Math.max(costPrice, Math.round(sellingRate * 0.85 * 100) / 100);

  return {
    ...p,
    costPrice,
    retailPrice: sellingRate,
    askingRate,
    sellingRate,
    minSellingRate,
    stock: Number(p.stock ?? 0),
    minAlertThreshold: Number(p.minAlertThreshold ?? 5),
    taxRate: Number(p.taxRate ?? 0)
  };
}

export function getAskingRate(p: Product): number {
  return p.askingRate !== undefined ? p.askingRate : p.retailPrice;
}

export function getSellingRate(p: Product): number {
  return p.sellingRate !== undefined ? p.sellingRate : p.retailPrice;
}

const defaultProducts: Product[] = [
  {
    id: "prod-1",
    name: "Artisan Roasted Coffee Beans 250g",
    sku: "CF-250-ART",
    barcode: "890123456001",
    category: "Beverages",
    costPrice: 6.5,
    retailPrice: 14.99,
    askingRate: 18.0,
    sellingRate: 14.99,
    minSellingRate: 11.5,
    stock: 24,
    minAlertThreshold: 10,
    unit: "bag",
    supplier: "Highland Roasters Co.",
    taxRate: 8.5,
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-2",
    name: "Organic Raw Wildflower Honey 500g",
    sku: "HNY-500-WLD",
    barcode: "890123456002",
    category: "Pantry",
    costPrice: 4.8,
    retailPrice: 11.5,
    askingRate: 14.0,
    sellingRate: 11.5,
    minSellingRate: 8.5,
    stock: 5,
    minAlertThreshold: 8,
    unit: "jar",
    supplier: "Golden Apiaries",
    taxRate: 5.0,
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-3",
    name: "Ceramic Minimalist Mug 350ml",
    sku: "MUG-350-MAT",
    barcode: "890123456003",
    category: "Home & Kitchen",
    costPrice: 3.2,
    retailPrice: 9.9,
    askingRate: 12.5,
    sellingRate: 9.9,
    minSellingRate: 6.5,
    stock: 0,
    minAlertThreshold: 5,
    unit: "pcs",
    supplier: "Clay & Co Craft",
    taxRate: 8.5,
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-4",
    name: "Cold Pressed Olive Oil 750ml",
    sku: "OIL-750-EVO",
    barcode: "890123456004",
    category: "Pantry",
    costPrice: 9.0,
    retailPrice: 18.5,
    askingRate: 22.5,
    sellingRate: 18.5,
    minSellingRate: 14.0,
    stock: 19,
    minAlertThreshold: 6,
    unit: "bottle",
    supplier: "Mediterranean Grove",
    taxRate: 5.0,
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-5",
    name: "Eco Canvas Tote Bag - Heavyweight",
    sku: "TOT-HVY-NAT",
    barcode: "890123456005",
    category: "Accessories",
    costPrice: 4.0,
    retailPrice: 12.0,
    askingRate: 15.0,
    sellingRate: 12.0,
    minSellingRate: 8.0,
    stock: 42,
    minAlertThreshold: 15,
    unit: "pcs",
    supplier: "GreenThreads Ltd",
    taxRate: 8.5,
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-6",
    name: "Stainless Steel Double-Wall Tumbler",
    sku: "TUM-SS-500",
    barcode: "890123456006",
    category: "Home & Kitchen",
    costPrice: 7.5,
    retailPrice: 22.0,
    askingRate: 26.0,
    sellingRate: 22.0,
    minSellingRate: 16.0,
    stock: 8,
    minAlertThreshold: 10,
    unit: "pcs",
    supplier: "ThermoWare Pro",
    taxRate: 8.5,
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-7",
    name: "Belgian Dark Chocolate Bar 72% 100g",
    sku: "CHO-72-BEL",
    barcode: "890123456007",
    category: "Snacks",
    costPrice: 1.8,
    retailPrice: 4.5,
    askingRate: 5.5,
    sellingRate: 4.5,
    minSellingRate: 3.2,
    stock: 65,
    minAlertThreshold: 20,
    unit: "bar",
    supplier: "Cacao Royale",
    taxRate: 8.5,
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-8",
    name: "Handcrafted Lavender Bar Soap 120g",
    sku: "SOP-LAV-120",
    barcode: "890123456008",
    category: "Personal Care",
    costPrice: 2.1,
    retailPrice: 6.9,
    askingRate: 8.5,
    sellingRate: 6.9,
    minSellingRate: 4.5,
    stock: 14,
    minAlertThreshold: 10,
    unit: "bar",
    supplier: "Pure Botanical",
    taxRate: 8.5,
    updatedAt: new Date().toISOString()
  }
];

const defaultSettings: StoreSettings = {
  businessName: "The Corner Market & Cafe",
  tagline: "Quality Provisions & Everyday Essentials",
  address: "482 Commerce Street, Suite 101, Metropolis, NY 10001",
  phone: "+1 (555) 234-8900",
  email: "hello@cornermarket.shop",
  taxId: "US-EIN-89-4209182",
  currency: "$",
  defaultTaxRate: 8.5,
  receiptFooter: "Thank you for shopping local! Returns accepted within 14 days with receipt.",
  invoicePrefix: "INV",
  nextInvoiceNum: 1045,
  enableCloudSync: true
};

const defaultUsers: User[] = [
  { id: "usr-1", name: "Elena Rostova", role: "admin", pin: "1234", avatar: "ER", active: true },
  { id: "usr-2", name: "Marcus Chen", role: "manager", pin: "2345", avatar: "MC", active: true },
  { id: "usr-3", name: "Sarah Miller", role: "cashier", pin: "3456", avatar: "SM", active: true }
];

export class StoreService {
  private listeners: ((state: AppState) => void)[] = [];
  private state: AppState;
  private isFirebaseInitialized = false;

  constructor() {
    const isSimOffline = localStorage.getItem(OFFLINE_SIM_KEY) === "true";
    const cached = this.loadLocalCache();

    this.state = {
      products: (cached?.products || defaultProducts).map(normalizeProduct),
      sales: cached?.sales || [],
      settings: cached?.settings || defaultSettings,
      users: cached?.users || defaultUsers,
      stockLogs: cached?.stockLogs || [],
      currentUser: cached?.currentUser || defaultUsers[0],
      isOnline: navigator.onLine && !isSimOffline,
      isSimulatedOffline: isSimOffline,
      isSyncing: false,
      offlineQueueCount: this.getOfflineQueue().length,
      lastSyncTime: new Date().toLocaleTimeString()
    };

    // Network listeners
    window.addEventListener("online", () => this.handleNetworkChange(true));
    window.addEventListener("offline", () => this.handleNetworkChange(false));
  }

  private handleNetworkChange(online: boolean) {
    const effectiveOnline = online && !this.state.isSimulatedOffline;
    this.state.isOnline = effectiveOnline;
    this.notify();
    if (effectiveOnline) {
      this.syncPendingQueue();
    }
  }

  public toggleSimulatedOffline(forceOffline?: boolean) {
    const nextState = forceOffline !== undefined ? forceOffline : !this.state.isSimulatedOffline;
    this.state.isSimulatedOffline = nextState;
    localStorage.setItem(OFFLINE_SIM_KEY, String(nextState));
    this.state.isOnline = navigator.onLine && !nextState;
    this.notify();
    if (this.state.isOnline) {
      this.syncPendingQueue();
    }
  }

  public getState(): AppState {
    return this.state;
  }

  public subscribe(listener: (state: AppState) => void) {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.saveLocalCache();
    this.state.offlineQueueCount = this.getOfflineQueue().length;
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  private loadLocalCache(): any {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveLocalCache() {
    try {
      const payload = {
        products: this.state.products,
        sales: this.state.sales,
        settings: this.state.settings,
        users: this.state.users,
        stockLogs: this.state.stockLogs,
        currentUser: this.state.currentUser
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Storage quota warning or disabled", e);
    }
  }

  public getOfflineQueue(): OfflineQueueItem[] {
    try {
      const q = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return q ? JSON.parse(q) : [];
    } catch {
      return [];
    }
  }

  private addToOfflineQueue(item: OfflineQueueItem) {
    const q = this.getOfflineQueue();
    q.push(item);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
    this.state.offlineQueueCount = q.length;
  }

  private clearOfflineQueue() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    this.state.offlineQueueCount = 0;
  }

  // Real-time Cloud Synchronization & Initialization
  public async init() {
    if (this.isFirebaseInitialized) return;
    this.isFirebaseInitialized = true;

    try {
      // 1. Listen to products in real-time
      const productsRef = collection(db, "products");
      onSnapshot(
        productsRef,
        async (snapshot) => {
          if (snapshot.empty) {
            // First time initialization: seed default products into Firestore
            console.log("Seeding default products to Firestore cloud database...");
            for (const p of defaultProducts) {
              try {
                await setDoc(doc(db, "products", p.id), p);
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, `products/${p.id}`);
              }
            }
          } else {
            const loadedProducts: Product[] = [];
            snapshot.forEach((docSnap) => {
              loadedProducts.push(normalizeProduct(docSnap.data()));
            });
            this.state.products = loadedProducts;
            this.state.lastSyncTime = new Date().toLocaleTimeString();
            this.notify();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, "products");
        }
      );

      // 2. Listen to store settings in real-time
      const settingsRef = doc(db, "settings", "store");
      onSnapshot(
        settingsRef,
        async (docSnap) => {
          if (!docSnap.exists()) {
            console.log("Seeding default settings to Firestore cloud database...");
            try {
              await setDoc(settingsRef, defaultSettings);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, "settings/store");
            }
          } else {
            this.state.settings = docSnap.data() as StoreSettings;
            this.notify();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, "settings/store");
        }
      );

      // 3. Listen to users / staff in real-time
      const usersRef = collection(db, "users");
      onSnapshot(
        usersRef,
        async (snapshot) => {
          if (snapshot.empty) {
            console.log("Seeding default users to Firestore cloud database...");
            for (const u of defaultUsers) {
              try {
                await setDoc(doc(db, "users", u.id), u);
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, `users/${u.id}`);
              }
            }
          } else {
            const loadedUsers: User[] = [];
            snapshot.forEach((docSnap) => {
              loadedUsers.push(docSnap.data() as User);
            });
            this.state.users = loadedUsers;

            // Keep current user updated
            const refreshed = loadedUsers.find((u) => u.id === this.state.currentUser.id);
            if (refreshed) {
              this.state.currentUser = refreshed;
            } else if (loadedUsers.length > 0) {
              this.state.currentUser = loadedUsers[0];
            }
            this.notify();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, "users");
        }
      );

      // 4. Listen to sales in real-time
      const salesRef = collection(db, "sales");
      onSnapshot(
        salesRef,
        (snapshot) => {
          const loadedSales: Sale[] = [];
          snapshot.forEach((docSnap) => {
            loadedSales.push(docSnap.data() as Sale);
          });
          // Sort newest first
          loadedSales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          this.state.sales = loadedSales;
          this.notify();
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, "sales");
        }
      );

      // 5. Listen to stock audit logs in real-time
      const logsRef = collection(db, "stockLogs");
      onSnapshot(
        logsRef,
        (snapshot) => {
          const loadedLogs: StockLog[] = [];
          snapshot.forEach((docSnap) => {
            loadedLogs.push(docSnap.data() as StockLog);
          });
          loadedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          this.state.stockLogs = loadedLogs;
          this.notify();
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, "stockLogs");
        }
      );
    } catch (err) {
      console.warn("Firestore connection initialization notice:", err);
    }

    // Process any offline items if online
    if (this.state.isOnline) {
      this.syncPendingQueue();
    }
  }

  // Sync any pending items created while offline
  public async syncPendingQueue(): Promise<void> {
    if (this.state.isSimulatedOffline || !navigator.onLine) return;
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return;

    this.state.isSyncing = true;
    this.notify();

    try {
      for (const item of queue) {
        if (item.type === "sale") {
          const sale = item.payload as Sale;
          await setDoc(doc(db, "sales", sale.id), { ...sale, synced: true });
        } else if (item.type === "product_update") {
          const product = item.payload as Product;
          await setDoc(doc(db, "products", product.id), product);
        } else if (item.type === "stock_adjust") {
          const { productId, delta, reason, user } = item.payload;
          const prod = this.state.products.find((p) => p.id === productId);
          if (prod) {
            await setDoc(doc(db, "products", prod.id), prod);
          }
          const logId = `log-${Date.now()}`;
          await setDoc(doc(db, "stockLogs", logId), {
            id: logId,
            productId,
            delta,
            reason,
            timestamp: new Date().toISOString(),
            user
          });
        }
      }
      this.clearOfflineQueue();
      this.state.lastSyncTime = new Date().toLocaleTimeString();
    } catch (err) {
      console.warn("Error processing offline queue:", err);
    } finally {
      this.state.isSyncing = false;
      this.notify();
    }
  }

  public async syncWithCloud(): Promise<boolean> {
    await this.syncPendingQueue();
    this.state.lastSyncTime = new Date().toLocaleTimeString();
    this.notify();
    return true;
  }

  // Process a sale (POS Checkout or Invoice payment)
  public async recordSale(saleData: Omit<Sale, "id" | "invoiceNumber" | "synced" | "timestamp">): Promise<Sale> {
    const saleId = `sale-${Date.now()}`;
    const invoiceNum = `${this.state.settings.invoicePrefix}-${this.state.settings.nextInvoiceNum}`;

    this.state.settings.nextInvoiceNum += 1;

    const fullSale: Sale = {
      ...saleData,
      id: saleId,
      invoiceNumber: invoiceNum,
      timestamp: new Date().toISOString(),
      synced: this.state.isOnline
    };

    // 1. Deduct stock immediately in local state
    const updatedProducts: Product[] = [];
    for (const item of fullSale.items) {
      const product = this.state.products.find((p) => p.id === item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        product.updatedAt = new Date().toISOString();
        updatedProducts.push(product);
      }
    }

    // 2. Add to sales list
    this.state.sales.unshift(fullSale);
    this.notify();

    // 3. Persist to Firestore
    if (this.state.isOnline) {
      try {
        await setDoc(doc(db, "sales", fullSale.id), fullSale);
        for (const p of updatedProducts) {
          await setDoc(doc(db, "products", p.id), p);
        }
        await setDoc(doc(db, "settings", "store"), this.state.settings);
      } catch (err) {
        this.addToOfflineQueue({
          id: `q-${Date.now()}`,
          type: "sale",
          payload: fullSale,
          timestamp: new Date().toISOString()
        });
        handleFirestoreError(err, OperationType.WRITE, `sales/${fullSale.id}`);
      }
    } else {
      fullSale.synced = false;
      this.addToOfflineQueue({
        id: `q-${Date.now()}`,
        type: "sale",
        payload: fullSale,
        timestamp: new Date().toISOString()
      });
    }

    this.notify();
    return fullSale;
  }

  // Adjust stock level for a product
  public async adjustStock(productId: string, delta: number, reason: string): Promise<void> {
    const prod = this.state.products.find((p) => p.id === productId);
    if (!prod) return;

    prod.stock = Math.max(0, prod.stock + delta);
    prod.updatedAt = new Date().toISOString();

    const log: StockLog = {
      id: `log-${Date.now()}`,
      productId,
      delta,
      reason,
      timestamp: new Date().toISOString(),
      user: this.state.currentUser.name
    };
    this.state.stockLogs.unshift(log);
    this.notify();

    if (this.state.isOnline) {
      try {
        await setDoc(doc(db, "products", prod.id), prod);
        await setDoc(doc(db, "stockLogs", log.id), log);
      } catch (err) {
        this.addToOfflineQueue({
          id: `q-stock-${Date.now()}`,
          type: "stock_adjust",
          payload: { productId, delta, reason, user: this.state.currentUser.name },
          timestamp: new Date().toISOString()
        });
        handleFirestoreError(err, OperationType.WRITE, `products/${prod.id}`);
      }
    } else {
      this.addToOfflineQueue({
        id: `q-stock-${Date.now()}`,
        type: "stock_adjust",
        payload: { productId, delta, reason, user: this.state.currentUser.name },
        timestamp: new Date().toISOString()
      });
    }
    this.notify();
  }

  // Save product (create or edit)
  public async saveProduct(product: Product): Promise<void> {
    const normalized = normalizeProduct(product);
    const exists = this.state.products.some((p) => p.id === normalized.id);
    if (exists) {
      this.state.products = this.state.products.map((p) => (p.id === normalized.id ? normalized : p));
    } else {
      this.state.products.unshift(normalized);
    }
    this.notify();

    if (this.state.isOnline) {
      try {
        await setDoc(doc(db, "products", normalized.id), normalized);
      } catch (err) {
        this.addToOfflineQueue({
          id: `q-prod-${Date.now()}`,
          type: "product_update",
          payload: normalized,
          timestamp: new Date().toISOString()
        });
        handleFirestoreError(err, OperationType.WRITE, `products/${normalized.id}`);
      }
    } else {
      this.addToOfflineQueue({
        id: `q-prod-${Date.now()}`,
        type: "product_update",
        payload: normalized,
        timestamp: new Date().toISOString()
      });
    }
    this.notify();
  }

  // Delete product
  public async deleteProduct(productId: string): Promise<void> {
    this.state.products = this.state.products.filter((p) => p.id !== productId);
    this.notify();

    if (this.state.isOnline) {
      try {
        await deleteDoc(doc(db, "products", productId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
      }
    }
  }

  // Update Settings
  public async updateSettings(settings: Partial<StoreSettings>): Promise<void> {
    this.state.settings = { ...this.state.settings, ...settings };
    this.notify();

    if (this.state.isOnline) {
      try {
        await setDoc(doc(db, "settings", "store"), this.state.settings);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "settings/store");
      }
    }
  }

  // Switch Active User / Cashier
  public setCurrentUser(user: User) {
    this.state.currentUser = user;
    this.notify();
  }

  // Reset Demo Data
  public async resetDemo() {
    this.state.products = [...defaultProducts];
    this.state.settings = { ...defaultSettings };
    this.state.users = [...defaultUsers];
    this.state.sales = [];
    this.state.stockLogs = [];
    this.clearOfflineQueue();
    this.notify();

    if (this.state.isOnline) {
      try {
        for (const p of defaultProducts) {
          await setDoc(doc(db, "products", p.id), p);
        }
        for (const u of defaultUsers) {
          await setDoc(doc(db, "users", u.id), u);
        }
        await setDoc(doc(db, "settings", "store"), defaultSettings);
      } catch (err) {
        console.warn("Reset demo cloud warning:", err);
      }
    }
  }

  // Category management
  public getCategories(): string[] {
    const defaultBaseline = [
      "Beverages",
      "Pantry",
      "Snacks",
      "Home & Kitchen",
      "Accessories",
      "Personal Care",
      "General"
    ];
    const custom = this.state.settings.customCategories || [];
    const fromProducts = this.state.products.map((p) => p.category).filter(Boolean);
    const combined = Array.from(new Set([...custom, ...fromProducts, ...defaultBaseline]));
    return combined;
  }

  public async addCategory(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    const currentCustom = this.state.settings.customCategories || this.getCategories();
    if (!currentCustom.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...currentCustom, trimmed];
      await this.updateSettings({ customCategories: updated });
    }
  }

  public async renameCategory(oldCategory: string, newCategory: string): Promise<void> {
    const trimmedOld = oldCategory.trim();
    const trimmedNew = newCategory.trim();
    if (!trimmedOld || !trimmedNew || trimmedOld.toLowerCase() === trimmedNew.toLowerCase()) return;

    // 1. Update all products having oldCategory
    const updatedProducts: Product[] = [];
    this.state.products = this.state.products.map((p) => {
      if (p.category.toLowerCase() === trimmedOld.toLowerCase()) {
        const updated = { ...p, category: trimmedNew, updatedAt: new Date().toISOString() };
        updatedProducts.push(updated);
        return updated;
      }
      return p;
    });

    // 2. Update customCategories in settings
    const currentList = this.getCategories();
    const nextCategories = Array.from(
      new Set(currentList.map((c) => (c.toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : c)))
    );
    this.state.settings.customCategories = nextCategories;
    this.notify();

    // 3. Persist and sync to Firestore
    if (this.state.isOnline) {
      try {
        for (const prod of updatedProducts) {
          await setDoc(doc(db, "products", prod.id), prod);
        }
        await setDoc(doc(db, "settings", "store"), this.state.settings);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "products");
      }
    }
  }

  public async deleteCategory(categoryToDelete: string, fallbackCategory: string = "General"): Promise<void> {
    const trimmed = categoryToDelete.trim();
    if (!trimmed) return;

    // 1. Reassign any product that used this category
    const updatedProducts: Product[] = [];
    this.state.products = this.state.products.map((p) => {
      if (p.category.toLowerCase() === trimmed.toLowerCase()) {
        const updated = { ...p, category: fallbackCategory, updatedAt: new Date().toISOString() };
        updatedProducts.push(updated);
        return updated;
      }
      return p;
    });

    // 2. Remove from customCategories
    const currentList = this.getCategories();
    const nextCategories = currentList.filter((c) => c.toLowerCase() !== trimmed.toLowerCase());
    if (!nextCategories.some((c) => c.toLowerCase() === fallbackCategory.toLowerCase())) {
      nextCategories.push(fallbackCategory);
    }
    this.state.settings.customCategories = nextCategories;
    this.notify();

    // 3. Persist and sync to Firestore
    if (this.state.isOnline) {
      try {
        for (const prod of updatedProducts) {
          await setDoc(doc(db, "products", prod.id), prod);
        }
        await setDoc(doc(db, "settings", "store"), this.state.settings);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "products");
      }
    }
  }

  // Staff management
  public async saveUser(user: Partial<User> & { name: string; pin: string }): Promise<User> {
    let finalUser: User;
    const existingIdx = user.id ? this.state.users.findIndex((u) => u.id === user.id) : -1;

    // Compute initials for avatar
    const nameParts = user.name.trim().split(/\s+/);
    const avatar =
      user.avatar ||
      (nameParts.length > 1
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
        : user.name.trim().slice(0, 2).toUpperCase());

    if (existingIdx >= 0 && user.id) {
      finalUser = {
        ...this.state.users[existingIdx],
        ...user,
        avatar
      };
      this.state.users[existingIdx] = finalUser;
    } else {
      finalUser = {
        id: user.id || `usr-${Date.now()}`,
        name: user.name.trim(),
        role: user.role || "cashier",
        pin: user.pin.trim(),
        avatar,
        active: user.active ?? true
      };
      this.state.users.push(finalUser);
    }

    if (this.state.currentUser.id === finalUser.id) {
      this.state.currentUser = finalUser;
    }

    this.saveLocalCache();
    this.notify();

    if (this.state.isOnline) {
      try {
        await setDoc(doc(db, "users", finalUser.id), finalUser);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${finalUser.id}`);
      }
    }

    return finalUser;
  }

  public async deleteUser(userId: string): Promise<boolean> {
    if (this.state.users.length <= 1) {
      return false;
    }

    this.state.users = this.state.users.filter((u) => u.id !== userId);

    if (this.state.currentUser.id === userId && this.state.users.length > 0) {
      this.state.currentUser = this.state.users[0];
    }

    this.saveLocalCache();
    this.notify();

    if (this.state.isOnline) {
      try {
        await deleteDoc(doc(db, "users", userId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
      }
    }

    return true;
  }

  // Get active inventory alerts
  public getInventoryAlerts(): InventoryAlert[] {
    const alerts: InventoryAlert[] = [];
    for (const p of this.state.products) {
      if (p.stock <= 0) {
        alerts.push({
          product: p,
          type: "out_of_stock",
          deficit: p.minAlertThreshold,
          severity: "critical"
        });
      } else if (p.stock <= p.minAlertThreshold) {
        alerts.push({
          product: p,
          type: "low_stock",
          deficit: p.minAlertThreshold - p.stock,
          severity: "warning"
        });
      }
    }
    return alerts.sort((a, b) => (a.severity === "critical" ? -1 : 1));
  }
}

export const store = new StoreService();
