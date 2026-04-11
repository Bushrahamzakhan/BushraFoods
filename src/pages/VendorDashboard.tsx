import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ensureDate } from '../lib/utils';
import { 
  Plus, Edit2, Trash2, Package, DollarSign, ShoppingBag, 
  Clock, CheckCircle, Truck, MapPin, X, TrendingUp, 
  AlertTriangle, BarChart2, LayoutDashboard, MessageSquare,
  ChevronDown, ChevronUp, Image as ImageIcon, Settings, Award, Users,
  ChevronRight, Eye, EyeOff, Lock, CreditCard
} from 'lucide-react';
import { Product, OrderStatus, PaymentStatus, VariationType, VariationCombination, SUPPORTED_CURRENCIES, VendorPaymentMethod, PaymentMethodType } from '../types';
import { COUNTRIES, FRESHNESS_OPTIONS, CATEGORIES } from '../constants';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import ImageUploadField from '../components/ImageUploadField';

export default function VendorDashboard() {
  const { 
    currentUser, products, addProduct, updateProduct, deleteProduct, 
    orders, updateOrderStatus, updateVendorProfile, formatPrice, 
    convertPrice, conversations, subscriptions, groupPurchases, 
    createInvestmentOpportunity, investmentOpportunities, vendorInvestments,
    updatePassword, addVendorPaymentMethod, updateVendorPaymentMethod, 
    deleteVendorPaymentMethod, reviewPaymentReceipt,
    categories
  } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'profile' | 'messages' | 'subscriptions' | 'groups' | 'investments' | 'payment_settings'>('dashboard');
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [isAddingInvestment, setIsAddingInvestment] = useState(false);
  const [investmentFormData, setInvestmentFormData] = useState({
    productId: '',
    fundingGoal: '',
    totalUnits: '',
    profitSharingPct: '',
    riskLevel: 'medium',
    tiers: [
      { name: 'Basic', amount: '', returnPct: '', estimatedEarnings: '' },
      { name: 'Standard', amount: '', returnPct: '', estimatedEarnings: '' },
      { name: 'Premium', amount: '', returnPct: '', estimatedEarnings: '' }
    ]
  });

  useEffect(() => {
    const state = location.state as { activeTab?: string, openChatWith?: string };
    if (state?.openChatWith) {
      setActiveTab('messages');
      setSelectedChatUserId(state.openChatWith);
      navigate(location.pathname, { replace: true, state: {} });
    } else if (state?.activeTab) {
      setActiveTab(state.activeTab as any);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{ orderId: string, status: OrderStatus, description: string } | null>(null);
  const [paymentRejectionModal, setPaymentRejectionModal] = useState<{ orderId: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    category: 'Fresh Items',
    imageUrl: '',
    stock: '',
    tags: '',
    availableCountries: '',
    availableCities: '',
    groupPrice: '',
    targetMembers: '',
    originCountry: 'United Arab Emirates',
    freshness: 'Fresh',
    availabilityScope: 'global',
    availabilityDescription: '',
  });
  
  const [variationTypes, setVariationTypes] = useState<VariationType[]>([]);
  const [variationCombinations, setVariationCombinations] = useState<VariationCombination[]>([]);
  const [showCombinations, setShowCombinations] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    storeName: currentUser?.storeName || '',
    storeDescription: currentUser?.storeDescription || '',
    profileImage: currentUser?.profileImage || '',
    coverImage: currentUser?.coverImage || ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<VendorPaymentMethod | null>(null);
  const [paymentMethodForm, setPaymentMethodForm] = useState<Omit<VendorPaymentMethod, 'id'>>({
    type: 'bank_transfer',
    name: '',
    details: '',
    qrCodeUrl: '',
    instructions: '',
    isActive: true
  });

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

  const handlePaymentMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPaymentMethod) {
        await updateVendorPaymentMethod({ ...paymentMethodForm, id: editingPaymentMethod.id });
      } else {
        await addVendorPaymentMethod(paymentMethodForm);
      }
      setIsAddingPaymentMethod(false);
      setEditingPaymentMethod(null);
      setPaymentMethodForm({
        type: 'bank_transfer',
        name: '',
        details: '',
        qrCodeUrl: '',
        instructions: '',
        isActive: true
      });
      setSuccessMessage('Payment method saved successfully');
    } catch (err) {
      setErrorMessage('Failed to save payment method');
    }
  };

  const handleEditPaymentMethod = (method: VendorPaymentMethod) => {
    setEditingPaymentMethod(method);
    setPaymentMethodForm({
      type: method.type,
      name: method.name,
      details: method.details,
      qrCodeUrl: method.qrCodeUrl || '',
      instructions: method.instructions || '',
      isActive: method.isActive
    });
    setIsAddingPaymentMethod(true);
  };
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  if (!currentUser || currentUser.role !== 'vendor') {
    return <Navigate to="/login" />;
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      updateVendorProfile({
        ...currentUser,
        storeName: profileData.storeName,
        storeDescription: profileData.storeDescription,
        profileImage: profileData.profileImage,
        coverImage: profileData.coverImage
      });
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
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

  const myProducts = products.filter(p => p.vendorId === currentUser.id);
  const myOrders = orders.filter(o => o.vendorId === currentUser.id).sort((a, b) => ensureDate(b.createdAt).getTime() - ensureDate(a.createdAt).getTime());

  // Analytics Data
  const totalRevenue = myOrders.filter(o => o.status === 'delivered').reduce((sum, order) => {
    const orderCurrency = order.items[0]?.currency || 'USD';
    return sum + convertPrice(order.totalAmount, orderCurrency, 'USD');
  }, 0);
  
  const totalOrders = myOrders.length;
  const totalProducts = myProducts.length;
  const pendingOrders = myOrders.filter(o => o.status === 'pending').length;
  const lowStockProducts = myProducts.filter(p => p.stock < 10);

  // Generate chart data from orders
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = ensureDate(new Date());
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayOrders = myOrders.filter(o => 
      ensureDate(o.createdAt).toLocaleDateString() === date.toLocaleDateString() && 
      o.status === 'delivered'
    );
    const amount = dayOrders.reduce((sum, o) => {
      const orderCurrency = o.items[0]?.currency || 'USD';
      return sum + convertPrice(o.totalAmount, orderCurrency, 'USD');
    }, 0);
    return { name: dateStr, sales: amount };
  });

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl text-green-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue, 'USD')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{myOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Capital Raised</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(vendorInvestments.reduce((sum, inv) => sum + inv.amount, 0))}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockProducts.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Sales Performance (Last 7 Days)</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div> Sales (USD)
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Pending Payments
            </h3>
            <div className="space-y-4">
              {myOrders.filter(o => o.paymentStatus === 'receipt_uploaded').length > 0 ? (
                myOrders.filter(o => o.paymentStatus === 'receipt_uploaded').map(order => (
                  <div key={order.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500">{order.customerName} • {formatPrice(order.totalAmount, order.currency)}</p>
                    </div>
                    <button 
                      onClick={() => { setActiveTab('orders'); /* Logic to open this specific order details */ }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Review Receipt
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-blue-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 italic">No pending payment approvals.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Inventory Alerts</h3>
          <div className="space-y-4">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" loading="lazy" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
                      <p className="text-xs text-red-600 font-bold">{product.stock} left in stock</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setActiveTab('products'); handleEditClick(product); }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">All products are well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Recent Orders & Investments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
            <button onClick={() => setActiveTab('orders')} className="text-sm text-green-600 font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">No orders yet</td>
                  </tr>
                ) : (
                  myOrders.slice(0, 5).map(order => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.customerName}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatPrice(order.totalAmount, order.currency)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Investments */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Recent Investments</h3>
            <button onClick={() => setActiveTab('investments')} className="text-sm text-green-600 font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Investor</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendorInvestments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">No investments yet</td>
                  </tr>
                ) : (
                  vendorInvestments.slice(0, 5).map(investment => (
                    <tr key={investment.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Investor #{investment.investorId.slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{investment.productName}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatPrice(investment.amount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{ensureDate(investment.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVariationType = () => {
    setVariationTypes([...variationTypes, { name: '', options: [] }]);
  };

  const handleVariationTypeNameChange = (index: number, name: string) => {
    const newTypes = [...variationTypes];
    newTypes[index].name = name;
    setVariationTypes(newTypes);
  };

  const handleVariationTypeOptionsChange = (index: number, optionsString: string) => {
    const newTypes = [...variationTypes];
    // Keep empty strings while typing to allow trailing commas
    newTypes[index].options = optionsString.split(',').map(opt => opt.trim());
    setVariationTypes(newTypes);
  };

  const handleRemoveVariationType = (index: number) => {
    const newTypes = [...variationTypes];
    newTypes.splice(index, 1);
    setVariationTypes(newTypes);
  };

  const generateCombinations = () => {
    if (variationTypes.length === 0) {
      setVariationCombinations([]);
      return;
    }
    
    // Check if all types have names and options
    if (variationTypes.some(t => !t.name || t.options.length === 0)) {
      setErrorMessage('Please ensure all variation types have a name and at least one option.');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    let results: Record<string, string>[] = [{}];
    
    variationTypes.forEach(type => {
      const newResults: Record<string, string>[] = [];
      results.forEach(res => {
        type.options.forEach(opt => {
          newResults.push({ ...res, [type.name]: opt });
        });
      });
      results = newResults;
    });
    
    const newCombinations = results.map(comb => {
      // Try to find existing combination to preserve data
      const existing = variationCombinations.find(vc => 
        Object.entries(comb).every(([key, value]) => vc.combination[key] === value)
      );
      
      if (existing) return existing;

      return {
        id: Math.random().toString(36).substr(2, 9),
        combination: comb,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        images: [formData.imageUrl].filter(Boolean),
        weight: '',
        attributes: {}
      };
    });
    
    setVariationCombinations(newCombinations);
    setShowCombinations(true);
  };

  const handleCombinationChange = (index: number, field: keyof VariationCombination, value: any) => {
    const newCombinations = [...variationCombinations];
    newCombinations[index] = { ...newCombinations[index], [field]: value };
    setVariationCombinations(newCombinations);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      currency: formData.currency,
      category: formData.category,
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
      stock: parseInt(formData.stock, 10),
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      availableCountries: formData.availableCountries.split(',').map(country => country.trim()).filter(country => country !== ''),
      availableCities: formData.availableCities.split(',').map(city => city.trim()).filter(city => city !== ''),
      variationTypes: variationTypes.filter(v => v.name && v.options.length > 0),
      variationCombinations: variationCombinations,
      isHalalCertified: true,
      groupPrice: formData.groupPrice ? parseFloat(formData.groupPrice) : null,
      targetMembers: formData.targetMembers ? parseInt(formData.targetMembers, 10) : null,
      originCountry: formData.originCountry,
      freshness: formData.freshness,
      availabilityScope: formData.availabilityScope as any,
      availabilityDescription: formData.availabilityDescription,
      rating: 0,
      reviewCount: 0
    };

    try {
      if (editingProduct) {
        await updateProduct({ ...editingProduct, ...productData });
        setSuccessMessage('Product updated successfully!');
      } else {
        await addProduct(productData);
        setSuccessMessage('Product created successfully!');
      }
      setTimeout(() => setSuccessMessage(null), 5000);
      resetForm();
    } catch (error: any) {
      setErrorMessage(`Error: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const resetForm = () => {
    setIsAddingProduct(false);
    setEditingProduct(null);
    setFormData({ 
      name: '', 
      description: '', 
      price: '', 
      currency: 'USD', 
      category: '', 
      imageUrl: '', 
      stock: '', 
      tags: '', 
      availableCountries: '', 
      availableCities: '', 
      groupPrice: '', 
      targetMembers: '', 
      originCountry: '',
      freshness: '',
      availabilityScope: 'global', 
      availabilityDescription: '' 
    });
    setVariationTypes([]);
    setVariationCombinations([]);
    setShowCombinations(false);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      currency: product.currency || 'USD',
      category: product.category,
      imageUrl: product.imageUrl,
      stock: product.stock.toString(),
      tags: product.tags?.join(', ') || '',
      availableCountries: product.availableCountries?.join(', ') || '',
      availableCities: product.availableCities?.join(', ') || '',
      groupPrice: product.groupPrice?.toString() || '',
      targetMembers: product.targetMembers?.toString() || '',
      originCountry: product.originCountry || 'United Arab Emirates',
      freshness: product.freshness || 'Fresh',
      availabilityScope: product.availabilityScope || 'global',
      availabilityDescription: product.availabilityDescription || '',
    });
    setVariationTypes(product.variationTypes || []);
    setVariationCombinations(product.variationCombinations || []);
    setShowCombinations((product.variationCombinations?.length || 0) > 0);
    setIsAddingProduct(true);
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Success Message Banner */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-green-900">{successMessage}</p>
            <p className="text-sm text-green-700">Your changes have been saved and are now live.</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-400 hover:text-green-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-red-900">Action Failed</p>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
            {currentUser.isTopRated && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 animate-pulse">
                <Award className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Top-Rated Vendor</span>
              </div>
            )}
          </div>
          <p className="text-gray-500 mt-2">Manage your store: {currentUser.storeName}</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'products' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Products
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'orders' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('subscriptions')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'subscriptions' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Subscriptions
          </button>
          <button 
            onClick={() => setActiveTab('groups')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'groups' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Group Buys
          </button>
          <button 
            onClick={() => setActiveTab('investments')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'investments' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Investments
          </button>
          <button 
            onClick={() => setActiveTab('payment_settings')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'payment_settings' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Payments
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'profile' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Store Profile
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'messages' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <div className="flex items-center gap-2">
              Messages
              {conversations.some(c => c.unreadCount > 0) && (
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Recurring Subscriptions</h2>
            <p className="text-sm text-gray-500">Manage active subscriptions for your products.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Frequency</th>
                  <th className="px-6 py-4 font-semibold">Next Delivery</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.filter(s => s.vendorId === currentUser.id).map(sub => (
                  <tr key={sub.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={sub.productImageUrl} alt={sub.productName} className="w-8 h-8 rounded-lg object-cover" />
                        <span className="text-sm font-medium text-gray-900">{sub.productName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sub.customerId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{sub.frequency}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ensureDate(sub.nextDelivery).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        sub.status === 'active' ? 'bg-green-100 text-green-700' :
                        sub.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Investments Tab */}
      {activeTab === 'investments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Investment Opportunities</h2>
              <p className="text-sm text-gray-500">Raise capital for your products through community investment.</p>
            </div>
            <button 
              onClick={() => setIsAddingInvestment(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
            >
              <Plus className="w-4 h-4" />
              Create Opportunity
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Capital Raised</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatPrice(0)}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Investors</p>
              <h3 className="text-2xl font-bold text-gray-900">0</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Profit Shared</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatPrice(0)}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Goal</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4">Profit Share</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {investmentOpportunities.filter(o => o.vendorId === currentUser.id).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                        No active investment opportunities. Click "Create Opportunity" to get started.
                      </td>
                    </tr>
                  ) : (
                    investmentOpportunities.filter(o => o.vendorId === currentUser.id).map(opportunity => (
                      <tr key={opportunity.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{opportunity.productName}</p>
                              <p className="text-xs text-gray-500">{opportunity.totalUnits} units goal</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{formatPrice(opportunity.fundingGoal)}</p>
                          <p className="text-xs text-gray-500">Raised: {formatPrice(opportunity.currentFunding)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-32">
                            <div className="flex justify-between text-[10px] font-bold mb-1">
                              <span>{Math.round((opportunity.currentFunding / opportunity.fundingGoal) * 100)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-500" 
                                style={{ width: `${Math.min(100, (opportunity.currentFunding / opportunity.fundingGoal) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-green-600">{opportunity.profitSharingPct}%</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            opportunity.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {opportunity.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Investment Opportunity Modal */}
      {isAddingInvestment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">New Investment Opportunity</h2>
              <button 
                onClick={() => setIsAddingInvestment(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await createInvestmentOpportunity({
                  ...investmentFormData,
                  fundingGoal: parseFloat(investmentFormData.fundingGoal),
                  totalUnits: parseInt(investmentFormData.totalUnits),
                  profitSharingPct: parseFloat(investmentFormData.profitSharingPct),
                  tiers: investmentFormData.tiers.map(t => ({
                    ...t,
                    amount: parseFloat(t.amount),
                    returnPct: parseFloat(t.returnPct),
                    estimatedEarnings: parseFloat(t.estimatedEarnings)
                  }))
                });
                setIsAddingInvestment(false);
                setInvestmentFormData({
                  productId: '',
                  fundingGoal: '',
                  totalUnits: '',
                  profitSharingPct: '',
                  riskLevel: 'medium',
                  tiers: [
                    { name: 'Basic', amount: '', returnPct: '', estimatedEarnings: '' },
                    { name: 'Standard', amount: '', returnPct: '', estimatedEarnings: '' },
                    { name: 'Premium', amount: '', returnPct: '', estimatedEarnings: '' }
                  ]
                });
                setSuccessMessage('Investment opportunity created successfully!');
              } catch (err: any) {
                setErrorMessage(err.message || 'Failed to create opportunity.');
              }
            }} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Select Product</label>
                  <select 
                    required
                    value={investmentFormData.productId}
                    onChange={(e) => setInvestmentFormData(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  >
                    <option value="">Choose a product...</option>
                    {myProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Funding Goal ($)</label>
                  <input 
                    type="number" 
                    required
                    value={investmentFormData.fundingGoal}
                    onChange={(e) => setInvestmentFormData(prev => ({ ...prev, fundingGoal: e.target.value }))}
                    placeholder="e.g. 5000"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Total Units to Produce</label>
                  <input 
                    type="number" 
                    required
                    value={investmentFormData.totalUnits}
                    onChange={(e) => setInvestmentFormData(prev => ({ ...prev, totalUnits: e.target.value }))}
                    placeholder="e.g. 500"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Profit Sharing %</label>
                  <input 
                    type="number" 
                    required
                    value={investmentFormData.profitSharingPct}
                    onChange={(e) => setInvestmentFormData(prev => ({ ...prev, profitSharingPct: e.target.value }))}
                    placeholder="e.g. 15"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Risk Level</label>
                  <select 
                    value={investmentFormData.riskLevel}
                    onChange={(e) => setInvestmentFormData(prev => ({ ...prev, riskLevel: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-900">Investment Tiers (3-Tier Model)</h4>
                <div className="grid grid-cols-1 gap-4">
                  {investmentFormData.tiers.map((tier, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-3 gap-4">
                      <div className="col-span-3 font-bold text-sm text-gray-700">{tier.name} Tier</div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Amount ($)</label>
                        <input 
                          type="number" 
                          required
                          value={tier.amount}
                          onChange={(e) => {
                            const newTiers = [...investmentFormData.tiers];
                            newTiers[idx].amount = e.target.value;
                            setInvestmentFormData(prev => ({ ...prev, tiers: newTiers }));
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">ROI (%)</label>
                        <input 
                          type="number" 
                          required
                          value={tier.returnPct}
                          onChange={(e) => {
                            const newTiers = [...investmentFormData.tiers];
                            newTiers[idx].returnPct = e.target.value;
                            setInvestmentFormData(prev => ({ ...prev, tiers: newTiers }));
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Est. Earnings ($)</label>
                        <input 
                          type="number" 
                          required
                          value={tier.estimatedEarnings}
                          onChange={(e) => {
                            const newTiers = [...investmentFormData.tiers];
                            newTiers[idx].estimatedEarnings = e.target.value;
                            setInvestmentFormData(prev => ({ ...prev, tiers: newTiers }));
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
              >
                Launch Investment Opportunity
              </button>
            </form>
          </div>
        </div>
      )}
      {activeTab === 'groups' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Group Purchases</h2>
            <p className="text-sm text-gray-500">Monitor active group buying campaigns.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {groupPurchases.filter(g => g.vendorId === currentUser.id).map(group => (
              <div key={group.id} className="border border-gray-100 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <img src={group.productImageUrl} alt={group.productName} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{group.productName}</h3>
                    <p className="text-xs text-gray-500">Ends: {ensureDate(group.expiresAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span>Progress</span>
                    <span>{group.currentMembers}/{group.targetMembers}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 transition-all duration-500" 
                      style={{ width: `${(group.currentMembers / group.targetMembers) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    group.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {group.status}
                  </span>
                  <p className="font-bold text-gray-900">{formatPrice(group.price, group.currency)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingProductId(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  deleteProduct(deletingProductId);
                  setDeletingProductId(null);
                  setSuccessMessage('Product deleted successfully!');
                  setTimeout(() => setSuccessMessage(null), 5000);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview - Only show on other tabs if needed, but we have a dedicated dashboard now */}
      {activeTab !== 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue, 'USD')}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Products</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          <div className="lg:col-span-1 overflow-y-auto">
            <ChatList onSelect={setSelectedChatUserId} activeUserId={selectedChatUserId || undefined} />
          </div>
          <div className="lg:col-span-2 h-full">
            {selectedChatUserId ? (
              <ChatWindow otherUserId={selectedChatUserId} onClose={() => setSelectedChatUserId(null)} />
            ) : (
              <div className="h-full bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Pick a customer from the list to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">My Products</h2>
            <button 
              onClick={() => {
                setIsAddingProduct(!isAddingProduct);
                if (!isAddingProduct) {
                  setEditingProduct(null);
                  setFormData({ 
                    name: '', 
                    description: '', 
                    price: '', 
                    currency: 'USD', 
                    category: 'Fresh Items', 
                    imageUrl: '', 
                    stock: '', 
                    tags: '', 
                    availableCountries: '', 
                    availableCities: '', 
                    groupPrice: '', 
                    targetMembers: '', 
                    originCountry: 'United Arab Emirates',
                    freshness: 'Fresh',
                    availabilityScope: 'global', 
                    availabilityDescription: ''
                  });
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              {isAddingProduct ? 'Cancel' : <><Plus className="w-4 h-4" /> Add Product</>}
            </button>
          </div>

          {isAddingProduct && (
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <form onSubmit={handleSubmitProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Product Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select Category</option>
                    {categories.filter(c => c.isActive).sort((a, b) => a.order - b.order).map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea required name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3}></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Price</label>
                  <div className="flex gap-2">
                    <select name="currency" value={formData.currency} onChange={handleInputChange} className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      {SUPPORTED_CURRENCIES.filter(c => c.code !== 'original').map(c => (
                        <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                      ))}
                    </select>
                    <input required type="number" step="0.01" min="0" name="price" value={formData.price} onChange={handleInputChange} className="flex-grow px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Stock Quantity</label>
                  <input required type="number" min="0" name="stock" value={formData.stock} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                  <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} placeholder="e.g., organic, gluten-free, spicy" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Available Countries (comma-separated, for Fresh Items)</label>
                  <input type="text" name="availableCountries" value={formData.availableCountries} onChange={handleInputChange} placeholder="e.g., USA, Canada" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Available Cities (comma-separated, for Fresh Items)</label>
                  <input type="text" name="availableCities" value={formData.availableCities} onChange={handleInputChange} placeholder="e.g., New York, Los Angeles" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Origin Country</label>
                  <select name="originCountry" value={formData.originCountry} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select Country</option>
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Freshness Level</label>
                  <select name="freshness" value={formData.freshness} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select Freshness</option>
                    {FRESHNESS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Availability Scope</label>
                  <select name="availabilityScope" value={formData.availabilityScope} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="global">Global Availability</option>
                    <option value="country">Country-Level Availability</option>
                    <option value="local">Local Region (Specific Cities)</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Availability/Delivery Description</label>
                  <input type="text" name="availabilityDescription" value={formData.availabilityDescription} onChange={handleInputChange} placeholder="e.g., Available in California only or Ships across UAE and Saudi Arabia" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <ImageUploadField
                    label="Product Image"
                    value={formData.imageUrl}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                    folder="products"
                    placeholder="https://example.com/product.jpg"
                  />
                </div>

                {/* Group Purchase Configuration */}
                <div className="md:col-span-2 p-6 border border-blue-100 rounded-2xl bg-blue-50/50 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h4 className="text-lg font-bold text-blue-900">Group Purchase Options</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-4">Enable collaborative buying for this product to boost sales with discounts.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-900">Group Discount Price</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        name="groupPrice" 
                        value={formData.groupPrice} 
                        onChange={handleInputChange} 
                        placeholder="e.g., 15.99"
                        className="w-full px-4 py-2 border border-blue-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-900">Target Members</label>
                      <input 
                        type="number" 
                        min="2" 
                        name="targetMembers" 
                        value={formData.targetMembers} 
                        onChange={handleInputChange} 
                        placeholder="e.g., 5"
                        className="w-full px-4 py-2 border border-blue-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                    </div>
                  </div>
                </div>

                {/* Variations Section */}
                <div className="space-y-6 md:col-span-2 mt-6">
                  <div className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">1. Define Variation Types</h4>
                        <p className="text-sm text-gray-500">Add types like Size, Color, or Material.</p>
                      </div>
                      <button type="button" onClick={handleAddVariationType} className="bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold hover:bg-green-100 transition-all flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Type
                      </button>
                    </div>
                    
                    {variationTypes.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Settings className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No variation types added yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {variationTypes.map((type, index) => (
                          <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 relative group">
                            <div className="w-full sm:w-1/3">
                              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Type Name</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Size" 
                                value={type.name} 
                                onChange={(e) => handleVariationTypeNameChange(index, e.target.value)} 
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                              />
                            </div>
                            <div className="flex-grow">
                              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Options (comma separated)</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Small, Medium, Large" 
                                value={type.options.join(', ')} 
                                onChange={(e) => handleVariationTypeOptionsChange(index, e.target.value)} 
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                              />
                            </div>
                            <button type="button" onClick={() => handleRemoveVariationType(index)} className="absolute -top-2 -right-2 sm:static p-2 text-red-400 hover:text-red-600 bg-white sm:bg-transparent rounded-full shadow-sm sm:shadow-none opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                        
                        <div className="pt-4 flex justify-center">
                          <button 
                            type="button" 
                            onClick={generateCombinations}
                            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg"
                          >
                            Generate All Combinations
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {showCombinations && variationCombinations.length > 0 && (
                    <div className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">2. Manage Combinations</h4>
                          <p className="text-sm text-gray-500">Set specific price, stock, and details for each variation.</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setShowCombinations(!showCombinations)}
                          className="text-gray-500 hover:text-gray-900"
                        >
                          {showCombinations ? <ChevronUp /> : <ChevronDown />}
                        </button>
                      </div>

                      <div className="space-y-4">
                        {variationCombinations.map((vc, index) => (
                          <div key={index} className="border border-gray-100 rounded-2xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 flex flex-wrap gap-2 items-center border-b border-gray-100">
                              {Object.entries(vc.combination).map(([key, value]) => (
                                <span key={`combo-${key}`} className="bg-white px-3 py-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 shadow-sm">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Price</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    value={vc.price}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                      handleCombinationChange(index, 'price', isNaN(val) ? 0 : val);
                                    }}
                                    className="w-full pl-7 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Stock</label>
                                <input 
                                  type="number" 
                                  value={vc.stock}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                    handleCombinationChange(index, 'stock', isNaN(val) ? 0 : val);
                                  }}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Weight</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 500g"
                                  value={vc.weight}
                                  onChange={(e) => handleCombinationChange(index, 'weight', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Images (comma separated)</label>
                                <input 
                                  type="text" 
                                  placeholder="URLs..."
                                  value={vc.images?.join(', ') || ''}
                                  onChange={(e) => handleCombinationChange(index, 'images', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 mt-4 flex justify-end gap-3">
                  <button type="button" onClick={resetForm} className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">
                    {editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Stock</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      You haven't added any products yet.
                    </td>
                  </tr>
                ) : (
                  myProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded object-cover" referrerPolicy="no-referrer" loading="lazy" />
                          <div>
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 line-clamp-1 w-48">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{product.category}</td>
                      <td className="p-4 font-medium text-gray-900">{formatPrice(product.price, product.currency)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {product.stock} in stock
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEditClick(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeletingProductId(product.id)} 
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {myOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
              <p className="text-gray-500">When customers buy your products, orders will appear here.</p>
            </div>
          ) : (
            myOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm font-medium text-gray-900">
                      Customer: {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {ensureDate(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Total</p>
                      <p className="font-bold text-gray-900">{formatPrice(order.totalAmount, order.currency)}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <select 
                        value={order.status}
                        onChange={(e) => setStatusModal({ orderId: order.id, status: e.target.value as OrderStatus, description: '' })}
                        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="payment_rejected">Payment Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Ordered Items</h4>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center text-green-700 font-bold text-sm">
                              {item.quantity}x
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 block">{item.productName}</span>
                              {item.selectedVariations && Object.keys(item.selectedVariations).length > 0 && (
                                <span className="text-xs text-gray-500">
                                  {Object.entries(item.selectedVariations).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-gray-600">{formatPrice(item.price * item.quantity, item.currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping & Payment Details */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Shipping Details</h4>
                    
                    {order.shippingDetails ? (
                      <div className="mb-4">
                        <p className="text-sm text-gray-900 font-medium">{order.shippingDetails.fullName}</p>
                        <p className="text-sm text-gray-600">{order.shippingDetails.address}</p>
                        <p className="text-sm text-gray-600">{order.shippingDetails.city}, {order.shippingDetails.zipCode}</p>
                        <p className="text-sm text-gray-600 mt-1">Contact: {order.shippingDetails.phone}</p>
                        <p className="text-sm text-gray-600">Email: {order.shippingDetails.email}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic mb-4">No shipping details provided.</p>
                    )}

                    {order.paymentMethod && (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                        <p className="text-sm text-gray-900 font-medium capitalize">
                          {order.paymentMethod.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Payment Status: <span className={`font-bold uppercase ${
                            order.paymentStatus === 'approved' ? 'text-green-600' : 
                            order.paymentStatus === 'rejected' ? 'text-red-600' : 
                            'text-blue-600'
                          }`}>{getPaymentStatusDisplay(order.paymentStatus || 'pending')}</span>
                        </p>
                      </div>
                    )}

                    {order.paymentStatus === 'receipt_uploaded' && order.paymentReceipt && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <h5 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Payment Receipt Uploaded
                        </h5>
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          <img 
                            src={order.paymentReceipt.imageUrl} 
                            alt="Receipt" 
                            className="w-full sm:w-32 h-32 object-cover rounded border border-blue-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setViewingReceiptUrl(order.paymentReceipt?.imageUrl || null)}
                          />
                          <div className="flex-grow space-y-3">
                            <p className="text-xs text-blue-700">
                              Please verify the payment receipt. Once verified, you can approve the order.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedChatUserId(order.customerId);
                                  setActiveTab('messages');
                                }}
                                className="bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Chat with Customer
                              </button>
                              <button 
                                onClick={() => reviewPaymentReceipt(order.id, 'approved')}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700"
                              >
                                Approve Payment
                              </button>
                              <button 
                                onClick={() => {
                                  setPaymentRejectionModal({ orderId: order.id });
                                  setRejectionReason('');
                                }}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700"
                              >
                                Reject Payment
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Updates History */}
                {order.history && order.history.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Order Updates History</h4>
                    <div className="space-y-4">
                      {order.history.map((update, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${index === order.history!.length - 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            {index !== order.history!.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1"></div>}
                          </div>
                          <div className="pb-4">
                            <p className="text-sm font-medium text-gray-900 capitalize">{update.status}</p>
                            <p className="text-sm text-gray-600 mt-1">{update.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{ensureDate(update.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      {/* Payment Settings Tab */}
      {activeTab === 'payment_settings' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Payment Methods</h2>
                <p className="text-sm text-gray-500">Configure how customers can pay you. Customers will upload receipts for these methods.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingPaymentMethod(null);
                  setPaymentMethodForm({
                    type: 'bank_transfer',
                    name: '',
                    details: '',
                    qrCodeUrl: '',
                    instructions: '',
                    isActive: true
                  });
                  setIsAddingPaymentMethod(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Method
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentUser?.paymentMethods?.map(method => (
                <div key={method.id} className="border border-gray-100 rounded-xl p-4 flex justify-between items-start bg-gray-50">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{method.type.replace('_', ' ')}</span>
                      {method.isActive ? (
                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                      ) : (
                        <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">INACTIVE</span>
                      )}
                    </div>
                    <p className="font-bold text-gray-900">{method.name}</p>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap font-mono bg-white p-2 rounded border border-gray-100">{method.details}</p>
                    {method.instructions && (
                      <p className="text-xs text-gray-500 mt-2 italic">{method.instructions}</p>
                    )}
                    {method.qrCodeUrl && (
                      <div className="mt-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">QR Code</p>
                        <img src={method.qrCodeUrl} alt="QR Code" className="w-32 h-32 rounded border border-gray-200 bg-white p-1" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button onClick={() => handleEditPaymentMethod(method)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteVendorPaymentMethod(method.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {(!currentUser?.paymentMethods || currentUser.paymentMethods.length === 0) && (
                <div className="md:col-span-2 py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No payment methods configured yet.</p>
                  <p className="text-sm text-gray-400">Add methods like Bank Transfer, Alipay, or Easypaisa to start receiving payments.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {isAddingPaymentMethod && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h3>
              <button onClick={() => setIsAddingPaymentMethod(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handlePaymentMethodSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Payment Type</label>
                <select 
                  value={paymentMethodForm.type}
                  onChange={(e) => setPaymentMethodForm({...paymentMethodForm, type: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="alipay">Alipay</option>
                  <option value="wechat">WeChat Pay</option>
                  <option value="easypaisa">Easypaisa</option>
                  <option value="payoneer">Payoneer</option>
                  <option value="paypal">PayPal</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Method Name (e.g., HBL Bank, My Alipay)</label>
                <input 
                  required
                  type="text"
                  value={paymentMethodForm.name}
                  onChange={(e) => setPaymentMethodForm({...paymentMethodForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. Standard Chartered Bank"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Payment Details (Account #, IBAN, Email, etc.)</label>
                <textarea 
                  required
                  value={paymentMethodForm.details}
                  onChange={(e) => setPaymentMethodForm({...paymentMethodForm, details: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                  placeholder="Enter account number, IBAN, or payment ID"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">QR Code URL (Optional)</label>
                <input 
                  type="url"
                  value={paymentMethodForm.qrCodeUrl}
                  onChange={(e) => setPaymentMethodForm({...paymentMethodForm, qrCodeUrl: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="https://example.com/qr-code.jpg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Instructions for Customer (Optional)</label>
                <input 
                  type="text"
                  value={paymentMethodForm.instructions}
                  onChange={(e) => setPaymentMethodForm({...paymentMethodForm, instructions: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. Please include order ID in reference"
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="isActive"
                  checked={paymentMethodForm.isActive}
                  onChange={(e) => setPaymentMethodForm({...paymentMethodForm, isActive: e.target.checked})}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (Visible to customers)</label>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddingPaymentMethod(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-md"
                >
                  {editingPaymentMethod ? 'Update Method' : 'Add Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Store Profile</h2>
            <p className="text-gray-500 mt-1">Update your store details and images for customers to see.</p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Store Name</label>
                <input required type="text" name="storeName" value={profileData.storeName} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Store Description</label>
                <textarea name="storeDescription" value={profileData.storeDescription} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={4} placeholder="Tell customers about your store and products..."></textarea>
              </div>
              <div className="space-y-2">
                <ImageUploadField
                  label="Profile Image (Logo)"
                  value={profileData.profileImage}
                  onChange={(url) => setProfileData({ ...profileData, profileImage: url })}
                  folder="vendors/logos"
                  placeholder="https://example.com/logo.jpg"
                />
              </div>
              <div className="space-y-2">
                <ImageUploadField
                  label="Cover Image"
                  value={profileData.coverImage}
                  onChange={(url) => setProfileData({ ...profileData, coverImage: url })}
                  folder="vendors/covers"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                Save Profile
              </button>
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

      {/* Payment Rejection Modal */}
      {paymentRejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Reject Payment</h3>
              <button onClick={() => setPaymentRejectionModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this payment receipt. This will be shown to the customer.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Transaction ID not found, Amount doesn't match, Receipt is blurry..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none h-32 resize-none mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentRejectionModal(null)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!rejectionReason.trim()) return;
                  await reviewPaymentReceipt(paymentRejectionModal.orderId, 'rejected', rejectionReason);
                  setPaymentRejectionModal(null);
                  setRejectionReason('');
                  setSuccessMessage('Payment rejected and customer notified');
                }}
                disabled={!rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">Update Order Status</h3>
              <button onClick={() => setStatusModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">New Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize inline-block ${getStatusColor(statusModal.status)}`}>
                  {statusModal.status}
                </span>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Description (Optional)
                </label>
                <textarea
                  value={statusModal.description}
                  onChange={(e) => setStatusModal({ ...statusModal, description: e.target.value })}
                  placeholder="e.g., Your order has been shipped via FedEx. Tracking #12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">This will be visible to the customer.</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setStatusModal(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateOrderStatus(statusModal.orderId, statusModal.status, statusModal.description);
                    setStatusModal(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-colors"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
