import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Persistent store file path
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed products
const defaultProducts = [
  {
    id: "prod-1",
    name: "Artisan Roasted Coffee Beans 250g",
    sku: "CF-250-ART",
    barcode: "890123456001",
    category: "Beverages",
    costPrice: 6.50,
    retailPrice: 14.99,
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
    costPrice: 4.80,
    retailPrice: 11.50,
    stock: 5, // Low stock
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
    costPrice: 3.20,
    retailPrice: 9.90,
    stock: 0, // Out of stock
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
    costPrice: 9.00,
    retailPrice: 18.50,
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
    costPrice: 4.00,
    retailPrice: 12.00,
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
    costPrice: 7.50,
    retailPrice: 22.00,
    stock: 8, // Low stock
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
    costPrice: 1.80,
    retailPrice: 4.50,
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
    costPrice: 2.10,
    retailPrice: 6.90,
    stock: 14,
    minAlertThreshold: 10,
    unit: "bar",
    supplier: "Pure Botanical",
    taxRate: 8.5,
    updatedAt: new Date().toISOString()
  }
];

const defaultSettings = {
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

const defaultUsers = [
  { id: "usr-1", name: "Elena Rostova", role: "admin", pin: "1234", avatar: "ER", active: true },
  { id: "usr-2", name: "Marcus Chen", role: "manager", pin: "2345", avatar: "MC", active: true },
  { id: "usr-3", name: "Sarah Miller", role: "cashier", pin: "3456", avatar: "SM", active: true }
];

const defaultSales = [
  {
    id: "sale-1001",
    invoiceNumber: "INV-1039",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    items: [
      { productId: "prod-1", name: "Artisan Roasted Coffee Beans 250g", price: 14.99, cost: 6.50, quantity: 2, taxRate: 8.5 },
      { productId: "prod-7", name: "Belgian Dark Chocolate Bar 72% 100g", price: 4.50, cost: 1.80, quantity: 1, taxRate: 8.5 }
    ],
    subtotal: 34.48,
    discountAmount: 0,
    taxAmount: 2.93,
    total: 37.41,
    costTotal: 14.80,
    profit: 19.68,
    paymentMethod: "Card",
    paymentDetails: { cardType: "Visa", last4: "4242", authCode: "AUTH-8921", status: "completed" },
    customerName: "Alex Mercer",
    customerEmail: "alex.m@example.com",
    cashierName: "Sarah Miller",
    synced: true
  },
  {
    id: "sale-1002",
    invoiceNumber: "INV-1040",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    items: [
      { productId: "prod-4", name: "Cold Pressed Olive Oil 750ml", price: 18.50, cost: 9.00, quantity: 1, taxRate: 5.0 },
      { productId: "prod-5", name: "Eco Canvas Tote Bag - Heavyweight", price: 12.00, cost: 4.00, quantity: 1, taxRate: 8.5 }
    ],
    subtotal: 30.50,
    discountAmount: 3.05, // 10% promo
    taxAmount: 2.33,
    total: 29.78,
    costTotal: 13.00,
    profit: 14.45,
    paymentMethod: "QR Code",
    paymentDetails: { provider: "Instant Pay / UPI", refId: "TXN-QR-9904", status: "completed" },
    customerName: "David Kim",
    customerEmail: "david.kim@example.com",
    cashierName: "Elena Rostova",
    synced: true
  },
  {
    id: "sale-1003",
    invoiceNumber: "INV-1041",
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    items: [
      { productId: "prod-6", name: "Stainless Steel Double-Wall Tumbler", price: 22.00, cost: 7.50, quantity: 1, taxRate: 8.5 },
      { productId: "prod-1", name: "Artisan Roasted Coffee Beans 250g", price: 14.99, cost: 6.50, quantity: 1, taxRate: 8.5 }
    ],
    subtotal: 36.99,
    discountAmount: 0,
    taxAmount: 3.14,
    total: 40.13,
    costTotal: 14.00,
    profit: 22.99,
    paymentMethod: "Cash",
    paymentDetails: { tendered: 50.00, change: 9.87, status: "completed" },
    customerName: "Walk-in Customer",
    customerEmail: "",
    cashierName: "Sarah Miller",
    synced: true
  }
];

function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading store file, falling back to default", err);
  }
  return {
    products: defaultProducts,
    settings: defaultSettings,
    users: defaultUsers,
    sales: defaultSales,
    stockLogs: [
      { id: "log-1", productId: "prod-1", delta: 20, reason: "Restock PO-890", timestamp: new Date(Date.now() - 86400000).toISOString(), user: "Elena Rostova" },
      { id: "log-2", productId: "prod-3", delta: -5, reason: "Store display & inventory write-off", timestamp: new Date(Date.now() - 43200000).toISOString(), user: "Marcus Chen" }
    ],
    lastSyncTimestamp: new Date().toISOString()
  };
}

