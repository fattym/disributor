import { api } from './api';

export type AccountType =
  | 'CUSTOMER'
  | 'SELLER'
  | 'TEACHER'
  | 'SCHOOL_ACCOUNT'
  | 'ADMINISTRATOR';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  account_type: AccountType;
  registration_date: string;
  status: UserStatus;
  last_login: string | null;
  avatar?: string | null;
}

export interface AdminSeller {
  id: number;
  store_name: string;
  owner: string;
  owner_email: string;
  products: number;
  orders: number;
  revenue: string;
  commission: string;
  status: UserStatus;
  registration_date: string;
  verified: boolean;
  payout_method?: string;
}

export interface AdminProduct {
  id: number;
  name: string;
  seller: string;
  seller_id: number;
  price: string;
  stock: number;
  status: 'PUBLISHED' | 'DRAFT' | 'PENDING_APPROVAL' | 'OUT_OF_STOCK' | 'DELETED';
  featured?: boolean;
  created_at: string;
  category: string;
  sku?: string;
  brand?: string;
  product_type?: 'physical' | 'digital' | 'service';
  cost_price?: string;
  tags?: string[];
  variants?: Array<{ label: string; size?: string; color?: string; stock_quantity?: number }>;
}

export interface AdminCourse {
  id: number;
  title: string;
  instructor: string;
  instructor_email: string;
  students: number;
  price: string;
  rating: number;
  rating_count: number;
  status: 'PUBLISHED' | 'DRAFT' | 'PENDING_APPROVAL' | 'DELETED';
  category: string;
  created_at: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type FundStatus = 'HELD' | 'RELEASED' | 'REFUNDED';

export interface AdminOrder {
  id: number;
  order_number: string;
  customer: string;
  customer_email: string;
  items: number;
  amount: string;
  payment: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  status: OrderStatus;
  fund_status?: FundStatus;
  disputed?: boolean;
  date: string;
  is_digital: boolean;
}

export type PaymentStatus = 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'REFUNDED';

export interface AdminPayment {
  id: number;
  transaction_id: string;
  order: string;
  customer: string;
  amount: string;
  method: 'M-Pesa' | 'Visa' | 'Mastercard' | 'Other';
  date: string;
  status: PaymentStatus;
}

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export interface AdminWithdrawal {
  id: number;
  seller: string;
  seller_id: number;
  amount: string;
  platform_fee: string;
  seller_receives: string;
  status: WithdrawalStatus;
  requested_at: string;
  paid_at: string | null;
  payout_method: string;
}

export interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  product_count: number;
  course_count: number;
  children: CategoryNode[];
}

export interface AdminReview {
  id: number;
  product: string;
  product_id: number;
  customer: string;
  rating: number;
  comment: string;
  date: string;
  status: 'APPROVED' | 'HIDDEN' | 'PENDING';
}

export interface AdminCoupon {
  id: number;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: string;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used: number;
  active: boolean;
  created_at: string;
}

export interface PlatformNotification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}

export interface ContentItem {
  id: number;
  key: string;
  title: string;
  content: string;
  type: 'page' | 'banner' | 'section';
  updated_at: string;
}

export interface AdminSettings {
  commission: number;
  currency: string;
  currency_symbol: string;
  default_country: string;
  allow_seller_registration: boolean;
  require_product_approval: boolean;
  require_course_approval: boolean;
  mpesa_enabled: boolean;
  visa_enabled: boolean;
  tax_rate: number;
  email_notifications: boolean;
}

export type Stat = {
  label: string;
  value: string;
  icon: string;
  href: string;
};

export type SalesPoint = {
  month: string;
  revenue: number;
  orders: number;
};

// ---- Mock data ----

export const mockStats: Record<string, Stat> = {
  totalRevenue: {
    label: 'Total Revenue',
    value: 'KSh 4,850,000',
    icon: '💰',
    href: '/admin/reports',
  },
  todayRevenue: {
    label: "Today's Revenue",
    value: 'KSh 125,400',
    icon: '📈',
    href: '/admin/reports',
  },
  totalOrders: {
    label: 'Total Orders',
    value: '3,421',
    icon: '📦',
    href: '/admin/orders',
  },
  pendingOrders: {
    label: 'Pending Orders',
    value: '86',
    icon: '⏳',
    href: '/admin/orders',
  },
  totalCustomers: {
    label: 'Total Customers',
    value: '12,850',
    icon: '👥',
    href: '/admin/users/customers',
  },
  activeSellers: {
    label: 'Active Sellers',
    value: '486',
    icon: '🏪',
    href: '/admin/sellers',
  },
  totalProducts: {
    label: 'Total Products',
    value: '8,420',
    icon: '📚',
    href: '/admin/products',
  },
  totalCourses: {
    label: 'Total Courses',
    value: '725',
    icon: '🎓',
    href: '/admin/courses',
  },
};

export const mockStatsList: Stat[] = [
  mockStats.totalRevenue,
  mockStats.todayRevenue,
  mockStats.totalOrders,
  mockStats.pendingOrders,
  mockStats.totalCustomers,
  mockStats.activeSellers,
  mockStats.totalProducts,
  mockStats.totalCourses,
];

export const mockSalesData: SalesPoint[] = [
  { month: 'Jan', revenue: 120000, orders: 320 },
  { month: 'Feb', revenue: 180000, orders: 450 },
  { month: 'Mar', revenue: 150000, orders: 390 },
  { month: 'Apr', revenue: 210000, orders: 510 },
  { month: 'May', revenue: 175000, orders: 430 },
  { month: 'Jun', revenue: 240000, orders: 580 },
  { month: 'Jul', revenue: 260000, orders: 640 },
  { month: 'Aug', revenue: 290000, orders: 690 },
  { month: 'Sep', revenue: 310000, orders: 730 },
  { month: 'Oct', revenue: 340000, orders: 810 },
  { month: 'Nov', revenue: 380000, orders: 920 },
  { month: 'Dec', revenue: 420000, orders: 1050 },
];

