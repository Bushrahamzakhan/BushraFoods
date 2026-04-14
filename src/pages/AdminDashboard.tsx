import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  Users, Store, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, 
  Package, ShoppingBag, Search, Filter, Trash2, Eye, ChevronRight, 
  TrendingUp, Activity, ShieldCheck, User as UserIcon, Award, BarChart3,
  PieChart as PieChartIcon, CreditCard, MessageSquare, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { OrderStatus, PaymentStatus, Category } from '../types';
import { ensureDate } from '../lib/utils';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';

type AdminTab = 'overview' | 'vendor-applications' | 'vendors' | 'products' | 'categories' | 'orders' | 'customers' | 'investments' | 'group-buys' | 'reviews' | 'audit' | 'admins' | 'payments' | 'messages' | 'settings';

export default function AdminDashboard() {
  const { 
    currentUser, adminStats, adminVendors, adminProducts, adminOrders, adminCustomers, adminInvestments, adminReviews, auditLogs,
    groupPurchases, fetchGroupPurchases,
    fetchAdminStats, fetchAdminVendors, fetchAdminProducts, fetchAdminOrders, fetchAdminCustomers, fetchAdminInvestments, fetchAdminReviews, fetchAuditLogs,
    updateVendorStatus, deleteUserAdmin, deleteProductAdmin, deleteReviewAdmin, updateReviewStatusAdmin, updateOrderStatusAdmin, recalculateTopRated, formatPrice,
    updateUserRole, updateUserStatus, cancelGroupPurchaseAdmin,
    vendorApplications, reviewVendorApplication,
    approveInvestmentOpportunity, rejectInvestmentOpportunity,
    categories, addCategory, updateCategory, deleteCategory,
    systemConfig, updateSystemConfig
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '', order: 0, isActive: true });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    if (currentUser?.role === 'admin' || 
        currentUser?.email === 'bushraanwar854@gmail.com' || 
        currentUser?.email === 'halalmarketonlineofficial@gmail.com') {
      fetchAdminStats();
      fetchAdminVendors();
      fetchAdminProducts();
      fetchAdminOrders();
      fetchAdminCustomers();
      fetchAdminInvestments();
      fetchAdminReviews();
      fetchAuditLogs();
      fetchGroupPurchases();
    }
  }, [currentUser]);

  if (!currentUser || (
    currentUser.role !== 'admin' && 
    currentUser.email !== 'bushraanwar854@gmail.com' && 
    currentUser.email !== 'halalmarketonlineofficial@gmail.com'
  )) {
    return <Navigate to="/" />;
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleDeleteUser = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User?',
      message: `Are you sure you want to delete user "${name}"? This action cannot be undone.`,
      onConfirm: async () => {
        await deleteUserAdmin(id);
        showSuccess(`User ${name} deleted successfully.`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteProduct = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product?',
      message: `Are you sure you want to delete product "${name}"?`,
      onConfirm: async () => {
        await deleteProductAdmin(id);
        showSuccess(`Product ${name} deleted successfully.`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatusAdmin(orderId, status);
    showSuccess(`Order status updated to ${status}.`);
  };

  const filteredVendors = adminVendors.filter(v => 
    (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.storeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = adminProducts.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = adminOrders.filter(o => 
    (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSuperAdmin = currentUser?.email === 'bushraanwar854@gmail.com' || currentUser?.email === 'halalmarketonlineofficial@gmail.com';

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

  const filteredAdmins = adminCustomers.filter(c => 
    c.role === 'admin' || c.role === 'moderator' || c.role === 'support'
  ).filter(a => 
    (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (a.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = adminCustomers.filter(c => 
    c.role !== 'admin' && c.role !== 'moderator' && c.role !== 'support'
  ).filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReviews = adminReviews.filter(r => 
    (r.comment || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.userName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOpportunities = adminInvestments.opportunities.filter(o => 
    (o.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroupPurchases = groupPurchases.filter(g => 
    (g.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Message Banner */}
      {successMessage && (
        <div className="fixed top-24 right-8 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
            <p className="text-gray-500 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span className="uppercase tracking-widest text-xs">Administrator Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Control Center</h1>
            {isSuperAdmin && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 flex items-center gap-1">
                <Award className="w-3 h-3" /> Super Admin
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">Global platform management and oversight.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          {(['overview', 'vendor-applications', 'vendors', 'products', 'categories', 'orders', 'customers', 'investments', 'group-buys', 'reviews', 'audit', 'admins', 'settings'] as AdminTab[]).map((tab) => {
            if (tab === 'admins' && !isSuperAdmin) return null;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchTerm('');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <DollarSign className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Revenue</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{formatPrice(adminStats?.totalRevenue || 0)}</p>
              <div className="mt-4 flex items-center gap-1 text-emerald-600 text-xs font-bold">
                <TrendingUp className="w-3 h-3" />
                <span>+12.5% from last month</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <Users className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Customers</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{adminStats?.totalCustomers || 0}</p>
              <div className="mt-4 flex items-center gap-1 text-blue-600 text-xs font-bold">
                <Activity className="w-3 h-3" />
                <span>Active users online</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <Store className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                  <Store className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Vendors</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{adminStats?.totalVendors || 0}</p>
              <div className="mt-4 flex items-center gap-1 text-purple-600 text-xs font-bold">
                <CheckCircle className="w-3 h-3" />
                <span>{adminStats?.totalVendors - adminStats?.pendingVendors} verified partners</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <Users className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Group Buys</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{groupPurchases.filter(g => g.status === 'open').length}</p>
              <div className="mt-4 flex items-center gap-1 text-emerald-600 text-xs font-bold">
                <Activity className="w-3 h-3" />
                <span>Active group campaigns</span>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  Revenue Growth
                </h3>
                <select className="text-xs font-bold bg-gray-50 border-0 rounded-lg px-3 py-1">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Mon', revenue: 4000 },
                    { name: 'Tue', revenue: 3000 },
                    { name: 'Wed', revenue: 2000 },
                    { name: 'Thu', revenue: 2780 },
                    { name: 'Fri', revenue: 1890 },
                    { name: 'Sat', revenue: 2390 },
                    { name: 'Sun', revenue: 3490 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f9fafb' }}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                <PieChartIcon className="w-5 h-5 text-blue-600" />
                User Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Customers', value: adminStats?.totalCustomers || 0 },
                        { name: 'Vendors', value: adminStats?.totalVendors || 0 },
                        { name: 'Investors', value: adminInvestments?.opportunities?.length || 0 },
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600">Customers</span>
                  </div>
                  <span className="font-bold">{adminStats?.totalCustomers || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-gray-600">Vendors</span>
                  </div>
                  <span className="font-bold">{adminStats?.totalVendors || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-gray-600">Investors</span>
                  </div>
                  <span className="font-bold">{adminInvestments?.opportunities?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Top-Rated Vendor Logic</h3>
                <p className="text-sm text-gray-600">Recalculate badges based on rating (4.0+), orders (5+), and completion rate (80%+).</p>
              </div>
            </div>
            <button 
              onClick={async () => {
                await recalculateTopRated();
                showSuccess('Vendor badges recalculated successfully!');
              }}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
            >
              Recalculate Now
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity / Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setActiveTab('vendor-applications')}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors text-left group relative"
                >
                  {vendorApplications.filter(a => a.status === 'pending').length > 0 && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                  <Store className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-gray-900">Vendor Apps</p>
                  <p className="text-xs text-gray-500">Review new vendor applications</p>
                </button>
                <button 
                  onClick={() => setActiveTab('vendors')}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors text-left group"
                >
                  <Store className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-gray-900">Review Vendors</p>
                  <p className="text-xs text-gray-500">Approve or suspend vendor accounts</p>
                </button>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors text-left group"
                >
                  <ShoppingBag className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-gray-900">Track Orders</p>
                  <p className="text-xs text-gray-500">Monitor global order status</p>
                </button>
                <button 
                  onClick={() => setActiveTab('products')}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors text-left group"
                >
                  <Package className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-gray-900">Manage Catalog</p>
                  <p className="text-xs text-gray-500">Remove inappropriate listings</p>
                </button>
                <button 
                  onClick={() => setActiveTab('customers')}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-amber-50 transition-colors text-left group"
                >
                  <Users className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-gray-900">User Support</p>
                  <p className="text-xs text-gray-500">Manage customer accounts</p>
                </button>
                <button 
                  onClick={() => setActiveTab('payments')}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors text-left group relative"
                >
                  {adminOrders.filter(o => o.paymentStatus === 'receipt_uploaded').length > 0 && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                  <CreditCard className="w-6 h-6 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-gray-900">Payment Oversight</p>
                  <p className="text-xs text-gray-500">Review pending receipts & disputes</p>
                </button>
                <button 
                  onClick={() => setActiveTab('messages')}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors text-left group"
                >
                  <MessageSquare className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-gray-900">Messages</p>
                  <p className="text-xs text-gray-500">Chat with vendors & customers</p>
                </button>
              </div>
            </div>

            {/* Pending Approvals Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Pending Approvals
                </h2>
                <button onClick={() => setActiveTab('vendors')} className="text-emerald-600 text-sm font-bold hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                {adminVendors.filter(v => v.status === 'pending').slice(0, 4).map(vendor => (
                  <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold">
                        {vendor.storeName?.[0] || vendor.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{vendor.storeName || vendor.name}</p>
                        <p className="text-xs text-gray-500">{vendor.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateVendorStatus(vendor.id, 'active')}
                        className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-600 hover:text-white transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => updateVendorStatus(vendor.id, 'suspended')}
                        className="p-2 bg-white text-red-600 rounded-lg shadow-sm hover:bg-red-600 hover:text-white transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {adminVendors.filter(v => v.status === 'pending').length === 0 && (
                  <div className="text-center py-8 text-gray-500 italic text-sm">
                    No pending vendor applications.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'overview' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900 capitalize">{activeTab} Management</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full md:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {activeTab === 'vendor-applications' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Business / Applicant</th>
                    <th className="px-6 py-4 font-bold">Contact</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Applied On</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendorApplications.filter(app => 
                    app.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    app.userName.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(app => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{app.businessName}</div>
                        <div className="text-xs text-gray-500">{app.userName}</div>
                        <div className="text-[10px] text-gray-400 mt-1 max-w-xs truncate">{app.businessDescription}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{app.userEmail}</div>
                        <div className="text-xs text-gray-400">{app.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          app.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ensureDate(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {app.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => reviewVendorApplication(app.id, 'approved')}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => setRejectingAppId(app.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">
                            Reviewed on {app.reviewedAt ? ensureDate(app.reviewedAt).toLocaleDateString() : 'N/A'}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'vendors' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Vendor / Store</th>
                    <th className="px-6 py-4 font-bold">Contact</th>
                    <th className="px-6 py-4 font-bold">Role</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Joined</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredVendors.map(vendor => (
                    <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{vendor.storeName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{vendor.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{vendor.email}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={vendor.role}
                          onChange={async (e) => {
                            const newRole = e.target.value as any;
                            setConfirmModal({
                              isOpen: true,
                              title: 'Change User Role?',
                              message: `Are you sure you want to change ${vendor.name}'s role to ${newRole}?`,
                              onConfirm: async () => {
                                await updateUserRole(vendor.id, newRole, vendor.name);
                                showSuccess(`Vendor ${vendor.name} role updated to ${newRole}.`);
                                fetchAdminVendors();
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                              }
                            });
                          }}
                          className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border-0 bg-gray-100 focus:ring-2 focus:ring-emerald-500"
                          disabled={!isSuperAdmin}
                        >
                          <option value="vendor">Vendor</option>
                          <option value="customer">Customer</option>
                          {isSuperAdmin && <option value="moderator">Moderator</option>}
                          {isSuperAdmin && <option value="support">Support</option>}
                          {isSuperAdmin && <option value="admin">Admin</option>}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          vendor.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          vendor.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ensureDate(vendor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              const methods = vendor.paymentMethods?.filter(m => m.isActive) || [];
                              setConfirmModal({
                                isOpen: true,
                                title: `${vendor.storeName || vendor.name} - Payment Methods`,
                                message: methods.length > 0 
                                  ? methods.map(m => `${m.name} (${m.type}): ${m.details}`).join('\n\n')
                                  : 'No active payment methods configured.',
                                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                              });
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" 
                            title="View Payment Methods"
                          >
                            <CreditCard className="w-5 h-5" />
                          </button>
                          {vendor.status !== 'active' && (
                            <button onClick={() => updateVendorStatus(vendor.id, 'active')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Approve">
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          {vendor.status !== 'suspended' && (
                            <button onClick={() => updateVendorStatus(vendor.id, 'suspended')} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Suspend">
                              <XCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button onClick={() => handleDeleteUser(vendor.id, vendor.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'products' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Product</th>
                    <th className="px-6 py-4 font-bold">Vendor</th>
                    <th className="px-6 py-4 font-bold">Category</th>
                    <th className="px-6 py-4 font-bold">Price</th>
                    <th className="px-6 py-4 font-bold">Stock</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100" referrerPolicy="no-referrer" />
                          <div className="font-bold text-gray-900 text-sm">{product.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.vendorName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">{product.category}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{formatPrice(product.price, product.currency)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.stock} units</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleDeleteProduct(product.id, product.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Remove Product">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'categories' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Manage Product Categories</h3>
                  <button 
                    onClick={() => setIsAddingCategory(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" /> Add Category
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(category => (
                    <div key={category.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 text-2xl">
                          {category.icon || <Package className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{category.name}</p>
                          <p className="text-xs text-gray-500">Order: {category.order} • {category.isActive ? 'Active' : 'Inactive'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingCategory(category)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Delete Category?',
                              message: `Are you sure you want to delete "${category.name}"? This might affect products assigned to it.`,
                              onConfirm: async () => {
                                await deleteCategory(category.id);
                                showSuccess(`Category ${category.name} deleted.`);
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                              }
                            });
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add/Edit Category Modal */}
                {(isAddingCategory || editingCategory) && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {isAddingCategory ? 'Add New Category' : 'Edit Category'}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-1 block">Category Name</label>
                          <input 
                            type="text"
                            value={isAddingCategory ? newCategory.name : editingCategory?.name}
                            onChange={(e) => isAddingCategory 
                              ? setNewCategory({...newCategory, name: e.target.value})
                              : setEditingCategory(editingCategory ? {...editingCategory, name: e.target.value} : null)
                            }
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="e.g. Rice & Grains"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-1 block">Icon Name (Lucide)</label>
                          <input 
                            type="text"
                            value={isAddingCategory ? newCategory.icon : editingCategory?.icon}
                            onChange={(e) => isAddingCategory 
                              ? setNewCategory({...newCategory, icon: e.target.value})
                              : setEditingCategory(editingCategory ? {...editingCategory, icon: e.target.value} : null)
                            }
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="e.g. Wheat, Croissant, Beef"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-1 block">Display Order</label>
                          <input 
                            type="number"
                            value={isAddingCategory ? newCategory.order : editingCategory?.order}
                            onChange={(e) => isAddingCategory 
                              ? setNewCategory({...newCategory, order: parseInt(e.target.value)})
                              : setEditingCategory(editingCategory ? {...editingCategory, order: parseInt(e.target.value)} : null)
                            }
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={isAddingCategory ? newCategory.isActive : editingCategory?.isActive}
                            onChange={(e) => isAddingCategory 
                              ? setNewCategory({...newCategory, isActive: e.target.checked})
                              : setEditingCategory(editingCategory ? {...editingCategory, isActive: e.target.checked} : null)
                            }
                            id="cat-active"
                          />
                          <label htmlFor="cat-active" className="text-sm font-bold text-gray-700">Active</label>
                        </div>
                        <div className="flex gap-3 mt-6">
                          <button 
                            onClick={() => {
                              setIsAddingCategory(false);
                              setEditingCategory(null);
                            }}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={async () => {
                              if (isAddingCategory) {
                                await addCategory(newCategory);
                                showSuccess('Category added successfully!');
                                setIsAddingCategory(false);
                                setNewCategory({ name: '', icon: '', order: 0, isActive: true });
                              } else if (editingCategory) {
                                await updateCategory(editingCategory);
                                showSuccess('Category updated successfully!');
                                setEditingCategory(null);
                              }
                            }}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                          >
                            {isAddingCategory ? 'Add Category' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Order ID</th>
                    <th className="px-6 py-4 font-bold">Customer</th>
                    <th className="px-6 py-4 font-bold">Amount</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{order.customerName}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">{formatPrice(order.totalAmount, order.currency)}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border-0 focus:ring-2 focus:ring-emerald-500 ${
                            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="payment_rejected">Payment Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ensureDate(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {order.paymentStatus === 'receipt_uploaded' && (
                            <div className="flex items-center gap-1 text-blue-600" title="Receipt Pending Review">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          )}
                          <button 
                            onClick={() => {
                              // Show order details modal with payment info
                              setConfirmModal({
                                isOpen: true,
                                title: `Order Details #${order.id.slice(0, 8).toUpperCase()}`,
                                message: `Payment Status: ${getPaymentStatusDisplay(order.paymentStatus || 'pending')}\nPayment Method: ${order.paymentMethod?.replace('_', ' ') || 'N/A'}\nTotal: ${formatPrice(order.totalAmount, order.currency)}\n\n${order.paymentReceipt ? 'Receipt image is available for review.' : 'No receipt uploaded.'}`,
                                onConfirm: () => {
                                  if (order.paymentReceipt) {
                                    window.open(order.paymentReceipt.imageUrl, '_blank');
                                  }
                                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'payments' && (
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6 text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm font-medium">Orders awaiting payment verification by vendors</p>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-bold">Order ID</th>
                      <th className="px-6 py-4 font-bold">Vendor</th>
                      <th className="px-6 py-4 font-bold">Customer</th>
                      <th className="px-6 py-4 font-bold">Amount</th>
                      <th className="px-6 py-4 font-bold">Receipt</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {adminOrders.filter(o => o.paymentStatus === 'receipt_uploaded').map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{order.vendorName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{order.customerName}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">{formatPrice(order.totalAmount, order.currency)}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => setViewingReceiptUrl(order.paymentReceipt?.imageUrl || null)}
                            className="text-blue-600 hover:underline text-xs font-bold flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> View Receipt
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => {
                              setSelectedChatUserId(order.vendorId);
                              setActiveTab('messages');
                            }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Contact Vendor"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {adminOrders.filter(o => o.paymentStatus === 'receipt_uploaded').length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                          No orders currently awaiting payment verification.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px] sm:h-[600px] lg:h-[700px] max-h-[calc(100vh-250px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 flex-1 min-h-0">
                  {/* Chat List - Hidden on mobile if a chat is selected */}
                  <div className={`lg:col-span-1 flex flex-col h-full overflow-hidden ${selectedChatUserId ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex-none">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
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
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-emerald-600 mb-6 border border-gray-100">
                          <MessageSquare className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Admin Messages</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">Select a user from the list to start a conversation.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'customers' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Customer Name</th>
                    <th className="px-6 py-4 font-bold">Email</th>
                    <th className="px-6 py-4 font-bold">Role</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                            {customer.name[0]}
                          </div>
                          <div className="font-bold text-gray-900 text-sm">{customer.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={customer.role}
                          onChange={async (e) => {
                            const newRole = e.target.value as any;
                            setConfirmModal({
                              isOpen: true,
                              title: 'Change User Role?',
                              message: `Are you sure you want to change ${customer.name}'s role to ${newRole}?`,
                              onConfirm: async () => {
                                await updateUserRole(customer.id, newRole, customer.name);
                                showSuccess(`User ${customer.name} role updated to ${newRole}.`);
                                fetchAdminCustomers();
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                              }
                            });
                          }}
                          className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border-0 bg-gray-100 focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="customer">Customer</option>
                          <option value="vendor">Vendor</option>
                          <option value="investor">Investor</option>
                          {isSuperAdmin && <option value="moderator">Moderator</option>}
                          {isSuperAdmin && <option value="support">Support</option>}
                          {isSuperAdmin && <option value="admin">Admin</option>}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          customer.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {customer.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {customer.status !== 'suspended' ? (
                            <button 
                              onClick={async () => {
                                await updateUserStatus(customer.id, 'suspended', customer.name);
                                showSuccess(`User ${customer.name} suspended.`);
                                fetchAdminCustomers();
                              }}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" 
                              title="Suspend User"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          ) : (
                            <button 
                              onClick={async () => {
                                await updateUserStatus(customer.id, 'active', customer.name);
                                showSuccess(`User ${customer.name} activated.`);
                                fetchAdminCustomers();
                              }}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" 
                              title="Activate User"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button onClick={() => handleDeleteUser(customer.id, customer.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete Account">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'investments' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Opportunity</th>
                    <th className="px-6 py-4 font-bold">Goal</th>
                    <th className="px-6 py-4 font-bold">Raised</th>
                    <th className="px-6 py-4 font-bold">Progress</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOpportunities.map(opp => (
                    <tr key={opp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-sm">{opp.productName}</div>
                        <div className="text-xs text-gray-500">ID: {opp.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{formatPrice(opp.fundingGoal)}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">{formatPrice(opp.currentFunding)}</td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-100 rounded-full h-2 max-w-[100px]">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (opp.currentFunding / opp.fundingGoal) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          opp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                          opp.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          opp.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {opp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {opp.status === 'pending' && (
                            <>
                              <button 
                                onClick={async () => {
                                  await approveInvestmentOpportunity(opp.id);
                                  showSuccess('Investment opportunity approved!');
                                  fetchAdminInvestments();
                                }}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                title="Approve"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => {
                                  const reason = prompt('Enter rejection reason:');
                                  if (reason) {
                                    rejectInvestmentOpportunity(opp.id, reason);
                                    showSuccess('Investment opportunity rejected.');
                                    fetchAdminInvestments();
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'group-buys' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Product</th>
                    <th className="px-6 py-4 font-bold">Target</th>
                    <th className="px-6 py-4 font-bold">Joined</th>
                    <th className="px-6 py-4 font-bold">Progress</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Expires</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredGroupPurchases.map(group => (
                    <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-sm">{group.productName}</div>
                        <div className="text-xs text-gray-500">ID: {group.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{group.targetMembers}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">{group.currentMembers}</td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-100 rounded-full h-2 max-w-[100px]">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (group.currentMembers / group.targetMembers) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          group.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 
                          group.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {group.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ensureDate(group.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {group.status === 'open' && (
                          <button 
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Cancel Group Buy?',
                                message: 'Are you sure you want to cancel this group buy? All participants will need to be refunded manually if not automated.',
                                onConfirm: async () => {
                                  await cancelGroupPurchaseAdmin(group.id);
                                  showSuccess('Group buy cancelled.');
                                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Cancel Group"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'reviews' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">User</th>
                    <th className="px-6 py-4 font-bold">Rating</th>
                    <th className="px-6 py-4 font-bold">Comment</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReviews.map(review => (
                    <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-sm">{review.userName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Activity key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{review.comment}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          review.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                          review.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {review.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ensureDate(review.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {review.status !== 'approved' && (
                            <button 
                              onClick={() => updateReviewStatusAdmin(review.id, 'approved')}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Approve Review"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          {review.status !== 'flagged' && (
                            <button 
                              onClick={() => updateReviewStatusAdmin(review.id, 'flagged')}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                              title="Flag Review"
                            >
                              <AlertCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Delete Review?',
                                message: 'Are you sure you want to remove this review? This is usually done for moderation purposes.',
                                onConfirm: async () => {
                                  await deleteReviewAdmin(review.id);
                                  showSuccess('Review removed successfully.');
                                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete Review"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'audit' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Action</th>
                    <th className="px-6 py-4 font-bold">Performed By</th>
                    <th className="px-6 py-4 font-bold">Target User</th>
                    <th className="px-6 py-4 font-bold">Details</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.filter(log => 
                    (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (log.performedByName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (log.targetUserName || '').toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                          log.action.includes('GRANT') || log.action.includes('ACTIVATE') ? 'bg-emerald-100 text-emerald-700' :
                          log.action.includes('REVOKE') || log.action.includes('SUSPEND') ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{log.performedByName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.targetUserName}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 italic">{log.details}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ensureDate(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'admins' && isSuperAdmin && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Admin Name</th>
                    <th className="px-6 py-4 font-bold">Email</th>
                    <th className="px-6 py-4 font-bold">Role</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAdmins.map(admin => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-xs font-bold">
                            {admin.name[0]}
                          </div>
                          <div className="font-bold text-gray-900 text-sm">{admin.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{admin.email}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={admin.role}
                          onChange={async (e) => {
                            const newRole = e.target.value as any;
                            setConfirmModal({
                              isOpen: true,
                              title: 'Change Admin Role?',
                              message: `Are you sure you want to change ${admin.name}'s role to ${newRole}?`,
                              onConfirm: async () => {
                                await updateUserRole(admin.id, newRole, admin.name);
                                showSuccess(`Admin ${admin.name} role updated to ${newRole}.`);
                                fetchAdminCustomers();
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                              }
                            });
                          }}
                          className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border-0 bg-amber-50 text-amber-700 focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="moderator">Moderator</option>
                          <option value="support">Support</option>
                          <option value="admin">Admin</option>
                          <option value="customer">Demote to Customer</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          admin.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {admin.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {admin.email !== 'bushraanwar854@gmail.com' && admin.email !== 'halalmarketonlineofficial@gmail.com' && (
                            <>
                              {admin.status !== 'suspended' ? (
                                <button 
                                  onClick={async () => {
                                    await updateUserStatus(admin.id, 'suspended', admin.name);
                                    showSuccess(`Admin ${admin.name} suspended.`);
                                    fetchAdminCustomers();
                                  }}
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" 
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              ) : (
                                <button 
                                  onClick={async () => {
                                    await updateUserStatus(admin.id, 'active', admin.name);
                                    showSuccess(`Admin ${admin.name} activated.`);
                                    fetchAdminCustomers();
                                  }}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" 
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              )}
                              <button onClick={() => handleDeleteUser(admin.id, admin.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {(activeTab === 'vendors' && filteredVendors.length === 0) ||
             (activeTab === 'products' && filteredProducts.length === 0) ||
             (activeTab === 'orders' && filteredOrders.length === 0) ||
             (activeTab === 'customers' && filteredCustomers.length === 0) ? (
              <div className="px-6 py-20 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                <p className="text-lg font-bold text-gray-400">No results found</p>
                <p className="text-sm">Try adjusting your search term or filters.</p>
              </div>
            ) : null}
          </div>
        </div>
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

      {rejectingAppId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Vendor Application</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Reason for Rejection</label>
                <textarea 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                  placeholder="Explain why the application is being rejected..."
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setRejectingAppId(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (!rejectionReason.trim()) return;
                    await reviewVendorApplication(rejectingAppId, 'rejected', rejectionReason);
                    setRejectingAppId(null);
                    setRejectionReason('');
                    showSuccess('Application rejected.');
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-100"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Payment Configuration</h2>
                <p className="text-sm text-gray-500">Manage global payment methods and online gateways.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-900">Online Payments (Credit/Debit Card)</h3>
                    <p className="text-xs text-gray-500">Global toggle for all online payment gateways.</p>
                  </div>
                  <button
                    onClick={() => updateSystemConfig({ onlinePaymentsEnabled: !systemConfig?.onlinePaymentsEnabled })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${systemConfig?.onlinePaymentsEnabled ? 'bg-emerald-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemConfig?.onlinePaymentsEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="p-6 border border-gray-100 rounded-xl space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Available Gateways
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">Enable specific gateways. If any are enabled, the "Credit/Debit Card" option will appear at checkout.</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Stripe Integration</span>
                      <button
                        onClick={() => updateSystemConfig({ stripeEnabled: !systemConfig?.stripeEnabled })}
                        className={`w-10 h-5 rounded-full transition-colors relative ${systemConfig?.stripeEnabled ? 'bg-emerald-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${systemConfig?.stripeEnabled ? 'left-5.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">PayPal Integration</span>
                      <button
                        onClick={() => updateSystemConfig({ paypalEnabled: !systemConfig?.paypalEnabled })}
                        className={`w-10 h-5 rounded-full transition-colors relative ${systemConfig?.paypalEnabled ? 'bg-emerald-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${systemConfig?.paypalEnabled ? 'left-5.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">2Checkout Integration</span>
                      <button
                        onClick={() => updateSystemConfig({ twoCheckoutEnabled: !systemConfig?.twoCheckoutEnabled })}
                        className={`w-10 h-5 rounded-full transition-colors relative ${systemConfig?.twoCheckoutEnabled ? 'bg-emerald-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${systemConfig?.twoCheckoutEnabled ? 'left-5.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Security Note
                </h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Online payments require valid API keys configured in the system environment. 
                  Enabling these methods without proper configuration will result in payment failures.
                  The "Credit/Debit Card" option is automatically optimized for security and follows 
                  industry standards for data handling.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
