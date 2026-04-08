import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  TrendingUp, Wallet, DollarSign, PieChart, 
  ArrowUpRight, ArrowDownRight, Clock, 
  ChevronRight, AlertCircle, BarChart3, 
  History, Download, Plus, Search, Filter
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { InvestmentOpportunity, InvestmentTier } from '../types';
import { ensureDate } from '../lib/utils';

export default function InvestorDashboard() {
  const location = useLocation();
  const { 
    currentUser, 
    investmentOpportunities, 
    myInvestments, 
    investorWallet, 
    formatPrice,
    invest,
    withdrawEarnings
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'my-investments' | 'wallet'>('overview');

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<InvestmentOpportunity | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const totalInvested = myInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalEarned = investorWallet?.totalEarned || 0;
  const currentBalance = investorWallet?.balance || 0;

  const handleInvest = async (opportunityId: string, tierId: string) => {
    try {
      await invest(opportunityId, tierId);
      setSelectedOpportunity(null);
      alert('Investment successful!');
    } catch (e) {
      alert('Investment failed. Please check your balance.');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setIsWithdrawing(true);
    try {
      await withdrawEarnings(amount);
      setWithdrawAmount('');
      alert('Withdrawal request submitted!');
    } catch (e) {
      alert('Withdrawal failed.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Investor Marketplace</h1>
          <p className="text-gray-500 mt-1">Manage your portfolio and explore new growth opportunities.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('wallet')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            <Wallet className="w-4 h-4" />
            Wallet: {formatPrice(currentBalance)}
          </button>
          <button 
            onClick={() => setActiveTab('opportunities')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
          >
            <Plus className="w-4 h-4" />
            New Investment
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +12.5%
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500">Total Invested</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(totalInvested)}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +8.2%
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500">Total Earnings</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(totalEarned)}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <PieChart className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active ROI</span>
          </div>
          <p className="text-sm font-medium text-gray-500">Average ROI</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">14.2%</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-8 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('opportunities')}
          className={`px-6 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'opportunities' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Opportunities
        </button>
        <button 
          onClick={() => setActiveTab('my-investments')}
          className={`px-6 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'my-investments' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          My Portfolio
        </button>
        <button 
          onClick={() => setActiveTab('wallet')}
          className={`px-6 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'wallet' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Wallet & Payouts
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Earnings Performance</h3>
                <select className="text-xs font-bold text-gray-500 bg-gray-50 border-none rounded-lg px-3 py-1 outline-none">
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                </select>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Oct', earnings: 120 },
                    { name: 'Nov', earnings: 210 },
                    { name: 'Dec', earnings: 180 },
                    { name: 'Jan', earnings: 350 },
                    { name: 'Feb', earnings: 420 },
                    { name: 'Mar', earnings: 580 },
                  ]}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Recent Investments</h3>
                <button onClick={() => setActiveTab('my-investments')} className="text-xs font-bold text-green-600 hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                {myInvestments.slice(0, 3).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{inv.productName}</h4>
                        <p className="text-xs text-gray-500">{inv.tierName} Tier • {ensureDate(inv.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">{formatPrice(inv.amount)}</p>
                      <p className="text-xs text-green-600 font-bold">+{inv.expectedReturnPct}% ROI</p>
                    </div>
                  </div>
                ))}
                {myInvestments.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">No investments yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-green-600 p-6 rounded-2xl text-white shadow-xl shadow-green-100 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Investment Tip</h3>
                <p className="text-green-50 text-sm leading-relaxed mb-4">
                  Diversifying your portfolio across multiple product categories can reduce risk and stabilize your monthly returns.
                </p>
                <button 
                  onClick={() => setActiveTab('opportunities')}
                  className="w-full py-2 bg-white text-green-600 rounded-xl font-bold text-sm hover:bg-green-50 transition-all"
                >
                  Explore Categories
                </button>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Portfolio Allocation</h3>
              <div className="space-y-4">
                {[
                  { label: 'Fresh Items', value: 45, color: 'bg-green-500' },
                  { label: 'Groceries', value: 30, color: 'bg-blue-500' },
                  { label: 'Electronics', value: 15, color: 'bg-purple-500' },
                  { label: 'Others', value: 10, color: 'bg-gray-300' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="text-gray-900">{item.value}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'opportunities' && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search opportunities..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <select className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 outline-none">
                <option>Highest ROI</option>
                <option>Lowest Risk</option>
                <option>Recently Added</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {investmentOpportunities.map(opp => (
              <div key={opp.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:border-green-200 transition-all">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                      opp.riskLevel === 'low' ? 'bg-green-50 text-green-600' :
                      opp.riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {opp.riskLevel} Risk
                    </span>
                    <span className="text-xs font-bold text-gray-400">Goal: {formatPrice(opp.fundingGoal)}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{opp.productName}</h3>
                  <p className="text-xs text-gray-500 mb-6">Profit Share: <span className="text-green-600 font-bold">{opp.profitSharingPct}%</span></p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-gray-500">Funding Progress</span>
                      <span className="text-gray-900">{Math.round((opp.currentFunding / opp.fundingGoal) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500" 
                        style={{ width: `${(opp.currentFunding / opp.fundingGoal) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Avg. ROI</p>
                      <p className="text-sm font-bold text-gray-900">12-18%</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Units</p>
                      <p className="text-sm font-bold text-gray-900">{opp.totalUnits}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedOpportunity(opp)}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
                  >
                    View Tiers & Invest
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'my-investments' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Active Portfolio</h3>
            <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-700">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tier</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ROI</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Earned</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myInvestments.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{inv.productName}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{ensureDate(inv.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">{inv.tierName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{formatPrice(inv.amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-green-600">{inv.expectedReturnPct}%</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{formatPrice(inv.earnedSoFar)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                        inv.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {myInvestments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                      No active investments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'wallet' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Wallet Balance</h3>
              <div className="p-6 bg-gray-900 rounded-2xl text-white mb-6">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Available for Withdrawal</p>
                <h2 className="text-3xl font-bold mb-6">{formatPrice(currentBalance)}</h2>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Total Earned: {formatPrice(totalEarned)}</span>
                </div>
              </div>
              
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Withdraw Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="number" 
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00" 
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) > currentBalance}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isWithdrawing ? 'Processing...' : 'Withdraw to Bank'}
                </button>
              </form>
            </div>

            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 mb-1">Important Notice</h4>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Withdrawals typically take 3-5 business days to process and appear in your bank account. Minimum withdrawal amount is $50.00.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Transaction History</h3>
                <button className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600">
                  <History className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {investorWallet?.transactions?.map(tx => (
                  <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.type === 'earning' ? 'bg-green-50 text-green-600' :
                        tx.type === 'investment' ? 'bg-blue-50 text-blue-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {tx.type === 'earning' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{tx.description}</h4>
                        <p className="text-xs text-gray-500">{ensureDate(tx.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatPrice(tx.amount)}
                    </p>
                  </div>
                ))}
                {(!investorWallet?.transactions || investorWallet.transactions.length === 0) && (
                  <div className="p-12 text-center text-gray-400 text-sm">
                    No transactions yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Investment Modal */}
      {selectedOpportunity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Investment Tiers</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedOpportunity.productName}</p>
              </div>
              <button 
                onClick={() => setSelectedOpportunity(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedOpportunity.tiers.map((tier) => (
                  <div key={tier.id} className="p-6 rounded-2xl border-2 border-gray-100 hover:border-green-500 transition-all flex flex-col">
                    <h4 className="font-bold text-gray-900 mb-1">{tier.name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Tier Option</p>
                    
                    <div className="mb-6">
                      <p className="text-2xl font-extrabold text-gray-900">{formatPrice(tier.amount)}</p>
                      <p className="text-xs text-green-600 font-bold mt-1">Expected ROI: {tier.returnPct}%</p>
                    </div>

                    <div className="space-y-3 mb-8 flex-grow">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Est. Earnings: {formatPrice(tier.estimatedEarnings)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Priority Support
                      </div>
                    </div>

                    <button 
                      onClick={() => handleInvest(selectedOpportunity.id, tier.id)}
                      className="w-full py-2 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition-all"
                    >
                      Invest Now
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-2xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-gray-400 shrink-0" />
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  By clicking "Invest Now", you agree to the terms of the investment and acknowledge that all investments involve risk. Returns are based on actual product sales performance and are not guaranteed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
  );
}
