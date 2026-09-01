/**
 * ADMIN COMMON TYPE DEFINITIONS
 */

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'manager' | 'staff' | 'customer';
  isActive: boolean;
  createdAt: string;
}

export interface DashboardStats {
  revenue: number;
  ordersCount: number;
  avgOrderValue: number;
  newCustomers: number;
  revenueByDay: Array<{ day: string; revenue: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
  }>;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  items: Array<{
    id: string;
    productName: string;
    variantName?: string;
    sku: string;
    quantity: number;
    price: number;
    customizationText?: string;
  }>;
  createdAt: string;
}

export interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  categoryId: string;
  basePrice: number;
  isActive: boolean;
  allowEngraving: boolean;
  variantsCount: number;
  createdAt: string;
}
