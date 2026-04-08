import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Trash2, ArrowRight, ShoppingBag, Store } from 'lucide-react';

export default function Cart() {
  const { cart, removeFromCart, addToCart, formatPrice, getCartTotal } = useAppContext();
  const navigate = useNavigate();

  const totalAmount = getCartTotal();

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
        <ShoppingBag className="w-24 h-24 text-gray-200 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added any halal products yet.</p>
        <Link to="/" className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-green-600" /> Your Cart
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="lg:w-2/3 space-y-4">
          {cart.map((item, index) => (
            <div key={`${item.product.id}-${index}`} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6">
              <img 
                src={item.product.imageUrl} 
                alt={item.product.name} 
                className="w-full sm:w-32 h-32 object-cover rounded-lg"
                referrerPolicy="no-referrer"
              />
              
              <div className="flex-grow w-full">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.product.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Store className="w-3 h-3" /> {item.product.vendorName}
                    </p>
                    {item.selectedVariations && Object.keys(item.selectedVariations).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(item.selectedVariations).map(([key, value]) => (
                          <span key={key} className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-lg text-green-700">{formatPrice(item.product.price * item.quantity, item.product.currency)}</p>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => addToCart(item.product, -1, item.selectedVariations)}
                      className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <div className="w-10 text-center text-sm font-medium text-gray-900">
                      {item.quantity}
                    </div>
                    <button 
                      onClick={() => addToCart(item.product, 1, item.selectedVariations)}
                      className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                      disabled={item.quantity >= item.product.stock}
                    >
                      +
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.product.id, item.selectedVariations)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors flex items-center gap-1 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Estimated Total</span>
                <span className="text-2xl font-extrabold text-green-700">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-md flex items-center justify-center gap-2 text-lg"
            >
              Proceed to Checkout <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="mt-4 text-center">
              <Link to="/" className="text-green-600 hover:underline text-sm font-medium">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