function saveStore(store: any) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving store file", err);
  }
}

let currentStore = loadStore();

// API Endpoints
app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Full state sync
app.get("/api/state", (_req, res) => {
  res.json({
    success: true,
    data: currentStore,
    serverTime: new Date().toISOString()
  });
});

// Cloud Sync endpoint for multi-device sync
app.post("/api/sync", (req, res) => {
  const { pendingSales = [], productUpdates = [], stockAdjustments = [], clientTimestamp } = req.body;

  let newSalesAdded = 0;
  // Apply pending offline sales
  if (Array.isArray(pendingSales) && pendingSales.length > 0) {
    for (const sale of pendingSales) {
      // Check if already present
      const existing = currentStore.sales.find((s: any) => s.id === sale.id);
      if (!existing) {
        currentStore.sales.unshift({ ...sale, synced: true });
        newSalesAdded++;

        // Deduct inventory stock if not already applied
        if (sale.items && Array.isArray(sale.items)) {
          for (const item of sale.items) {
            const product = currentStore.products.find((p: any) => p.id === item.productId);
            if (product) {
              product.stock = Math.max(0, product.stock - (item.quantity || 1));
              product.updatedAt = new Date().toISOString();
            }
          }
        }
      }
    }
  }

  // Apply product updates
  if (Array.isArray(productUpdates) && productUpdates.length > 0) {
    for (const pUpdate of productUpdates) {
      const idx = currentStore.products.findIndex((p: any) => p.id === pUpdate.id);
      if (idx >= 0) {
        currentStore.products[idx] = { ...currentStore.products[idx], ...pUpdate, updatedAt: new Date().toISOString() };
      } else {
        currentStore.products.push({ ...pUpdate, updatedAt: new Date().toISOString() });
      }
    }
  }

  // Apply stock adjustments
  if (Array.isArray(stockAdjustments) && stockAdjustments.length > 0) {
    for (const adj of stockAdjustments) {
      const product = currentStore.products.find((p: any) => p.id === adj.productId);
      if (product) {
        product.stock = Math.max(0, product.stock + adj.delta);
        product.updatedAt = new Date().toISOString();
        currentStore.stockLogs.unshift({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          productId: adj.productId,
          delta: adj.delta,
          reason: adj.reason || "Manual adjustment",
          timestamp: new Date().toISOString(),
          user: adj.user || "Staff"
        });
      }
    }
  }

  currentStore.lastSyncTimestamp = new Date().toISOString();
  saveStore(currentStore);

  res.json({
    success: true,
    newSalesAdded,
    serverTimestamp: currentStore.lastSyncTimestamp,
    data: currentStore
  });
});

// Update products directly
app.post("/api/products", (req, res) => {
  const product = req.body;
  if (!product.id) {
    product.id = `prod-${Date.now()}`;
  }
  product.updatedAt = new Date().toISOString();

  const idx = currentStore.products.findIndex((p: any) => p.id === product.id);
  if (idx >= 0) {
    currentStore.products[idx] = product;
  } else {
    currentStore.products.unshift(product);
  }
  saveStore(currentStore);
  res.json({ success: true, product });
});

// Delete product
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  currentStore.products = currentStore.products.filter((p: any) => p.id !== id);
  saveStore(currentStore);
  res.json({ success: true, id });
});

// Rename category across all products & settings
app.post("/api/categories/rename", (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) {
    return res.status(400).json({ success: false, message: "Missing oldName or newName" });
  }

  let count = 0;
  for (const prod of currentStore.products) {
    if (prod.category && prod.category.toLowerCase() === oldName.trim().toLowerCase()) {
      prod.category = newName.trim();
      prod.updatedAt = new Date().toISOString();
      count++;
    }
  }

  if (Array.isArray(currentStore.settings?.customCategories)) {
    currentStore.settings.customCategories = currentStore.settings.customCategories.map((c: string) =>
      c.toLowerCase() === oldName.trim().toLowerCase() ? newName.trim() : c
    );
  }

  saveStore(currentStore);
  res.json({ success: true, count, newName, oldName });
});

