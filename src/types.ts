export type Role = 'customer' | 'vendor' | 'admin';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'original', symbol: '', name: 'Original Currency' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
];

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
}

export type UserStatus = 'pending' | 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  storeName?: string;
  storeDescription?: string;
  profileImage?: string;
  coverImage?: string;
  lastShippingDetails?: ShippingDetails;
  wishlist?: string[]; // Array of product IDs
  rating?: number;
  reviewCount?: number;
  isTopRated?: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  productId: string;
  productName: string;
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
  groupPurchaseId: string;
  customerId: string;
  customerName: string;
  joinedAt: string;
}

export interface VariationType {
  name: string; // e.g., "Color", "Size"
  options: string[]; // e.g., ["Red", "Blue"]
}

export interface VariationCombination {
  id: string;
  combination: Record<string, string>; // e.g., {"Color": "Red", "Size": "XL"}
  price: number;
  stock: number;
  images: string[];
  weight?: string;
  attributes?: Record<string, string>;
}

export interface InvestmentTier {
  id: string;
  name: string;
  amount: number;
  returnPct: number;
  estimatedEarnings: number;
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
  status: 'pending' | 'active' | 'completed';
  tiers: InvestmentTier[];
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: string;
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
  status: 'active' | 'completed';
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'investment' | 'earning' | 'withdrawal' | 'deposit';
  description: string;
  createdAt: string;
}

export interface InvestorWallet {
  userId: string;
  balance: number;
  totalEarned: number;
  transactions: WalletTransaction[];
}

export interface SalesStat {
  month: string;
  unitsSold: number;
  revenue: number;
}

export type AvailabilityScope = 'local' | 'country' | 'global';

export interface Product {
  id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl: string;
  stock: number;
  tags: string[];
  isHalalCertified: boolean;
  availableCountries?: string[]; // For Fresh Items
  availableCities?: string[]; // For Fresh Items
  variationTypes?: VariationType[];
  variationCombinations?: VariationCombination[];
  originCountry?: string;
  freshness?: 'fresh' | 'frozen' | 'organic';
  groupPrice?: number;
  targetMembers?: number;
  rating?: number;
  reviewCount?: number;
  investmentOpportunity?: InvestmentOpportunity;
  salesStats?: SalesStat[];
  availabilityScope?: AvailabilityScope;
  availabilityDescription?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariations?: Record<string, string>;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered';
export type PaymentMethod = 'card' | 'cod';

export interface OrderStatusUpdate {
  id: string;
  orderId: string;
  status: OrderStatus;
  description: string;
  timestamp: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  currency: string;
  vendorId: string;
  selectedVariations?: Record<string, string>;
  imageUrl?: string;
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  vendorId: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  shippingDetails: ShippingDetails;
  paymentMethod: PaymentMethod;
  history?: OrderStatusUpdate[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatConversation {
  otherUser: {
    id: string;
    name: string;
    profileImage?: string;
    role: Role;
    storeName?: string;
  };
  lastMessage: ChatMessage;
  unreadCount: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  productId?: string; // If it's a product review
  vendorId?: string; // If it's a vendor review
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