export const mockRecentOrders: AdminOrder[] = [
  {
    id: 10245,
    order_number: 'LP10245',
    customer: 'Jane Wanjiku',
    customer_email: 'jane.wanjiku@email.com',
    items: 3,
    amount: '4500.00',
    payment: 'PAID',
    status: 'PROCESSING',
    date: '2026-09-27T08:30:00Z',
    is_digital: false,
  },
  {
    id: 10244,
    order_number: 'LP10244',
    customer: 'Samuel Ochieng',
    customer_email: 'sam@email.com',
    items: 1,
    amount: '1250.00',
    payment: 'PAID',
    status: 'DELIVERED',
    date: '2026-09-26T14:20:00Z',
    is_digital: true,
  },
  {
    id: 10243,
    order_number: 'LP10243',
    customer: 'Amina Hassan',
    customer_email: 'amina.hassan@email.com',
    items: 5,
    amount: '7800.00',
    payment: 'PENDING',
    status: 'PENDING',
    date: '2026-09-26T11:05:00Z',
    is_digital: false,
  },
  {
    id: 10242,
    order_number: 'LP10242',
    customer: 'David Mwangi',
    customer_email: 'david.mwangi@email.com',
    items: 2,
    amount: '3200.00',
    payment: 'PAID',
    status: 'SHIPPED',
    date: '2026-09-25T16:45:00Z',
    is_digital: false,
  },
  {
    id: 10241,
    order_number: 'LP10241',
    customer: 'Fatuma Ali',
    customer_email: 'fatuma.ali@email.com',
    items: 1,
    amount: '2500.00',
    payment: 'PAID',
    status: 'DELIVERED',
    date: '2026-09-25T09:10:00Z',
    is_digital: true,
  },
];

export const mockNotifications: PlatformNotification[] = [
  {
    id: 1,
    title: 'New seller applications',
    message: '5 new seller applications require your review',
    type: 'info',
    read: false,
    created_at: '2026-09-27T09:00:00Z',
  },
  {
    id: 2,
    title: 'Product approvals',
    message: '3 products waiting for approval',
    type: 'warning',
    read: false,
    created_at: '2026-09-27T08:45:00Z',
  },
  {
    id: 3,
    title: 'Withdrawal requests',
    message: '8 withdrawal requests are pending',
    type: 'info',
    read: false,
    created_at: '2026-09-26T18:30:00Z',
  },
  {
    id: 4,
    title: 'Payment failures',
    message: '2 payment failures detected',
    type: 'error',
    read: true,
    created_at: '2026-09-26T14:12:00Z',
  },
  {
    id: 5,
    title: 'Reported reviews',
    message: '4 reviews have been reported and need moderation',
    type: 'warning',
    read: true,
    created_at: '2026-09-26T11:00:00Z',
  },
];

export const mockUsers: AdminUser[] = [
  {
    id: 1,
    name: 'Jane Wanjiku',
    email: 'jane.wanjiku@email.com',
    phone: '+254 712 345 678',
    account_type: 'CUSTOMER',
    registration_date: '2024-03-12',
    status: 'ACTIVE',
    last_login: '2026-09-27T08:30:00Z',
  },
  {
    id: 2,
    name: 'ABC Education',
    email: 'abc@education.co.ke',
    phone: '+254 700 111 222',
    account_type: 'SELLER',
    registration_date: '2024-01-08',
    status: 'ACTIVE',
    last_login: '2026-09-26T14:20:00Z',
  },
  {
    id: 3,
    name: 'John Kamau',
    email: 'john.kamau@teacher.ke',
    phone: '+254 722 333 444',
    account_type: 'TEACHER',
    registration_date: '2024-06-15',
    status: 'ACTIVE',
    last_login: '2026-09-25T10:00:00Z',
  },
  {
    id: 4,
    name: 'Nairobi Primary School',
    email: 'info@nairobi-primary.ac.ke',
    phone: '+254 20 123 4567',
    account_type: 'SCHOOL_ACCOUNT',
    registration_date: '2023-11-20',
    status: 'ACTIVE',
    last_login: '2026-09-24T16:45:00Z',
  },
  {
    id: 5,
    name: 'Samuel Ochieng',
    email: 'sam.ochieng@email.com',
    phone: '+254 733 555 666',
    account_type: 'CUSTOMER',
    registration_date: '2025-02-01',
    status: 'SUSPENDED',
    last_login: '2026-09-20T09:00:00Z',
  },
  {
    id: 6,
    name: 'Grace Njoroge',
    email: 'grace@admin.learningpack.ke',
    phone: '+254 711 000 111',
    account_type: 'ADMINISTRATOR',
    registration_date: '2022-08-01',
    status: 'ACTIVE',
    last_login: '2026-09-27T09:50:00Z',
  },
  {
    id: 8,
    name: 'Amina Hassan',
    email: 'amina.hassan@email.com',
    phone: '+254 709 888 777',
    account_type: 'SELLER',
    registration_date: '2025-08-30',
    status: 'PENDING',
    last_login: null,
  },
];

export const mockSellers: AdminSeller[] = [
  {
    id: 1,
    store_name: 'ABC Education',
    owner: 'Mary Ochieng',
    owner_email: 'mary@abceducation.co.ke',
    products: 125,
    orders: 342,
    revenue: '850000.00',
    commission: '85000.00',
    status: 'ACTIVE',
    registration_date: '2024-01-08',
    verified: true,
    payout_method: 'M-Pesa',
  },
  {
    id: 2,
    store_name: 'Smart Teachers',
    owner: 'David Mwangi',
    owner_email: 'david@smartteachers.co.ke',
    products: 87,
    orders: 210,
    revenue: '523000.00',
    commission: '52300.00',
    status: 'ACTIVE',
    registration_date: '2024-03-22',
    verified: true,
    payout_method: 'Bank',
  },
  {
    id: 3,
    store_name: 'Kenya Books Ltd',
    owner: 'Sarah Mutua',
    owner_email: 'sarah@kenyabooks.co.ke',
    products: 340,
    orders: 588,
    revenue: '1280000.00',
    commission: '128000.00',
    status: 'ACTIVE',
    registration_date: '2023-09-14',
    verified: true,
    payout_method: 'M-Pesa',
  },
  {
    id: 4,
    store_name: 'Bright Minds',
    owner: 'James Njoroge',
    owner_email: 'james@brightminds.ke',
    products: 56,
    orders: 134,
    revenue: '412000.00',
    commission: '41200.00',
    status: 'SUSPENDED',
    registration_date: '2024-07-30',
    verified: true,
    payout_method: 'Bank',
  },
  {
    id: 5,
    store_name: 'EduKids Centre',
    owner: 'Linda Akinyi',
    owner_email: 'linda@edukids.co.ke',
    products: 98,
    orders: 267,
    revenue: '670000.00',
    commission: '67000.00',
    status: 'ACTIVE',
    registration_date: '2024-05-12',
    verified: false,
    payout_method: 'M-Pesa',
  },
];

