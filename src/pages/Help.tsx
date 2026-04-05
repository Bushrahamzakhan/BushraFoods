import React from 'react';
import { ArrowLeft, HelpCircle, Package, Truck, CreditCard, User, Shield, MessageSquare, Search } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Help() {
  const navigate = useNavigate();

  const helpTopics = [
    { icon: <Package className="w-6 h-6" />, title: 'Your Orders', description: 'Track packages, edit or cancel orders' },
    { icon: <Truck className="w-6 h-6" />, title: 'Returns & Refunds', description: 'Return or replace items, check refund status' },
    { icon: <CreditCard className="w-6 h-6" />, title: 'Payment Settings', description: 'Add or edit payment methods, manage subscriptions' },
    { icon: <User className="w-6 h-6" />, title: 'Account Settings', description: 'Change email or password, update profile' },
    { icon: <Shield className="w-6 h-6" />, title: 'Privacy & Security', description: 'Manage your data and security settings' },
    { icon: <MessageSquare className="w-6 h-6" />, title: 'Contact Us', description: 'Get help via chat or email' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <button onClick={() => navigate(-1)} className="text-emerald-700 hover:text-emerald-900 mb-8 flex items-center gap-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <HelpCircle className="w-10 h-10 text-emerald-600" /> How can we help you?
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions, track your orders, and manage your account.
        </p>
      </div>

      <div className="relative max-w-2xl mx-auto mb-16">
        <input 
          type="text" 
          placeholder="Search help articles..." 
          className="w-full px-12 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {helpTopics.map((topic, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              {topic.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{topic.title}</h3>
            <p className="text-sm text-gray-500">{topic.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-emerald-900 rounded-3xl p-10 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
        <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
          Our customer service team is available 24/7 to assist you with any questions or concerns.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/customer" state={{ activeTab: 'messages' }} className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-bold transition-colors flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Start a Chat
          </Link>
          <button className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">
            Email Support
          </button>
        </div>
      </div>
    </div>
  );
}
