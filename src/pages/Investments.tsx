import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { TrendingUp, DollarSign, Clock, CheckCircle, ChevronRight, Info, ShieldCheck, BarChart3, Users, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { InvestmentOpportunity, InvestmentTier } from '../types';
import { Link, useNavigate } from 'react-router-dom';

export default function Investments() {
  const { investmentOpportunities, currentUser, invest, formatPrice: contextFormatPrice } = useAppContext();
  const navigate = useNavigate();
  const [selectedOpportunity, setSelectedOpportunity] = useState<InvestmentOpportunity | null>(null);
  const [selectedTier, setSelectedTier] = useState<InvestmentTier | null>(null);
  const [isInvesting, setIsInvesting] = useState(false);
  const [investmentSuccess, setInvestmentSuccess] = useState(false);

  // Filter only active opportunities for public view
  const activeOpportunities = investmentOpportunities.filter(opp => opp.status === 'active');

  const handleInvest = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: '/investments' } });
      return;
    }

    if (currentUser.role !== 'investor') {
      alert('Only registered investors can participate. Please update your account role in the dashboard.');
      return;
    }

    if (!selectedOpportunity || !selectedTier) return;

    setIsInvesting(true);
    try {
      await invest(selectedOpportunity.id, selectedTier.id);
      setInvestmentSuccess(true);
      setTimeout(() => {
        setInvestmentSuccess(false);
        setSelectedOpportunity(null);
        setSelectedTier(null);
      }, 3000);
    } catch (error) {
      console.error('Investment failed:', error);
      alert('Investment failed. Please check your wallet balance.');
    } finally {
      setIsInvesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-emerald-900 text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-800/50 border border-emerald-700 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-widest mb-6">
                <ShieldCheck className="w-4 h-4" />
                Ethical Investing
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                Grow Your Wealth with <span className="text-emerald-400">Halal Investments</span>
              </h1>
              <p className="text-xl text-emerald-100/80 mb-8 leading-relaxed">
                Support local vendors and participate in the growth of the Halal marketplace. 
                Transparent, ethical, and community-driven investment opportunities.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#opportunities" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                  View Opportunities <ArrowRight className="w-5 h-5" />
                </a>
                <Link to="/help" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all backdrop-blur-sm border border-white/10">
                  How it Works
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                <TrendingUp className="w-8 h-8 text-emerald-400 mb-4" />
                <p className="text-3xl font-black mb-1">12%</p>
                <p className="text-xs text-emerald-200 uppercase font-bold tracking-wider">Avg. ROI</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                <Users className="w-8 h-8 text-blue-400 mb-4" />
                <p className="text-3xl font-black mb-1">500+</p>
                <p className="text-xs text-emerald-200 uppercase font-bold tracking-wider">Active Investors</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                <DollarSign className="w-8 h-8 text-amber-400 mb-4" />
                <p className="text-3xl font-black mb-1">$2M+</p>
                <p className="text-xs text-emerald-200 uppercase font-bold tracking-wider">Total Funded</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                <BarChart3 className="w-8 h-8 text-purple-400 mb-4" />
                <p className="text-3xl font-black mb-1">100%</p>
                <p className="text-xs text-emerald-200 uppercase font-bold tracking-wider">Halal Certified</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="opportunities">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Available Opportunities</h2>
            <p className="text-gray-500">Carefully vetted investment opportunities from our top vendors.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
              Filter by ROI
            </button>
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
              Sort by Newest
            </button>
          </div>
        </div>

        {activeOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeOpportunities.map((opp) => (
              <motion.div 
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={opp.imageUrl || 'https://picsum.photos/seed/investment/800/600'} 
                    alt={opp.productName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-emerald-700 shadow-sm">
                    {opp.profitSharingPct}% ROI
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{opp.productName}</h3>
                  <p className="text-sm text-gray-500 mb-6 line-clamp-2">{opp.description}</p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Funding Goal</span>
                      <span className="font-bold text-gray-900">{contextFormatPrice(opp.fundingGoal)}</span>
                    </div>
                    <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (opp.currentFunding / opp.fundingGoal) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-600 font-bold">{Math.round((opp.currentFunding / opp.fundingGoal) * 100)}% Funded</span>
                      <span className="text-gray-400">{contextFormatPrice(opp.fundingGoal - opp.currentFunding)} remaining</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 rounded-2xl">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Duration</p>
                      <p className="text-sm font-bold text-gray-900">{opp.durationMonths} Months</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-2xl">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Risk Level</p>
                      <p className="text-sm font-bold text-emerald-600 capitalize">{opp.riskLevel}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedOpportunity(opp)}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    Invest Now <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Opportunities</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              We're currently vetting new investment opportunities. Check back soon for new ways to grow your wealth.
            </p>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Why Invest with Halal Market?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">We provide a secure and ethical platform for investors to connect with verified vendors.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Shariah Compliant</h4>
              <p className="text-gray-500 leading-relaxed">All opportunities are strictly vetted to ensure they adhere to Islamic financial principles.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Transparent Returns</h4>
              <p className="text-gray-500 leading-relaxed">Real-time tracking of your investment performance and clear profit-sharing models.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Community Impact</h4>
              <p className="text-gray-500 leading-relaxed">Your capital helps small Halal businesses scale, creating jobs and strengthening the community.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Modal */}
      {selectedOpportunity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
          >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-900">{selectedOpportunity.productName}</h3>
                <p className="text-sm text-gray-500">Select an investment tier to proceed</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedOpportunity(null);
                  setSelectedTier(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-8">
              {investmentSuccess ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Investment Successful!</h4>
                  <p className="text-gray-500">Your investment has been processed. You can track it in your dashboard.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {selectedOpportunity.tiers.map((tier, idx) => (
                      <button
                        key={tier.id || `tier-${idx}`}
                        onClick={() => setSelectedTier(tier)}
                        className={`p-4 rounded-2xl border-2 transition-all text-left ${
                          selectedTier?.id === tier.id 
                            ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10' 
                            : 'border-gray-100 hover:border-emerald-200'
                        }`}
                      >
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">{tier.name}</p>
                        <p className="text-xl font-black text-gray-900 mb-2">{contextFormatPrice(tier.amount)}</p>
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> {tier.returnPct}% Return
                          </p>
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {selectedOpportunity.durationMonths} Months
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="bg-amber-50 rounded-2xl p-4 mb-8 flex gap-3">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      By investing, you agree to the profit-sharing terms of this opportunity. 
                      Investments carry risks; please review the full disclosure before proceeding.
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleInvest}
                    disabled={!selectedTier || isInvesting}
                    className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg ${
                      !selectedTier || isInvesting
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                    }`}
                  >
                    {isInvesting ? 'Processing...' : `Invest ${selectedTier ? contextFormatPrice(selectedTier.amount) : ''}`}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function XCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
  );
}