export const mockPendingSellers: Omit<AdminSeller, 'products' | 'orders' | 'revenue' | 'commission'>[] = [
  {
    id: 10,
    store_name: 'ABC Academy',
    owner: 'Peter Otieno',
    owner_email: 'peter@abcacademy.co.ke',
    status: 'PENDING',
    registration_date: '2026-09-22',
    verified: false,
  },
  {
    id: 11,
    store_name: 'Smart Teachers',
    owner: 'Rachel Adisa',
    owner_email: 'rachel@smartteachers.co.ke',
    status: 'PENDING',
    registration_date: '2026-09-20',
    verified: false,
  },
  {
    id: 12,
    store_name: 'Kenya Books',
    owner: 'Tom Odhiambo',
    owner_email: 'tom@kenyabooks.co.ke',
    status: 'PENDING',
    registration_date: '2026-09-18',
    verified: false,
  },
];

export const mockProducts: AdminProduct[] = [
  {
    id: 1,
    name: 'Grade 6 Mathematics Revision',
    seller: 'ABC Academy',
    seller_id: 1,
    price: '500.00',
    stock: 245,
    status: 'PUBLISHED',
    featured: true,
    created_at: '2024-02-10T09:00:00Z',
    category: 'Primary School > Mathematics',
  },
  {
    id: 2,
    name: 'KCPE Mock Exams 2024',
    seller: 'Kenya Books Ltd',
    seller_id: 3,
    price: '1200.00',
    stock: 89,
    status: 'PENDING_APPROVAL',
    created_at: '2026-09-25T14:30:00Z',
    category: 'Exams & Tests',
  },
  {
    id: 3,
    name: 'Grade 4 English Workbooks',
    seller: 'Smart Teachers',
    seller_id: 2,
    price: '750.00',
    stock: 0,
    status: 'OUT_OF_STOCK',
    featured: false,
    created_at: '2024-06-18T10:00:00Z',
    category: 'Primary School > English',
  },
  {
    id: 4,
    name: 'Form 3 Chemistry Past Papers',
    seller: 'Bright Minds',
    seller_id: 4,
    price: '1800.00',
    stock: 156,
    status: 'PUBLISHED',
    created_at: '2024-08-22T11:00:00Z',
    category: 'Secondary School > Chemistry',
  },
  {
    id: 5,
    name: 'Grade 8 Science Notes',
    seller: 'EduKids Centre',
    seller_id: 5,
    price: '950.00',
    stock: 320,
    status: 'DRAFT',
    created_at: '2026-09-20T08:00:00Z',
    category: 'Primary School > Science',
  },
];

export const mockCourses: AdminCourse[] = [
  {
    id: 1,
    title: 'Python Programming for Beginners',
    instructor: 'John Kamau',
    instructor_email: 'john.kamau@teacher.ke',
    students: 324,
    price: '2500.00',
    rating: 4.7,
    rating_count: 128,
    status: 'PENDING_APPROVAL',
    category: 'Professional > Programming',
    created_at: '2026-09-10T09:00:00Z',
  },
  {
    id: 2,
    title: 'KCSE Biology Mastery',
    instructor: 'Dr. Wanjiru',
    instructor_email: 'wanjiru@biology.co.ke',
    students: 512,
    price: '3500.00',
    rating: 4.8,
    rating_count: 203,
    status: 'PUBLISHED',
    category: 'Secondary School > Biology',
    created_at: '2024-09-01T10:00:00Z',
  },
  {
    id: 3,
    title: 'Grade 6 Mathematics Bootcamp',
    instructor: 'Samuel Ochieng',
    instructor_email: 'sam@math.co.ke',
    students: 187,
    price: '1800.00',
    rating: 4.5,
    rating_count: 76,
    status: 'PUBLISHED',
    category: 'Primary School > Mathematics',
    created_at: '2024-04-15T11:00:00Z',
  },
  {
    id: 4,
    title: 'Digital Marketing Fundamentals',
    instructor: 'Amina Hassan',
    instructor_email: 'amina@marketing.ke',
    students: 421,
    price: '0.00',
    rating: 4.9,
    rating_count: 311,
    status: 'DRAFT',
    category: 'Professional > Digital Marketing',
    created_at: '2026-09-18T08:00:00Z',
  },
];

export const mockOrders: AdminOrder[] = [
  {
    id: 10245,
    order_number: 'LP10245',
    customer: 'Jane Wanjiku',
    customer_email: 'jane.wanjiku@email.com',
    items: 3,
    amount: '4500.00',
    payment: 'PAID',
    status: 'PROCESSING',
    date: '2026-09-27T08:30:00Z',
    is_digital: false,
  },
  {
    id: 10244,
    order_number: 'LP10244',
    customer: 'Samuel Ochieng',
    customer_email: 'sam@email.com',
    items: 1,
    amount: '1250.00',
    payment: 'PAID',
    status: 'DELIVERED',
    date: '2026-09-26T14:20:00Z',
    is_digital: true,
  },
  {
    id: 10243,
    order_number: 'LP10243',
    customer: 'Amina Hassan',
    customer_email: 'amina.hassan@email.com',
    items: 5,
    amount: '7800.00',
    payment: 'PENDING',
    status: 'PENDING',
    date: '2026-09-26T11:05:00Z',
    is_digital: false,
  },
  {
    id: 10242,
    order_number: 'LP10242',
    customer: 'David Mwangi',
    customer_email: 'david.mwangi@email.com',
    items: 2,
    amount: '3200.00',
    payment: 'PAID',
    status: 'SHIPPED',
    date: '2026-09-25T16:45:00Z',
    is_digital: false,
  },
  {
    id: 10241,
    order_number: 'LP10241',
    customer: 'Fatuma Ali',
    customer_email: 'fatuma.ali@email.com',
    items: 1,
    amount: '2500.00',
    payment: 'PAID',
    status: 'DELIVERED',
    date: '2026-09-25T09:10:00Z',
    is_digital: true,
  },
  {
    id: 10240,
    order_number: 'LP10240',
    customer: 'Grace Njoroge',
    customer_email: 'grace@email.com',
    items: 4,
    amount: '6700.00',
    payment: 'PAID',
    status: 'CANCELLED',
    date: '2026-09-24T13:25:00Z',
    is_digital: false,
  },
  {
    id: 10239,
    order_number: 'LP10239',
    customer: 'Samuel Ochieng',
    customer_email: 'sam@email.com',
    items: 2,
    amount: '3400.00',
    payment: 'FAILED',
    status: 'PENDING',
    date: '2026-09-24T16:20:00Z',
    is_digital: false,
  },
  {
    id: 10238,
    order_number: 'LP10238',
    customer: 'Amina Hassan',
    customer_email: 'amina.hassan@email.com',
    items: 1,
    amount: '1850.00',
    payment: 'PAID',
    status: 'PAID',
    date: '2026-09-23T10:40:00Z',
    is_digital: true,
  },
];

