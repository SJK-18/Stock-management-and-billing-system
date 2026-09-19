export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  costPrice: number;
  retailPrice: number; // Maintained for compatibility (mirrors sellingRate or askingRate)
  askingRate: number;  // The Initial Quoted / Catalog / MRP Tag Rate shown to customer
  sellingRate: number; // The Default / Agreed Target Selling Rate
  minSellingRate?: number; // Minimum floor price to prevent selling below acceptable threshold
  stock: number;
  minAlertThreshold: number;
  unit: string;
  supplier: string;
  taxRate: number; // in percent, e.g. 8.5
  notes?: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number; // Effective agreed selling rate per unit
  askingRate: number; // Initial quoted/asking rate per unit
  sellingRate: number; // Negotiated/agreed selling rate per unit (same as price)
  cost: number;
  quantity: number;
  taxRate: number;
  discount?: number; // discount percentage on item
}

export type PaymentMethod = "Cash" | "Card" | "QR Code" | "Split";

export interface PaymentDetails {
  cardType?: string;
  last4?: string;
  authCode?: string;
  tendered?: number;
  change?: number;
  provider?: string;
  refId?: string;
  splitDetails?: {
    cashAmount?: number;
    cardAmount?: number;
  };
  status: "completed" | "pending";
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  items: SaleItem[];
  subtotal: number;
  askingSubtotal?: number; // Sum of asking rates * quantity
  bargainSavings?: number; // Total customer savings achieved through negotiation
  discountAmount: number;
  taxAmount: number;
  total: number;
  costTotal: number;
  profit: number;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  cashierName: string;
  cashierId?: string;
  synced: boolean;
  dueDate?: string;
  notes?: string;
}

export type TabId = "dashboard" | "pos" | "inventory" | "invoices" | "analytics" | "settings";

export interface RolePermission {
  role: UserRole;
  label: string;
  badgeColor: string;
  allowedTabs: TabId[];
  defaultTab: TabId;
  canManageSettings: boolean;
  canManageStaff: boolean;
  canEditCatalog: boolean;
  canDeleteProduct: boolean;
  canViewProfits: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  admin: {
    role: "admin",
    label: "Administrator",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    allowedTabs: ["dashboard", "pos", "inventory", "invoices", "analytics", "settings"],
    defaultTab: "dashboard",
    canManageSettings: true,
    canManageStaff: true,
    canEditCatalog: true,
    canDeleteProduct: true,
    canViewProfits: true
  },
  manager: {
    role: "manager",
    label: "Store Manager",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    allowedTabs: ["dashboard", "pos", "inventory", "invoices", "analytics"],
    defaultTab: "dashboard",
    canManageSettings: false,
    canManageStaff: false,
    canEditCatalog: true,
    canDeleteProduct: false,
    canViewProfits: true
  },
  cashier: {
    role: "cashier",
    label: "Cashier",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    allowedTabs: ["pos", "invoices"],
    defaultTab: "pos",
    canManageSettings: false,
    canManageStaff: false,
    canEditCatalog: false,
    canDeleteProduct: false,
    canViewProfits: false
  }
};

export interface StockLog {
  id: string;
  productId: string;
  delta: number;
  reason: string;
  timestamp: string;
  user: string;
}

export interface StoreSettings {
  businessName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  defaultTaxRate: number;
  receiptFooter: string;
  invoicePrefix: string;
  nextInvoiceNum: number;
  enableCloudSync: boolean;
  customCategories?: string[];
}

export type UserRole = "admin" | "manager" | "cashier";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  avatar: string;
  active: boolean;
}

export interface InventoryAlert {
  product: Product;
  type: "out_of_stock" | "low_stock";
  deficit: number;
  severity: "critical" | "warning";
}

export interface OfflineQueueItem {
  id: string;
  type: "sale" | "product_update" | "stock_adjust";
  payload: any;
  timestamp: string;
}
