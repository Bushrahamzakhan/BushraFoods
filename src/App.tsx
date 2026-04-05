/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import CustomerDashboard from './pages/CustomerDashboard';
import VendorDashboard from './pages/VendorDashboard';
import InvestorDashboard from './pages/InvestorDashboard';
import VendorsList from './pages/VendorsList';
import VendorShop from './pages/VendorShop';
import AdminDashboard from './pages/AdminDashboard';
import GroupCheckout from './pages/GroupCheckout';
import About from './pages/About';
import Help from './pages/Help';
import Privacy from './pages/Privacy';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="login" element={<Login />} />
            <Route path="customer" element={<CustomerDashboard />} />
            <Route path="vendor" element={<VendorDashboard />} />
            <Route path="investor" element={<InvestorDashboard />} />
            <Route path="vendors" element={<VendorsList />} />
            <Route path="vendor/:id" element={<VendorShop />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="group-checkout/:id" element={<GroupCheckout />} />
            <Route path="about" element={<About />} />
            <Route path="help" element={<Help />} />
            <Route path="privacy" element={<Privacy />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}