export const mockPayments: AdminPayment[] = [
  {
    id: 1,
    transaction_id: 'MPESA-20260927-0012',
    order: 'LP10241',
    customer: 'Fatuma Ali',
    amount: '2500.00',
    method: 'M-Pesa',
    date: '2026-09-25T09:10:00Z',
    status: 'SUCCESSFUL',
  },
  {
    id: 2,
    transaction_id: 'VISA-20260926-0098',
    order: 'LP10243',
    customer: 'Amina Hassan',
    amount: '7800.00',
    method: 'Visa',
    date: '2026-09-26T11:05:00Z',
    status: 'PENDING',
  },
  {
    id: 3,
    transaction_id: 'MC-20260925-0045',
    order: 'LP10242',
    customer: 'David Mwangi',
    amount: '3200.00',
    method: 'Mastercard',
    date: '2026-09-25T16:45:00Z',
    status: 'SUCCESSFUL',
  },
  {
    id: 4,
    transaction_id: 'MPESA-20260924-0088',
    order: 'LP10239',
    customer: 'Samuel Ochieng',
    amount: '1250.00',
    method: 'M-Pesa',
    date: '2026-09-24T16:20:00Z',
    status: 'FAILED',
  },
  {
    id: 5,
    transaction_id: 'PAY-20260923-0101',
    order: 'LP10230',
    customer: 'Jane Wanjiku',
    amount: '4500.00',
    method: 'Other',
    date: '2026-09-23T08:00:00Z',
    status: 'REFUNDED',
  },
];

export const mockWithdrawals: AdminWithdrawal[] = [
  {
    id: 1,
    seller: 'ABC Education',
    seller_id: 1,
    amount: '45000.00',
    platform_fee: '4500.00',
    seller_receives: '40500.00',
    status: 'PENDING',
    requested_at: '2026-09-25T10:00:00Z',
    paid_at: null,
    payout_method: 'M-Pesa',
  },
  {
    id: 2,
    seller: 'Smart Teachers',
    seller_id: 2,
    amount: '18500.00',
    platform_fee: '1850.00',
    seller_receives: '16650.00',
    status: 'APPROVED',
    requested_at: '2026-09-24T14:00:00Z',
    paid_at: null,
    payout_method: 'Bank',
  },
  {
    id: 3,
    seller: 'Kenya Books Ltd',
    seller_id: 3,
    amount: '72000.00',
    platform_fee: '7200.00',
    seller_receives: '64800.00',
    status: 'PAID',
    requested_at: '2026-09-22T09:00:00Z',
    paid_at: '2026-09-23T09:00:00Z',
    payout_method: 'M-Pesa',
  },
  {
    id: 4,
    seller: 'Bright Minds',
    seller_id: 4,
    amount: '23000.00',
    platform_fee: '2300.00',
    seller_receives: '20700.00',
    status: 'REJECTED',
    requested_at: '2026-09-21T11:00:00Z',
    paid_at: null,
    payout_method: 'Bank',
  },
];

export const mockCategories: CategoryNode[] = [
  {
    id: 1,
    name: 'Primary School',
    slug: 'primary-school',
    product_count: 3240,
    course_count: 120,
    children: [
      { id: 2, name: 'Mathematics', slug: 'mathematics', product_count: 780, course_count: 24, children: [] },
      { id: 3, name: 'English', slug: 'english', product_count: 650, course_count: 31, children: [] },
      { id: 4, name: 'Science', slug: 'science', product_count: 420, course_count: 18, children: [] },
      { id: 5, name: 'Social Studies', slug: 'social-studies', product_count: 310, course_count: 12, children: [] },
    ],
  },
  {
    id: 6,
    name: 'Secondary School',
    slug: 'secondary-school',
    product_count: 2180,
    course_count: 205,
    children: [
      { id: 7, name: 'Mathematics', slug: 'mathematics', product_count: 490, course_count: 42, children: [] },
      { id: 8, name: 'Biology', slug: 'biology', product_count: 410, course_count: 56, children: [] },
      { id: 9, name: 'Chemistry', slug: 'chemistry', product_count: 380, course_count: 33, children: [] },
      { id: 10, name: 'Physics', slug: 'physics', product_count: 390, course_count: 28, children: [] },
    ],
  },
  {
    id: 11,
    name: 'Professional',
    slug: 'professional',
    product_count: 3000,
    course_count: 400,
    children: [
      { id: 12, name: 'Programming', slug: 'programming', product_count: 890, course_count: 156, children: [] },
      { id: 13, name: 'Business', slug: 'business', product_count: 720, course_count: 98, children: [] },
      { id: 14, name: 'Accounting', slug: 'accounting', product_count: 640, course_count: 87, children: [] },
      { id: 15, name: 'Digital Marketing', slug: 'digital-marketing', product_count: 750, course_count: 59, children: [] },
    ],
  },
];

export const mockReviews: AdminReview[] = [
  {
    id: 1,
    product: 'Grade 6 Mathematics Revision',
    product_id: 1,
    customer: 'Jane',
    rating: 5,
    comment: 'Very useful revision material.',
    date: '2026-09-20T10:00:00Z',
    status: 'APPROVED',
  },
  {
    id: 2,
    product: 'KCPE Mock Exams 2024',
    product_id: 2,
    customer: 'Samuel O.',
    rating: 4,
    comment: 'Good practice papers, helped a lot with revision.',
    date: '2026-09-24T14:00:00Z',
    status: 'PENDING',
  },
  {
    id: 3,
    product: 'Form 3 Chemistry Past Papers',
    product_id: 4,
    customer: 'Amina H.',
    rating: 1,
    comment: 'Worst purchase ever. Papers were outdated.',
    date: '2026-09-23T09:30:00Z',
    status: 'PENDING',
  },
  {
    id: 4,
    product: 'Grade 8 Science Notes',
    product_id: 3,
    customer: 'David M.',
    rating: 3,
    comment: 'Average content, could be better organized.',
    date: '2026-09-22T16:20:00Z',
    status: 'HIDDEN',
  },
];

export const mockCoupons: AdminCoupon[] = [
  {
    id: 1,
    code: 'BACKTOSCHOOL',
    discount_type: 'PERCENTAGE',
    discount_value: '20',
    start_date: '2026-09-01',
    end_date: '2026-09-30',
    usage_limit: 1000,
    used: 342,
    active: true,
    created_at: '2026-08-25T10:00:00Z',
  },
  {
    id: 2,
    code: 'NEWUSER500',
    discount_type: 'FIXED_AMOUNT',
    discount_value: '500',
    start_date: '2026-09-20',
    end_date: '2026-12-31',
    usage_limit: 500,
    used: 87,
    active: true,
    created_at: '2026-09-15T08:00:00Z',
  },
];

