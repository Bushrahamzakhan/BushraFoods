import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Search, Filter, ShoppingBag, Store, CheckCircle, MapPin, ChevronRight, Star, Globe2, ShieldCheck, Award, HeartHandshake, Truck, Users, X } from 'lucide-react';
import { COUNTRIES, FRESHNESS_OPTIONS, CATEGORIES } from '../constants';

const CATEGORY_ICONS: Record<string, { icon: React.ReactNode, color: string, bg: string }> = {
  'Bakery': { icon: <span className="text-2xl">🥐</span>, color: 'text-amber-600', bg: 'bg-amber-100' },
  'Snacks': { icon: <span className="text-2xl">🥨</span>, color: 'text-orange-600', bg: 'bg-orange-100' },
  'Frozen': { icon: <span className="text-2xl">🧊</span>, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  'Dairy': { icon: <span className="text-2xl">🥛</span>, color: 'text-blue-600', bg: 'bg-blue-100' },
  'Meat': { icon: <span className="text-2xl">🥩</span>, color: 'text-red-600', bg: 'bg-red-100' },
  'Beverages': { icon: <span className="text-2xl">🥤</span>, color: 'text-purple-600', bg: 'bg-purple-100' },
  'Seafood': { icon: <span className="text-2xl">🐟</span>, color: 'text-teal-600', bg: 'bg-teal-100' },
  'Spices': { icon: <span className="text-2xl">🌶️</span>, color: 'text-rose-600', bg: 'bg-rose-100' },
  'Fresh Items': { icon: <span className="text-2xl">🥬</span>, color: 'text-green-600', bg: 'bg-green-100' },
};

export default function Home() {
  const { products, addToCart, formatPrice, fetchProducts, userLocation, setUserLocation, loading } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [halalOnly, setHalalOnly] = useState(false);
  const [freshness, setFreshness] = useState('');
  const [origin, setOrigin] = useState('');
  const [availableInMyLocation, setAvailableInMyLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState({ country: userLocation.country, city: userLocation.city });

  useEffect(() => {
    setTempLocation({ country: userLocation.country, city: userLocation.city });
  }, [userLocation]);

  const handleSaveLocation = () => {
    if (tempLocation.country.trim()) {
      setUserLocation({ 
        country: tempLocation.country.trim(), 
        city: tempLocation.city.trim() 
      });
      setIsEditingLocation(false);
    }
  };

  useEffect(() => {
    const filters = {
      q: searchTerm,
      category: selectedCategory === 'All' ? '' : selectedCategory,
      minPrice,
      maxPrice,
      halal: halalOnly ? 'true' : '',
      freshness,
      origin,
      availableInMyLocation: availableInMyLocation ? 'true' : '',
      userCountry: userLocation.country,
      userCity: userLocation.city
    };
    fetchProducts(filters);
  }, [searchTerm, selectedCategory, minPrice, maxPrice, halalOnly, freshness, origin, availableInMyLocation, userLocation, fetchProducts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const categories = ['All', ...CATEGORIES];
  const countries = ['All Countries', ...COUNTRIES];
  const freshnessOptions = [
    { label: 'All', value: '' },
    ...FRESHNESS_OPTIONS
  ];

  const featuredProducts = [...products].sort((a, b) => {
    if ((b.rating || 0) !== (a.rating || 0)) {
      return (b.rating || 0) - (a.rating || 0);
    }
    return (b.reviewCount || 0) - (a.reviewCount || 0);
  }).slice(0, 4);

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section ... same as before ... */}
      <section className="relative bg-emerald-900 rounded-[2rem] overflow-hidden shadow-2xl mx-4 sm:mx-0">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&q=80&w=1600" 
            alt="Halal Fresh Market" 
            className="w-full h-full object-cover opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900/90 to-transparent"></div>
        </div>
        
        <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" /> 100% Halal Certified
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Premium Halal <br/> <span className="text-emerald-400">Fresh Marketplace</span>
            </h1>
            <p className="text-lg text-emerald-100/80 max-w-lg leading-relaxed font-medium">
              Shop globally sourced, certified halal products. From fresh local meats to international spices, delivered right to your door.
            </p>
            
            {/* Search Bar in Hero */}
            <div className="relative max-w-xl mt-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search for halal meats, spices, fresh items..." 
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-11 pr-4 py-4 border-0 rounded-xl text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-lg sm:leading-6 shadow-lg"
              />
              <button className="absolute inset-y-2 right-2 bg-emerald-600 text-white px-6 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                Search
              </button>
            </div>
          </div>
          
          <div className="hidden lg:block flex-shrink-0 w-1/3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white font-bold">Quality Guaranteed</p>
                  <p className="text-emerald-200 text-xs">Verified Halal Standards</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-100 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Fresh Daily Arrivals
                </div>
                <div className="flex items-center gap-2 text-emerald-100 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Trusted Local Vendors
                </div>
                <div className="flex items-center gap-2 text-emerald-100 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Secure Halal Logistics
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Horizontal Categories Row */}
      <section className="px-4 sm:px-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600" /> Browse by Category
          </h2>
          <button 
            onClick={() => setSelectedCategory('All')}
            className="text-sm font-bold text-emerald-600 hover:underline"
          >
            View All
          </button>
        </div>
        
        <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 md:grid-cols-10">
          {categories.map(cat => {
            const config = CATEGORY_ICONS[cat] || { icon: <Globe2 className="w-6 h-6" />, color: 'text-gray-600', bg: 'bg-gray-100' };
            const isActive = selectedCategory === cat;
            
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300 group min-w-[100px] sm:min-w-0 ${
                  isActive 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100 -translate-y-1' 
                    : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-200 hover:shadow-md hover:-translate-y-1'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-white/20' : config.bg
                }`}>
                  <span className={isActive ? 'text-white' : ''}>{config.icon}</span>
                </div>
                <span className={`text-[10px] font-bold text-center uppercase tracking-wider ${isActive ? 'text-white' : 'text-gray-700 group-hover:text-emerald-600'}`}>
                  {cat}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className={`lg:w-64 space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" /> Smart Filters
              </h3>
              <button 
                onClick={() => {
                  setSelectedCategory('All');
                  setMinPrice('');
                  setMaxPrice('');
                  setHalalOnly(false);
                  setFreshness('');
                  setOrigin('');
                  setAvailableInMyLocation(false);
                }}
                className="text-xs text-emerald-600 font-bold hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Location Availability */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Location Availability</p>
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch('https://ipapi.co/json/');
                      const data = await res.json();
                      if (data.country_name) {
                        setUserLocation({ country: data.country_name, city: data.city || '' });
                      }
                    } catch (e) {
                      alert('Failed to detect location. Please set it manually.');
                    }
                  }}
                  className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" /> Detect
                </button>
              </div>
              <div className="space-y-2">
                <label className={`flex items-center gap-2 cursor-pointer group ${!userLocation.country ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={availableInMyLocation} 
                      disabled={!userLocation.country}
                      onChange={(e) => setAvailableInMyLocation(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-emerald-600 transition-all"></div>
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:translate-x-5 transition-all"></div>
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-emerald-600 transition-colors">Available in my area</span>
                </label>
                
                {!userLocation.country && (
                  <p className="text-[10px] text-amber-600 font-medium">Set your location to use this filter</p>
                )}
                
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Current Location</span>
                    {!isEditingLocation && (
                      <button 
                        onClick={() => setIsEditingLocation(true)}
                        className="text-[10px] font-bold text-emerald-600 hover:underline"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {isEditingLocation ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest">Country</label>
                        <select 
                          value={tempLocation.country} 
                          onChange={(e) => setTempLocation({ ...tempLocation, country: e.target.value })} 
                          className="w-full px-2 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                        >
                          <option value="">Select Country</option>
                          {COUNTRIES.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest">City</label>
                        <input 
                          type="text" 
                          value={tempLocation.city} 
                          onChange={(e) => setTempLocation({ ...tempLocation, city: e.target.value })} 
                          placeholder="Enter your city"
                          className="w-full px-2 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" 
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button 
                          onClick={handleSaveLocation}
                          className="flex-1 px-2 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => {
                            setIsEditingLocation(false);
                            setTempLocation({ country: userLocation.country, city: userLocation.city });
                          }}
                          className="flex-1 px-2 py-1.5 bg-white text-emerald-600 border border-emerald-200 text-[10px] font-bold rounded-lg hover:bg-emerald-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-emerald-900 font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      {userLocation.country ? `${userLocation.city ? userLocation.city + ', ' : ''}${userLocation.country}` : 'Not set'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Price Range</p>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Halal Certified */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-10 h-6 rounded-full relative transition-colors ${halalOnly ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                <input 
                  type="checkbox" 
                  checked={halalOnly}
                  onChange={(e) => setHalalOnly(e.target.checked)}
                  className="sr-only"
                />
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${halalOnly ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="text-sm font-bold text-gray-700">Halal Certified</span>
            </label>

            {/* Freshness */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Freshness</p>
              <div className="flex flex-wrap gap-2">
                {freshnessOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFreshness(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      freshness === opt.value ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Origin */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Country of Origin</p>
              <select 
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="">All Countries</option>
                {countries.filter(c => c !== 'All Countries').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="flex-grow space-y-12">
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 shadow-sm"
          >
            <Filter className="w-4 h-4" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Featured Products (only if no search/filter) */}
          {!searchTerm && selectedCategory === 'All' && !minPrice && !maxPrice && !halalOnly && !freshness && !origin && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" /> Featured Products
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map(product => (
                  <ProductCard key={product.id} product={product} addToCart={addToCart} />
                ))}
              </div>
            </section>
          )}

          {/* Main Product Grid */}
          <section id="products-grid" className="relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-3xl transition-all duration-300">
                <div className="flex flex-col items-center gap-4 p-8 bg-white/80 rounded-2xl shadow-xl border border-emerald-100">
                  <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
                  <p className="text-emerald-800 font-bold text-sm tracking-wide">Updating results...</p>
                </div>
              </div>
            )}
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {searchTerm || selectedCategory !== 'All' || minPrice || maxPrice || halalOnly || freshness || origin ? 'Filtered Results' : 'All Products'}
              </h2>
              <span className="text-sm text-gray-500">{products.length} items found</span>
            </div>
            
            {products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 max-w-md mx-auto">Try adjusting your filters to find what you're looking for.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} addToCart={addToCart} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// Extracted ProductCard component for reuse
function ProductCard({ product, addToCart }: { product: any, addToCart: any, key?: React.Key }) {
  const { formatPrice } = useAppContext();
  
  const prices = product.variationCombinations && product.variationCombinations.length > 0
    ? product.variationCombinations.map((vc: any) => vc.price)
    : [product.price];
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const hasPriceRange = minPrice !== maxPrice;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
      <Link to={`/product/${product.id}`} className="block relative h-56 overflow-hidden bg-gray-50">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isHalalCertified && (
            <div className="bg-green-600 text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-sm flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Halal
            </div>
          )}
          {product.vendorIsTopRated && (
            <div className="bg-amber-500 text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-sm flex items-center gap-1">
              <Award className="w-3 h-3" /> Top-Rated
            </div>
          )}
          {product.availabilityScope === 'global' ? (
            <div className="bg-blue-600 text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-sm flex items-center gap-1">
              <Globe2 className="w-3 h-3" /> Ships Globally
            </div>
          ) : (
            <div className="bg-emerald-600 text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-sm flex items-center gap-1">
              <MapPin className="w-3 h-3" /> 
              {product.availabilityScope === 'country' ? 'Country-Wide' : 'Local Only'}
            </div>
          )}
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-semibold text-gray-700 shadow-sm">
            {product.category}
          </div>
          {product.groupPrice && (
            <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1">
              <Users className="w-3 h-3" /> Group Buy
            </div>
          )}
        </div>
      </Link>
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" /> {product.vendorName}
            {product.vendorIsTopRated && <Award className="w-3 h-3 text-amber-500" />}
          </p>
          <Link to={`/product/${product.id}`}>
            <h3 className="font-bold text-gray-900 line-clamp-2 hover:text-green-600 transition-colors leading-tight">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-gray-900">{product.rating?.toFixed(1) || '0.0'}</span>
            <span className="text-[10px] text-gray-400">({product.reviewCount || 0})</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {product.freshness && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md">
              {product.freshness}
            </span>
          )}
          {product.originCountry && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-blue-50 text-blue-700 rounded-md flex items-center gap-1">
              <Globe2 className="w-2.5 h-2.5" /> {product.originCountry}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-gray-900">
              {hasPriceRange ? `From ${formatPrice(minPrice, product.currency)}` : formatPrice(product.price, product.currency)}
            </span>
            {product.groupPrice && (
              <span className="text-[10px] text-emerald-600 font-bold">
                Group Price: {formatPrice(product.groupPrice, product.currency)}
              </span>
            )}
          </div>
          <Link 
            to={`/product/${product.id}`}
            className="p-3 rounded-xl transition-all bg-green-600 text-white hover:bg-green-700 hover:shadow-md hover:-translate-y-0.5"
            title="View Details"
          >
            <ShoppingBag className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
