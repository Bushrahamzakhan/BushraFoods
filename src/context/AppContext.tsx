import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { User, Product, CartItem, Order, OrderStatus, ShippingDetails, PaymentMethod, SUPPORTED_CURRENCIES, Notification, ChatMessage, ChatConversation, Review, Subscription, GroupPurchase, InvestmentOpportunity, Investment, InvestorWallet, Role, AuditLog, PaymentMethodType, VendorPaymentMethod, PaymentReceipt, PaymentStatus, VendorApplication, Category } from '../types';
import { ensureDate } from '../lib/utils';
import { auth, db, storage } from '../firebase';
import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable,
  getDownloadURL 
} from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { 
  onAuthStateChanged, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  or,
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  setDoc,
  Timestamp,
  serverTimestamp,
  increment,
  limit,
  arrayUnion,
  arrayRemove,
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  PKR: 278.5,
  CNY: 7.23,
  GBP: 0.79,
  JPY: 151.30,
  AUD: 1.52,
  CAD: 1.35,
  CHF: 0.90,
  HKD: 7.82,
  SGD: 1.34,
  AED: 3.67,
  SAR: 3.75,
  INR: 83.30,
  BDT: 109.50,
  TRY: 32.20,
  MYR: 4.73,
  IDR: 15850,
  ZAR: 18.80,
  NZD: 1.66,
  BRL: 5.05,
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const cleanData = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Check if it's a plain object or an array
  // Firestore FieldValues and Timestamps are NOT plain objects
  const isPlainObject = (val: any) => {
    if (typeof val !== 'object' || val === null) return false;
    const proto = Object.getPrototypeOf(val);
    return proto === Object.prototype || proto === null;
  };

  if (Array.isArray(obj)) {
    return obj.map(item => cleanData(item));
  }

  if (!isPlainObject(obj)) {
    return obj;
  }

  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      newObj[key] = cleanData(obj[key]);
    }
  });
  return newObj;
};

