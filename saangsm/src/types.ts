export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
  is_active: number;
}

export type CategoryType = "imei" | "server" | "rental";

export interface Category {
  id: number;
  name: string;
  slug: string;
  type: CategoryType;
  description: string;
}

export interface ServiceInputRequirement {
  name: string;
  label: string;
  type: "text" | "email" | "select" | "number";
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface Service {
  id: number;
  category_id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  delivery_label: string;
  requires_input: string; // JSON string representing ServiceInputRequirement[]
  is_featured: number;
  is_active: number;
  stock: number;
  category_name?: string;
  category_type?: CategoryType;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

export interface Order {
  id: number;
  order_ref: string;
  user_id: number | null;
  service_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  customer_input: string; // JSON string
  status: OrderStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  service_title?: string;
  service_type?: CategoryType;
  delivery_label?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  category_name?: string;
}

export interface Payment {
  id: number;
  order_id: number;
  provider: string;
  phone_number: string;
  amount: number;
  external_transaction_id: string;
  status: "initiated" | "success" | "failed";
  raw_response: string;
  created_at: string;
}

export interface Rental {
  id: number;
  order_id: number;
  tool_name: string;
  access_credentials?: string;
  starts_at?: string;
  expires_at?: string;
  status: "active" | "expired" | "pending";
  created_at: string;
}

export interface OrderCountByStatus {
  status: OrderStatus;
  count: number;
}

export interface DashboardStats {
  total_revenue: number;
  orders_by_status: OrderCountByStatus[];
  customers_count: number;
  recent_orders: Array<
    Order & {
      customer_name: string;
      service_title: string;
    }
  >;
}
