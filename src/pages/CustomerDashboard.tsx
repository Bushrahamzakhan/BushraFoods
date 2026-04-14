import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  Package, Clock, CheckCircle, Truck, MapPin, 
  CreditCard, Banknote, User as UserIcon, Heart, 
  Settings, ShoppingBag, ChevronRight, Star, MessageSquare, X, Users,
  Eye, EyeOff, Lock, Upload, Search, Filter, RefreshCw, Store, XCircle, AlertCircle
} from 'lucide-react';
import { OrderStatus, PaymentStatus } from '../types';
import { ensureDate } from '../lib/utils';
import { COUNTRIES } from '../constants';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import PaymentReceiptUpload from '../components/PaymentReceiptUpload';
import ImageUploadField from '../components/ImageUploadField';

export default function CustomerDashboard() {
  const { 
    currentUser, orders, products, formatPrice, updateUserProfile, 
    toggleWishlist, conversations, sendMessage, userLocation, setUserLocation,
    updatePassword, uploadPaymentReceipt, addToCart,
    vendorApplications, submitVendorApplication
  } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile' | 'messages' | 'subscriptions' | 'groups' | 'vendor'>('orders');
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadingReceiptOrder, setUploadingReceiptOrder] = useState<any>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const { subscriptions, groupPurchases, updateSubscriptionStatus } = useAppContext();

  useEffect(() => {
    const state = location.state as { openChatWith?: string, activeTab?: string, triggerReceiptUpload?: boolean, statusFilter?: string };
    if (state?.openChatWith) {
      setActiveTab('messages');
      setSelectedChatUserId(state.openChatWith);
      // Clear state to avoid reopening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    } else if (state?.activeTab) {
      setActiveTab(state.activeTab as any);
      
      if (state.statusFilter) {
        setOrderStatusFilter(state.statusFilter);
      }
      
      // If triggered from checkout, find pending orders
      if (state.triggerReceiptUpload) {
        const pendingOrders = orders.filter(o => 
          o.customerId === currentUser?.id && 
          o.paymentStatus === 'pending' && 
          o.paymentMethod !== 'card'
        );

        if (pendingOrders.length > 0) {
          if (pendingOrders.length === 1) {
            // If only one vendor, open the upload modal directly
            setUploadingReceiptOrder(pendingOrders[0]);
          } else {
            // If multiple vendors, ensure we are on orders tab and pending filter is on
            setOrderStatusFilter('pending');
          }
          // Clear state only after handling orders
          navigate(location.pathname, { replace: true, state: {} });
        }
        // If no pending orders yet, we wait for the next effect run when orders load
      } else {
        // No receipt upload trigger, clear state immediately
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, orders, currentUser?.id]);

  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    profileImage: currentUser?.profileImage || ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [vendorFormData, setVendorFormData] = useState({
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    phoneNumber: ''
  });
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);
  const [vendorSuccess, setVendorSuccess] = useState(false);

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingVendor(true);
    try {
      await submitVendorApplication(vendorFormData);
      setVendorSuccess(true);
    } catch (error) {
      console.error("Error submitting vendor application:", error);
    } finally {
      setIsSubmittingVendor(false);
    }
  };

  const myApplication = vendorApplications.find(app => app.userId === currentUser?.id);

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile(profileData);
    setSuccessMessage('Profile updated successfully!');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    try {
      await updatePassword(passwordData.newPassword);
      setPasswordSuccess(true);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password. You may need to re-authenticate.");
    }
  };

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderTimeFilter, setOrderTimeFilter] = useState<string>('all');

  const myOrders = orders
    .filter(o => o.customerId === currentUser.id)
    .filter(o => {
      const matchesSearch = o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
        o.items.some(item => item.productName.toLowerCase().includes(orderSearch.toLowerCase()));
      const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      
      let matchesTime = true;
      if (orderTimeFilter !== 'all') {
        const orderDate = ensureDate(o.createdAt);
        const now = new Date();
        if (orderTimeFilter === '30days') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesTime = orderDate >= thirtyDaysAgo;
        } else if (orderTimeFilter === '6months') {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(now.getMonth() - 6);
          matchesTime = orderDate >= sixMonthsAgo;
        } else if (orderTimeFilter === '1year') {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          matchesTime = orderDate >= oneYearAgo;
        }
      }
      
      return matchesSearch && matchesStatus && matchesTime;
    })
    .sort((a, b) => ensureDate(b.createdAt).getTime() - ensureDate(a.createdAt).getTime());

  const totalOrdersCount = orders.filter(o => o.customerId === currentUser.id).length;
  const wishlistProducts = products.filter(p => currentUser.wishlist?.includes(p.id));

  const handleBuyAgain = (order: any) => {
    let itemsAdded = 0;
    order.items.forEach((item: any) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        addToCart(product, item.quantity, item.selectedVariations);
        itemsAdded++;
      }
    });
    if (itemsAdded > 0) {
      setSuccessMessage(`${itemsAdded} items added to cart`);
      setTimeout(() => setSuccessMessage(null), 3000);
      navigate('/cart');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'payment_rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'receipt_uploaded': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusDisplay = (status: PaymentStatus) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'receipt_uploaded': return 'Receipt Uploaded';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Payment Received';
      case 'rejected': return 'Payment Not Received';
      default: return (status as string).replace('_', ' ');
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'preparing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <MapPin className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];

  const getStepIndex = (status: OrderStatus) => {
    return STATUS_STEPS.indexOf(status);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Success Message Banner */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-green-900">{successMessage}</p>
            <p className="text-sm text-green-700">Your profile has been updated successfully.</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-400 hover:text-green-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 text-center">
            <div className="relative inline-block mb-4">
              <img 
                src={currentUser.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=10b981&color=fff`} 
                alt={currentUser.name} 
                className="w-20 h-20 rounded-full object-cover border-4 border-green-50"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <h2 className="font-bold text-gray-900 line-clamp-1">{currentUser.name}</h2>
            <p className="text-xs text-gray-500 mt-1">{currentUser.email}</p>
          </div>

          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'orders' ? 'bg-green-600 text-white shadow-md shadow-green-200' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <ShoppingBag className="w-5 h-5" />
            My Orders
          </button>
          <button 
            onClick={() => setActiveTab('subscriptions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'subscriptions' ? 'bg-green-600 text-white shadow-md shadow-green-200' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Clock className="w-5 h-5" />
            Subscriptions
          </button>
          <button 
            onClick={() => setActiveTab('groups')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'groups' ? 'bg-green-600 text-white shadow-md shadow-green-200' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Users className="w-5 h-5" />
            Group Buys
          </button>
          <button 
            onClick={() => setActiveTab('wishlist')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'wishlist' ? 'bg-green-600 text-white shadow-md shadow-green-200' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Heart className="w-5 h-5" />
            Wishlist
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'messages' ? 'bg-green-600 text-white shadow-md shadow-green-200' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              {conversations.some(c => c.unreadCount > 0) && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            Messages
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'profile' ? 'bg-green-600 text-white shadow-md shadow-green-200' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Settings className="w-5 h-5" />
            Account Settings
          </button>
          {currentUser?.role === 'customer' && (
            <button 
              onClick={() => setActiveTab('vendor')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'vendor' ? 'bg-green-600 text-white shadow-md shadow-green-200' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <ShoppingBag className="w-5 h-5" />
              Become a Vendor
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-grow">
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
                <span className="text-sm text-gray-500">{subscriptions.length} active subscriptions</span>
              </div>

              {subscriptions.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <Clock className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">No subscriptions</h2>
                  <p className="text-gray-500 mb-6">Subscribe to your favorite products for regular deliveries!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {subscriptions.map(sub => (
                    <div key={sub.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                          <img src={sub.productImageUrl} alt={sub.productName} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{sub.productName}</h3>
                          <p className="text-sm text-gray-500 capitalize">{sub.frequency} delivery • Qty: {sub.quantity}</p>
                          <p className="text-xs text-emerald-600 font-bold mt-1">Next Delivery: {ensureDate(sub.nextDelivery).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Price</p>
                          <p className="font-extrabold text-gray-900">{formatPrice(sub.price * sub.quantity, sub.currency)}</p>
                        </div>
                        <div className="flex gap-2">
                          {sub.status === 'active' ? (
                            <button 
                              onClick={() => updateSubscriptionStatus(sub.id, 'paused')}
                              className="px-4 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-bold hover:bg-amber-100 transition-colors"
                            >
                              Pause
                            </button>
                          ) : (
                            <button 
                              onClick={() => updateSubscriptionStatus(sub.id, 'active')}
                              className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors"
                            >
                              Resume
                            </button>
                          )}
                          <button 
                            onClick={() => updateSubscriptionStatus(sub.id, 'cancelled')}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold text-gray-900">Group Purchases</h1>
                <span className="text-sm text-gray-500">{groupPurchases.filter(g => g.members?.some((m: any) => m.customerId === currentUser.id)).length} groups joined</span>
              </div>

              {groupPurchases.filter(g => g.members?.some((m: any) => m.customerId === currentUser.id)).length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">No joined groups</h2>
                  <p className="text-gray-500 mb-6">Join group purchases to save more with friends!</p>
                  <button onClick={() => navigate('/')} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">
                    Find Group Deals
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groupPurchases.filter(g => g.members?.some((m: any) => m.customerId === currentUser.id)).map(group => {
                    const product = products.find(p => p.id === group.productId);
                    return (
                      <div key={group.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 hover:border-emerald-100 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                            <img src={product?.imageUrl} alt={group.productName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-bold text-gray-900 line-clamp-1">{group.productName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                group.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 
                                group.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {group.status}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">#{group.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Group Progress</span>
                            <span className="text-xs font-bold text-emerald-700">{group.currentMembers}/{group.targetMembers} Joined</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                            <div 
                              className="h-full bg-emerald-600 transition-all duration-500" 
                              style={{ width: `${(group.currentMembers / group.targetMembers) * 100}%` }}
                            ></div>
                          </div>
                          
                          {/* Member Avatars */}
                          <div className="flex -space-x-2 overflow-hidden">
                            {group.members?.map((member: any) => (
                              <div key={member.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 overflow-hidden" title={member.customerName}>
                                {member.customerProfileImage ? (
                                  <img src={member.customerProfileImage} alt={member.customerName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">
                                    {member.customerName.charAt(0)}
                                  </div>
                                )}
                              </div>
                            ))}
                            {Array.from({ length: Math.max(0, group.targetMembers - group.currentMembers) }).map((_, i) => (
                              <div key={`empty-${i}`} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                                <Users className="w-3 h-3" />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Your Price</p>
                            <p className="text-xl font-black text-emerald-600">{formatPrice(group.price, group.currency)}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/product/${group.productId}`);
                                alert('Invite link copied!');
                              }}
                              className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                              title="Invite Friends"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => navigate(`/product/${group.productId}`)}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                              View Product
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
                  <p className="text-sm text-gray-500">Manage and track your past purchases</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <ShoppingBag className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-gray-700">{totalOrdersCount} Total Orders</span>
                </div>
              </div>

              {/* Pending Payments Alert */}
              {myOrders.some(o => o.paymentStatus === 'pending' && o.paymentMethod !== 'card') && (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 flex-shrink-0">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-bold text-amber-900 text-lg">Action Required: Separate Vendor Payments</p>
                      <p className="text-sm text-amber-700 leading-relaxed">
                        You have orders awaiting manual payment. <span className="font-bold underline">IMPORTANT:</span> Since you purchased from different vendors, you <span className="font-bold">must make separate payments</span> to each vendor below. Do not pay the total amount to a single vendor.
                      </p>
                    </div>
                    <button 
                      onClick={() => setOrderStatusFilter('pending')}
                      className="hidden md:block px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                      View All Pending
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {(() => {
                      const pendingByVendor = myOrders
                        .filter(o => o.paymentStatus === 'pending' && o.paymentMethod !== 'card')
                        .reduce((acc, order) => {
                          if (!acc[order.vendorId]) {
                            acc[order.vendorId] = {
                              name: order.vendorName,
                              total: 0,
                              currency: order.currency,
                              count: 0
                            };
                          }
                          acc[order.vendorId].total += order.totalAmount;
                          acc[order.vendorId].count += 1;
                          return acc;
                        }, {} as Record<string, { name: string, total: number, currency: string, count: number }>);

                      return Object.entries(pendingByVendor).map(([vendorId, data]) => (
                        <div key={vendorId} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Pay to Vendor</p>
                                <p className="font-bold text-gray-900 truncate max-w-[120px]">{data.name}</p>
                              </div>
                              <div className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {data.count} {data.count === 1 ? 'Order' : 'Orders'}
                              </div>
                            </div>
                            <p className="text-2xl font-black text-amber-700">{formatPrice(data.total, data.currency)}</p>
                          </div>
                          
                        </div>
                      ));
                    })()}
                  </div>
                  
                  <div className="md:hidden">
                    <button 
                      onClick={() => setOrderStatusFilter('pending')}
                      className="w-full py-3 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors shadow-sm"
                    >
                      View All Pending Orders
                    </button>
                  </div>
                </div>
              )}

              {/* Filters & Search */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by Order ID or Product Name..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer font-medium"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 rotate-90 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <select
                        value={orderTimeFilter}
                        onChange={(e) => setOrderTimeFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer font-medium"
                      >
                        <option value="all">All Time</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="1year">Last Year</option>
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 rotate-90 pointer-events-none" />
                    </div>
                  </div>
                </div>
                
                {(orderSearch || orderStatusFilter !== 'all' || orderTimeFilter !== 'all') && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-500">
                      Showing <span className="font-bold text-gray-900">{myOrders.length}</span> matching orders
                    </p>
                    <button 
                      onClick={() => { setOrderSearch(''); setOrderStatusFilter('all'); setOrderTimeFilter('all'); }}
                      className="text-xs font-bold text-green-600 hover:text-green-700 underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>

              {totalOrdersCount === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
                  <p className="text-gray-500 mb-8 max-w-xs mx-auto">You haven't placed any orders yet. Explore our wide range of halal products!</p>
                  <button onClick={() => navigate('/')} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95">
                    Start Shopping
                  </button>
                </div>
              ) : myOrders.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-gray-300" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">No matching orders</h2>
                  <p className="text-gray-500 mb-8">We couldn't find any orders matching your current filters.</p>
                  <button 
                    onClick={() => { setOrderSearch(''); setOrderStatusFilter('all'); setOrderTimeFilter('all'); }}
                    className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {myOrders.map(order => {
                    const currentStepIndex = getStepIndex(order.status);
                    
                    return (
                      <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-green-100 transition-colors">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-sm font-medium text-gray-900">
                              Placed on {ensureDate(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Total</p>
                              <p className="font-bold text-gray-900">{formatPrice(order.totalAmount, order.items[0]?.currency)}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 capitalize ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status}
                            </div>
                          </div>
                        </div>
                        
                        {/* Status Tracker */}
                        <div className="px-6 py-10 border-b border-gray-100 bg-white">
                          <div className="relative max-w-3xl mx-auto">
                            {/* Progress Line */}
                            <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }} 
                                className="h-full bg-green-500 transition-all duration-1000 ease-out"
                              ></div>
                            </div>
                            
                            {/* Steps */}
                            <div className="relative flex justify-between">
                              {STATUS_STEPS.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                
                                return (
                                  <div key={step} className="flex flex-col items-center group">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10 ${
                                      isCompleted 
                                        ? 'bg-green-500 border-white text-white shadow-lg shadow-green-100' 
                                        : 'bg-white border-gray-100 text-gray-300'
                                    } ${isCurrent ? 'ring-4 ring-green-100 scale-110' : ''}`}>
                                      {index < currentStepIndex ? (
                                        <CheckCircle className="w-5 h-5" />
                                      ) : (
                                        <div className="flex items-center justify-center">
                                          {step === 'pending' && <Clock className="w-5 h-5" />}
                                          {step === 'confirmed' && <CheckCircle className="w-5 h-5" />}
                                          {step === 'preparing' && <Package className="w-5 h-5" />}
                                          {step === 'shipped' && <Truck className="w-5 h-5" />}
                                          {step === 'delivered' && <MapPin className="w-5 h-5" />}
                                        </div>
                                      )}
                                    </div>
                                    <span className={`mt-3 text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 hidden sm:block ${
                                      isCompleted ? 'text-green-600' : 'text-gray-400'
                                    }`}>
                                      {step}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Order Items */}
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Items</h4>
                            <div className="space-y-4">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-700 font-bold text-sm">
                                      {item.quantity}x
                                    </div>
                                    <div>
                                      <span className="font-bold text-gray-900 block text-sm">{item.productName}</span>
                                      {item.selectedVariations && Object.keys(item.selectedVariations).length > 0 && (
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">
                                          {Object.entries(item.selectedVariations).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="font-bold text-gray-900 text-sm">{formatPrice(item.price * item.quantity, item.currency)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Shipping & Payment Details */}
                          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Delivery Details</h4>
                            
                            {order.shippingDetails && (
                              <div className="mb-4">
                                <p className="text-sm text-gray-900 font-bold">{order.shippingDetails.fullName}</p>
                                <p className="text-sm text-gray-600 mt-1">{order.shippingDetails.address}</p>
                                <p className="text-sm text-gray-600">{order.shippingDetails.city}, {order.shippingDetails.zipCode}</p>
                                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 font-medium">
                                  <MapPin className="w-3 h-3" /> {order.shippingDetails.phone}
                                </div>
                              </div>
                            )}

                            <div className="pt-4 border-t border-gray-200 mt-4">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Payment Status</p>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPaymentStatusColor(order.paymentStatus || 'pending')}`}>
                                      {getPaymentStatusDisplay(order.paymentStatus || 'pending')}
                                    </span>
                                    <p className="text-xs text-gray-600 font-medium capitalize">
                                      via {order.paymentMethod?.replace('_', ' ')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {order.paymentMethod !== 'card' && (
                                    <>
                                      {(order.paymentStatus === 'pending' || order.paymentStatus === 'rejected') ? (
                                        <button 
                                          onClick={() => setUploadingReceiptOrder(order)}
                                          className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-md shadow-green-100 flex items-center justify-center gap-2"
                                        >
                                          <Upload className="w-3.5 h-3.5" />
                                          {order.paymentStatus === 'rejected' ? 'Re-upload Receipt' : 'Upload Receipt'}
                                        </button>
                                      ) : order.paymentReceipt?.imageUrl ? (
                                        <button 
                                          onClick={() => setViewingReceiptUrl(order.paymentReceipt?.imageUrl || null)}
                                          className="w-full sm:w-auto px-4 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all shadow-sm flex items-center justify-center gap-2"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          View Receipt
                                        </button>
                                      ) : null}
                                    </>
                                  )}
                                  
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <button 
                                      onClick={() => handleBuyAgain(order)}
                                      className="flex-1 sm:flex-none px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-[10px] font-bold hover:bg-green-100 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      Buy Again
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setSelectedChatUserId(order.vendorId);
                                        setActiveTab('messages');
                                      }}
                                      className="flex-1 sm:flex-none px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-[10px] font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      Chat
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Payment Instructions for Pending Orders */}
                              {order.paymentStatus === 'pending' && order.paymentMethod !== 'card' && order.vendorPaymentDetails && (
                                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Banknote className="w-4 h-4 text-emerald-600" />
                                    <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Payment Instructions</h5>
                                  </div>
                                  <p className="text-xs text-emerald-700 mb-2 leading-relaxed">
                                    {order.vendorPaymentDetails.instructions || `Please pay ${formatPrice(order.totalAmount, order.currency)} via ${order.vendorPaymentDetails.name}.`}
                                  </p>
                                  {order.vendorPaymentDetails.details && (
                                    <div className="p-2 bg-white/50 rounded-lg text-[10px] font-mono text-emerald-800 break-all mb-2">
                                      {order.vendorPaymentDetails.details}
                                    </div>
                                  )}
                                  {order.vendorPaymentDetails.qrCodeUrl && (
                                    <div className="flex justify-center bg-white p-2 rounded-lg border border-emerald-200 w-fit mx-auto">
                                      <img src={order.vendorPaymentDetails.qrCodeUrl} alt="QR Code" className="w-24 h-24 object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {order.paymentStatus === 'rejected' && order.paymentReceipt?.rejectionReason && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                                  <p className="text-[10px] font-bold text-red-800 uppercase tracking-widest mb-1">Rejection Reason</p>
                                  <p className="text-xs text-red-700">{order.paymentReceipt.rejectionReason}</p>
                                </div>
                              )}

                              {order.paymentStatus === 'receipt_uploaded' && (
                                <p className="text-[10px] text-blue-600 font-bold mt-2 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Payment submitted – please wait for confirmation
                                </p>
                              )}

                              {order.paymentStatus === 'approved' && (
                                <p className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Payment confirmed – your order is now confirmed
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Updates History */}
                        {order.history && order.history.length > 0 && (
                          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <button 
                              className="text-xs font-bold text-green-600 uppercase tracking-widest flex items-center gap-2 hover:underline"
                              onClick={(e) => {
                                const historyEl = e.currentTarget.nextElementSibling;
                                historyEl?.classList.toggle('hidden');
                              }}
                            >
                              Show Tracking History <ChevronRight className="w-3 h-3" />
                            </button>
                            <div className="mt-4 space-y-4 hidden">
                              {order.history.map((update, index) => (
                                <div key={index} className="flex gap-4">
                                  <div className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${index === 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    {index !== order.history!.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1"></div>}
                                  </div>
                                  <div className="pb-4">
                                    <p className="text-xs font-bold text-gray-900 capitalize">{update.status}</p>
                                    <p className="text-xs text-gray-500 mt-1">{update.description}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 font-bold">{ensureDate(update.timestamp).toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
                <span className="text-sm text-gray-500">{wishlistProducts.length} items saved</span>
              </div>

              {wishlistProducts.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
                  <p className="text-gray-500 mb-6">Save items you love to find them easily later.</p>
                  <button onClick={() => navigate('/')} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistProducts.map(product => (
                    <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:border-green-100 transition-all">
                      <div className="relative aspect-square overflow-hidden">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-full shadow-sm hover:bg-white transition-colors"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">{product.category}</p>
                        <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{product.name}</h3>
                        <div className="flex items-center gap-1 mb-3">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs font-bold text-gray-700">4.8</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900">{formatPrice(product.price, product.currency)}</p>
                          <button 
                            onClick={() => navigate(`/product/${product.id}`)}
                            className="text-xs font-bold text-green-600 hover:underline"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px] sm:h-[600px] lg:h-[700px] max-h-[calc(100vh-250px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 flex-1 min-h-0">
                {/* Chat List - Hidden on mobile if a chat is selected */}
                <div className={`lg:col-span-1 flex flex-col h-full overflow-hidden ${selectedChatUserId ? 'hidden lg:flex' : 'flex'}`}>
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex-none">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      Conversations
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <ChatList onSelect={setSelectedChatUserId} activeUserId={selectedChatUserId || undefined} />
                  </div>
                </div>

                {/* Chat Window - Hidden on mobile if no chat is selected */}
                <div className={`lg:col-span-2 h-full flex flex-col min-h-0 ${!selectedChatUserId ? 'hidden lg:flex' : 'flex'}`}>
                  {selectedChatUserId ? (
                    <ChatWindow otherUserId={selectedChatUserId} onClose={() => setSelectedChatUserId(null)} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50/30">
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-green-600 mb-6 border border-gray-100">
                        <MessageSquare className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Your Messages</h3>
                      <p className="text-gray-500 max-w-xs mx-auto">Select a vendor from the list to start a conversation and discuss your orders.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vendor' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Grow Your Business with Halal Market</h2>
                  <p className="text-gray-500 mt-2">Join our community of trusted vendors and reach thousands of customers looking for quality halal products.</p>
                </div>

                {myApplication ? (
                  <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      myApplication.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      myApplication.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {myApplication.status === 'pending' ? <Clock className="w-6 h-6" /> :
                       myApplication.status === 'approved' ? <CheckCircle className="w-6 h-6" /> :
                       <XCircle className="w-6 h-6" />}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 capitalize">Application {myApplication.status}</h3>
                    <div className="text-gray-500 mt-2">
                      {myApplication.status === 'pending' && "Your application is currently being reviewed by our team. We'll notify you once a decision is made."}
                      {myApplication.status === 'approved' && "Congratulations! Your application has been approved. Please refresh the page to access your vendor dashboard."}
                      {myApplication.status === 'rejected' && (
                        <div>
                          <p>Unfortunately, your application was not approved at this time.</p>
                          <p className="mt-2 text-red-600 font-bold">Reason: {myApplication.rejectionReason}</p>
                          <button 
                            onClick={() => {
                              // Allow re-submission by deleting or just resetting local state if we wanted to support it
                              // For now just show the reason
                            }}
                            className="mt-4 text-emerald-600 font-bold hover:underline"
                          >
                            Contact Support for more info
                          </button>
                        </div>
                      )}
                    </div>
                    {myApplication.status === 'approved' && (
                      <button 
                        onClick={() => window.location.reload()}
                        className="mt-6 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                      >
                        Go to Vendor Dashboard
                      </button>
                    )}
                  </div>
                ) : vendorSuccess ? (
                  <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-100 text-center">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-900">Application Submitted!</h3>
                    <p className="text-emerald-700 mt-2">Thank you for applying. Our team will review your business details and get back to you soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleVendorSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Business Name</label>
                        <input
                          required
                          type="text"
                          value={vendorFormData.businessName}
                          onChange={(e) => setVendorFormData({...vendorFormData, businessName: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          placeholder="e.g. Halal Delights"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Phone Number</label>
                        <input
                          required
                          type="tel"
                          value={vendorFormData.phoneNumber}
                          onChange={(e) => setVendorFormData({...vendorFormData, phoneNumber: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Business Address</label>
                      <input
                        required
                        type="text"
                        value={vendorFormData.businessAddress}
                        onChange={(e) => setVendorFormData({...vendorFormData, businessAddress: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="123 Market St, City, Country"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Business Description</label>
                      <textarea
                        required
                        rows={4}
                        value={vendorFormData.businessDescription}
                        onChange={(e) => setVendorFormData({...vendorFormData, businessDescription: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                        placeholder="Tell us about your products and business..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingVendor}
                      className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingVendor ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your personal information and profile appearance.</p>
              </div>
              <div className="p-8">
                <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      required 
                      type="text" 
                      name="name" 
                      value={profileData.name} 
                      onChange={handleProfileChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all font-medium" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      required 
                      type="email" 
                      name="email" 
                      value={profileData.email} 
                      onChange={handleProfileChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all font-medium" 
                    />
                  </div>
                  <div className="space-y-2">
                    <ImageUploadField
                      label="Profile Image"
                      value={profileData.profileImage}
                      onChange={(url) => setProfileData({ ...profileData, profileImage: url })}
                      folder="customers/profiles"
                      placeholder="https://example.com/profile.jpg"
                    />
                  </div>

                  {/* Location Settings */}
                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" /> Shopping Location
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Country</label>
                        <select 
                          value={userLocation.country} 
                          onChange={(e) => setUserLocation({ ...userLocation, country: e.target.value })} 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all font-medium"
                        >
                          <option value="">Select Country</option>
                          {COUNTRIES.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">City</label>
                        <input 
                          type="text" 
                          value={userLocation.city} 
                          onChange={(e) => setUserLocation({ ...userLocation, city: e.target.value })} 
                          placeholder="e.g. London"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all font-medium" 
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This helps us show you products available in your area.
                    </p>
                  </div>

                  <div className="pt-4">
                    <button type="submit" className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100">
                      Save Changes
                    </button>
                  </div>
                </form>

                {/* Change Password Section */}
                <div className="mt-12 pt-12 border-t border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-emerald-600" /> Change Password
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">Update your password to keep your account secure.</p>

                  {passwordSuccess && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-bold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Password updated successfully!
                    </div>
                  )}

                  {passwordError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-bold flex items-center gap-2">
                      <X className="w-4 h-4" /> {passwordError}
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-6 max-w-xl">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">New Password</label>
                      <div className="relative">
                        <input 
                          required 
                          type={showNewPassword ? "text" : "password"} 
                          value={passwordData.newPassword} 
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all font-medium pr-10" 
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirm New Password</label>
                      <div className="relative">
                        <input 
                          required 
                          type={showConfirmPassword ? "text" : "password"} 
                          value={passwordData.confirmPassword} 
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all font-medium pr-10" 
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="pt-2">
                      <button type="submit" className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-200">
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {uploadingReceiptOrder && (
        <PaymentReceiptUpload 
          order={uploadingReceiptOrder} 
          onClose={() => setUploadingReceiptOrder(null)} 
        />
      )}
      
      {/* Receipt Image Lightbox */}
      {viewingReceiptUrl && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 cursor-zoom-out"
          onClick={() => setViewingReceiptUrl(null)}
        >
          <button 
            onClick={() => setViewingReceiptUrl(null)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={viewingReceiptUrl} 
            alt="Payment Receipt Full View" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