export const mockSettings: AdminSettings = {
  commission: 10,
  currency: 'KES',
  currency_symbol: 'KSh',
  default_country: 'Kenya',
  allow_seller_registration: true,
  require_product_approval: true,
  require_course_approval: true,
  mpesa_enabled: true,
  visa_enabled: true,
  tax_rate: 0,
  email_notifications: true,
};

// ---- Helpers ----

const safe = async <T>(promise: Promise<unknown>, fallback: T): Promise<T> => {
  try {
    return (await promise) as T;
  } catch {
    return fallback;
  }
};

function filterByParams<T>(data: T[], params?: Record<string, string>): T[] {
  if (!params) return data;
  return data.filter((item) =>
    Object.entries(params).every(([key, value]) => {
      if (!value) return true;
      const record = item as unknown as Record<string, unknown>;
      const itemValue = record[key];
      return String(itemValue ?? '').toLowerCase().includes(value.toLowerCase());
    }),
  );
}

// ---- Response mappers + API client (falls back to mock data when backend is unavailable) ----

const asArray = <T,>(data: unknown): T[] =>
  Array.isArray(data)
    ? (data as T[])
    : data && typeof data === 'object' && 'results' in data
      ? asArray<T>((data as { results: unknown }).results)
      : [];

const slugify = (value: string): string =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const money = (value: string | number | null | undefined): string =>
  `${(parseFloat(value == null ? '0' : String(value)) || 0).toFixed(2)}`;

const statMoney = (value: number): string => `KSh ${(value || 0).toLocaleString()}`;
const statCount = (value: number): string => `${(value || 0).toLocaleString()}`;

const roleToAccountType = (role: string): AccountType => {
  switch (role) {
    case 'PARENT':
    case 'STUDENT':
      return 'CUSTOMER';
    case 'DISTRIBUTOR':
      return 'SELLER';
    case 'TEACHER':
      return 'TEACHER';
    case 'ADMIN':
    case 'STAFF':
      return 'ADMINISTRATOR';
    default:
      return 'CUSTOMER';
  }
};

interface BackendUser {
  id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  phone?: string;
  is_active?: boolean;
  created_at?: string;
  last_login?: string | null;
}

const mapUser = (u: BackendUser): AdminUser => ({
  id: u.id,
  name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || '',
  email: u.email || '',
  phone: u.phone || '',
  account_type: roleToAccountType(u.role || ''),
  registration_date: (u.created_at || '').slice(0, 10),
  status: u.is_active ? 'ACTIVE' : 'SUSPENDED',
  last_login: u.last_login ?? null,
  avatar: null,
});

interface BackendProfile {
  id: number;
  company_name?: string;
  email?: string;
  is_verified?: boolean;
  is_suspended?: boolean;
  created_at?: string;
  total_earned?: string | number;
  product_count?: number;
  order_count?: number;
  owner_name?: string;
}

const mapSeller = (
  p: BackendProfile,
  agg?: { revenue: number; commission: number },
): AdminSeller => {
  const earned = parseFloat(p.total_earned == null ? '0' : String(p.total_earned)) || 0;
  const revenue = agg && agg.revenue > 0 ? agg.revenue : earned;
  const commission = agg && agg.commission > 0 ? agg.commission : earned;
  return {
    id: p.id,
    store_name: p.company_name || '',
    owner: p.owner_name || '',
    owner_email: p.email || '',
    products: p.product_count ?? 0,
    orders: p.order_count ?? 0,
    revenue: money(revenue),
    commission: money(commission),
    status: p.is_suspended ? 'SUSPENDED' : p.is_verified ? 'ACTIVE' : 'PENDING',
    registration_date: (p.created_at || '').slice(0, 10),
    verified: !!p.is_verified,
    payout_method: 'M-Pesa',
  };
};

const mapPendingSeller = (p: BackendProfile): Omit<AdminSeller, 'products' | 'orders' | 'revenue' | 'commission'> => {
  const s = mapSeller(p);
  return {
    id: s.id,
    store_name: s.store_name,
    owner: s.owner,
    owner_email: s.owner_email,
    status: s.status,
    registration_date: s.registration_date,
    verified: s.verified,
  };
};

interface BackendVariant {
  id?: number;
  label?: string;
  size?: string;
  color?: string;
  stock_quantity?: number;
  price_override?: string | null;
  effective_price?: string | number;
}

export interface BackendProduct {
  id: number;
  name?: string;
  distributor_name?: string;
  linked_distributor_product?: number | null;
  linked_distributor_product_name?: string | null;
  effective_price?: string | number;
  price?: string | number;
  category?: number;
  category_name?: string;
  description?: string;
  image?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  is_reseller_listing?: boolean;
  created_at?: string;
  variants?: BackendVariant[];
  images?: BackendProductImage[];
  tags?: BackendTag[];
  applicable_levels?: number[];
  learning_areas?: number[];
  sku?: string;
  brand?: string;
  product_type?: string;
  cost_price?: string | number | null;
  low_stock_threshold?: number;
  backorders?: boolean;
  shipping_weight?: string | number | null;
  shipping_length?: string | number | null;
  shipping_width?: string | number | null;
  shipping_height?: string | number | null;
}

interface BackendPayment {
  id?: number;
  status?: string;
  amount?: string | number;
  method?: string;
  mpesa_receipt_number?: string;
  confirmed_at?: string;
}

interface BackendOrder {
  id: number;
  pickup_code?: string;
  learner_name?: string;
  delivery_name?: string;
  items?: unknown[];
  total_amount?: string | number;
  payment?: BackendPayment | null;
  status?: string;
  created_at?: string;
  delivery_address?: string;
  fund_status?: string;
  disputed?: boolean;
}

interface BackendCourse {
  id: number;
  title?: string;
  teacher_name?: string;
  status?: string;
  enrollments?: unknown[];
  learning_area?: string | number;
  grade_name?: string;
  created_at?: string;
}

interface BackendCategory {
  id: number;
  name?: string;
  parent?: number | null;
}

export interface BackendGrade {
  id: number;
  name: string;
  stage: 'pre_primary' | 'primary' | 'junior_secondary' | 'senior_secondary';
  order: number;
}

export interface BackendLearningArea {
  id: number;
  name: string;
  code?: string;
  grade?: number;
  pathway?: number | null;
  school?: number;
}

export interface BackendPathway {
  id: number;
  name: string;
  code?: string;
}

export interface BackendTag {
  id: number;
  name: string;
}

export interface BackendProductImage {
  id: number;
  image_url?: string | null;
  alt?: string;
  is_primary?: boolean;
}

