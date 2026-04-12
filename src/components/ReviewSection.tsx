import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, User as UserIcon, MessageSquare, Send, CheckCircle, Filter, ChevronDown, Store, ShoppingCart } from 'lucide-react';
import { Review } from '../types';
import { useAppContext } from '../context/AppContext';
import { ensureDate } from '../lib/utils';

interface ReviewSectionProps {
  productId?: string;
  vendorId?: string;
}

type SortOption = 'newest' | 'highest' | 'lowest';

export default function ReviewSection({ productId, vendorId }: ReviewSectionProps) {
  const { currentUser, fetchProductReviews, fetchVendorReviews, submitReview, orders, products } = useAppContext();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const loadReviews = async () => {
    setIsLoading(true);
    let data: Review[] = [];
    if (productId) {
      data = await fetchProductReviews(productId);
    } else if (vendorId) {
      data = await fetchVendorReviews(vendorId);
    }
    setReviews(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, [productId, vendorId]);

  const isOwnProduct = productId && products.find(p => p.id === productId)?.vendorId === currentUser?.id;
  const isOwnStore = vendorId === currentUser?.id;
  const isVendor = isOwnProduct || isOwnStore;

  const userAlreadyReviewed = reviews.some(r => r.userId === currentUser?.id);
  
  const hasPurchased = productId ? orders.some(order => 
    order.status === 'delivered' && 
    order.items.some(item => item.productId === productId) &&
    order.customerId === currentUser?.id
  ) : true; // For vendor reviews, we might want to check any purchase from that vendor, but let's simplify for now.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (comment.length < 10) {
      setError('Comment must be at least 10 characters long');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await submitReview({ productId, vendorId, rating, comment });
      setComment('');
      setRating(5);
      await loadReviews();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const total = reviews.length;
    const counts = [0, 0, 0, 0, 0]; // 1 to 5 stars
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating - 1]++;
      }
    });
    const average = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    return { total, counts, average };
  }, [reviews]);

  const filteredAndSortedReviews = useMemo(() => {
    let result = reviews.filter(r => r.status === 'approved' || r.userId === currentUser?.id);
    
    if (filterRating !== null) {
      result = result.filter(r => r.rating === filterRating);
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return ensureDate(b.createdAt).getTime() - ensureDate(a.createdAt).getTime();
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0;
    });

    return result;
  }, [reviews, filterRating, sortBy]);

  return (
    <div className="mt-12 space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 border-b border-gray-100 pb-10">
        {/* Rating Summary */}
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Customer Reviews</h3>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-extrabold text-gray-900">{stats.average.toFixed(1)}</div>
              <div>
                <div className="flex items-center gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={`w-5 h-5 ${s <= Math.round(stats.average) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-500 font-medium">{stats.total} total reviews</div>
              </div>
            </div>
          </div>

          {/* Rating Bars */}
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map(star => {
              const count = stats.counts[star - 1];
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <button 
                  key={star}
                  onClick={() => setFilterRating(filterRating === star ? null : star)}
                  className={`flex items-center gap-3 w-full group transition-all p-1 rounded-lg hover:bg-gray-50 ${filterRating === star ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''}`}
                >
                  <span className="text-sm font-bold text-gray-600 w-3">{star}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <div className="flex-grow h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${filterRating === star ? 'bg-emerald-500' : 'bg-yellow-400'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-400 w-8 text-right">{percentage.toFixed(0)}%</span>
                </button>
              );
            })}
          </div>
          
          {filterRating && (
            <button 
              onClick={() => setFilterRating(null)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100"
            >
              <Filter className="w-3 h-3" /> Showing {filterRating} stars only • Clear
            </button>
          )}
        </div>

        {/* Review Form */}
        <div className="lg:col-span-2">
          {currentUser && !userAlreadyReviewed && !isVendor && hasPurchased ? (
            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm shadow-emerald-100/50">
              <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" /> Share Your Experience
              </h4>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-gray-700">How would you rate it?</label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        onMouseEnter={() => setRating(s)}
                        className="focus:outline-none transition-all hover:scale-110"
                      >
                        <Star 
                          className={`w-10 h-10 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                        />
                      </button>
                    ))}
                    <span className="ml-4 text-lg font-bold text-emerald-700">
                      {rating === 5 ? 'Excellent! 🌟' : rating === 4 ? 'Great! 👍' : rating === 3 ? 'Good 🙂' : rating === 2 ? 'Fair 😐' : 'Poor 😞'}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700">Your detailed review</label>
                    <span className={`text-xs font-bold ${comment.length < 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {comment.length} / 500 characters
                    </span>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 500))}
                    placeholder="Tell others about the quality, delivery, or service..."
                    required
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all resize-none h-36"
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || comment.length < 10}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200"
                >
                  {isSubmitting ? 'Submitting...' : <><Send className="w-5 h-5" /> Post Review</>}
                </button>
              </form>
            </div>
          ) : currentUser && isVendor ? (
            <div className="bg-amber-50 p-10 rounded-3xl border border-dashed border-amber-300 flex flex-col items-center justify-center text-center h-full">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Store className="w-8 h-8 text-amber-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Vendor Restriction</h4>
              <p className="text-gray-500 max-w-sm">
                As a vendor, you cannot leave reviews for your own products or store. This ensures a fair and transparent feedback system.
              </p>
            </div>
          ) : currentUser && !hasPurchased ? (
            <div className="bg-blue-50 p-10 rounded-3xl border border-dashed border-blue-300 flex flex-col items-center justify-center text-center h-full">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Verified Purchase Required</h4>
              <p className="text-gray-500 max-w-sm">
                Only customers who have purchased and received this product can leave a review. This helps us maintain the integrity of our feedback system.
              </p>
            </div>
          ) : currentUser && userAlreadyReviewed ? (
            <div className="bg-gray-50 p-10 rounded-3xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center h-full">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Review Already Submitted</h4>
              <p className="text-gray-500 max-w-sm">
                You've already shared your feedback for this {productId ? 'product' : 'vendor'}. We appreciate your contribution to our community!
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 p-10 rounded-3xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center h-full">
              <h4 className="text-xl font-bold text-gray-900 mb-2">Want to leave a review?</h4>
              <p className="text-gray-500 mb-6">Please sign in to share your experience with others.</p>
              <Link to="/login" className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h4 className="text-xl font-bold text-gray-900">
          {filterRating ? `${filterRating} Star Reviews` : 'All Reviews'}
          <span className="ml-2 text-sm font-normal text-gray-500">({filteredAndSortedReviews.length})</span>
        </h4>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">Sort by:</span>
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-10 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer shadow-sm"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="text-gray-500 mt-4 font-medium">Loading reviews...</p>
          </div>
        ) : filteredAndSortedReviews.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h5 className="text-lg font-bold text-gray-900 mb-1">No reviews found</h5>
            <p className="text-gray-500">
              {filterRating ? `There are no ${filterRating} star reviews yet.` : 'Be the first to review this!'}
            </p>
          </div>
        ) : (
          filteredAndSortedReviews.map((review) => (
            <div key={review.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    {review.userProfileImage ? (
                      <img 
                        src={review.userProfileImage} 
                        alt={review.userName} 
                        className="w-14 h-14 rounded-2xl object-cover ring-4 ring-emerald-50"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 ring-4 ring-emerald-50">
                        <UserIcon className="w-7 h-7" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                      <div className="bg-emerald-500 rounded-md p-0.5">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h5 className="font-bold text-gray-900 text-lg">{review.userName}</h5>
                      {productId && orders.some(o => o.status === 'delivered' && o.items.some(i => i.productId === productId) && o.customerId === review.userId) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-extrabold rounded-lg uppercase tracking-wider">
                          <CheckCircle className="w-3 h-3" /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-gray-400 ml-2">
                        {ensureDate(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 relative">
                <div className="absolute -top-4 -left-4 text-6xl text-emerald-50 font-serif select-none">“</div>
                <p className="text-gray-700 text-base leading-relaxed relative z-10 pl-2">
                  {review.comment}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
