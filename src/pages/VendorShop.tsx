import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Store, MapPin, Tag, ArrowLeft, Star } from 'lucide-react';
import ReviewSection from '../components/ReviewSection';

export default function VendorShop() {
  const { id } = useParams<{ id: string }>();
  const { vendors, products, formatPrice } = useAppContext();

  const vendor = vendors.find(v => v.id === id && v.role === 'vendor');
  const vendorProducts = products.filter(p => p.vendorId === id);

  if (!vendor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Vendor not found</h2>
        <Link to="/vendors" className="text-emerald-600 hover:underline flex items-center justify-center gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Back to Vendors
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Vendor Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
        <div className="h-48 md:h-64 bg-emerald-100 relative">
          {vendor.coverImage ? (
            <img 
              src={vendor.coverImage} 
              alt={vendor.storeName || vendor.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-emerald-300">
              <Store className="w-24 h-24" />
            </div>
          )}
        </div>
        
        <div className="px-8 pb-8 relative">
          <div className="absolute -top-16 left-8 z-10">
            {vendor.profileImage ? (
              <img 
                src={vendor.profileImage} 
                alt={vendor.storeName || vendor.name} 
                className="w-32 h-32 rounded-full border-4 border-white object-cover bg-white shadow-md"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white bg-emerald-600 flex items-center justify-center shadow-md">
                <span className="text-4xl font-bold text-white">
                  {(vendor.storeName || vendor.name).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <div className="pt-20 md:pt-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{vendor.storeName || vendor.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={`w-4 h-4 ${s <= Math.round(vendor.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900">{vendor.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-sm text-gray-500">({vendor.reviewCount || 0} reviews)</span>
              </div>
              <p className="text-gray-600 max-w-3xl leading-relaxed">
                {vendor.storeDescription || 'A certified vendor on Halal Market Online.'}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link 
                to="/customer" 
                state={{ activeTab: 'messages', openChatWith: vendor.id }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                Chat with Vendor
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Products */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Products from {vendor.storeName || vendor.name}</h2>
        <span className="text-gray-500">{vendorProducts.length} items</span>
      </div>

      {vendorProducts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-500">This vendor hasn't added any products to their store.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vendorProducts.map(product => (
            <Link key={product.id} to={`/product/${product.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                {product.isHalalCertified && (
                  <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-1 rounded text-xs font-bold shadow-sm">
                    Halal
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <div className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wider">{product.category}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-bold text-gray-900">{product.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-[10px] text-gray-400">({product.reviewCount || 0})</span>
                </div>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-gray-900">
                    {product.variationCombinations && product.variationCombinations.length > 0
                      ? `From ${formatPrice(Math.min(...product.variationCombinations.map((vc: any) => vc.price)), product.currency)}`
                      : formatPrice(product.price, product.currency)}
                  </span>
                  <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">View Details</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Vendor Reviews */}
      <div className="mt-20 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <ReviewSection vendorId={vendor.id} />
      </div>
    </div>
  );
}