export interface CreateProductData {
  name: string;
  category: number;
  price: string | number;
  description?: string;
  is_active?: boolean;
  sku?: string;
  brand?: string;
  product_type?: 'physical' | 'digital' | 'service';
  cost_price?: string;
  low_stock_threshold?: number;
  backorders?: boolean;
  shipping_weight?: string;
  shipping_length?: string;
  shipping_width?: string;
  shipping_height?: string;
  applicable_levels?: number[];
  learning_areas?: number[];
  institution_categories?: string[];
  tags?: string[];
  variants?: Array<{
    label: string;
    size?: string;
    color?: string;
    stock_quantity?: number;
    price_override?: string | null;
  }>;
  images?: File[];
}

const mapProduct = (p: BackendProduct): AdminProduct => {
  const stock = Array.isArray(p.variants)
    ? p.variants.reduce((sum: number, v) => sum + (v.stock_quantity || 0), 0)
    : 0;
  const price = p.effective_price ?? p.price ?? 0;
  let status: AdminProduct['status'];
  if (!p.is_active) status = 'DRAFT';
  else if (stock === 0) status = 'OUT_OF_STOCK';
  else status = 'PUBLISHED';
  return {
    id: p.id,
    name: p.name || '',
    seller: p.distributor_name || p.linked_distributor_product_name || '',
    seller_id: p.linked_distributor_product ?? 0,
    price: money(price),
    stock,
    status,
    featured: !!p.is_reseller_listing,
    created_at: p.created_at || '',
    category: p.category_name || '',
  };
};

const mapCourse = (c: BackendCourse): AdminCourse => {
  const st = (c.status || '').toLowerCase();
  let status: AdminCourse['status'];
  if (st === 'published') status = 'PUBLISHED';
  else if (st === 'submitted_for_review') status = 'PENDING_APPROVAL';
  else status = 'DRAFT';
  return {
    id: c.id,
    title: c.title || '',
    instructor: c.teacher_name || '',
    instructor_email: '',
    students: Array.isArray(c.enrollments) ? c.enrollments.length : 0,
    price: '0.00',
    rating: 0,
    rating_count: 0,
    status,
    category: [c.grade_name, c.learning_area ? String(c.learning_area) : ''].filter(Boolean).join(' > '),
    created_at: c.created_at || '',
  };
};

const mapOrder = (o: BackendOrder): AdminOrder => {
  const st = (o.status || '').toLowerCase();
  let status: OrderStatus;
  switch (st) {
    case 'paid':
      status = 'PAID';
      break;
    case 'ready_for_pickup':
      status = 'PROCESSING';
      break;
    case 'picked_up':
      status = 'SHIPPED';
      break;
    case 'cancelled':
      status = 'CANCELLED';
      break;
    case 'pending_payment':
      status = 'PENDING';
      break;
    default:
      status = 'PENDING';
  }
  let payment: AdminOrder['payment'] = 'PENDING';
  if (o.payment) {
    const ps = (o.payment.status || '').toLowerCase();
    payment = ps === 'confirmed' ? 'PAID' : ps === 'failed' ? 'FAILED' : 'PENDING';
  }
  const customer = o.learner_name || o.delivery_name || `Order #${o.id}`;
  return {
    id: o.id,
    order_number: o.pickup_code || `LP${o.id}`,
    customer,
    customer_email: '',
    items: Array.isArray(o.items) ? o.items.length : 0,
    amount: money(o.total_amount),
    payment,
    status,
    fund_status: (o.fund_status || 'HELD') as FundStatus,
    disputed: !!o.disputed,
    date: o.created_at || '',
    is_digital: false,
  };
};

const mapPayment = (o: BackendOrder, idx: number): AdminPayment => {
  const pm = o.payment || {};
  const method = (pm.method || '').toLowerCase() === 'mpesa' ? 'M-Pesa' : 'Other';
  const ps = (pm.status || '').toLowerCase();
  const status: PaymentStatus = ps === 'confirmed' ? 'SUCCESSFUL' : ps === 'failed' ? 'FAILED' : 'PENDING';
  return {
    id: pm.id || idx,
    transaction_id: pm.mpesa_receipt_number || `PAY-${pm.id || idx}`,
    order: o.pickup_code || `LP${o.id}`,
    customer: o.learner_name || o.delivery_name || '',
    amount: money(pm.amount || o.total_amount),
    method,
    date: pm.confirmed_at || o.created_at || '',
    status,
  };
};

const mapCategoryTree = (flat: BackendCategory[]): CategoryNode[] => {
  const byId = new Map<number, CategoryNode>();
  const nodes: CategoryNode[] = [];
  flat.forEach((c) =>
    byId.set(c.id, {
      id: c.id,
      name: c.name || '',
      slug: slugify(c.name || ''),
      product_count: 0,
      course_count: 0,
      children: [],
    }),
  );
  flat.forEach((c) => {
    const node = byId.get(c.id);
    if (node && c.parent && byId.has(c.parent)) {
      byId.get(c.parent)!.children.push(node);
    } else if (node) {
      nodes.push(node);
    }
  });
  return nodes;
};

export const mockHeldFunds: AdminOrder[] = [
  {
    id: 10245,
    order_number: 'LP10245',
    customer: 'Jane Wanjiku',
    customer_email: 'jane.wanjiku@email.com',
    items: 3,
    amount: '4500.00',
    payment: 'PAID',
    status: 'DELIVERED',
    fund_status: 'HELD',
    disputed: false,
    date: '2026-09-27T08:30:00Z',
    is_digital: false,
  },
  {
    id: 10244,
    order_number: 'LP10244',
    customer: 'Samuel Ochieng',
    customer_email: 'sam@email.com',
    items: 1,
    amount: '1250.00',
    payment: 'PAID',
    status: 'DELIVERED',
    fund_status: 'HELD',
    disputed: false,
    date: '2026-09-26T14:20:00Z',
    is_digital: true,
  },
];

