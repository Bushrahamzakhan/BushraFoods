import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CheckCircle, CreditCard, Truck, MapPin, Banknote, QrCode, Building2, Wallet, HelpCircle, MessageSquare } from 'lucide-react';
import { PaymentMethodType, ShippingDetails, User, CartItem } from '../types';

export default function Checkout() {
  const { cart, placeOrder, currentUser, formatPrice, getCartTotal, vendors } = useAppContext();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [vendorPaymentMethods, setVendorPaymentMethods] = useState<Record<string, PaymentMethodType>>({});

  const totalAmount = getCartTotal();

  // Group cart items by vendor
  const vendorGroups = cart.reduce((groups, item) => {
    const vendorId = item.product.vendorId;
    if (!groups[vendorId]) {
      groups[vendorId] = {
        items: [],
        vendor: vendors.find(v => v.id === vendorId)
      };
    }
    groups[vendorId].items.push(item);
    return groups;
  }, {} as Record<string, { items: CartItem[], vendor?: User }>);

  // Initialize payment methods
  useEffect(() => {
    const initialMethods: Record<string, PaymentMethodType> = { ...vendorPaymentMethods };
    let changed = false;
    Object.keys(vendorGroups).forEach(vendorId => {
      if (!initialMethods[vendorId]) {
        const vendor = vendorGroups[vendorId].vendor;
        const firstActive = vendor?.paymentMethods?.find(m => m.isActive);
        initialMethods[vendorId] = (firstActive?.type as PaymentMethodType) || 'card';
        changed = true;
      }
    });
    if (changed) {
      setVendorPaymentMethods(initialMethods);
    }
  }, [vendorGroups]);

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

  if (cart.length === 0 && !isSuccess) {
    navigate('/cart');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login?redirect=/checkout');
      return;
    }

    setIsProcessing(true);
    
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

    // Simulate payment processing
    setTimeout(() => {
      placeOrder(shippingDetails, vendorPaymentMethods);
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Thank you for shopping with Halal Market Online. Your order has been placed successfully and is being processed.
        </p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => navigate('/customer')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            View My Orders
          </button>
          <button 
            onClick={() => navigate('/')}
            className="bg-white text-green-700 border border-green-200 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors shadow-sm"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Shipping Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" /> Shipping Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <input required type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Street Address</label>
                  <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Province / State</label>
                  <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <input required type="text" name="country" value={formData.country} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ZIP / Postal Code</label>
                  <input required type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            {/* Payment Info per Vendor */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" /> Payment Methods
              </h2>
              
              {Object.entries(vendorGroups).map(([vendorId, group]) => (
                <div key={vendorId} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">
                      Payment for <span className="text-green-600">{group.vendor?.storeName || group.vendor?.name}</span>
                    </h3>
                    <span className="text-sm font-medium text-gray-500">
                      {group.items.length} items • {formatPrice(group.items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0), group.items[0].product.currency)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Default Card Option */}
                    <button
                      type="button"
                      onClick={() => setVendorPaymentMethods(prev => ({ ...prev, [vendorId]: 'card' }))}
                      className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                        vendorPaymentMethods[vendorId] === 'card' 
                          ? 'border-green-600 bg-green-50 text-green-800' 
                          : 'border-gray-100 hover:border-green-200 text-gray-600'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-bold text-sm">Credit/Debit Card</p>
                        <p className="text-[10px] opacity-70">Secure online payment</p>
                      </div>
                    </button>

                    {/* Vendor Configured Methods */}
                    {group.vendor?.paymentMethods?.filter(m => m.isActive).map(method => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setVendorPaymentMethods(prev => ({ ...prev, [vendorId]: method.type }))}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                          vendorPaymentMethods[vendorId] === method.type 
                            ? 'border-green-600 bg-green-50 text-green-800' 
                            : 'border-gray-100 hover:border-green-200 text-gray-600'
                        }`}
                      >
                        {method.type === 'alipay' || method.type === 'wechat' ? <QrCode className="w-5 h-5" /> : 
                         method.type === 'bank_transfer' ? <Building2 className="w-5 h-5" /> :
                         method.type === 'easypaisa' || method.type === 'payoneer' || method.type === 'paypal' ? <Wallet className="w-5 h-5" /> :
                         <HelpCircle className="w-5 h-5" />}
                        <div className="text-left">
                          <p className="font-bold text-sm">{method.name}</p>
                          <p className="text-[10px] opacity-70 capitalize">{method.type.replace('_', ' ')}</p>
                        </div>
                      </button>
                    ))}

                    {/* Chat for more options */}
                    <button
                      type="button"
                      onClick={() => navigate('/customer', { state: { activeTab: 'messages', openChatWith: vendorId } })}
                      className="p-4 rounded-xl border-2 border-dashed border-gray-200 flex items-center gap-3 text-gray-400 hover:border-green-200 hover:text-green-600 transition-all"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-bold text-sm">Other Methods?</p>
                        <p className="text-[10px] opacity-70">Chat with vendor</p>
                      </div>
                    </button>
                  </div>

                  {/* Payment Instructions / Card Form */}
                  <div className="mt-6 pt-6 border-t border-gray-50">
                    {vendorPaymentMethods[vendorId] === 'card' ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Card Number</label>
                          <input required type="text" name="cardNumber" placeholder="0000 0000 0000 0000" value={formData.cardNumber} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expiry</label>
                            <input required type="text" name="expiry" placeholder="MM/YY" value={formData.expiry} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">CVV</label>
                            <input required type="text" name="cvv" placeholder="123" value={formData.cvv} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-blue-900">Receipt-Based Payment</p>
                          <p className="text-xs text-blue-700 mt-1">
                            After placing your order, you will receive instructions to pay via {vendorPaymentMethods[vendorId]?.replace('_', ' ')}. 
                            You'll need to upload a screenshot of your payment receipt for the vendor to approve your order.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2 ${
                isProcessing 
                  ? 'bg-green-400 text-white cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg'
              }`}
            >
              {isProcessing ? (
                <>Processing Order...</>
              ) : (
                <>Place Order • {formatPrice(totalAmount)}</>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
              {cart.map(item => (
                <div key={item.product.id} className="flex gap-4">
                  <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded-md" referrerPolicy="no-referrer" />
                  <div className="flex-grow">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.product.name}</h4>
                    {item.selectedVariations && Object.entries(item.selectedVariations).map(([key, val]) => (
                      <p key={key} className="text-xs text-gray-500">{key}: {val}</p>
                    ))}
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {formatPrice(item.product.price * item.quantity, item.product.currency)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-green-700">{formatPrice(totalAmount)}</span>
              </div>
            </div>
            
            <div className="mt-6 bg-gray-50 p-4 rounded-lg flex items-start gap-3">
              <Truck className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                All halal fresh items are shipped in temperature-controlled packaging to ensure maximum freshness upon delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
