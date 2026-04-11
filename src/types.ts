import { Timestamp } from 'firebase/firestore';

export type UserRole = 'buyer' | 'seller' | 'admin' | 'vendor' | 'customer' | 'investor' | 'moderator' | 'support';
export type Role = UserRole;
export type OrderStatus = 'pending' | 'processing' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'confirmed' | 'refunded' | 'payment_rejected';
export type PaymentStatus = 'pending' | 'receipt_uploaded' | 'under_review' | 'approved' | 'rejected';
export type PaymentMethodType = 'card' | 'alipay' | 'wechat' | 'bank_transfer' | 'easypaisa' | 'payoneer' | 'paypal' | 'other';
export type VariationType = { name: string; options: string[] };
export type VariationCombination = { 
  combination: Record<string, string>;
  price: number;
  stock: number;
  id?: string;
  images?: string[];
  weight?: string;
  attributes?: Record<string, any>;
};

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
];

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  order?: number;
  isActive: boolean;
  createdAt: string | Timestamp;
}

export interface User {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  storeName?: string;
  storeDescription?: string;
  profileImage?: string;
  coverImage?: string;
  lastShippingDetails?: ShippingDetails;
  wishlist?: string[];
  isTopRated?: boolean;
  rating?: number;
  reviewCount?: number;
  paymentMethods?: VendorPaymentMethod[];
  createdAt: string | Timestamp;
}

export interface VendorPaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  details: string;
  qrCodeUrl?: string;
  instructions?: string;
  isActive: boolean;
}

export interface UserProfile extends User {}

export interface Product {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorIsTopRated?: boolean;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl: string;
  stock: number;
  tags: string[];
  isHalalCertified: boolean;
  availableCountries: string[];
  availableCities: string[];
  variationTypes: VariationType[];
  variationCombinations: VariationCombination[];
  originCountry: string;
  freshness: string;
  groupPrice?: number;
  targetMembers?: number;
  availabilityScope: 'global' | 'country' | 'local';
  availabilityDescription?: string;
  rating?: number;
  reviewCount?: number;
  createdAt: string | Timestamp;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedVariations?: Record<string, string>;
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
}

export type PaymentMethod = PaymentMethodType;

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  vendorId: string;
  vendorName: string;
  groupPurchaseId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  shippingDetails: ShippingDetails;
  paymentMethod: PaymentMethod;
  paymentReceipt?: PaymentReceipt;
  vendorPaymentDetails?: VendorPaymentMethod;
  history: OrderHistoryItem[];
  createdAt: string | Timestamp;
  userId?: string; // For backward compatibility or specific queries
}

export interface PaymentReceipt {
  imageUrl: string;
  uploadedAt: string | Timestamp;
  status: PaymentStatus;
  rejectionReason?: string;
  reviewedAt?: string | Timestamp;
  reviewedBy?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  currency: string;
  quantity: number;
  selectedVariations: Record<string, string>;
  imageUrl: string;
}

export interface OrderHistoryItem {
  id: string;
  status: OrderStatus;
  description: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'system' | 'message' | 'approval';
  orderId?: string;
  link?: string;
  isRead: boolean;
  isArchived?: boolean;
  createdAt: string | Timestamp;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatConversation {
  otherUserId: string;
  otherUserName: string;
  otherUserProfileImage?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  otherUser?: string; // Alias for otherUserId used in some components
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  productId?: string;
  vendorId?: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'flagged';
  images?: string[];
  createdAt: string | Timestamp;
}

export interface Subscription {
  id: string;
  customerId: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  vendorId: string;
  vendorName: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  quantity: number;
  price: number;
  currency: string;
  status: 'active' | 'paused' | 'cancelled';
  nextDelivery: string;
  createdAt: string;
}

export interface GroupPurchase {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  vendorId: string;
  vendorName: string;
  targetMembers: number;
  currentMembers: number;
  price: number;
  currency: string;
  expiresAt: string;
  status: 'open' | 'completed' | 'expired';
  createdAt: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  customerId: string;
  customerName: string;
  customerProfileImage?: string;
  joinedAt: string;
  paymentMethod: PaymentMethodType;
  shippingDetails: ShippingDetails;
}

export interface InvestmentOpportunity {
  id: string;
  productId: string;
  productName: string;
  vendorId: string;
  fundingGoal: number;
  currentFunding: number;
  totalUnits: number;
  profitSharingPct: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  tiers: InvestmentTier[];
}

export interface InvestmentTier {
  id: string;
  name: string;
  amount: number;
  returnPct: number;
  estimatedEarnings: number;
}

export interface Investment {
  id: string;
  opportunityId: string;
  productId: string;
  productName: string;
  investorId: string;
  tierId: string;
  tierName: string;
  amount: number;
  expectedReturnPct: number;
  earnedSoFar: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface InvestorWallet {
  userId: string;
  balance: number;
  totalEarned: number;
  updatedAt: string;
  transactions?: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'investment' | 'earning' | 'withdrawal' | 'deposit';
  description: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: 'GRANT_ADMIN' | 'REVOKE_ADMIN' | 'SUSPEND_USER' | 'ACTIVATE_USER' | 'UPDATE_USER_ROLE' | 'GRANT_MODERATOR' | 'REVOKE_MODERATOR' | 'SYSTEM_CONFIG_CHANGE' | 'APPROVE_VENDOR' | 'REJECT_VENDOR';
  performedBy: string;
  performedByName: string;
  targetUserId: string;
  targetUserName: string;
  details?: string;
  createdAt: string | Timestamp;
}

export interface VendorApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  businessName: string;
  businessDescription: string;
  businessAddress: string;
  phoneNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string | Timestamp;
  reviewedAt?: string | Timestamp;
  reviewedBy?: string;
}
