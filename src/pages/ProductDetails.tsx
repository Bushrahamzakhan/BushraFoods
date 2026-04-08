import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Product, VariationCombination } from '../types';
import { ensureDate } from '../lib/utils';
import { ArrowLeft, Store, ShoppingCart, Check, AlertCircle, CheckCircle, MapPin, Tag, MessageSquare, Star, Award, Users, Calendar, RefreshCw, Globe2, TrendingUp, ArrowUpRight, Truck } from 'lucide-react';
import ReviewSection from '../components/ReviewSection';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    products, addToCart, formatPrice, currentUser, createSubscription, 
    joinGroupPurchase, createGroupPurchase, groupPurchases, investmentOpportunities 
  } = useAppContext();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [currentCombination, setCurrentCombination] = useState<VariationCombination | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [subFrequency, setSubFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [showSubModal, setShowSubModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const product = products.find(p => p.id === id);
  const activeGroup = groupPurchases.find(g => g.productId === id && g.status === 'open');
  const activeInvestment = investmentOpportunities.find(io => io.productId === id && io.status === 'active');
  const isOwnProduct = currentUser?.id === product?.vendorId;

  useEffect(() => {
    if (!activeGroup) return;

    const timer = setInterval(() => {
      const now = ensureDate(new Date()).getTime();
      const expiry = ensureDate(activeGroup.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeGroup?.expiresAt]);

  // ... (rest of the logic same as before) ...
  // Initialize default variations if not set
  useEffect(() => {
    if (product?.variationTypes && product.variationTypes.length > 0) {
      const initialOptions: Record<string, string> = {};
      product.variationTypes.forEach(vt => {
        if (vt.options.length > 0) initialOptions[vt.name] = vt.options[0];
      });
      setSelectedOptions(initialOptions);
    }
  }, [product?.id]);

  // Find matching combination
  useEffect(() => {
    if (product?.variationCombinations && Object.keys(selectedOptions).length > 0) {
      const match = product.variationCombinations.find(vc => {
        // Ensure all selected options match the combination
        const selectedEntries = Object.entries(selectedOptions);
        if (selectedEntries.length === 0) return false;
        
        return selectedEntries.every(([key, value]) => {
          const vcValue = vc.combination[key];
          return vcValue && vcValue.toString().trim() === value.toString().trim();
        });
      });
      
      setCurrentCombination(match || null);
      setActiveImageIndex(0); // Reset image index when variation changes
    } else {
      setCurrentCombination(null);
    }
  }, [selectedOptions, product]);

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
        <button onClick={() => navigate('/')} className="text-green-600 hover:underline flex items-center justify-center gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    const finalProduct = {
      ...product,
      price: currentCombination?.price ?? product.price,
      stock: currentCombination?.stock ?? product.stock,
      imageUrl: (currentCombination?.images && currentCombination.images.length > 0) 
        ? currentCombination.images[0] 
        : product.imageUrl,
    };
    addToCart(finalProduct, quantity, selectedOptions);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleSubscribe = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: `/product/${id}` } } });
      return;
    }
    await createSubscription(product.id, subFrequency, quantity);
    setShowSubModal(false);
    alert('Subscription created successfully!');
  };

  const isMember = activeGroup?.members?.some((m: any) => m.customerId === currentUser?.id);

  const handleJoinGroup = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: `/product/${id}` } } });
      return;
    }
    if (isMember) {
      alert('You are already a member of this group!');
      return;
    }
    if (activeGroup) {
      navigate(`/group-checkout/${product.id}`, { 
        state: { isJoining: true, groupId: activeGroup.id } 
      });
    }
  };

  const handleStartGroup = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: `/product/${id}` } } });
      return;
    }
    if (product.groupPrice) {
      navigate(`/group-checkout/${product.id}`, { 
        state: { isJoining: false } 
      });
    }
  };

  const copyGroupLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayPrice = currentCombination?.price ?? product.price;
  const displayStock = currentCombination?.stock ?? product.stock;
  const displayImages = currentCombination?.images && currentCombination.images.length > 0 
    ? currentCombination.images 
    : [product.imageUrl];
  const activeImage = displayImages[activeImageIndex] || product.imageUrl;

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col lg:flex-row">
        {/* Product Image Gallery */}
        <div className="lg:w-1/2 p-4 sm:p-8 bg-gray-50 flex flex-col gap-4">
          <div className="aspect-square relative rounded-xl overflow-hidden bg-white border border-gray-100">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isHalalCertified && (
                <div className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> 100% Halal
                </div>
              )}
              {product.vendorIsTopRated && (
                <div className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Top-Rated Vendor
                </div>
              )}
              {product.availabilityScope === 'global' ? (
                <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5">
                  <Globe2 className="w-4 h-4" /> Global Shipping
                </div>
              ) : (
                <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> 
                  {product.availabilityScope === 'country' ? 'Country-Wide' : 'Local Availability'}
                </div>
              )}
            </div>
          </div>
          
          {displayImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {displayImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                    activeImageIndex === idx ? 'border-green-600 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="lg:w-1/2 p-8 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wider">
              {product.category}
            </span>
            <Link to={`/vendor/${product.vendorId}`} className="text-sm text-gray-500 hover:text-green-600 flex items-center gap-1 transition-colors">
              <Store className="w-4 h-4" /> {product.vendorName}
              {product.vendorIsTopRated && <Award className="w-3.5 h-3.5 text-amber-500" />}
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          
          {/* Rating Summary */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  className={`w-4 h-4 ${s <= Math.round(product.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-900">{product.rating?.toFixed(1) || '0.0'}</span>
            <span className="text-sm text-gray-500">({product.reviewCount || 0} reviews)</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {product.freshness && (
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                {product.freshness}
              </span>
            )}
            {product.originCountry && (
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5" /> Origin: {product.originCountry}
              </span>
            )}
            {product.availabilityDescription && (
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> {product.availabilityDescription}
              </span>
            )}
            {product.availabilityScope !== 'global' && (
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-red-50 text-red-700 rounded-lg flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> 
                {product.availabilityScope === 'country' 
                  ? `Available in: ${product.availableCountries?.join(', ') || 'Selected Countries'}` 
                  : `Available in: ${product.availableCities?.join(', ') || 'Selected Cities'}`}
              </span>
            )}
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {product.description}
          </p>

          {/* Investment Opportunity Banner */}
          {activeInvestment && (
            <div className="mb-8 p-5 bg-purple-50 border-2 border-purple-100 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-100">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-purple-900">Investment Opportunity</p>
                    <p className="text-xs text-purple-700">Fund this product and earn up to <span className="font-bold">{Math.max(...activeInvestment.tiers.map(t => t.returnPct))}% ROI</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Progress</p>
                  <p className="text-sm font-mono font-bold text-purple-900 bg-white px-2 py-1 rounded-lg border border-purple-100">
                    {Math.round((activeInvestment.currentFunding / activeInvestment.fundingGoal) * 100)}%
                  </p>
                </div>
              </div>
              
              <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-purple-600 transition-all duration-500" 
                  style={{ width: `${(activeInvestment.currentFunding / activeInvestment.fundingGoal) * 100}%` }}
                />
              </div>

              <button 
                onClick={() => navigate('/investor')}
                className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-5 h-5" /> View Investment Details
              </button>
            </div>
          )}

          {/* Group Purchase Banner */}
          {activeGroup ? (
            <div className="mb-8 p-5 bg-emerald-50 border-2 border-emerald-100 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Active Group Purchase</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-32 h-2 bg-emerald-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-600 transition-all duration-500" 
                          style={{ width: `${(activeGroup.currentMembers / activeGroup.targetMembers) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs font-bold text-emerald-700">{activeGroup.currentMembers}/{activeGroup.targetMembers} joined</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Ends In</p>
                  <p className="text-sm font-mono font-bold text-emerald-900 bg-white px-2 py-1 rounded-lg border border-emerald-100">{timeLeft}</p>
                </div>
              </div>

              {/* Group Members List */}
              <div className="mb-4">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Participants</p>
                <div className="flex flex-wrap gap-2">
                  {activeGroup.members?.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-2 py-1 rounded-full border border-emerald-100" title={member.customerName}>
                      {member.customerProfileImage ? (
                        <img src={member.customerProfileImage} alt={member.customerName} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-700 uppercase">
                          {member.customerName.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs font-medium text-emerald-900 max-w-[80px] truncate">{member.customerName}</span>
                    </div>
                  ))}
                  {Array.from({ length: activeGroup.targetMembers - activeGroup.currentMembers }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-8 h-8 rounded-full border-2 border-dashed border-emerald-200 flex items-center justify-center text-emerald-300" title="Waiting for member">
                      <Users className="w-4 h-4" />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-emerald-100">
                <div>
                  <p className="text-xs text-emerald-600 font-bold mb-1">Group Price</p>
                  <p className="text-2xl font-black text-emerald-600">{formatPrice(activeGroup.price, activeGroup.currency)}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: `Join my group purchase for ${product.name}!`,
                            text: `I'm buying ${product.name} on Halal Market. Join my group to get it for only ${formatPrice(activeGroup.price, activeGroup.currency)}!`,
                            url: window.location.href,
                          });
                        } catch (err) {
                          console.error('Error sharing:', err);
                        }
                      } else {
                        copyGroupLink();
                      }
                    }}
                    className="p-3 rounded-xl bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
                    title="Share Group"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={handleJoinGroup}
                    disabled={isOwnProduct || isMember}
                    className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-100 ${
                      (isOwnProduct || isMember) ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isMember ? 'Already Joined' : 'Join Group'}
                  </button>
                </div>
              </div>
            </div>
          ) : product.groupPrice ? (
            <div className="mb-8 p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Start a Group Buy</p>
                  <p className="text-xs text-blue-700">Get it for {formatPrice(product.groupPrice, product.currency)} with {product.targetMembers || 5} friends</p>
                </div>
              </div>
              <button 
                onClick={handleStartGroup}
                disabled={isOwnProduct}
                className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 ${
                  isOwnProduct ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Start Group
              </button>
            </div>
          ) : null}

          {/* ... Variations and other info ... */}
          {/* Variations */}
          {product.variationTypes && product.variationTypes.length > 0 && (
            <div className="space-y-6 mb-8">
              {product.variationTypes.map(vt => (
                <div key={`vt-${vt.name}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{vt.name}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {vt.options.map(option => (
                      <button
                        key={option}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, [vt.name]: option }))}
                        className={`px-4 py-2 text-sm border-2 rounded-xl transition-all ${
                          selectedOptions[vt.name] === option
                            ? 'border-green-600 bg-green-50 text-green-700 font-bold shadow-sm'
                            : 'border-gray-100 text-gray-600 hover:border-green-200 hover:bg-gray-50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 pt-6 mt-auto">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Price</p>
                <p className="text-4xl font-extrabold text-gray-900">{formatPrice(displayPrice, product.currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Availability</p>
                {displayStock > 0 ? (
                  <p className="text-green-600 font-medium flex items-center gap-1 justify-end">
                    <Check className="w-4 h-4" /> In Stock ({displayStock})
                  </p>
                ) : (
                  <p className="text-red-500 font-medium flex items-center gap-1 justify-end">
                    <AlertCircle className="w-4 h-4" /> Out of Stock
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {isOwnProduct && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 mb-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">You cannot purchase your own product.</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center border-2 border-gray-100 rounded-xl overflow-hidden w-full sm:w-auto">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 bg-white hover:bg-gray-50 text-gray-600 transition-colors border-r border-gray-100"
                    disabled={displayStock === 0}
                  >
                    -
                  </button>
                  <div className="w-12 text-center font-bold text-gray-900">
                    {quantity}
                  </div>
                  <button 
                    onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                    className="px-4 py-3 bg-white hover:bg-gray-50 text-gray-600 transition-colors border-l border-gray-100"
                    disabled={displayStock === 0 || quantity >= displayStock}
                  >
                    +
                  </button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  disabled={displayStock === 0 || isOwnProduct}
                  className={`flex-1 w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold transition-all ${
                    displayStock === 0 || isOwnProduct
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : added 
                        ? 'bg-green-500 text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 hover:shadow-emerald-300'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-5 h-5" /> Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" /> Add to Cart
                    </>
                  )}
                </button>
              </div>

              {/* Subscription Option */}
              <button 
                onClick={() => setShowSubModal(true)}
                disabled={isOwnProduct}
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold border-2 transition-all ${
                  isOwnProduct 
                    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <RefreshCw className="w-5 h-5" /> Subscribe & Save
              </button>
            </div>

            <button 
              onClick={() => {
                const targetPath = currentUser?.role === 'vendor' ? '/vendor' : '/customer';
                if (!currentUser) {
                  navigate('/login', { 
                    state: { 
                      from: { 
                        pathname: targetPath, 
                        state: { openChatWith: product.vendorId } 
                      } 
                    } 
                  });
                  return;
                }
                navigate(targetPath, { state: { openChatWith: product.vendorId } });
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold border-2 border-green-600 text-green-600 hover:bg-green-50 transition-all"
            >
              <MessageSquare className="w-5 h-5" /> Chat with Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Setup Subscription</h3>
                <p className="text-sm text-gray-500">Scheduled deliveries for {product.name}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">Delivery Frequency</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['daily', 'weekly', 'monthly'] as const).map(freq => (
                    <button
                      key={freq}
                      onClick={() => setSubFrequency(freq)}
                      className={`py-3 rounded-xl text-sm font-bold capitalize transition-all border-2 ${
                        subFrequency === freq ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-200'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-emerald-800">Quantity</span>
                  <span className="font-bold text-emerald-900">{quantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-800">Total per delivery</span>
                  <span className="text-lg font-extrabold text-emerald-600">{formatPrice(displayPrice * quantity, product.currency)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSubModal(false)}
                  className="flex-1 py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubscribe}
                  className="flex-[2] py-4 rounded-xl font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                >
                  Confirm Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Reviews Section */}
      <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <ReviewSection productId={product.id} />
      </div>

      {/* More from vendor section */}
      <div className="mt-12">
        <h3 className="text-xl font-bold text-gray-900 mb-6">More from {product.vendorName}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.filter(p => p.vendorId === product.vendorId && p.id !== product.id).slice(0, 4).map(p => (
            <Link key={p.id} to={`/product/${p.id}`} className="group">
              <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img src={p.imageUrl} alt={p.name} className="w-full h-32 object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                <div className="p-3">
                  <h4 className="font-medium text-gray-900 line-clamp-1 group-hover:text-green-600">{p.name}</h4>
                  <p className="text-green-700 font-bold mt-1">{formatPrice(p.price, p.currency)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