interface AppContextType {
  currentUser: User | null;
  preferredCurrency: string;
  setPreferredCurrency: (code: string) => void;
  formatPrice: (amount: number, fromCurrency?: string) => string;
  convertPrice: (amount: number, fromCurrency: string, toCurrency: string) => number;
  getCartTotal: () => number;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signup: (email: string, password: string, profile: Partial<User>) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  logout: () => void;
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'vendorId' | 'vendorName' | 'createdAt'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, selectedVariations?: Record<string, string>) => void;
  removeFromCart: (productId: string, selectedVariations?: Record<string, string>) => void;
  clearCart: () => void;
  orders: Order[];
  placeOrder: (shippingDetails: ShippingDetails, paymentMethods: Record<string, PaymentMethodType>) => Promise<Order[]>;
  updateOrderStatus: (orderId: string, status: OrderStatus, description?: string) => Promise<void>;
  vendors: User[];
  admins: User[];
  updateVendorProfile: (vendor: User) => Promise<void>;
  updateUserProfile: (user: Partial<User>) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  addVendorPaymentMethod: (method: Omit<VendorPaymentMethod, 'id'>) => Promise<void>;
  updateVendorPaymentMethod: (method: VendorPaymentMethod) => Promise<void>;
  deleteVendorPaymentMethod: (id: string) => Promise<void>;
  uploadPaymentReceipt: (orderId: string, imageUrl: string) => Promise<void>;
  reviewPaymentReceipt: (orderId: string, status: 'approved' | 'rejected', reason?: string) => Promise<void>;
  adminStats: any;
  adminVendors: User[];
  adminProducts: Product[];
  adminOrders: Order[];
  adminCustomers: User[];
  adminInvestments: { opportunities: InvestmentOpportunity[], investments: Investment[] };
  adminReviews: Review[];
  fetchAdminStats: () => Promise<void>;
  fetchAdminVendors: () => Promise<void>;
  fetchAdminProducts: () => Promise<void>;
  fetchAdminOrders: () => Promise<void>;
  fetchAdminCustomers: () => Promise<void>;
  fetchAdminInvestments: () => Promise<void>;
  fetchAdminReviews: () => Promise<void>;
  updateVendorStatus: (vendorId: string, status: string) => Promise<void>;
  deleteUserAdmin: (id: string) => Promise<void>;
  deleteProductAdmin: (id: string) => Promise<void>;
  deleteReviewAdmin: (id: string) => Promise<void>;
  updateReviewStatusAdmin: (id: string, status: 'approved' | 'flagged' | 'pending') => Promise<void>;
  updateOrderStatusAdmin: (orderId: string, status: OrderStatus, description?: string) => Promise<void>;
  cancelGroupPurchaseAdmin: (groupId: string) => Promise<void>;
  uploadImage: (file: File, folder: string, onProgress?: (progress: number) => void) => Promise<string>;
  updateUserRole: (targetUserId: string, newRole: Role, targetUserName: string) => Promise<void>;
  updateUserStatus: (targetUserId: string, newStatus: string, targetUserName: string) => Promise<void>;
  auditLogs: AuditLog[];
  fetchAuditLogs: () => Promise<void>;
  recalculateTopRated: () => Promise<void>;
  vendorApplications: VendorApplication[];
  submitVendorApplication: (data: Omit<VendorApplication, 'id' | 'userId' | 'userName' | 'userEmail' | 'status' | 'createdAt'>) => Promise<void>;
  fetchVendorApplications: () => Promise<void>;
  reviewVendorApplication: (applicationId: string, status: 'approved' | 'rejected', reason?: string) => Promise<void>;
  customers: User[];
  isAuthReady: boolean;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  conversations: ChatConversation[];
  activeMessages: ChatMessage[];
  activeChatUserId: string | null;
  setActiveChatUserId: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (otherUserId: string) => (() => void);
  sendMessage: (receiverId: string, content: string, imageUrl?: string) => Promise<void>;
  fetchProductReviews: (productId: string) => Promise<Review[]>;
  fetchVendorReviews: (vendorId: string) => Promise<Review[]>;
  submitReview: (review: { productId?: string, vendorId?: string, rating: number, comment: string }) => Promise<void>;
  groupPurchases: GroupPurchase[];
  subscriptions: Subscription[];
  fetchGroupPurchases: () => Promise<void>;
  fetchSubscriptions: () => Promise<void>;
  createGroupPurchase: (productId: string, targetMembers: number, paymentMethod: PaymentMethodType, shippingDetails: ShippingDetails, durationHours?: number) => Promise<void>;
  joinGroupPurchase: (groupId: string, paymentMethod: PaymentMethodType, shippingDetails: ShippingDetails) => Promise<void>;
  createSubscription: (productId: string, frequency: 'daily' | 'weekly' | 'monthly', quantity: number) => Promise<void>;
  updateSubscriptionStatus: (id: string, status: 'active' | 'paused' | 'cancelled') => Promise<void>;
  investmentOpportunities: InvestmentOpportunity[];
  myInvestments: Investment[];
  vendorInvestments: Investment[];
  investorWallet: InvestorWallet | null;
  loading: boolean;
  fetchInvestmentOpportunities: () => Promise<void>;
  createInvestmentOpportunity: (data: any) => Promise<void>;
  invest: (opportunityId: string, tierId: string) => Promise<void>;
  fetchMyInvestments: () => Promise<void>;
  fetchVendorInvestments: () => Promise<void>;
  fetchInvestorWallet: () => Promise<void>;
  withdrawEarnings: (amount: number) => Promise<void>;
  userLocation: { country: string, city: string };
  setUserLocation: (location: { country: string, city: string }) => void;
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [preferredCurrency, setPreferredCurrency] = useState<string>(() => {
    return localStorage.getItem('preferredCurrency') || 'original';
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [groupPurchases, setGroupPurchases] = useState<GroupPurchase[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [investmentOpportunities, setInvestmentOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [myInvestments, setMyInvestments] = useState<Investment[]>([]);
  const [vendorInvestments, setVendorInvestments] = useState<Investment[]>([]);
  const [investorWallet, setInvestorWallet] = useState<InvestorWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ country: string, city: string }>(() => {
    const saved = localStorage.getItem('userLocation');
    return saved ? JSON.parse(saved) : { country: '', city: '' };
  });
  const [categories, setCategories] = useState<Category[]>([]);

  // Category Listener and Seeder
  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'categories'), orderBy('order', 'asc')), async (snapshot) => {
      if (snapshot.empty && (currentUser?.role === 'admin' || currentUser?.email === 'bushraanwar854@gmail.com')) {
        // Seed categories if empty
        const initialCategories = [
          { name: 'Bakery', icon: 'Croissant', order: 1, isActive: true },
          { name: 'Snacks', icon: 'Cookie', order: 2, isActive: true },
          { name: 'Frozen', icon: 'IceCream', order: 3, isActive: true },
          { name: 'Dairy', icon: 'Milk', order: 4, isActive: true },
          { name: 'Meat', icon: 'Beef', order: 5, isActive: true },
          { name: 'Beverages', icon: 'Coffee', order: 6, isActive: true },
          { name: 'Seafood', icon: 'Fish', order: 7, isActive: true },
          { name: 'Spices', icon: 'Flame', order: 8, isActive: true },
          { name: 'Fresh Items', icon: 'Apple', order: 9, isActive: true },
          { name: 'Rice', icon: 'Wheat', order: 10, isActive: true },
          { name: 'Grains', icon: 'Sprout', order: 11, isActive: true },
          { name: 'Cereals', icon: 'Bowl', order: 12, isActive: true },
        ];

        for (const cat of initialCategories) {
          await addDoc(collection(db, 'categories'), {
            ...cat,
            createdAt: serverTimestamp()
          });
        }
      } else {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    return () => unsubscribe();
  }, [currentUser?.id, currentUser?.role]);

  const addCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'categories'), cleanData({
        ...category,
        createdAt: serverTimestamp()
      }));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'categories');
    }
  };

  const updateCategory = async (category: Category) => {
    try {
      const { id, ...data } = category;
      await updateDoc(doc(db, 'categories', id), cleanData(data));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `categories/${category.id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `categories/${id}`);
    }
  };

  // Firebase Auth Listener
  useEffect(() => {
    const testConnection = async () => {
      try {
        const { getDocFromServer } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get user profile from Firestore
          let userDoc;
          try {
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          } catch (e) {
            handleFirestoreError(e, OperationType.GET, `users/${firebaseUser.uid}`);
          }

          if (userDoc?.exists()) {
            let userData = userDoc.data() as User;
            
            // Force admin role for super admin email
            if (firebaseUser.email === 'bushraanwar854@gmail.com' && userData.role !== 'admin') {
              userData.role = 'admin';
              try {
                await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' });
              } catch (e) {
                console.error("Failed to auto-update super admin role:", e);
              }
            }
            
            setCurrentUser({ id: firebaseUser.uid, ...userData });
          } else {
            // Create profile if it doesn't exist
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: firebaseUser.email === 'bushraanwar854@gmail.com' ? 'admin' : 'customer',
              status: 'active',
              createdAt: serverTimestamp() as any
            };
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
              setCurrentUser(newUser);
            } catch (e) {
              handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}`);
            }
          }
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        console.error("Auth listener error:", e);
      } finally {
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('userLocation', JSON.stringify(userLocation));
  }, [userLocation]);

  useEffect(() => {
    const detectUserContext = async () => {
      // Skip if already detected or preferred
      const hasLocation = !!userLocation.country;
      const hasPreferredCurrency = !!localStorage.getItem('preferredCurrency');
      
      if (hasLocation && hasPreferredCurrency) return;

      try {
        // Use a controller to timeout the request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error('Network response was not ok');
        
        const data = await res.json();
        
        if (!hasLocation && data.country_name) {
          setUserLocation({ country: data.country_name, city: data.city || '' });
        }
        
        if (!hasPreferredCurrency && data.currency) {
          setPreferredCurrency(data.currency);
        }
      } catch (e) {
        // Silent fail for location/currency detection as it's a non-critical enhancement
        // Fallback for currency if not set
        if (!hasPreferredCurrency) {
          try {
            const browserCurrency = new Intl.NumberFormat().resolvedOptions().currency;
            if (browserCurrency) setPreferredCurrency(browserCurrency);
          } catch (err) {
            // Final fallback to USD
            setPreferredCurrency('USD');
          }
        }
      }
    };
    
    detectUserContext();
  }, []);

  useEffect(() => {
    localStorage.setItem('preferredCurrency', preferredCurrency);
  }, [preferredCurrency]);

  const convertPrice = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    const baseAmount = amount / (EXCHANGE_RATES[fromCurrency] || 1);
    return baseAmount * (EXCHANGE_RATES[toCurrency] || 1);
  };

  const formatPrice = (amount: number, fromCurrency: string = 'USD'): string => {
    const targetCurrency = preferredCurrency === 'original' ? fromCurrency : preferredCurrency;
    const converted = convertPrice(amount, fromCurrency, targetCurrency);
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === targetCurrency) || SUPPORTED_CURRENCIES[0];
    const symbol = currency.code === 'original' ? '' : currency.symbol;
    
    // If it's original, we still need a symbol. If fromCurrency is not in SUPPORTED_CURRENCIES, we use its code.
    const displaySymbol = symbol || SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency)?.symbol || fromCurrency;
    
    return `${displaySymbol} ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('halal_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminVendors, setAdminVendors] = useState<User[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminCustomers, setAdminCustomers] = useState<User[]>([]);
  const [adminInvestments, setAdminInvestments] = useState<{ opportunities: InvestmentOpportunity[], investments: Investment[] }>({ opportunities: [], investments: [] });
  const [adminReviews, setAdminReviews] = useState<Review[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [vendorApplications, setVendorApplications] = useState<VendorApplication[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);

  const sendNotification = async (
    userId: string, 
    title: string, 
    message: string, 
    type: 'order' | 'payment' | 'system' | 'message' | 'approval' = 'system',
    link?: string
  ) => {
    try {
      await addDoc(collection(db, 'notifications'), cleanData({
        userId,
        title,
        message,
        type,
        isRead: false,
        isArchived: false,
        link,
        createdAt: serverTimestamp()
      }));
    } catch (e) {
      console.error("Failed to send notification:", e);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true
      });
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      const batch = writeBatch(db);
      unreadNotifications.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
    }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isArchived: true
      });
    } catch (e) {
      console.error("Failed to archive notification:", e);
    }
  };

  const clearNotifications = async () => {
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
    } catch (e) {
      console.error("Failed to clear notifications:", e);
    }
  };

  const activeChatUserIdRef = useRef<string | null>(null);
  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
    activeChatUserIdRef.current = activeChatUserId;
  }, [activeChatUserId]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const handleResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}...`);
  };

  const fetchVendors = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'vendor'));
      const snapshot = await getDocs(q);
      setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'users');
    }
  };

  const fetchOrders = async () => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'orders'), 
        where(currentUser.role === 'vendor' ? 'vendorId' : 'customerId', '==', currentUser.id)
      );
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'orders');
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'notifications'), where('userId', '==', currentUser.id));
      const snapshot = await getDocs(q);
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'notifications');
    }
  };

  const addVendorPaymentMethod = async (method: Omit<VendorPaymentMethod, 'id'>) => {
    if (!currentUser || (currentUser.role !== 'vendor' && currentUser.role !== 'seller')) return;
    const newMethod = { ...method, id: Math.random().toString(36).substr(2, 9) };
    const updatedMethods = [...(currentUser.paymentMethods || []), newMethod];
    await updateUserProfile({ paymentMethods: updatedMethods });
  };

  const updateVendorPaymentMethod = async (method: VendorPaymentMethod) => {
    if (!currentUser || (currentUser.role !== 'vendor' && currentUser.role !== 'seller')) return;
    const updatedMethods = (currentUser.paymentMethods || []).map(m => m.id === method.id ? method : m);
    await updateUserProfile({ paymentMethods: updatedMethods });
  };

  const deleteVendorPaymentMethod = async (id: string) => {
    if (!currentUser || (currentUser.role !== 'vendor' && currentUser.role !== 'seller')) return;
    const updatedMethods = (currentUser.paymentMethods || []).filter(m => m.id !== id);
    await updateUserProfile({ paymentMethods: updatedMethods });
  };

  const uploadPaymentReceipt = async (orderId: string, imageUrl: string) => {
    if (!currentUser) return;
    const orderRef = doc(db, 'orders', orderId);
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const receipt: PaymentReceipt = {
      imageUrl,
      uploadedAt: ensureDate(new Date()).toISOString(),
      status: 'receipt_uploaded'
    };
    
    try {
      await updateDoc(orderRef, {
        paymentReceipt: receipt,
        paymentStatus: 'receipt_uploaded',
        status: 'processing',
        history: arrayUnion({
          id: Math.random().toString(36).substr(2, 9),
          status: 'processing',
          description: 'Payment receipt uploaded. Awaiting vendor confirmation.',
          timestamp: ensureDate(new Date()).toISOString()
        })
      });

      // Notify Vendor
      await sendNotification(
        order.vendorId,
        'Payment Receipt Uploaded',
        `A payment receipt has been uploaded for order #${orderId.slice(0, 8).toUpperCase()}. Please review it.`,
        'payment',
        '/vendor?tab=orders'
      );

      // Notify Admins
      for (const admin of admins) {
        await sendNotification(
          admin.id,
          'New Payment Receipt',
          `Order #${orderId.slice(0, 8).toUpperCase()} has a new payment receipt awaiting review.`,
          'payment',
          '/admin?tab=payments'
        );
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const reviewPaymentReceipt = async (orderId: string, status: 'approved' | 'rejected', reason?: string) => {
    if (!currentUser) return;
    const orderRef = doc(db, 'orders', orderId);
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedReceipt = {
      ...order.paymentReceipt,
      status,
      rejectionReason: reason || null,
      reviewedAt: ensureDate(new Date()).toISOString(),
      reviewedBy: currentUser.id
    };

    const orderStatus = status === 'approved' ? 'confirmed' : 'payment_rejected';

    try {
      await updateDoc(orderRef, {
        paymentReceipt: updatedReceipt,
        paymentStatus: status,
        status: orderStatus,
        history: arrayUnion({
          id: Math.random().toString(36).substr(2, 9),
          status: orderStatus,
          description: status === 'approved' ? 'Payment approved' : `Payment rejected: ${reason}`,
          timestamp: ensureDate(new Date()).toISOString()
        })
      });

      // Notify Customer
      await sendNotification(
        order.customerId,
        status === 'approved' ? 'Payment Confirmed' : 'Payment Rejected',
        status === 'approved' 
          ? `Your payment for order #${orderId.slice(0, 8).toUpperCase()} has been confirmed. Your order is now confirmed!`
          : `Your payment for order #${orderId.slice(0, 8).toUpperCase()} was rejected. Reason: ${reason}`,
        'payment',
        '/dashboard?tab=orders'
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const fetchAdminStats = async () => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const productsSnap = await getDocs(collection(db, 'products'));
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const reviewsSnap = await getDocs(collection(db, 'reviews'));

      const orders = ordersSnap.docs.map(d => d.data());
      const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      setAdminStats({
        totalUsers: usersSnap.size,
        totalVendors: usersSnap.docs.filter(d => d.data().role === 'vendor').length,
        totalProducts: productsSnap.size,
        totalOrders: ordersSnap.size,
        totalRevenue,
        totalReviews: reviewsSnap.size
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'adminStats');
    }
  };

  const fetchAdminVendors = async () => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'vendor'));
      const snapshot = await getDocs(q);
      setAdminVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'adminVendors');
    }
  };

  const fetchAdminProducts = async () => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      setAdminProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'adminProducts');
    }
  };

  const fetchAdminOrders = async () => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      setAdminOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'adminOrders');
    }
  };

  const fetchAdminCustomers = async () => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'customer'));
      const snapshot = await getDocs(q);
      setAdminCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'adminCustomers');
    }
  };

  const fetchAdminInvestments = async () => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      const oppsSnap = await getDocs(collection(db, 'investmentOpportunities'));
      const invsSnap = await getDocs(collection(db, 'investments'));
      setAdminInvestments({
        opportunities: oppsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestmentOpportunity)),
        investments: invsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment))
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'adminInvestments');
    }
  };

  const fetchAdminReviews = async () => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      const snapshot = await getDocs(collection(db, 'reviews'));
      setAdminReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'adminReviews');
    }
  };

  const fetchAuditLogs = async () => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'auditLogs');
    }
  };

  const fetchVendorApplications = async () => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') {
      // If customer, only fetch their own
      if (currentUser) {
        try {
          const q = query(collection(db, 'vendorApplications'), where('userId', '==', currentUser.id));
          const snapshot = await getDocs(q);
          setVendorApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorApplication)));
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, 'vendorApplications');
        }
      }
      return;
    }
    
    try {
      const snapshot = await getDocs(collection(db, 'vendorApplications'));
      setVendorApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorApplication)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'vendorApplications');
    }
  };

  const submitVendorApplication = async (data: any) => {
    if (!currentUser) throw new Error("Authentication required");
    
    try {
      const applicationData = cleanData({
        ...data,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      await addDoc(collection(db, 'vendorApplications'), applicationData);
      
      // Notify Admins
      for (const admin of admins) {
        await sendNotification(
          admin.id,
          'New Vendor Application',
          `${currentUser.name} has applied to become a vendor.`,
          'approval',
          '/admin?tab=vendor-applications'
        );
      }
      
      fetchVendorApplications();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'vendorApplications');
    }
  };

  const reviewVendorApplication = async (applicationId: string, status: 'approved' | 'rejected', reason?: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    
    try {
      const appRef = doc(db, 'vendorApplications', applicationId);
      const appSnap = await getDoc(appRef);
      if (!appSnap.exists()) return;
      
      const appData = appSnap.data() as VendorApplication;
      
      await updateDoc(appRef, cleanData({
        status,
        rejectionReason: reason || null,
        reviewedAt: serverTimestamp(),
        reviewedBy: currentUser.id
      }));
      
      if (status === 'approved') {
        // Update user role to vendor
        await updateDoc(doc(db, 'users', appData.userId), {
          role: 'vendor',
          storeName: appData.businessName,
          storeDescription: appData.businessDescription
        });
        
        // Audit Log
        await addDoc(collection(db, 'auditLogs'), {
          action: 'APPROVE_VENDOR',
          performedBy: currentUser.id,
          performedByName: currentUser.name,
          targetUserId: appData.userId,
          targetUserName: appData.userName,
          details: `Vendor application approved for ${appData.businessName}`,
          createdAt: serverTimestamp()
        });
      } else {
        // Audit Log
        await addDoc(collection(db, 'auditLogs'), {
          action: 'REJECT_VENDOR',
          performedBy: currentUser.id,
          performedByName: currentUser.name,
          targetUserId: appData.userId,
          targetUserName: appData.userName,
          details: `Vendor application rejected. Reason: ${reason}`,
          createdAt: serverTimestamp()
        });
      }
      
      // Notify Customer
      await sendNotification(
        appData.userId,
        status === 'approved' ? 'Vendor Application Approved' : 'Vendor Application Rejected',
        status === 'approved' 
          ? `Congratulations! Your application to become a vendor has been approved. You now have access to vendor tools.`
          : `Your vendor application was rejected. Reason: ${reason}`,
        'approval',
        status === 'approved' ? '/vendor' : '/dashboard?tab=vendor'
      );
      
      fetchVendorApplications();
      fetchAdminVendors();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `vendorApplications/${applicationId}`);
    }
  };

  const updateUserRole = async (targetUserId: string, newRole: Role, targetUserName: string) => {
    const isSuperAdmin = currentUser?.email === 'bushraanwar854@gmail.com';
    
    // Only Super Admin can grant/revoke admin roles
    if (newRole === 'admin' || newRole === 'moderator' || newRole === 'support') {
      if (!isSuperAdmin) {
        throw new Error("Unauthorized: Only the Super Admin can grant administrative roles.");
      }
    }

    if (currentUser?.role !== 'admin' && !isSuperAdmin) {
      throw new Error("Unauthorized: Only admins can manage roles.");
    }

    try {
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, { role: newRole });

      // Determine specific audit action
      let auditAction: any = 'UPDATE_USER_ROLE';
      if (newRole === 'admin') auditAction = 'GRANT_ADMIN';
      else if (newRole === 'moderator') auditAction = 'GRANT_MODERATOR';
      else if (newRole === 'support') auditAction = 'GRANT_SUPPORT';
      else if (newRole === 'customer' || newRole === 'vendor') auditAction = 'REVOKE_ADMIN';

      // Create Audit Log
      await addDoc(collection(db, 'auditLogs'), {
        action: auditAction,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
        targetUserId,
        targetUserName,
        details: `Role updated to ${newRole}`,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${targetUserId}`);
      throw e;
    }
  };

  const updateUserStatus = async (targetUserId: string, newStatus: string, targetUserName: string) => {
    const isSuperAdmin = currentUser?.email === 'bushraanwar854@gmail.com';
    if (currentUser?.role !== 'admin' && !isSuperAdmin) {
      throw new Error("Unauthorized: Only admins can manage user status.");
    }

    try {
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, { status: newStatus });

      // Create Audit Log
      await addDoc(collection(db, 'auditLogs'), {
        action: newStatus === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
        performedBy: currentUser.id,
        performedByName: currentUser.name,
        targetUserId,
        targetUserName,
        details: `Status updated to ${newStatus}`,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${targetUserId}`);
      throw e;
    }
  };

  const deleteReviewAdmin = async (id: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      fetchAdminReviews();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `reviews/${id}`);
    }
  };

  const updateReviewStatusAdmin = async (id: string, status: 'approved' | 'flagged' | 'pending') => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      await updateDoc(doc(db, 'reviews', id), { status });
      fetchAdminReviews();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `reviews/${id}`);
    }
  };

  const uploadImage = async (file: File, folder: string, onProgress?: (progress: number) => void): Promise<string> => {
    if (!currentUser) throw new Error("Authentication required for upload");
    
    try {
      // Image compression
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(file, options);
      
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      
      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, compressedFile);
        
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          }, 
          (error) => {
            console.error("Upload error:", error);
            reject(error);
          }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Record media in Firestore for admin moderation
            try {
              await addDoc(collection(db, 'media'), {
                url: downloadURL,
                path: `${folder}/${fileName}`,
                folder,
                uploadedBy: currentUser.id,
                uploadedByEmail: currentUser.email,
                createdAt: serverTimestamp(),
                fileSize: compressedFile.size,
                fileName: file.name
              });
            } catch (e) {
              console.error("Error recording media:", e);
              // Don't fail the upload if recording fails
            }
            
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const recalculateTopRated = async () => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      // Logic to recalculate top rated vendors based on reviews
      const vendorsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'vendor')));
      for (const vendorDoc of vendorsSnap.docs) {
        const reviewsSnap = await getDocs(query(collection(db, 'reviews'), where('vendorId', '==', vendorDoc.id)));
        const reviews = reviewsSnap.docs.map(d => d.data());
        const avgRating = reviews.length > 0 ? reviews.reduce((sum, r: any) => sum + r.rating, 0) / reviews.length : 0;
        const isTopRated = avgRating >= 4.5 && reviews.length >= 5;
        await updateDoc(doc(db, 'users', vendorDoc.id), { isTopRated });
      }
      fetchAdminVendors();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  };

  useEffect(() => {
    setIsAuthReady(true);
  }, []);

  const fetchSubscriptions = async () => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'subscriptions'), 
        or(
          where('customerId', '==', currentUser.id),
          where('vendorId', '==', currentUser.id)
        )
      );
      const snapshot = await getDocs(q);
      setSubscriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'subscriptions');
    }
  };

  const fetchGroupPurchases = async () => {
    try {
      const q = query(collection(db, 'groupPurchases'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setGroupPurchases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupPurchase)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'groupPurchases');
    }
  };

  const fetchInvestmentOpportunities = async () => {
    try {
      const q = query(collection(db, 'investmentOpportunities'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setInvestmentOpportunities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestmentOpportunity)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'investmentOpportunities');
    }
  };

  const fetchMyInvestments = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'investments'), where('investorId', '==', currentUser.id), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setMyInvestments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'investments');
    }
  };

  const fetchVendorInvestments = async () => {
    if (!currentUser || currentUser.role !== 'vendor') return;
    try {
      const q = query(collection(db, 'investments'), where('vendorId', '==', currentUser.id), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setVendorInvestments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'investments');
    }
  };

  const fetchInvestorWallet = async () => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'investorWallets', currentUser.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setInvestorWallet(docSnap.data() as InvestorWallet);
      } else {
        const newWallet: InvestorWallet = {
          userId: currentUser.id,
          balance: 0,
          totalEarned: 0,
          updatedAt: ensureDate(new Date()).toISOString()
        };
        await setDoc(docRef, newWallet);
        setInvestorWallet(newWallet);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `investorWallets/${currentUser.id}`);
    }
  };

  const createInvestmentOpportunity = async (data: any) => {
    if (!currentUser || currentUser.role !== 'vendor') return;
    try {
      const newOpportunity = cleanData({
        ...data,
        vendorId: currentUser.id,
        currentFunding: 0,
        status: 'active',
        createdAt: serverTimestamp()
      });
      await addDoc(collection(db, 'investmentOpportunities'), newOpportunity);
      
      // Notify Admins
      for (const admin of admins) {
        await sendNotification(
          admin.id,
          'New Investment Opportunity',
          `${currentUser.name} has created a new investment opportunity for ${data.productName}.`,
          'approval',
          '/admin?tab=investments'
        );
      }
      
      fetchInvestmentOpportunities();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'investmentOpportunities');
    }
  };

  const invest = async (opportunityId: string, tierId: string) => {
    if (!currentUser) return;
    try {
      const oppRef = doc(db, 'investmentOpportunities', opportunityId);
      const oppSnap = await getDoc(oppRef);
      if (!oppSnap.exists()) return;
      const oppData = oppSnap.data();
      const tier = oppData.tiers.find((t: any) => t.id === tierId);
      if (!tier) return;

      const newInvestment = {
        opportunityId,
        productId: oppData.productId,
        productName: oppData.productName,
        investorId: currentUser.id,
        tierId,
        tierName: tier.name,
        amount: tier.amount,
        expectedReturnPct: tier.returnPct,
        earnedSoFar: 0,
        status: 'active',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'investments'), newInvestment);
      try {
        await updateDoc(oppRef, {
          currentFunding: increment(tier.amount)
        });

        // Notify Vendor
        await sendNotification(
          oppData.vendorId,
          'New Investment Received',
          `${currentUser.name} has invested ${formatPrice(tier.amount, 'USD')} in your opportunity for ${oppData.productName}.`,
          'payment',
          '/vendor'
        );
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `investmentOpportunities/${opportunityId}`);
      }
      
      // Update wallet
      const walletRef = doc(db, 'investorWallets', currentUser.id);
      try {
        await setDoc(walletRef, {
          balance: increment(-tier.amount),
          updatedAt: ensureDate(new Date()).toISOString()
        }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `investorWallets/${currentUser.id}`);
      }

      fetchMyInvestments();
      fetchInvestorWallet();
      fetchInvestmentOpportunities();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'investments');
    }
  };

  const withdrawEarnings = async (amount: number) => {
    if (!currentUser) return;
    try {
      const walletRef = doc(db, 'investorWallets', currentUser.id);
      await setDoc(walletRef, {
        balance: increment(-amount),
        updatedAt: ensureDate(new Date()).toISOString()
      }, { merge: true });
      fetchInvestorWallet();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `investorWallets/${currentUser.id}`);
    }
  };

  const createSubscription = async (productId: string, frequency: 'daily' | 'weekly' | 'monthly', quantity: number) => {
    if (!currentUser) return;
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const newSubscription = cleanData({
        customerId: currentUser.id,
        productId,
        productName: product.name,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        frequency,
        quantity,
        price: product.price,
        currency: product.currency,
        status: 'active',
        nextDelivery: ensureDate(new Date(Date.now() + 86400000)).toISOString(), // Tomorrow
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'subscriptions'), newSubscription);
      fetchSubscriptions();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'subscriptions');
    }
  };

  const updateSubscriptionStatus = async (id: string, status: 'active' | 'paused' | 'cancelled') => {
    try {
      await updateDoc(doc(db, 'subscriptions', id), { status });
      fetchSubscriptions();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `subscriptions/${id}`);
    }
  };

  const createGroupPurchase = async (productId: string, targetMembers: number, paymentMethod: PaymentMethodType, shippingDetails: ShippingDetails, durationHours: number = 24) => {
    if (!currentUser) return;
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const newGroup = cleanData({
        productId,
        productName: product.name,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        targetMembers,
        currentMembers: 1,
        price: product.groupPrice || product.price,
        currency: product.currency,
        expiresAt: ensureDate(new Date(Date.now() + durationHours * 3600000)).toISOString(),
        status: 'open',
        createdAt: serverTimestamp(),
        members: [{
          id: Math.random().toString(36).substr(2, 9),
          customerId: currentUser.id,
          customerName: currentUser.name,
          joinedAt: ensureDate(new Date()).toISOString(),
          paymentMethod,
          shippingDetails
        }]
      });

      await addDoc(collection(db, 'groupPurchases'), newGroup);
      fetchGroupPurchases();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'groupPurchases');
    }
  };

  const joinGroupPurchase = async (groupId: string, paymentMethod: PaymentMethodType, shippingDetails: ShippingDetails) => {
    if (!currentUser) return;
    try {
      const groupRef = doc(db, 'groupPurchases', groupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) return;
      const groupData = groupSnap.data();

      if (groupData.status !== 'open') throw new Error('Group purchase is no longer open');
      if (groupData.members.some((m: any) => m.customerId === currentUser.id)) throw new Error('You have already joined this group');

      const newMember = {
        id: Math.random().toString(36).substr(2, 9),
        customerId: currentUser.id,
        customerName: currentUser.name,
        joinedAt: ensureDate(new Date()).toISOString(),
        paymentMethod,
        shippingDetails
      };

      const newMembers = [...groupData.members, newMember];
      const newCount = newMembers.length;
      const isCompleted = newCount >= groupData.targetMembers;

      try {
        await updateDoc(groupRef, {
          members: newMembers,
          currentMembers: newCount,
          status: isCompleted ? 'completed' : 'open'
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `groupPurchases/${groupId}`);
        throw e;
      }

      if (isCompleted) {
        // Create orders for all members
        for (const member of newMembers) {
          const product = products.find(p => p.id === groupData.productId);
          if (!product) continue;

          const newOrder = {
            groupPurchaseId: groupId,
            customerId: member.customerId,
            customerName: member.customerName,
            vendorId: groupData.vendorId,
            vendorName: groupData.vendorName,
            items: [{
              productId: groupData.productId,
              productName: groupData.productName,
              price: groupData.price,
              currency: groupData.currency,
              quantity: 1,
              selectedVariations: {},
              imageUrl: product.imageUrl
            }],
            totalAmount: groupData.price,
            currency: groupData.currency,
            shippingDetails: member.shippingDetails,
            paymentMethod: member.paymentMethod,
            status: 'pending',
            paymentStatus: 'pending',
            history: [{
              id: Math.random().toString(36).substr(2, 9),
              status: 'pending',
              description: 'Group purchase completed, order created',
              timestamp: ensureDate(new Date()).toISOString()
            }],
            createdAt: serverTimestamp()
          };
          
          try {
            await addDoc(collection(db, 'orders'), newOrder);
            
            // Notify member
            await sendNotification(
              member.customerId,
              'Group Buy Completed!',
              `The group buy for ${groupData.productName} is now complete! Your order has been created.`,
              'order',
              '/dashboard?tab=orders'
            );
          } catch (e) {
            handleFirestoreError(e, OperationType.CREATE, 'orders');
          }
        }

        // Notify Vendor
        await sendNotification(
          groupData.vendorId,
          'Group Buy Completed',
          `The group buy for ${groupData.productName} has reached its target! ${newCount} orders have been created.`,
          'order',
          '/vendor?tab=orders'
        );
      } else {
        // Notify Vendor of new member
        await sendNotification(
          groupData.vendorId,
          'New Group Buy Member',
          `${currentUser.name} has joined the group buy for ${groupData.productName}.`,
          'order',
          '/vendor'
        );

        // Notify current user
        await sendNotification(
          currentUser.id,
          'Joined Group Buy',
          `You have successfully joined the group buy for ${groupData.productName}.`,
          'order',
          '/dashboard?tab=groups'
        );
      }

      fetchGroupPurchases();
      fetchOrders();
    } catch (e) {
      // This catch handles errors before the updateDoc or custom errors
      if (e instanceof Error && e.message === 'Group purchase is no longer open') {
        // Log it but maybe don't use handleFirestoreError if it's not a firestore error
        console.error('Group Buy Error:', e.message);
      } else {
        // For other errors, we might still want to log them
        console.error('Join Group Buy Error:', e);
      }
      throw e;
    }
  };

  useEffect(() => {
    // Real-time listeners
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setLoading(false);
    });

    const unsubVendors = onSnapshot(query(collection(db, 'users'), where('role', '==', 'vendor')), (snapshot) => {
      setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    let unsubAdmins: () => void;
    let unsubOrders: () => void;
    let unsubNotifications: () => void;
    let unsubConversations: () => void;
    let unsubGroupPurchases: () => void;
    let unsubSubscriptions: () => void;
    let unsubVendorApplications: () => void;

    if (currentUser) {
      // Clear previous data for new user
      setOrders([]);
      setNotifications([]);
      setConversations([]);
      setGroupPurchases([]);
      setSubscriptions([]);

      const ordersQ = query(
        collection(db, 'orders'), 
        or(
          where('customerId', '==', currentUser.id),
          where('vendorId', '==', currentUser.id)
        )
      );
      unsubOrders = onSnapshot(ordersQ, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      }, (error) => {
        if (auth.currentUser) {
          handleFirestoreError(error, OperationType.LIST, 'orders');
        }
      });

      const notifQ = query(collection(db, 'notifications'), where('userId', '==', currentUser.id));
      unsubNotifications = onSnapshot(notifQ, (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      }, (error) => {
        if (auth.currentUser) {
          handleFirestoreError(error, OperationType.LIST, 'notifications');
        }
      });

      // Conversations listener
      const convQ = query(
        collection(db, 'conversations'), 
        where('participants', 'array-contains', currentUser.id)
      );
      unsubConversations = onSnapshot(convQ, (snapshot) => {
        setConversations(snapshot.docs.map(doc => {
          const data = doc.data();
          const otherUserId = data.participants.find((p: string) => p !== currentUser.id);
          return {
            otherUserId,
            otherUserName: data.participantNames[otherUserId],
            otherUserProfileImage: data.participantImages?.[otherUserId],
            lastMessage: data.lastMessage,
            unreadCount: data.unreadCounts?.[currentUser.id] || 0
          } as ChatConversation;
        }));
      }, (error) => {
        if (auth.currentUser) {
          handleFirestoreError(error, OperationType.LIST, 'conversations');
        }
      });

      const groupQ = query(collection(db, 'groupPurchases'));
      unsubGroupPurchases = onSnapshot(groupQ, (snapshot) => {
        setGroupPurchases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupPurchase)));
      }, (error) => {
        if (auth.currentUser) {
          handleFirestoreError(error, OperationType.LIST, 'groupPurchases');
        }
      });

      const subQ = query(
        collection(db, 'subscriptions'), 
        or(
          where('customerId', '==', currentUser.id),
          where('vendorId', '==', currentUser.id)
        )
      );
      unsubSubscriptions = onSnapshot(subQ, (snapshot) => {
        setSubscriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription)));
      }, (error) => {
        if (auth.currentUser) {
          handleFirestoreError(error, OperationType.LIST, 'subscriptions');
        }
      });

      const vendorAppQ = (currentUser.role === 'admin' || currentUser.email === 'bushraanwar854@gmail.com')
        ? query(collection(db, 'vendorApplications'))
        : query(collection(db, 'vendorApplications'), where('userId', '==', currentUser.id));

      unsubVendorApplications = onSnapshot(vendorAppQ, (snapshot) => {
        setVendorApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorApplication)));
      }, (error) => {
        if (auth.currentUser) {
          handleFirestoreError(error, OperationType.LIST, 'vendorApplications');
        }
      });

      if (currentUser.role === 'admin' || currentUser.email === 'bushraanwar854@gmail.com') {
        unsubAdmins = onSnapshot(query(collection(db, 'users'), where('role', 'in', ['admin', 'support', 'moderator'])), (snapshot) => {
          setAdmins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        }, (error) => {
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.LIST, 'users');
          }
        });
      }
    }

    return () => {
      unsubProducts();
      unsubVendors();
      unsubAdmins?.();
      unsubOrders?.();
      unsubNotifications?.();
      unsubConversations?.();
      unsubGroupPurchases?.();
      unsubSubscriptions?.();
      unsubVendorApplications?.();
    };
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    localStorage.setItem('halal_cart', JSON.stringify(cart));
  }, [cart]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const signup = async (email: string, password: string, profile: Partial<User>) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // Create user document in Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), cleanData({
          ...profile,
          email,
          status: 'active',
          createdAt: serverTimestamp()
        }));
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error("No user logged in");
    try {
      await firebaseUpdatePassword(auth.currentUser, newPassword);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const addProduct = async (product: Omit<Product, 'id' | 'vendorId' | 'vendorName'>) => {
    if (!currentUser || currentUser.role !== 'vendor') return;
    try {
      const newProduct = cleanData({
        ...product,
        vendorId: currentUser.id,
        vendorName: currentUser.storeName || currentUser.name,
        createdAt: serverTimestamp(),
        rating: 0,
        reviewCount: 0
      });
      await addDoc(collection(db, 'products'), newProduct);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'products');
    }
  };

  const updateProduct = async (product: Product) => {
    const { id, ...data } = product;
    try {
      await updateDoc(doc(db, 'products', id), cleanData(data));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    }
  };

  const getCartTotal = (): number => {
    return cart.reduce((sum, item) => {
      const itemTotal = item.product.price * item.quantity;
      // Always convert to USD as the base for the total sum
      return sum + convertPrice(itemTotal, item.product.currency, 'USD');
    }, 0);
  };

  const addToCart = (product: Product, quantity: number, selectedVariations?: Record<string, string>) => {
    if (currentUser?.id === product.vendorId) {
      return;
    }
    setCart(prev => {
      const existingItemIndex = prev.findIndex(item => 
        item.product.id === product.id && 
        JSON.stringify(item.selectedVariations || {}) === JSON.stringify(selectedVariations || {})
      );

      if (existingItemIndex >= 0) {
        const newCart = [...prev];
        const existingItem = newCart[existingItemIndex];
        
        // Update quantity and ensure price/stock/image is current for the variation
        existingItem.quantity += quantity;
        existingItem.product = {
          ...existingItem.product,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl
        };
        
        return newCart;
      }

      return [...prev, {
        productId: product.id,
        product,
        quantity,
        selectedVariations
      }];
    });
  };

  const removeFromCart = (productId: string, selectedVariations?: Record<string, string>) => {
    setCart(prev => prev.filter(item => 
      !(item.product.id === productId && JSON.stringify(item.selectedVariations) === JSON.stringify(selectedVariations || {}))
    ));
  };

  const clearCart = () => setCart([]);

  const placeOrder = async (shippingDetails: ShippingDetails, paymentMethods: Record<string, PaymentMethodType>) => {
    if (!currentUser || cart.length === 0) return [];

    const createdOrders: Order[] = [];

    // Group cart items by vendor
    const itemsByVendor = cart.reduce((acc, item) => {
      if (!acc[item.product.vendorId]) acc[item.product.vendorId] = [];
      acc[item.product.vendorId].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    // Create an order for each vendor
    for (const [vendorId, items] of Object.entries(itemsByVendor) as [string, CartItem[]][]) {
      const vendor = vendors.find(v => v.id === vendorId);
      const orderCurrency = (items as CartItem[])[0]?.product?.currency || 'USD';
      const totalAmount = (items as CartItem[]).reduce((sum, item) => {
        const itemTotal = item.product.price * item.quantity;
        return sum + convertPrice(itemTotal, item.product.currency, orderCurrency);
      }, 0);

      const paymentMethod = paymentMethods[vendorId] || 'card';
      const vendorPaymentDetails = vendor?.paymentMethods?.find(m => m.type === paymentMethod);

      const orderItems = (items as CartItem[]).map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        currency: item.product.currency,
        quantity: item.quantity,
        selectedVariations: item.selectedVariations,
        imageUrl: item.product.imageUrl
      }));

      const newOrderData = {
        customerId: currentUser.id,
        customerName: currentUser.name,
        vendorId,
        vendorName: vendor?.storeName || vendor?.name || 'Unknown Vendor',
        items: orderItems,
        totalAmount,
        currency: orderCurrency,
        shippingDetails,
        paymentMethod,
        vendorPaymentDetails,
        status: 'pending' as OrderStatus,
        paymentStatus: 'pending' as PaymentStatus,
        history: [{
          id: Math.random().toString(36).substr(2, 9),
          status: 'pending' as OrderStatus,
          description: `Order placed successfully. Awaiting payment via ${paymentMethod}.`,
          timestamp: ensureDate(new Date()).toISOString()
        }],
        createdAt: serverTimestamp()
      };

      try {
        const orderDoc = await addDoc(collection(db, 'orders'), cleanData(newOrderData));
        
        createdOrders.push({
          id: orderDoc.id,
          ...newOrderData,
          createdAt: new Date().toISOString()
        } as unknown as Order);
        
        // Notify Vendor
        await sendNotification(
          vendorId,
          'New Order Received',
          `You have received a new order from ${currentUser.name}.`,
          'order',
          '/vendor?tab=orders'
        );
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'orders');
      }
      
      // Update product stock
      for (const item of items) {
        try {
          await updateDoc(doc(db, 'products', item.product.id), {
            stock: increment(-item.quantity)
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `products/${item.product.id}`);
        }
      }
    }

    clearCart();
    
    // Update local user state with new shipping details
    if (currentUser) {
      await updateUserProfile({ lastShippingDetails: shippingDetails });
    }

    return createdOrders;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, description?: string) => {
    const orderRef = doc(db, 'orders', orderId);
    let orderSnap;
    try {
      orderSnap = await getDoc(orderRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `orders/${orderId}`);
      return;
    }
    if (!orderSnap.exists()) return;
    
    const history = orderSnap.data().history || [];
    const newHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      status,
      description: description || `Order status updated to ${status}`,
      timestamp: ensureDate(new Date()).toISOString()
    };

    try {
      await updateDoc(orderRef, cleanData({
        status,
        history: [...history, newHistoryItem]
      }));

      // Notify Customer
      await sendNotification(
        orderSnap.data().customerId,
        'Order Status Updated',
        `Your order #${orderId.slice(0, 8).toUpperCase()} status has been updated to ${status}.`,
        'order',
        '/dashboard?tab=orders'
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateVendorProfile = async (vendor: User) => {
    try {
      await updateDoc(doc(db, 'users', vendor.id), cleanData(vendor));
      setCurrentUser(vendor);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${vendor.id}`);
    }
  };

  const updateUserProfile = async (userData: Partial<User>) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.id), cleanData(userData));
      setCurrentUser({ ...currentUser, ...userData } as User);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!currentUser) return;
    const wishlist = currentUser.wishlist || [];
    const newWishlist = wishlist.includes(productId)
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId];
    
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { wishlist: newWishlist });
      setCurrentUser({ ...currentUser, wishlist: newWishlist });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  const updateVendorStatus = async (vendorId: string, status: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      await updateDoc(doc(db, 'users', vendorId), { status });
      fetchAdminVendors();
      fetchAdminStats();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${vendorId}`);
    }
  };

  const deleteUserAdmin = async (id: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      await deleteDoc(doc(db, 'users', id));
      fetchAdminVendors();
      fetchAdminCustomers();
      fetchAdminStats();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${id}`);
    }
  };

  const deleteProductAdmin = async (id: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      await deleteDoc(doc(db, 'products', id));
      fetchAdminProducts();
      // fetchProducts();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    }
  };

  const updateOrderStatusAdmin = async (orderId: string, status: OrderStatus, description?: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    await updateOrderStatus(orderId, status, description);
    fetchAdminOrders();
    fetchAdminStats();
  };

  const cancelGroupPurchaseAdmin = async (groupId: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.email !== 'bushraanwar854@gmail.com') return;
    try {
      await updateDoc(doc(db, 'groupPurchases', groupId), {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
      await fetchGroupPurchases();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `groupPurchases/${groupId}`);
    }
  };

  useEffect(() => {
    if (!activeChatUserId) {
      setActiveMessages([]);
    }
  }, [activeChatUserId]);

  const fetchConversations = async () => {
    // Handled by onSnapshot in useEffect
  };

  const fetchMessages = (otherUserId: string) => {
    if (!currentUser) return () => {};
    setActiveChatUserId(otherUserId);
    
    const participants = [currentUser.id, otherUserId].sort();
    const conversationId = participants.join('_');
    
    const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
    }, (error) => {
      // Only report if we have a user, otherwise it's likely a logout event
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.LIST, `conversations/${conversationId}/messages`);
      }
    });

    // Mark as read
    const markAsRead = async () => {
      const convRef = doc(db, 'conversations', conversationId);
      try {
        const convSnap = await getDoc(convRef);
        if (convSnap.exists()) {
          await updateDoc(convRef, {
            [`unreadCounts.${currentUser.id}`]: 0
          });
        }
      } catch (e) {
        // Ignore if we can't mark as read (e.g. conversation doesn't exist yet)
        console.warn("Could not mark conversation as read:", e);
      }
    };
    markAsRead();

    return unsubscribe;
  };

  const sendMessage = async (receiverId: string, content: string, imageUrl?: string) => {
    if (!currentUser || (!content.trim() && !imageUrl)) return;
    
    const participants = [currentUser.id, receiverId].sort();
    const conversationId = participants.join('_');
    
    const messageData = {
      senderId: currentUser.id,
      receiverId,
      content,
      imageUrl,
      isRead: false,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), cleanData(messageData));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `conversations/${conversationId}/messages`);
    }

    // Update conversation metadata
    const convRef = doc(db, 'conversations', conversationId);
    let convSnap;
    let receiverData;
    try {
      convSnap = await getDoc(convRef);
      const receiverDoc = await getDoc(doc(db, 'users', receiverId));
      receiverData = receiverDoc.data();
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `conversations/${conversationId} or users/${receiverId}`);
      return;
    }
    
    const updateData = cleanData({
      participants,
      participantNames: {
        [currentUser.id]: currentUser.name,
        [receiverId]: receiverData?.name || 'Unknown'
      },
      participantImages: {
        [currentUser.id]: currentUser.profileImage || '',
        [receiverId]: receiverData?.profileImage || ''
      },
      lastMessage: {
        ...messageData,
        createdAt: ensureDate(new Date()).toISOString()
      },
      updatedAt: serverTimestamp(),
      [`unreadCounts.${receiverId}`]: increment(1)
    });

    try {
      if (convSnap.exists()) {
        await updateDoc(convRef, updateData);
      } else {
        await setDoc(convRef, updateData);
      }

      // Notify recipient
      await sendNotification(
        receiverId,
        'New Message',
        `You have a new message from ${currentUser.name}: "${content.length > 50 ? content.substring(0, 50) + '...' : content}"`,
        'message',
        currentUser.role === 'admin' ? '/admin?tab=messages' : 
        currentUser.role === 'vendor' ? '/vendor?tab=messages' : '/dashboard?tab=messages'
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `conversations/${conversationId}`);
    }
  };

  const submitReview = async (review: { productId?: string, vendorId?: string, rating: number, comment: string }) => {
    if (!currentUser) throw new Error('You must be logged in to submit a review');

    // Vendor Restriction: Cannot review own product/store
    if (review.productId) {
      const product = products.find(p => p.id === review.productId);
      if (product && product.vendorId === currentUser.id) {
        throw new Error('Vendors cannot review their own products');
      }
    }
    if (review.vendorId === currentUser.id) {
      throw new Error('Vendors cannot review their own store');
    }

    // Purchase Requirement: Must have purchased the product
    let isVerifiedPurchase = false;
    if (review.productId) {
      const deliveredOrder = orders.find(o => 
        o.customerId === currentUser.id && 
        o.status === 'delivered' && 
        o.items.some(item => item.productId === review.productId)
      );
      if (!deliveredOrder) {
        throw new Error('You must purchase and receive the product before leaving a review');
      }
      isVerifiedPurchase = true;
    }

    try {
      const newReview = cleanData({
        ...review,
        userId: currentUser.id,
        userName: currentUser.name,
        userProfileImage: currentUser.profileImage || '',
        isVerifiedPurchase,
        status: 'approved' as const, // Set to approved immediately for visibility
        createdAt: serverTimestamp()
      });
      
      const reviewDoc = await addDoc(collection(db, 'reviews'), newReview);
      
      // Update product/vendor rating (only if approved, but we'll do it now for simplicity or wait for approval)
      // Requirement says "Visibility of Ratings and Reviews: All ratings and reviews... must be visible"
      // If we want them visible immediately but moderated later, we can set status to 'approved' by default
      // Let's set to 'approved' by default for verified purchases, 'pending' otherwise (if we allowed non-verified, but we don't)
      // Actually, let's stick to 'approved' for verified purchases to ensure immediate visibility as requested.
      
      await updateDoc(doc(db, 'reviews', reviewDoc.id), { status: 'approved' });

      if (review.productId) {
        const productRef = doc(db, 'products', review.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const data = productSnap.data();
          const newCount = (data.reviewCount || 0) + 1;
          const newRating = ((data.rating || 0) * (data.reviewCount || 0) + review.rating) / newCount;
          await updateDoc(productRef, {
            rating: newRating,
            reviewCount: newCount
          });
        }
      }

      // Also update vendor rating if applicable
      const vId = review.vendorId || (review.productId ? products.find(p => p.id === review.productId)?.vendorId : null);
      if (vId) {
        const vendorRef = doc(db, 'users', vId);
        const vendorSnap = await getDoc(vendorRef);
        if (vendorSnap.exists()) {
          const data = vendorSnap.data();
          const newCount = (data.reviewCount || 0) + 1;
          const newRating = ((data.rating || 0) * (data.reviewCount || 0) + review.rating) / newCount;
          await updateDoc(vendorRef, {
            rating: newRating,
            reviewCount: newCount
          });
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'reviews');
    }
  };

  const fetchProductReviews = async (productId: string): Promise<Review[]> => {
    try {
      const q = query(collection(db, 'reviews'), where('productId', '==', productId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'reviews');
    }
    return [];
  };

  const fetchVendorReviews = async (vendorId: string): Promise<Review[]> => {
    try {
      const q = query(collection(db, 'reviews'), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'reviews');
    }
    return [];
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      preferredCurrency,
      setPreferredCurrency,
      formatPrice,
      convertPrice,
      getCartTotal,
      login,
      loginWithGoogle,
      resetPassword,
      signup,
      logout,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      orders,
      placeOrder,
      updateOrderStatus,
      vendors,
      admins,
      updateVendorProfile,
      updateUserProfile,
      toggleWishlist,
      addVendorPaymentMethod,
      updateVendorPaymentMethod,
      deleteVendorPaymentMethod,
      uploadPaymentReceipt,
      reviewPaymentReceipt,
      adminStats,
      adminVendors,
      adminProducts,
      adminOrders,
      adminCustomers,
      adminInvestments,
      adminReviews,
      fetchAdminStats,
      fetchAdminVendors,
      fetchAdminProducts,
      fetchAdminOrders,
      fetchAdminCustomers,
      fetchAdminInvestments,
      fetchAdminReviews,
      updateVendorStatus,
      deleteUserAdmin,
      deleteProductAdmin,
      deleteReviewAdmin,
      updateReviewStatusAdmin,
      updateOrderStatusAdmin,
      cancelGroupPurchaseAdmin,
      uploadImage,
      updateUserRole,
      updateUserStatus,
      auditLogs,
      fetchAuditLogs,
      recalculateTopRated,
      vendorApplications,
      submitVendorApplication,
      fetchVendorApplications,
      reviewVendorApplication,
      customers,
      isAuthReady,
      notifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      archiveNotification,
      clearNotifications,
      conversations,
      activeMessages,
      activeChatUserId,
      setActiveChatUserId,
      fetchConversations,
      fetchMessages,
      sendMessage,
      fetchProductReviews,
      fetchVendorReviews,
      submitReview,
      groupPurchases,
      subscriptions,
      fetchGroupPurchases,
      fetchSubscriptions,
      createGroupPurchase,
      joinGroupPurchase,
      createSubscription,
      updateSubscriptionStatus,
      investmentOpportunities,
      myInvestments,
      investorWallet,
      loading,
      fetchInvestmentOpportunities,
      createInvestmentOpportunity,
      invest,
      fetchMyInvestments,
      fetchVendorInvestments,
      fetchInvestorWallet,
      withdrawEarnings,
      vendorInvestments,
      updatePassword,
      userLocation,
      setUserLocation,
      categories,
      addCategory,
      updateCategory,
      deleteCategory
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
