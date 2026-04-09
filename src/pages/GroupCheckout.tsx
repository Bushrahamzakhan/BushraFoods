import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CheckCircle, CreditCard, Users, MapPin, Banknote, ArrowLeft, Info, QrCode, Building2, Wallet, HelpCircle, ShieldCheck, Zap } from 'lucide-react';
import { PaymentMethodType, ShippingDetails } from '../types';
import { motion } from 'motion/react';

export default function GroupCheckout() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { products, groupPurchases, createGroupPurchase, joinGroupPurchase, currentUser, formatPrice, vendors } = useAppContext();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');
  
  const isJoining = location.state?.isJoining || false;
  const groupId = location.state?.groupId || null;
  
  const product = products.find(p => p.id === id);
  const vendor = vendors.find(v => v.id === product?.vendorId);
  const activeGroup = groupId ? groupPurchases.find(g => g.id === groupId) : null;
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: currentUser?.lastShippingDetails?.fullName || currentUser?.name || '',
    email: currentUser?.lastShippingDetails?.email || currentUser?.email || '',
    phone: currentUser?.lastShippingDetails?.phone || '',
    address: currentUser?.lastShippingDetails?.address || '',
    city: currentUser?.lastShippingDetails?.city || '',
    state: currentUser?.lastShippingDetails?.state || '',
    country: currentUser?.lastShippingDetails?.country || '',
    zipCode: currentUser?.lastShippingDetails?.zipCode || '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    if (!product || !product.groupPrice) {
      navigate('/');
      return;
    }

    // Check if already a member
    if (isJoining && groupId && currentUser && groupPurchases.length > 0) {
      const group = groupPurchases.find(g => g.id === groupId);
      const isMember = group?.members?.some((m: any) => m.customerId === currentUser.id);
      if (isMember) {
        navigate(`/product/${id}`);
        // Small delay to ensure navigation happens before alert
        setTimeout(() => alert('You are already a member of this group!'), 100);
      }
    }
  }, [product, navigate, isJoining, groupId, currentUser, groupPurchases, id]);

  if (!product) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: `/group-checkout/${id}`, state: location.state } } });
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(async () => {
      try {
        const shippingDetails: ShippingDetails = {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zipCode: formData.zipCode
        };

        if (isJoining && groupId) {
          await joinGroupPurchase(groupId, paymentMethod, shippingDetails);
        } else {
          await createGroupPurchase(product.id, product.targetMembers || 5, paymentMethod, shippingDetails, 24);
        }
        setIsProcessing(false);
        setIsSuccess(true);
      } catch (error: any) {
        setIsProcessing(false);
        alert(error.message || 'Failed to process group purchase');
      }
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">You're in the Group!</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Your payment has been processed. Once the group reaches {product.targetMembers || 5} members, your order will be automatically confirmed.
        </p>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 mb-8 max-w-md mx-auto">
          <p className="text-sm text-emerald-800 font-medium flex items-center justify-center gap-2 mb-2">
            <Users className="w-4 h-4" /> Share with friends to complete the group faster!
          </p>
          <div className="flex gap-2">
            <input 
              readOnly 
              value={`${window.location.origin}/product/${product.id}`} 
              className="flex-grow px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs text-emerald-700 font-mono"
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/product/${product.id}`);
                alert('Link copied!');
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => navigate('/customer')}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md"
          >
            View My Groups
          </button>
          <button 
            onClick={() => navigate('/')}
            className="bg-white text-emerald-700 border border-emerald-200 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors shadow-sm"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-2 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:w-2/3"
        >
          <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-start gap-4 mb-8 shadow-sm">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-emerald-100">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-sm text-emerald-900">
              <p className="font-bold mb-1">Group Purchase Activated!</p>
              <p className="opacity-80">You are paying the discounted group price upfront. If the group does not reach its target of <span className="font-bold">{product.targetMembers || 5} members</span> within the time limit, you will receive a <span className="font-bold underline">full automatic refund</span>. No risk involved!</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Shipping Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" /> Shipping Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <input required type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Street Address</label>
                  <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Province / State</label>
                  <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <input required type="text" name="country" value={formData.country} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ZIP / Postal Code</label>
                  <input required type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" /> Payment Method
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${
                    paymentMethod === 'card' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800' 
                      : 'border-gray-200 hover:border-emerald-200 text-gray-600'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-bold">Credit/Debit Card</p>
                    <p className="text-[10px] opacity-70">Secure online payment</p>
                  </div>
                </button>

                {vendor?.paymentMethods?.filter(m => m.isActive).map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.type)}
                    className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${
                      paymentMethod === method.type 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800' 
                        : 'border-gray-200 hover:border-emerald-200 text-gray-600'
                    }`}
                  >
                    {method.type === 'alipay' || method.type === 'wechat' ? <QrCode className="w-6 h-6" /> : 
                     method.type === 'bank_transfer' ? <Building2 className="w-6 h-6" /> :
                     method.type === 'easypaisa' || method.type === 'payoneer' || method.type === 'paypal' ? <Wallet className="w-6 h-6" /> :
                     <HelpCircle className="w-6 h-6" />}
                    <div className="text-left">
                      <p className="font-bold">{method.name}</p>
                      <p className="text-[10px] opacity-70 capitalize">{method.type.replace('_', ' ')}</p>
                    </div>
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Card Number</label>
                    <input required type="text" name="cardNumber" placeholder="0000 0000 0000 0000" value={formData.cardNumber} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                      <input required type="text" name="expiry" placeholder="MM/YY" value={formData.expiry} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">CVV</label>
                      <input required type="text" name="cvv" placeholder="123" value={formData.cvv} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2 ${
                isProcessing 
                  ? 'bg-emerald-400 text-white cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg'
              }`}
            >
              {isProcessing ? (
                <>Processing Payment...</>
              ) : (
                <>Pay {formatPrice(product.groupPrice || 0, product.currency)} & Join Group</>
              )}
            </button>
          </form>
        </motion.div>

        {/* Order Summary Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:w-1/3"
        >
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Group Summary</h2>
            
            <div className="flex gap-4 mb-6">
              <div className="relative">
                <img src={product.imageUrl} alt={product.name} className="w-24 h-24 object-cover rounded-2xl shadow-sm border border-gray-100" referrerPolicy="no-referrer" />
                <div className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-md uppercase tracking-widest">
                  Group Deal
                </div>
              </div>
              <div className="flex-grow">
                <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{product.name}</h4>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {product.vendorName}
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Group Progress</span>
                    <span className="text-[10px] font-bold text-emerald-600">{isJoining && activeGroup ? activeGroup.currentMembers : 0}/{product.targetMembers || 5}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${((isJoining && activeGroup ? activeGroup.currentMembers : 0) / (product.targetMembers || 5)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Standard Price</span>
                <span className="line-through">{formatPrice(product.price, product.currency)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 text-sm font-bold">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Group Savings
                </span>
                <span>-{formatPrice(product.price - (product.groupPrice || 0), product.currency)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">You Pay</span>
                <span className="text-2xl font-black text-emerald-700">{formatPrice(product.groupPrice || 0, product.currency)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  <span className="font-bold">Buyer Protection:</span> Your funds are held securely. If the group doesn't complete, we'll refund you instantly.
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4 opacity-50 grayscale">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
