
export interface Customer {
  id: number;
  customer: number;
  customer_profile: CustomerProfile;
}

export interface CustomerProfile {
  id: number;
  name: string;
  color: number[];
  email: string;
  pincode: string;
  location_name: string;
  type: string;
  profile_pic: string | null;
  gst: string;
}

export interface SKU {
  id: number;
  selling_price: number;
  max_retail_price: number;
  amount: number;
  unit: string;
  quantity_in_inventory: number;
  product: number;
}

export interface Product {
  id: number;
  display_id: number;
  owner: number;
  name: string;
  category: string;
  characteristics: string;
  features: string;
  brand: string;
  sku: SKU[];
  updated_on: string;
  adding_date: string;
}

export interface OrderItem {
  sku_id: number;
  price: number;
  quantity: number;
  product_name?: string;  // Added for display purposes
}

export interface SaleOrder {
  id: number;
  customer_id: number;
  customer_name: string;
  items: OrderItem[];
  paid: boolean;
  invoice_no: string;
  invoice_date: string;
  created_at: string;
  last_modified: string;
  total_price: number;
}

export interface SaleOrderFormData {
  customer_id: number;
  items: OrderItem[];
  paid: boolean;
  invoice_no: string;
  invoice_date: string;
}

export type OrderStatus = "active" | "completed";

export interface User {
  username: string;
  password: string;
}
