import React from 'react';
import { ArrowLeft, Store, Users, Globe, ShieldCheck, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <button onClick={() => navigate(-1)} className="text-emerald-700 hover:text-emerald-900 mb-8 flex items-center gap-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 flex items-center justify-center gap-4">
          <Store className="w-12 h-12 text-emerald-600" /> About Halal Market Online
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          We are the world's leading marketplace for certified halal products, connecting ethical vendors with conscious consumers globally.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            Our mission is to make high-quality, certified halal products accessible to everyone, everywhere. We believe that ethical consumption should be simple, transparent, and rewarding.
          </p>
          <div className="flex items-center gap-4 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
            <Heart className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-800 font-medium">
              We prioritize community, integrity, and quality in everything we do.
            </p>
          </div>
        </div>
        <div className="relative rounded-3xl overflow-hidden shadow-xl">
          <img 
            src="https://picsum.photos/seed/halal/800/600" 
            alt="Halal Market Online Team" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
        {[
          { icon: <Globe className="w-6 h-6" />, title: 'Global Reach', description: 'Connecting vendors and customers across 50+ countries.' },
          { icon: <ShieldCheck className="w-6 h-6" />, title: '100% Certified', description: 'Every product is verified for halal compliance.' },
          { icon: <Users className="w-6 h-6" />, title: 'Community First', description: 'Supporting local businesses and ethical producers.' },
          { icon: <Store className="w-6 h-6" />, title: 'Vendor Support', description: 'Providing tools and platform for small businesses to thrive.' },
        ].map((item, index) => (
          <div key={index} className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
              {item.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-emerald-900 rounded-3xl p-12 text-white text-center">
        <h2 className="text-3xl font-bold mb-6">Join Our Community</h2>
        <p className="text-emerald-100 mb-10 max-w-2xl mx-auto text-lg">
          Whether you're a customer looking for authentic products or a vendor wanting to grow your business, we're here to help you succeed.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button onClick={() => navigate('/login?mode=signup')} className="px-10 py-4 bg-green-500 hover:bg-green-600 rounded-2xl font-bold transition-all shadow-lg hover:shadow-green-500/20">
            Start Shopping
          </button>
          <button onClick={() => navigate('/login?mode=signup&role=vendor')} className="px-10 py-4 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-bold transition-all shadow-lg">
            Become a Vendor
          </button>
        </div>
      </div>
    </div>
  );
}
