import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CheckCircle, CreditCard, Users, MapPin, Banknote, ArrowLeft, Info } from 'lucide-react';
import { PaymentMethod, ShippingDetails } from '../types';

export default function GroupCheckout() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { products, groupPurchases, createGroupPurchase, joinGroupPurchase, currentUser, formatPrice } = useAppContext();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  
  const isJoining = location.state?.isJoining || false;
  const groupId = location.state?.groupId || null;
  
  const product = products.find(p => p.id === id);
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
        if (isJoining && groupId) {
          await joinGroupPurchase(groupId);
        } else {
          await createGroupPurchase(product.id, product.targetMembers || 5, 24);
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
    <div className="max-w-6xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mb-8">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">Group Purchase Policy (Prepaid Model)</p>
              <p>You are paying the discounted group price upfront. If the group does not reach its target of {product.targetMembers || 5} members within the time limit, you will receive a full automatic refund.</p>
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
                  <span className="font-semibold">Credit/Debit Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${
                    paymentMethod === 'cod' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800' 
                      : 'border-gray-200 hover:border-emerald-200 text-gray-600'
                  }`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="font-semibold">Cash on Delivery</span>
                </button>
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
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Group Summary</h2>
            
            <div className="flex gap-4 mb-6">
              <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-cover rounded-xl" referrerPolicy="no-referrer" />
              <div className="flex-grow">
                <h4 className="text-sm font-bold text-gray-900 line-clamp-2">{product.name}</h4>
                <p className="text-xs text-gray-500 mt-1">Vendor: {product.vendorName}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Users className="w-3 h-3 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">
                    {isJoining && activeGroup ? `${activeGroup.currentMembers}/${activeGroup.targetMembers}` : `0/${product.targetMembers || 5}`} Members
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Original Price</span>
                <span className="line-through">{formatPrice(product.price, product.currency)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 text-sm font-bold">
                <span>Group Discount</span>
                <span>-{formatPrice(product.price - (product.groupPrice || 0), product.currency)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-emerald-700">{formatPrice(product.groupPrice || 0, product.currency)}</span>
              </div>
            </div>
            
            <div className="mt-6 bg-emerald-50 p-4 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 leading-relaxed">
                You are joining a collaborative purchase. Your order will be fulfilled as soon as the group is complete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
