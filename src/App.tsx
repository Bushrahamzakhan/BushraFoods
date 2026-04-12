import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import GroupCheckout from './pages/GroupCheckout';
import Login from './pages/Login';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import InvestorDashboard from './pages/InvestorDashboard';
import VendorsList from './pages/VendorsList';
import VendorShop from './pages/VendorShop';
import About from './pages/About';
import Help from './pages/Help';
import Privacy from './pages/Privacy';
import ErrorBoundary from './components/ErrorBoundary';
import { AnimatePresence } from 'motion/react';

function AppRoutes() {
  const { currentUser, isAuthReady } = useAppContext();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
          <p className="text-emerald-800 font-bold text-lg animate-pulse">Initializing HalalMarket...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/products" element={<Layout><Home /></Layout>} />
        <Route path="/product/:id" element={<Layout><ProductDetails /></Layout>} />
        <Route path="/cart" element={<Layout><Cart /></Layout>} />
        <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
        <Route path="/group-checkout/:id" element={<Layout><GroupCheckout /></Layout>} />
        <Route path="/login" element={<Login />} />
        <Route path="/vendors" element={<Layout><VendorsList /></Layout>} />
        <Route path="/vendor/:id" element={<Layout><VendorShop /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/help" element={<Layout><Help /></Layout>} />
        <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
        
        {/* Protected Routes */}
        <Route 
          path="/vendor" 
          element={
            currentUser?.role === 'vendor' 
              ? <Layout><VendorDashboard /></Layout> 
              : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/admin" 
          element={
            (currentUser?.role === 'admin' || 
             currentUser?.email === 'bushraanwar854@gmail.com' || 
             currentUser?.email === 'halalmarketonlineofficial@gmail.com')
              ? <Layout><AdminDashboard /></Layout> 
              : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/customer" 
          element={
            currentUser 
              ? <Layout><CustomerDashboard /></Layout> 
              : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/investor" 
          element={
            currentUser?.role === 'investor' 
              ? <Layout><InvestorDashboard /></Layout> 
              : <Navigate to="/login" replace />
          } 
        />
        
        {/* Legacy Dashboard Routes */}
        <Route path="/vendor-dashboard" element={<Navigate to="/vendor" replace />} />
        <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/customer-dashboard" element={<Navigate to="/customer" replace />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}