export const adminApi = {
  getDashboardStats: async (): Promise<Stat[]> => {
    try {
      const [orders, users, products, sellers, courses] = await Promise.all([
        adminApi.getOrders(),
        adminApi.getUsers(),
        adminApi.getProducts(),
        adminApi.getSellers(),
        adminApi.getCourses(),
      ]);
      const totalRevenue = orders.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
      const today = new Date().toISOString().slice(0, 10);
      const todayRevenue = orders
        .filter((o) => (o.date || '').slice(0, 10) === today)
        .reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
      const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.payment === 'PENDING').length;
      const totalCustomers = users.filter((u) => u.account_type === 'CUSTOMER').length;
      const activeSellers = sellers.filter((s) => s.status === 'ACTIVE').length;
      return [
        { ...mockStats.totalRevenue, value: statMoney(totalRevenue) },
        { ...mockStats.todayRevenue, value: statMoney(todayRevenue) },
        { ...mockStats.totalOrders, value: statCount(orders.length) },
        { ...mockStats.pendingOrders, value: statCount(pendingOrders) },
        { ...mockStats.totalCustomers, value: statCount(totalCustomers) },
        { ...mockStats.activeSellers, value: statCount(activeSellers) },
        { ...mockStats.totalProducts, value: statCount(products.length) },
        { ...mockStats.totalCourses, value: statCount(courses.length) },
      ];
    } catch {
      return mockStatsList;
    }
  },

  getSalesAnalytics: () =>
    safe(
      adminApi.getOrders().then((orders) => {
        const byMonth = new Map<string, { revenue: number; orders: number }>();
        orders.forEach((o) => {
          const d = new Date(o.date || 0);
          const key = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
          const cur = byMonth.get(key) || { revenue: 0, orders: 0 };
          cur.revenue += parseFloat(o.amount) || 0;
          cur.orders += 1;
          byMonth.set(key, cur);
        });
        return Array.from(byMonth.entries())
          .sort((a, b) => (a[0] < b[0] ? -1 : 1))
          .map(([month, v]) => ({ month, revenue: Math.round(v.revenue), orders: v.orders }));
      }),
      mockSalesData,
    ),

  getRecentOrders: () => safe(adminApi.getOrders().then((orders) => orders.slice(0, 5)), mockRecentOrders),

  getNotifications: () =>
    safe(api.get('/admin/notifications/').then((r) => asArray(r.data)), mockNotifications),

  getUsers: (params?: Record<string, string>) =>
    safe(
      api.get('/auth/users/', { params }).then((r) => asArray<BackendUser>(r.data).map(mapUser)),
      filterByParams(mockUsers, params),
    ),
  getUser: (id: string) =>
    safe(
      api.get(`/auth/users/${id}/`).then((r) => mapUser(r.data)),
      mockUsers.find((u) => u.id === Number(id)) ?? null,
    ),
  updateUser: (id: string, data: Partial<AdminUser>) => {
    const patch: Record<string, unknown> = {};
    if (data.status === 'ACTIVE') patch.is_active = true;
    else if (data.status === 'SUSPENDED') patch.is_active = false;
    if (data.name) {
      const [first, ...rest] = data.name.split(' ');
      if (first) patch.first_name = first;
      if (rest.length) patch.last_name = rest.join(' ');
    }
    if (data.phone) patch.phone = data.phone;
    return api.patch(`/auth/users/${id}/`, patch).then((r) => mapUser(r.data));
  },
  deleteUser: (id: string) => api.delete(`/auth/users/${id}/`).then((r) => r.data),

  getSellers: () =>
    safe(
      (async () => {
        const [profiles, wallets] = await Promise.all([
          api.get('/distributor/profiles/').then((r) => asArray<BackendProfile>(r.data)),
          api.get('/distributor/wallet/').then((r) =>
            asArray<{ distributor: number; transactions?: Array<{ order_total?: string | number; amount?: string | number }> }>(r.data),
          ),
        ]);
        const walletByProfile = new Map<number, { revenue: number; commission: number }>();
        wallets.forEach((w) => {
          const base = walletByProfile.get(w.distributor) || { revenue: 0, commission: 0 };
          (w.transactions || []).forEach((t) => {
            base.revenue += parseFloat(t.order_total == null ? '0' : String(t.order_total)) || 0;
            base.commission += parseFloat(t.amount == null ? '0' : String(t.amount)) || 0;
          });
          walletByProfile.set(w.distributor, base);
        });
        return profiles.map((p) => mapSeller(p, walletByProfile.get(p.id)));
      })(),
      mockSellers,
    ),
  getSeller: (id: string) =>
    safe(
      api.get(`/distributor/profiles/${id}/`).then((r) => mapSeller(r.data)),
      mockSellers.find((s) => s.id === Number(id)) ?? null,
    ),
  updateSeller: (id: string, data: Partial<AdminSeller>) => {
    if (data.status === 'SUSPENDED') {
      return api.post(`/distributor/profiles/${id}/suspend/`).then((r) =>
        mapSeller(r.data.profile ?? r.data),
      );
    }
    if (data.status === 'ACTIVE') {
      return api.post(`/distributor/profiles/${id}/unsuspend/`).then((r) =>
        mapSeller(r.data.profile ?? r.data),
      );
    }
    return api.patch(`/distributor/profiles/${id}/`, data).then((r) => mapSeller(r.data));
  },
  getPendingSellers: () =>
    safe(
      api.get('/distributor/profiles/pending/').then((r) => asArray<BackendProfile>(r.data).map(mapPendingSeller)),
      mockPendingSellers,
    ),
  approveSeller: (id: string) => api.post(`/distributor/profiles/${id}/approve/`).then((r) => r.data),
  rejectSeller: (id: string) => api.post(`/distributor/profiles/${id}/suspend/`).then((r) => r.data),

  getProducts: (params?: Record<string, string>) =>
    safe(
      api
        .get('/shop/products/', { params })
        .then((r) => filterByParams(asArray<BackendProduct>(r.data).map(mapProduct), params)),
      filterByParams(mockProducts, params),
    ),
  getProduct: (id: string) =>
    safe(
      api.get(`/shop/products/${id}/`).then((r) => mapProduct(r.data)),
      mockProducts.find((p) => p.id === Number(id)) ?? null,
    ),
  updateProduct: (id: string, data: Partial<AdminProduct>) => {
    const patch: Record<string, unknown> = {};
    if (data.status !== undefined) {
      patch.is_active =
        data.status === 'PUBLISHED' || data.status === 'OUT_OF_STOCK' || data.status === 'PENDING_APPROVAL';
    }
    return api.patch(`/shop/products/${id}/`, patch).then((r) => mapProduct(r.data));
  },
  deleteProduct: (id: string) => api.delete(`/shop/products/${id}/`).then((r) => r.data),
  createProduct: (data: CreateProductData) => {
    const fallback: BackendProduct = {
      id: Date.now(),
      name: data.name,
      price: data.price,
      is_active: data.is_active !== false,
    };
    const payload: Record<string, unknown> = {
      name: data.name,
      category: data.category,
      price: data.price,
      description: data.description ?? '',
      is_active: data.is_active !== false,
      low_stock_threshold: data.low_stock_threshold ?? 0,
      backorders: !!data.backorders,
      applicable_levels: data.applicable_levels ?? [],
      learning_areas: data.learning_areas ?? [],
      tags_data: data.tags ?? [],
      variants_data: data.variants ?? [],
    };
    if (data.sku) payload.sku = data.sku;
    if (data.brand) payload.brand = data.brand;
    if (data.product_type) payload.product_type = data.product_type;
    if (data.cost_price) payload.cost_price = data.cost_price;
    if (data.shipping_weight) payload.shipping_weight = data.shipping_weight;
    if (data.shipping_length) payload.shipping_length = data.shipping_length;
    if (data.shipping_width) payload.shipping_width = data.shipping_width;
    if (data.shipping_height) payload.shipping_height = data.shipping_height;
    if (data.institution_categories && data.institution_categories.length)
      payload.institution_categories = data.institution_categories;
    const base = safe(
      api.post('/shop/products/', payload).then((r) => r.data),
      fallback,
    );
    return base.then(async (product: BackendProduct) => {
      if (data.images && data.images.length > 0 && product.id) {
        const form = new FormData();
        data.images.forEach((f) => form.append('files', f));
        try {
          await api.post(`/shop/products/${product.id}/upload_images/`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch {
          /* image upload best-effort */
        }
      }
      return product;
    });
  },
  uploadProductImages: (id: number, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api
      .post(`/shop/products/${id}/upload_images/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => asArray<BackendProductImage>(r.data));
  },
  importProducts: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post('/shop/products/import_products/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data as { created: number; failed: number; errors: unknown[] });
  },

  getCourses: (params?: Record<string, string>) =>
    safe(
      api
        .get('/courses/courses/', { params })
        .then((r) => filterByParams(asArray<BackendCourse>(r.data).map(mapCourse), params)),
      filterByParams(mockCourses, params),
    ),
  getCourse: (id: string) =>
    safe(
      api.get(`/courses/courses/${id}/`).then((r) => mapCourse(r.data)),
      mockCourses.find((c) => c.id === Number(id)) ?? null,
    ),
  updateCourse: (id: string, data: Partial<AdminCourse>) =>
    api.patch(`/courses/courses/${id}/`, data).then((r) => mapCourse(r.data)),

  getOrders: (params?: Record<string, string>) =>
    safe(
      api
        .get('/shop/orders/', { params })
        .then((r) => filterByParams(asArray<BackendOrder>(r.data).map(mapOrder), params)),
      filterByParams(mockOrders, params),
    ),
  updateOrder: (id: string, data: Partial<AdminOrder>) => {
    const patch: Record<string, unknown> = {};
    if (data.status !== undefined) {
      const map: Record<string, string> = {
        PAID: 'paid',
        PROCESSING: 'ready_for_pickup',
        SHIPPED: 'picked_up',
        DELIVERED: 'picked_up',
        CANCELLED: 'cancelled',
        REFUNDED: 'cancelled',
        PENDING: 'pending_payment',
      };
      patch.status = map[data.status] || 'pending_payment';
    }
    return api.patch(`/shop/orders/${id}/`, patch).then((r) => mapOrder(r.data));
  },

  getPayments: (params?: Record<string, string>) =>
    safe(
      api.get('/shop/orders/').then((r) =>
        filterByParams(
          asArray<BackendOrder>(r.data).map((o, i) => mapPayment(o, i)),
          params,
        ),
      ),
      filterByParams(mockPayments, params),
    ),
  getTransactions: () =>
    safe(
      api.get('/shop/orders/').then((r) => asArray<BackendOrder>(r.data).map((o, i) => mapPayment(o, i))),
      mockPayments,
    ),

  getHeldFunds: () =>
    safe(
      adminApi.getOrders().then((orders) =>
        orders.filter((o) => o.fund_status === 'HELD' && o.status === 'DELIVERED' && !o.disputed),
      ),
      mockHeldFunds,
    ),
  releaseFunds: (id: string) =>
    api.post(`/shop/orders/${id}/release_funds/`, {}).then((r) => r.data),
  confirmDelivery: (id: string) =>
    api.post(`/shop/orders/${id}/confirm_delivery/`, {}).then((r) => r.data),
  disputeOrder: (id: string, reason: string) =>
    api.post(`/shop/orders/${id}/dispute/`, { reason }).then((r) => r.data),

  getWithdrawals: (params?: Record<string, string>) =>
    safe(
      api.get('/admin/withdrawals/', { params }).then((r) => filterByParams(asArray(r.data), params)),
      filterByParams(mockWithdrawals, params),
    ),
  updateWithdrawal: (id: string, data: Partial<AdminWithdrawal>) =>
    api.patch(`/admin/withdrawals/${id}/`, data).then((r) => r.data),

  getCategories: () =>
    safe(
      api.get('/shop/categories/').then((r) => mapCategoryTree(asArray<BackendCategory>(r.data))),
      mockCategories,
    ),
  createCategory: (data: unknown) => api.post('/shop/categories/', data).then((r) => r.data),
  updateCategory: (id: string, data: unknown) => api.patch(`/shop/categories/${id}/`, data).then((r) => r.data),

  getGrades: () =>
    safe(
      api.get('/academics/grades/').then((r) => asArray<BackendGrade>(r.data)),
      [],
    ),
  getLearningAreas: () =>
    safe(
      api.get('/academics/learning-areas/').then((r) => asArray<BackendLearningArea>(r.data)),
      [],
    ),
  getPathways: () =>
    safe(
      api.get('/academics/pathways/').then((r) => asArray<BackendPathway>(r.data)),
      [],
    ),

  getReviews: (params?: Record<string, string>) =>
    safe(
      api.get('/admin/reviews/', { params }).then((r) => filterByParams(asArray(r.data), params)),
      filterByParams(mockReviews, params),
    ),
  updateReview: (id: string, data: Partial<AdminReview>) => api.patch(`/admin/reviews/${id}/`, data).then((r) => r.data),

  getCoupons: () => safe(api.get('/admin/coupons/').then((r) => asArray(r.data)), mockCoupons),
  createCoupon: (data: Omit<AdminCoupon, 'id'>) => api.post('/admin/coupons/', data).then((r) => r.data),
  updateCoupon: (id: string, data: Partial<AdminCoupon>) => api.patch(`/admin/coupons/${id}/`, data).then((r) => r.data),

  getContent: () => safe(api.get('/admin/content/').then((r) => asArray(r.data)), [] as ContentItem[]),
  updateContent: (id: string, data: Partial<ContentItem>) => api.patch(`/admin/content/${id}/`, data).then((r) => r.data),

  getSettings: () => safe(api.get('/admin/settings/').then((r) => ({ ...mockSettings, ...r.data })), mockSettings),
  updateSettings: (data: Partial<AdminSettings>) => api.patch('/admin/settings/', data).then((r) => r.data),
};
