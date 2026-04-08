import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, Store, User as UserIcon, LogOut, Menu, X, Package, Search, MapPin, ChevronDown, Globe, Bell, MessageSquare, BarChart2, TrendingUp } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SUPPORTED_CURRENCIES } from '../types';
import { ensureDate } from '../lib/utils';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const { currentUser, logout, cart, isAuthReady, preferredCurrency, setPreferredCurrency, notifications, markNotificationAsRead, conversations } = useAppContext();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const currentCurrency = SUPPORTED_CURRENCIES.find(c => c.code === preferredCurrency) || SUPPORTED_CURRENCIES[0];

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const unreadMessagesCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Main Header */}
      <header className="bg-emerald-950 text-white sticky top-0 z-50 border-b border-emerald-900/50 backdrop-blur-md bg-emerald-950/95">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 mr-2">
              <Link to="/" className="flex items-center gap-2 hover:bg-white/5 p-2 rounded-xl transition-all group">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col leading-tight hidden sm:flex">
                  <span className="font-bold text-lg lg:text-xl tracking-tight text-white">Halal Market</span>
                  <span className="text-[10px] text-emerald-400 tracking-widest uppercase font-black">Online</span>
                </div>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 min-w-0 max-w-3xl mx-2 lg:mx-4">
              <form onSubmit={handleSearch} className="flex w-full rounded-xl overflow-hidden ring-1 ring-emerald-800 focus-within:ring-2 focus-within:ring-emerald-400 bg-emerald-900/30">
                <select className="bg-emerald-900/50 text-emerald-100 text-sm px-2 lg:px-3 py-2 border-r border-emerald-800 outline-none cursor-pointer hover:bg-emerald-800 transition-colors hidden lg:block">
                  <option>All Categories</option>
                  <option>Fresh Meat</option>
                  <option>Groceries</option>
                  <option>Bakery</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Search for Halal products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow px-4 py-2 text-white outline-none placeholder:text-emerald-400/50 bg-transparent"
                />
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 px-4 lg:px-5 py-2 transition-colors flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5 text-white" />
                </button>
              </form>
            </div>

            {/* Right Navigation */}
            <nav className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0 flex-nowrap">
              {!isAuthReady ? (
                <div className="text-sm text-gray-300">Loading...</div>
              ) : currentUser ? (
                <div className="relative group">
                  <div className="flex flex-col leading-tight hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm cursor-pointer transition-all">
                    <span className="text-xs text-gray-300 hidden lg:block">Hello, {currentUser.name.split(' ')[0]}</span>
                    <span className="text-sm font-bold text-white flex items-center gap-1 whitespace-nowrap">
                      Account <ChevronDown className="w-3 h-3 text-gray-400" />
                    </span>
                  </div>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-md shadow-xl border border-gray-200 hidden group-hover:block text-black py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-bold">Your Account</p>
                    </div>
                    <Link to="/customer" className="block px-4 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700">Your Orders</Link>
                    <Link to="/investor" className="block px-4 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700 font-bold text-emerald-600">Investor Dashboard</Link>
                    <Link to="/customer" state={{ activeTab: 'messages' }} className="block px-4 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700 flex justify-between items-center">
                      Messages
                      {unreadMessagesCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {unreadMessagesCount}
                        </span>
                      )}
                    </Link>
                    {currentUser.role === 'vendor' && (
                      <Link to="/vendor" className="block px-4 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700">Vendor Dashboard</Link>
                    )}
                    {(currentUser.role === 'admin' || currentUser.email === 'bushraanwar854@gmail.com') && (
                      <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700">Admin Dashboard</Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700">
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <Link to="/login" className="flex flex-col leading-tight hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm transition-all">
                    <span className="text-xs text-gray-300 hidden lg:block">Hello, sign in</span>
                    <span className="text-sm font-bold text-white flex items-center gap-1 whitespace-nowrap">
                      Account <ChevronDown className="w-3 h-3 text-gray-400" />
                    </span>
                  </Link>
                  
                  {/* Dropdown Menu for Guests */}
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-md shadow-xl border border-gray-200 hidden group-hover:block text-black py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 flex flex-col items-center">
                      <Link to="/login" className="w-full bg-green-600 text-white text-center py-2 rounded-lg font-bold hover:bg-green-700 transition-colors mb-2">
                        Sign In
                      </Link>
                      <p className="text-xs text-gray-500">
                        New customer? <Link to="/login?mode=signup" className="text-green-600 hover:underline">Start here.</Link>
                      </p>
                    </div>
                    <div className="py-2">
                      <p className="px-4 py-1 text-xs font-bold text-gray-900 uppercase tracking-wider">For Vendors</p>
                      <Link to="/login?role=vendor" className="block px-4 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700">
                        Sign in as Vendor
                      </Link>
                      <Link to="/login?mode=signup&role=vendor" className="block px-4 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700">
                        Register as Vendor
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              {currentUser && (
                <Link 
                  to={currentUser.role === 'vendor' ? "/vendor" : "/customer"} 
                  state={{ activeTab: 'messages' }}
                  className="flex items-center gap-1 hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm transition-all relative flex-shrink-0"
                >
                  <div className="relative">
                    <MessageSquare className="w-6 h-6 text-emerald-200" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border border-emerald-900">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:block text-sm font-bold text-white ml-1">Messages</span>
                </Link>
              )}

              {/* Cart */}
              <Link to="/cart" className="flex items-end hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm transition-all relative flex-shrink-0">
                <div className="relative flex items-center">
                  <ShoppingCart className="w-8 h-8 text-white" />
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 text-green-400 font-bold text-sm">
                    {cartItemsCount}
                  </span>
                </div>
                <span className="hidden lg:block text-sm font-bold text-white mb-1 ml-1">Cart</span>
              </Link>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1">
                {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="flex w-full rounded-xl overflow-hidden ring-1 ring-emerald-800 focus-within:ring-2 focus-within:ring-emerald-400 bg-emerald-900/30">
              <input 
                type="text" 
                placeholder="Search for Halal products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow px-4 py-2 text-white outline-none text-sm placeholder:text-emerald-400/50 bg-transparent"
              />
              <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 px-4 py-2 transition-colors flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </button>
            </form>
          </div>
        </div>

        {/* Secondary Navigation Bar */}
        <div className="bg-emerald-800 text-white text-sm relative">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-10">
            <button className="flex items-center gap-1 font-bold hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm mr-4 flex-shrink-0">
              <Menu className="w-5 h-5" /> All
            </button>
            
            <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar flex-grow">
              <div className="flex items-center gap-1 hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm cursor-pointer transition-all flex-shrink-0">
                <MapPin className="w-4 h-4 text-gray-300" />
                <span className="text-xs font-bold text-white whitespace-nowrap">Deliver to city</span>
              </div>
              
              <Link to="/vendors" className="hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm font-bold text-green-400 flex-shrink-0">Our Vendors</Link>
              <Link to="/investor" state={{ activeTab: 'opportunities' }} className="hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm flex-shrink-0 text-amber-400 font-bold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Investment Opportunities
              </Link>
              <Link to="/" className="hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm flex-shrink-0">Today's Deals</Link>
              <Link to="/" className="hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm flex-shrink-0 hidden sm:block">Halal Fresh</Link>
              <Link to="/help" className="hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm flex-shrink-0 hidden md:block">Customer Service</Link>
            </div>

            {/* Secondary Right Nav (Moved from Top Bar) */}
            <div className="flex items-center gap-2 ml-auto pl-4 border-l border-emerald-700 h-6">
              {/* Returns & Orders */}
              <Link to="/customer" className="flex items-center gap-1 hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm transition-all flex-shrink-0">
                <Package className="w-4 h-4 text-emerald-200" />
                <span className="text-xs font-bold text-white whitespace-nowrap hidden sm:block">Orders</span>
              </Link>

              {/* Notifications */}
              {currentUser && (
                <div className="relative group/notif">
                  <div className="flex items-center gap-1 hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm cursor-pointer transition-all relative flex-shrink-0">
                    <Bell className="w-4 h-4 text-emerald-200" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border border-emerald-800">
                        {unreadCount}
                      </span>
                    )}
                    <span className="text-xs font-bold text-white hidden sm:block">Alerts</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </div>

                  <div className="absolute right-0 top-full mt-0 w-80 bg-white rounded-md shadow-xl border border-gray-200 hidden group-hover/notif:block text-black py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <p className="font-bold">Notifications</p>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} NEW
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div 
                            key={notification.id} 
                            onClick={() => markNotificationAsRead(notification.id)}
                            className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-emerald-50/30' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-0.5">
                              <h4 className={`text-xs font-bold ${!notification.isRead ? 'text-emerald-900' : 'text-gray-900'}`}>
                                {notification.title}
                              </h4>
                              <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">
                                {ensureDate(notification.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-600 line-clamp-1">{notification.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Currency Selector */}
              <div className="relative group">
                <div className="flex items-center gap-1 hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm cursor-pointer transition-all flex-shrink-0">
                  <Globe className="w-4 h-4 text-emerald-200" />
                  <span className="text-xs font-bold text-white uppercase">{currentCurrency.code === 'original' ? 'Auto' : currentCurrency.code}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </div>
                
                <div className="absolute right-0 top-full mt-0 w-48 bg-white rounded-md shadow-xl border border-gray-200 hidden group-hover:block text-black py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-bold text-xs text-gray-500 uppercase tracking-wider">Currency</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => setPreferredCurrency(currency.code)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 flex items-center justify-between ${
                          preferredCurrency === currency.code ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-gray-700'
                        }`}
                      >
                        <span>{currency.name}</span>
                        {currency.code !== 'original' && <span className="text-xs text-gray-400">{currency.symbol}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-emerald-800 pb-4 px-4 border-t border-emerald-700">
            <div className="flex flex-col gap-2 mt-2">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-white hover:text-green-400">Shop All</Link>
              
              {currentUser ? (
                <>
                  <Link 
                    to={currentUser.role === 'vendor' ? "/vendor" : "/customer"} 
                    state={{ activeTab: 'messages' }}
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="block py-2 text-white hover:text-green-400 flex justify-between items-center"
                  >
                    Messages
                    {unreadMessagesCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </Link>
                  {currentUser.role === 'vendor' ? (
                    <Link to="/vendor" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-white hover:text-green-400">Vendor Dashboard</Link>
                  ) : (
                    <Link to="/customer" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-white hover:text-green-400">Your Orders</Link>
                  )}
                  <Link to="/investor" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-green-400 font-bold">Investor Dashboard</Link>
                  <div className="border-t border-emerald-600 pt-4 mt-2">
                    <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="flex items-center gap-2 text-emerald-200 hover:text-white">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 border-t border-emerald-600 pt-4 mt-2">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-white hover:text-green-400">Sign In</Link>
                  <Link to="/login?mode=signup" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-green-400">Create Account</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow w-full mx-auto pb-8">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="bg-emerald-900 text-white pt-12 pb-8">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold mb-4 text-lg">Get to Know Us</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/about" className="hover:underline">About Halal Market</Link></li>
              <li><Link to="/help" className="hover:underline">Careers</Link></li>
              <li><Link to="/help" className="hover:underline">Blog</Link></li>
              <li><Link to="/help" className="hover:underline">Investor Relations</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-lg">Make Money with Us</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/login?mode=signup&role=vendor" className="hover:underline">Sell products on Halal Market</Link></li>
              <li><Link to="/login?mode=signup&role=vendor" className="hover:underline">Sell on Halal Business</Link></li>
              <li><Link to="/login?mode=signup&role=vendor" className="hover:underline">Become an Affiliate</Link></li>
              <li><Link to="/login?mode=signup&role=vendor" className="hover:underline">Advertise Your Products</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-lg">Halal Payment Products</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/help" className="hover:underline">Halal Market Rewards Visa</Link></li>
              <li><Link to="/help" className="hover:underline">Halal.com Store Card</Link></li>
              <li><Link to="/help" className="hover:underline">Shop with Points</Link></li>
              <li><Link to="/help" className="hover:underline">Reload Your Balance</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-lg text-emerald-200">Let Us Help You</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to={currentUser ? (currentUser.role === 'vendor' ? "/vendor" : "/customer") : "/login"} className="hover:underline">Your Account</Link></li>
              <li><Link to={currentUser ? (currentUser.role === 'vendor' ? "/vendor" : "/customer") : "/login"} className="hover:underline">Your Orders</Link></li>
              {(currentUser?.role === 'admin' || currentUser?.email === 'bushraanwar854@gmail.com') && (
                <li><Link to="/admin" className="hover:underline text-emerald-400 font-bold">Admin Panel</Link></li>
              )}
              <li><Link to="/help" className="hover:underline">Shipping Rates & Policies</Link></li>
              <li><Link to="/help" className="hover:underline">Returns & Replacements</Link></li>
              <li><Link to="/help" className="hover:underline">Help</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-emerald-800 flex flex-col items-center">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <Store className="h-8 w-8 text-green-400" />
            <span className="font-bold text-xl tracking-tight text-white">Halal Market Online</span>
          </Link>
          <div className="flex gap-4 text-sm text-gray-300">
            <Link to="/privacy" className="hover:underline">Conditions of Use</Link>
            <Link to="/privacy" className="hover:underline">Privacy Notice</Link>
            <Link to="/privacy" className="hover:underline">Consumer Health Data Privacy Disclosure</Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            &copy; {ensureDate(new Date()).getFullYear()}, HalalMarketOnline.com, Inc. or its affiliates
          </p>
        </div>
      </footer>
    </div>
  );
}