// Delete category and reassign products
app.post("/api/categories/delete", (req, res) => {
  const { categoryName, fallbackCategory = "General" } = req.body;
  if (!categoryName) {
    return res.status(400).json({ success: false, message: "Missing categoryName" });
  }

  let count = 0;
  for (const prod of currentStore.products) {
    if (prod.category && prod.category.toLowerCase() === categoryName.trim().toLowerCase()) {
      prod.category = fallbackCategory;
      prod.updatedAt = new Date().toISOString();
      count++;
    }
  }

  if (Array.isArray(currentStore.settings?.customCategories)) {
    currentStore.settings.customCategories = currentStore.settings.customCategories.filter(
      (c: string) => c.toLowerCase() !== categoryName.trim().toLowerCase()
    );
  }

  saveStore(currentStore);
  res.json({ success: true, count, reassignedTo: fallbackCategory });
});

// Create or update staff user
app.post("/api/users", (req, res) => {
  const userData = req.body;
  if (!userData || !userData.name || !userData.pin) {
    return res.status(400).json({ success: false, message: "Name and PIN are required." });
  }

  if (!userData.id) {
    userData.id = `usr-${Date.now()}`;
  }

  // Derive avatar initials if not provided
  if (!userData.avatar) {
    const parts = userData.name.trim().split(/\s+/);
    userData.avatar = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
  }

  const idx = currentStore.users.findIndex((u: any) => u.id === userData.id);
  if (idx >= 0) {
    currentStore.users[idx] = { ...currentStore.users[idx], ...userData };
  } else {
    currentStore.users.push(userData);
  }

  saveStore(currentStore);
  res.json({ success: true, user: userData, users: currentStore.users });
});

// Delete staff user
app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  if (currentStore.users.length <= 1) {
    return res.status(400).json({ success: false, message: "Cannot delete the only staff account." });
  }

  currentStore.users = currentStore.users.filter((u: any) => u.id !== id);
  saveStore(currentStore);
  res.json({ success: true, id, users: currentStore.users });
});

// Record direct sale
app.post("/api/sales", (req, res) => {
  const sale = req.body;
  if (!sale.id) {
    sale.id = `sale-${Date.now()}`;
  }
  sale.timestamp = sale.timestamp || new Date().toISOString();
  sale.synced = true;

  // Deduct stock
  if (Array.isArray(sale.items)) {
    for (const it of sale.items) {
      const prod = currentStore.products.find((p: any) => p.id === it.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - (it.quantity || 1));
        prod.updatedAt = new Date().toISOString();
      }
    }
  }

  currentStore.sales.unshift(sale);
  currentStore.settings.nextInvoiceNum = (currentStore.settings.nextInvoiceNum || 1045) + 1;
  saveStore(currentStore);
  res.json({ success: true, sale, remainingStock: currentStore.products });
});

// Stock adjustment endpoint
app.post("/api/stock/adjust", (req, res) => {
  const { productId, delta, reason, user } = req.body;
  const prod = currentStore.products.find((p: any) => p.id === productId);
  if (!prod) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  prod.stock = Math.max(0, prod.stock + Number(delta));
  prod.updatedAt = new Date().toISOString();

  const log = {
    id: `log-${Date.now()}`,
    productId,
    delta: Number(delta),
    reason: reason || "Inventory audit adjustment",
    timestamp: new Date().toISOString(),
    user: user || "Store Manager"
  };

  currentStore.stockLogs.unshift(log);
  saveStore(currentStore);
  res.json({ success: true, product: prod, log });
});

// Update Store Settings
app.post("/api/settings", (req, res) => {
  currentStore.settings = { ...currentStore.settings, ...req.body };
  saveStore(currentStore);
  res.json({ success: true, settings: currentStore.settings });
});

// Reset demo state
app.post("/api/reset-demo", (_req, res) => {
  currentStore = {
    products: defaultProducts,
    settings: defaultSettings,
    users: defaultUsers,
    sales: defaultSales,
    stockLogs: [
      { id: "log-1", productId: "prod-1", delta: 20, reason: "Restock PO-890", timestamp: new Date(Date.now() - 86400000).toISOString(), user: "Elena Rostova" }
    ],
    lastSyncTimestamp: new Date().toISOString()
  };
  saveStore(currentStore);
  res.json({ success: true, data: currentStore });
});

// Boot Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
