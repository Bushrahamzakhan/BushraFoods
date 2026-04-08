import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import Database from 'better-sqlite3';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-testing';
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'HALAL_ADMIN_2026'; // The secret key for admin registration
const PORT = 3000;

// Initialize Database
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'database.sqlite');
let db: Database.Database;

try {
  db = new Database(dbPath);
  console.log(`Database initialized at ${dbPath}`);
} catch (error) {
  console.error("Failed to initialize file-based database, falling back to in-memory:", error);
  db = new Database(':memory:');
}

// Create tables
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      status TEXT DEFAULT 'active',
      storeName TEXT,
      storeDescription TEXT,
      profileImage TEXT,
      coverImage TEXT,
      lastShippingDetails TEXT,
      wishlist TEXT DEFAULT '[]',
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      vendorId TEXT,
      vendorName TEXT,
      name TEXT,
      description TEXT,
      price REAL,
      currency TEXT DEFAULT 'USD',
      category TEXT,
      imageUrl TEXT,
      stock INTEGER,
      tags TEXT,
      isHalalCertified INTEGER,
      availableCountries TEXT,
      availableCities TEXT,
      variationTypes TEXT,
      variationCombinations TEXT,
      originCountry TEXT,
      freshness TEXT,
      groupPrice REAL,
      targetMembers INTEGER,
      availabilityScope TEXT DEFAULT 'global',
      availabilityDescription TEXT
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      customerId TEXT,
      productId TEXT,
      productName TEXT,
      vendorId TEXT,
      vendorName TEXT,
      frequency TEXT, -- 'daily', 'weekly', 'monthly'
      quantity INTEGER,
      price REAL,
      currency TEXT,
      status TEXT DEFAULT 'active', -- 'active', 'paused', 'cancelled'
      nextDelivery TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS group_purchases (
      id TEXT PRIMARY KEY,
      productId TEXT,
      productName TEXT,
      vendorId TEXT,
      vendorName TEXT,
      targetMembers INTEGER DEFAULT 5,
      currentMembers INTEGER DEFAULT 0,
      price REAL,
      currency TEXT,
      expiresAt TEXT,
      status TEXT DEFAULT 'open', -- 'open', 'completed', 'expired'
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY,
      groupPurchaseId TEXT,
      customerId TEXT,
      customerName TEXT,
      customerProfileImage TEXT,
      joinedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerId TEXT,
      customerName TEXT,
      vendorId TEXT,
      vendorName TEXT,
      status TEXT,
      totalAmount REAL,
      createdAt TEXT,
      shippingDetails TEXT,
      paymentMethod TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT,
      title TEXT,
      message TEXT,
      type TEXT,
      orderId TEXT,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      orderId TEXT,
      productId TEXT,
      productName TEXT,
      price REAL,
      currency TEXT DEFAULT 'USD',
      quantity INTEGER,
      selectedVariations TEXT,
      imageUrl TEXT
    );

    CREATE TABLE IF NOT EXISTS order_history (
      id TEXT PRIMARY KEY,
      orderId TEXT,
      status TEXT,
      description TEXT,
      timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS investment_opportunities (
      id TEXT PRIMARY KEY,
      productId TEXT,
      productName TEXT,
      vendorId TEXT,
      fundingGoal REAL,
      currentFunding REAL DEFAULT 0,
      totalUnits INTEGER,
      profitSharingPct REAL,
      riskLevel TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'active',
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS investment_tiers (
      id TEXT PRIMARY KEY,
      opportunityId TEXT,
      name TEXT,
      amount REAL,
      returnPct REAL,
      estimatedEarnings REAL
    );

    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      opportunityId TEXT,
      productId TEXT,
      productName TEXT,
      investorId TEXT,
      tierId TEXT,
      tierName TEXT,
      amount REAL,
      expectedReturnPct REAL,
      earnedSoFar REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS investor_wallets (
      userId TEXT PRIMARY KEY,
      balance REAL DEFAULT 0,
      totalEarned REAL DEFAULT 0,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      userId TEXT,
      amount REAL,
      type TEXT, -- 'investment', 'earning', 'withdrawal', 'deposit'
      description TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS product_sales_stats (
      productId TEXT,
      month TEXT, -- 'YYYY-MM'
      unitsSold INTEGER DEFAULT 0,
      revenue REAL DEFAULT 0,
      PRIMARY KEY (productId, month)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderId TEXT,
      receiverId TEXT,
      content TEXT,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      userId TEXT,
      userName TEXT,
      userProfileImage TEXT,
      productId TEXT,
      vendorId TEXT,
      rating INTEGER,
      comment TEXT,
      isVerifiedPurchase INTEGER DEFAULT 0,
      createdAt TEXT
    );
  `);
} catch (error) {
  console.error("Failed to create tables:", error);
}

// Migration: Ensure all required columns exist in the tables
try {
  const requiredColumns = [
    { table: 'products', name: 'currency', type: 'TEXT DEFAULT \'USD\'' },
    { table: 'products', name: 'tags', type: 'TEXT' },
    { table: 'products', name: 'isHalalCertified', type: 'INTEGER DEFAULT 1' },
    { table: 'products', name: 'availableCountries', type: 'TEXT' },
    { table: 'products', name: 'availableCities', type: 'TEXT' },
    { table: 'products', name: 'variationTypes', type: 'TEXT' },
    { table: 'products', name: 'variationCombinations', type: 'TEXT' },
    { table: 'users', name: 'status', type: 'TEXT DEFAULT \'active\'' },
    { table: 'users', name: 'wishlist', type: 'TEXT DEFAULT \'[]\'' },
    { table: 'users', name: 'createdAt', type: 'TEXT' },
    { table: 'users', name: 'storeName', type: 'TEXT' },
    { table: 'users', name: 'storeDescription', type: 'TEXT' },
    { table: 'users', name: 'profileImage', type: 'TEXT' },
    { table: 'users', name: 'coverImage', type: 'TEXT' },
    { table: 'users', name: 'lastShippingDetails', type: 'TEXT' },
    { table: 'orders', name: 'shippingDetails', type: 'TEXT' },
    { table: 'orders', name: 'paymentMethod', type: 'TEXT' },
    { table: 'orders', name: 'currency', type: 'TEXT DEFAULT \'USD\'' },
    { table: 'reviews', name: 'isVerifiedPurchase', type: 'INTEGER DEFAULT 0' },
    { table: 'order_items', name: 'currency', type: 'TEXT DEFAULT \'USD\'' },
    { table: 'products', name: 'originCountry', type: 'TEXT' },
    { table: 'products', name: 'freshness', type: 'TEXT' },
    { table: 'products', name: 'groupPrice', type: 'REAL' },
    { table: 'products', name: 'targetMembers', type: 'INTEGER' },
    { table: 'products', name: 'availabilityScope', type: 'TEXT DEFAULT \'global\'' },
    { table: 'products', name: 'availabilityDescription', type: 'TEXT' },
    { table: 'users', name: 'isTopRated', type: 'INTEGER DEFAULT 0' },
    { table: 'group_members', name: 'customerProfileImage', type: 'TEXT' }
  ];

  for (const col of requiredColumns) {
    const tableInfo = db.prepare(`PRAGMA table_info(${col.table})`).all() as any[];
    const columns = tableInfo.map(c => c.name);
    if (!columns.includes(col.name)) {
      db.exec(`ALTER TABLE ${col.table} ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Migration: Added '${col.name}' column to '${col.table}' table.`);
    }
  }
  
  // Ensure all existing vendors are active for testing
  db.prepare("UPDATE users SET status = 'active' WHERE role = 'vendor' AND (status = 'pending' OR status IS NULL)").run();

  // Seed Admin User
  const adminEmail = 'hamza.mec.edu@gmail.com';
  const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    const adminId = uuidv4();
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const createdAt = new Date().toISOString();
    db.prepare('INSERT INTO users (id, name, email, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(adminId, 'Platform Admin', adminEmail, adminPassword, 'admin', 'active', createdAt);
    console.log(`Admin user created: ${adminEmail} / admin123`);
  } else if ((existingAdmin as any).role !== 'admin') {
    db.prepare('UPDATE users SET role = \'admin\' WHERE email = ?').run(adminEmail);
    console.log(`User ${adminEmail} promoted to admin.`);
  }
} catch (error) {
  console.error("Migration error:", error);
}

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  app.use(cors());
  app.use((req, res, next) => {
    // Only log API requests to avoid cluttering logs with static asset requests
    if (req.url.startsWith('/api/')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    }
    next();
  });
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Error handling for malformed JSON
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
  });

  // Health check and ping routes
  app.get('/ping', (req, res) => res.send('pong'));
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
  });

  // Redirect common branding paths to root
  app.get('/halalmarketonline', (req, res) => res.redirect('/'));
  app.get('/halal-market', (req, res) => res.redirect('/'));

  // Middleware to authenticate JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API ROUTES ---

  // Auth
  app.post('/api/account/register', (req, res) => {
    console.log('POST /api/account/register', req.body?.email);
    const { name, email, password, role, storeName, accessKey } = req.body;
    try {
      // Check admin secret if role is admin
      if (role === 'admin') {
        if (accessKey !== ADMIN_SECRET_KEY) {
          return res.status(403).json({ error: 'Invalid admin access key. You are not authorized to register as an administrator.' });
        }
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      const status = role === 'vendor' ? 'active' : 'active'; // Changed to active for testing as requested by user context
      
      const stmt = db.prepare('INSERT INTO users (id, name, email, password, role, status, storeName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      stmt.run(id, name, email, hashedPassword, role, status, storeName || null, createdAt);
      
      const token = jwt.sign({ id, email, role }, JWT_SECRET);
      res.json({ token, user: { id, name, email, role, status, storeName, createdAt } });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.post('/api/account/login', (req, res) => {
    console.log('POST /api/account/login', req.body?.email);
    const { email, password } = req.body;
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as any;

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get('/api/account/me', authenticateToken, (req: any, res) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(req.user.id) as any;
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      if (userWithoutPassword.lastShippingDetails) {
        userWithoutPassword.lastShippingDetails = JSON.parse(userWithoutPassword.lastShippingDetails);
      }
      if (userWithoutPassword.wishlist) {
        userWithoutPassword.wishlist = JSON.parse(userWithoutPassword.wishlist);
      }
      res.json({ user: userWithoutPassword });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  // Users
  app.get('/api/users/vendors', (req, res) => {
    const stmt = db.prepare(`
      SELECT 
        u.id, u.name, u.email, u.role, u.status, u.storeName, u.storeDescription, u.profileImage, u.coverImage, u.createdAt,
        (SELECT AVG(rating) FROM reviews WHERE vendorId = u.id) as rating,
        (SELECT COUNT(*) FROM reviews WHERE vendorId = u.id) as reviewCount
      FROM users u 
      WHERE u.role = 'vendor' AND (u.status = 'active' OR u.status = 'pending' OR u.status IS NULL)
    `);
    const vendors = stmt.all().map((v: any) => ({
      ...v,
      rating: v.rating || 0,
      reviewCount: v.reviewCount || 0
    }));
    res.json({ vendors });
  });

  app.put('/api/users/wishlist', authenticateToken, (req: any, res) => {
    const { productId } = req.body;
    const user = db.prepare('SELECT wishlist FROM users WHERE id = ?').get(req.user.id) as any;
    let wishlist = JSON.parse(user.wishlist || '[]');
    
    if (wishlist.includes(productId)) {
      wishlist = wishlist.filter((id: string) => id !== productId);
    } else {
      wishlist.push(productId);
    }
    
    db.prepare('UPDATE users SET wishlist = ? WHERE id = ?').run(JSON.stringify(wishlist), req.user.id);
    res.json({ wishlist });
  });

  app.put('/api/users/profile', authenticateToken, (req: any, res) => {
    const { name, email, storeName, storeDescription, profileImage, coverImage } = req.body;
    const stmt = db.prepare('UPDATE users SET name = ?, email = ?, storeName = ?, storeDescription = ?, profileImage = ?, coverImage = ? WHERE id = ?');
    stmt.run(name || '', email || '', storeName || null, storeDescription || null, profileImage || null, coverImage || null, req.user.id);
    res.json({ success: true });
    io.emit('vendors_updated');
  });

  // Admin Routes
  app.get('/api/admin/stats', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    
    const totalSales = db.prepare('SELECT SUM(totalAmount) as total FROM orders WHERE status = ?').get('delivered') as any;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('customer') as any;
    const totalVendors = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('vendor') as any;
    const pendingVendors = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ?').get('vendor', 'pending') as any;
    
    // Commission is 5% of delivered sales
    const commissionRate = 0.05;
    const totalRevenue = totalSales.total || 0;
    const totalCommission = totalRevenue * commissionRate;
    
    res.json({
      totalRevenue,
      totalCommission,
      totalCustomers: totalUsers.count,
      totalVendors: totalVendors.count,
      pendingVendors: pendingVendors.count
    });
  });

  app.get('/api/admin/vendors', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const vendors = db.prepare('SELECT id, name, email, status, storeName, createdAt FROM users WHERE role = ?').all('vendor');
    res.json(vendors);
  });

  app.put('/api/admin/vendors/:id/status', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { status } = req.body;
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
    
    // Notify vendor
    const now = new Date().toISOString();
    db.prepare('INSERT INTO notifications (id, userId, title, message, type, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), req.params.id, 'Account Status Updated', `Your vendor account status has been updated to ${status}.`, 'account_update', now);
    
    res.json({ success: true });
    io.emit('notifications_updated');
    io.emit('vendors_updated');
  });

  app.get('/api/admin/products', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const products = db.prepare('SELECT * FROM products').all();
    res.json(products.map((p: any) => ({
      ...p,
      tags: JSON.parse(p.tags || '[]'),
      availableCountries: JSON.parse(p.availableCountries || '[]'),
      availableCities: JSON.parse(p.availableCities || '[]'),
      variationTypes: JSON.parse(p.variationTypes || '[]'),
      variationCombinations: JSON.parse(p.variationCombinations || '[]')
    })));
  });

  app.get('/api/admin/orders', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const orders = db.prepare('SELECT * FROM orders').all();
    res.json(orders.map((o: any) => ({
      ...o,
      items: JSON.parse(o.items || '[]'),
      shippingDetails: JSON.parse(o.shippingDetails || '{}'),
      history: JSON.parse(o.history || '[]')
    })));
  });

  app.get('/api/admin/customers', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const customers = db.prepare('SELECT id, name, email, status, createdAt FROM users WHERE role = ?').all('customer');
    res.json(customers);
  });

  app.get('/api/admin/investments', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const opportunities = db.prepare('SELECT * FROM investment_opportunities').all();
    const investments = db.prepare('SELECT * FROM investments').all();
    res.json({ opportunities, investments });
  });

  app.get('/api/admin/reviews', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const reviews = db.prepare('SELECT * FROM reviews ORDER BY createdAt DESC').all();
    res.json(reviews);
  });

  app.delete('/api/admin/reviews/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    res.json({ success: true });
    io.emit('products_updated');
    io.emit('vendors_updated');
  });

  app.delete('/api/admin/users/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
    io.emit('vendors_updated');
  });

  app.delete('/api/admin/products/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.put('/api/admin/orders/:id/status', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { status, description } = req.body;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const history = JSON.parse(order.history || '[]');
    const update = {
      id: uuidv4(),
      orderId: order.id,
      status,
      description: description || `Order status updated to ${status} by Administrator`,
      timestamp: new Date().toISOString()
    };
    history.push(update);

    db.prepare('UPDATE orders SET status = ?, history = ? WHERE id = ?')
      .run(status, JSON.stringify(history), req.params.id);

    // Notify customer
    db.prepare('INSERT INTO notifications (id, userId, title, message, type, orderId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), order.customerId, 'Order Status Updated', `Your order #${order.id.slice(0, 8)} has been updated to ${status} by Admin.`, 'order_update', order.id, new Date().toISOString());

    res.json({ success: true });
    io.emit('notifications_updated');
    io.emit('orders_updated');
  });

  // Products
  app.get('/api/products', (req, res) => {
    const { category, minPrice, maxPrice, halal, freshness, origin, q, userCountry, userCity, availableInMyLocation } = req.query;
    let query = `
      SELECT 
        p.*,
        v.isTopRated as vendorIsTopRated,
        (SELECT AVG(rating) FROM reviews WHERE productId = p.id) as rating,
        (SELECT COUNT(*) FROM reviews WHERE productId = p.id) as reviewCount
      FROM products p
      LEFT JOIN users v ON p.vendorId = v.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'All') {
      query += ' AND p.category = ?';
      params.push(category);
    }
    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(Number(maxPrice));
    }
    if (halal === 'true') {
      query += ' AND p.isHalalCertified = 1';
    }
    if (freshness && freshness !== 'All') {
      query += ' AND p.freshness = ?';
      params.push(freshness);
    }
    if (origin && origin !== 'All Countries') {
      query += ' AND p.originCountry = ?';
      params.push(origin);
    }
    if (q) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      const search = `%${q}%`;
      params.push(search, search, search);
    }

    const stmt = db.prepare(query);
    let products = stmt.all(...params).map((p: any) => ({
      ...p,
      isHalalCertified: Boolean(p.isHalalCertified),
      currency: p.currency || 'USD',
      tags: JSON.parse(p.tags || '[]'),
      availableCountries: JSON.parse(p.availableCountries || '[]'),
      availableCities: JSON.parse(p.availableCities || '[]'),
      variationTypes: JSON.parse(p.variationTypes || '[]'),
      variationCombinations: JSON.parse(p.variationCombinations || '[]'),
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      availabilityScope: p.availabilityScope || 'global'
    }));

    // Location-based filtering in JS for complex logic
    if (availableInMyLocation === 'true' && userCountry) {
      const normalizedUserCountry = String(userCountry).toLowerCase().trim();
      const normalizedUserCity = userCity ? String(userCity).toLowerCase().trim() : '';

      products = products.filter((p: any) => {
        if (p.availabilityScope === 'global') return true;
        
        const countries = (p.availableCountries || []).map((c: string) => c.toLowerCase().trim());
        const cities = (p.availableCities || []).map((c: string) => c.toLowerCase().trim());
        
        if (p.availabilityScope === 'country') {
          return countries.includes(normalizedUserCountry);
        }
        
        if (p.availabilityScope === 'local') {
          return countries.includes(normalizedUserCountry) && (normalizedUserCity ? cities.includes(normalizedUserCity) : true);
        }
        
        return true;
      });
    }

    res.json(products);
  });

  // Subscriptions
  app.get('/api/subscriptions', authenticateToken, (req: any, res) => {
    const stmt = db.prepare('SELECT * FROM subscriptions WHERE customerId = ? OR vendorId = ?');
    const subs = stmt.all(req.user.id, req.user.id);
    res.json(subs);
  });

  app.post('/api/subscriptions', authenticateToken, (req: any, res) => {
    const { productId, frequency, quantity } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (product.vendorId === req.user.id) {
      return res.status(400).json({ error: 'You cannot purchase your own product.' });
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const nextDelivery = new Date();
    if (frequency === 'daily') nextDelivery.setDate(nextDelivery.getDate() + 1);
    else if (frequency === 'weekly') nextDelivery.setDate(nextDelivery.getDate() + 7);
    else if (frequency === 'monthly') nextDelivery.setMonth(nextDelivery.getMonth() + 1);

    const stmt = db.prepare(`
      INSERT INTO subscriptions (id, customerId, productId, productName, vendorId, vendorName, frequency, quantity, price, currency, nextDelivery, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, req.user.id, productId, product.name, product.vendorId, product.vendorName, frequency, quantity, product.price, product.currency, nextDelivery.toISOString(), createdAt);
    
    res.json({ id, status: 'active' });
  });

  app.put('/api/subscriptions/:id', authenticateToken, (req: any, res) => {
    const { status } = req.body;
    const stmt = db.prepare('UPDATE subscriptions SET status = ? WHERE id = ? AND (customerId = ? OR vendorId = ?)');
    const result = stmt.run(status, req.params.id, req.user.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Subscription not found' });
    res.json({ success: true });
  });

  // Helper to complete a group purchase
  const completeGroupPurchase = (groupId: string) => {
    const group = db.prepare('SELECT * FROM group_purchases WHERE id = ?').get(groupId) as any;
    if (!group || group.status !== 'open') return;

    const members = db.prepare('SELECT * FROM group_members WHERE groupPurchaseId = ?').all(groupId) as any[];
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(group.productId) as any;

    db.transaction(() => {
      // Update group status
      db.prepare("UPDATE group_purchases SET status = 'completed' WHERE id = ?").run(groupId);

      // Create orders for each member
      for (const member of members) {
        const orderId = uuidv4();
        const createdAt = new Date().toISOString();
        const user = db.prepare('SELECT name, email, lastShippingDetails FROM users WHERE id = ?').get(member.customerId) as any;
        let shippingDetails = {};
        if (user.lastShippingDetails) {
          try {
            shippingDetails = JSON.parse(user.lastShippingDetails);
          } catch (e) {
            console.error('Failed to parse shipping details', e);
          }
        } else {
          // Use basic profile info if no shipping details yet
          shippingDetails = {
            fullName: user.name,
            email: user.email,
            address: '',
            city: '',
            state: '',
            country: '',
            zipCode: '',
            phone: ''
          };
        }

        db.prepare(`
          INSERT INTO orders (id, customerId, customerName, vendorId, vendorName, status, totalAmount, currency, createdAt, shippingDetails, paymentMethod)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(orderId, member.customerId, user.name, group.vendorId, group.vendorName, 'confirmed', group.price, group.currency, createdAt, JSON.stringify(shippingDetails), 'card');

        db.prepare(`
          INSERT INTO order_items (id, orderId, productId, productName, price, currency, quantity, selectedVariations, imageUrl)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), orderId, group.productId, group.productName, group.price, group.currency, 1, '{}', product?.imageUrl || '');

        db.prepare('INSERT INTO order_history (id, orderId, status, description, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(uuidv4(), orderId, 'confirmed', 'Order confirmed via successful Group Purchase', createdAt);

        // Notify customer
        db.prepare('INSERT INTO notifications (id, userId, title, message, type, orderId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(uuidv4(), member.customerId, 'Group Purchase Successful!', `The group purchase for ${group.productName} is complete! Your order has been confirmed.`, 'group_success', orderId, createdAt);
      }

      // Notify vendor
      db.prepare('INSERT INTO notifications (id, userId, title, message, type, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), group.vendorId, 'Group Purchase Completed', `Group purchase for ${group.productName} (#${groupId.slice(0, 8)}) has been successfully completed with ${group.targetMembers} members.`, 'group_vendor_success', new Date().toISOString());
    })();

    io.emit('orders_updated');
    io.emit('notifications_updated');
    io.emit('group_purchases_updated');
  };

  // Helper to expire a group purchase
  const expireGroupPurchase = (groupId: string) => {
    const group = db.prepare('SELECT * FROM group_purchases WHERE id = ?').get(groupId) as any;
    if (!group || group.status !== 'open') return;

    const members = db.prepare('SELECT * FROM group_members WHERE groupPurchaseId = ?').all(groupId) as any[];

    db.transaction(() => {
      db.prepare("UPDATE group_purchases SET status = 'expired' WHERE id = ?").run(groupId);

      // Notify members about refund
      for (const member of members) {
        db.prepare('INSERT INTO notifications (id, userId, title, message, type, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
          .run(uuidv4(), member.customerId, 'Group Purchase Expired', `The group purchase for ${group.productName} did not reach its target. A refund has been issued to your original payment method.`, 'group_expired', new Date().toISOString());
      }
    })();

    io.emit('notifications_updated');
    io.emit('group_purchases_updated');
  };

  // Periodic check for expired groups
  setInterval(() => {
    const now = new Date().toISOString();
    const expiredGroups = db.prepare("SELECT id FROM group_purchases WHERE status = 'open' AND expiresAt < ?").all(now) as any[];
    for (const g of expiredGroups) {
      expireGroupPurchase(g.id);
    }
  }, 60000); // Every minute

  // Group Purchases
  app.get('/api/group-purchases', (req, res) => {
    const groups = db.prepare("SELECT * FROM group_purchases WHERE status = 'open'").all() as any[];
    const groupsWithMembers = groups.map(g => {
      const members = db.prepare('SELECT * FROM group_members WHERE groupPurchaseId = ?').all(g.id);
      return { ...g, members };
    });
    res.json(groupsWithMembers);
  });

  app.post('/api/group-purchases', authenticateToken, (req: any, res) => {
    const { productId, targetMembers, durationHours } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
    if (!product || !product.groupPrice) return res.status(400).json({ error: 'Product not eligible for group purchase' });

    if (product.vendorId === req.user.id) {
      return res.status(400).json({ error: 'You cannot purchase your own product.' });
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (durationHours || 24));

    const stmt = db.prepare(`
      INSERT INTO group_purchases (id, productId, productName, vendorId, vendorName, targetMembers, currentMembers, price, currency, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const targetCount = product.targetMembers || targetMembers || 5;
    stmt.run(id, productId, product.name, product.vendorId, product.vendorName, targetCount, 1, product.groupPrice, product.currency, expiresAt.toISOString(), createdAt);

    const memberId = uuidv4();
    const user = db.prepare('SELECT name, profileImage FROM users WHERE id = ?').get(req.user.id) as any;
    db.prepare('INSERT INTO group_members (id, groupPurchaseId, customerId, customerName, customerProfileImage, joinedAt) VALUES (?, ?, ?, ?, ?, ?)').run(memberId, id, req.user.id, user.name, user.profileImage || null, createdAt);

    res.json({ id, status: 'open' });
    io.emit('group_purchases_updated');
  });

  app.post('/api/group-purchases/:id/join', authenticateToken, (req: any, res) => {
    const group = db.prepare('SELECT * FROM group_purchases WHERE id = ?').get(req.params.id) as any;
    if (!group || group.status !== 'open') return res.status(400).json({ error: 'Group not available' });

    if (group.vendorId === req.user.id) {
      return res.status(400).json({ error: 'You cannot purchase your own product.' });
    }

    const alreadyJoined = db.prepare('SELECT * FROM group_members WHERE groupPurchaseId = ? AND customerId = ?').get(group.id, req.user.id);
    if (alreadyJoined) return res.status(400).json({ error: 'Already joined' });

    const memberId = uuidv4();
    const joinedAt = new Date().toISOString();
    const user = db.prepare('SELECT name, profileImage FROM users WHERE id = ?').get(req.user.id) as any;
    db.prepare('INSERT INTO group_members (id, groupPurchaseId, customerId, customerName, customerProfileImage, joinedAt) VALUES (?, ?, ?, ?, ?, ?)').run(memberId, group.id, req.user.id, user.name, user.profileImage || null, joinedAt);

    const newCount = group.currentMembers + 1;
    db.prepare('UPDATE group_purchases SET currentMembers = ? WHERE id = ?').run(newCount, group.id);

    if (newCount >= group.targetMembers) {
      completeGroupPurchase(group.id);
    } else {
      io.emit('group_purchases_updated');
      // Notify other members that someone joined
      const members = db.prepare('SELECT customerId FROM group_members WHERE groupPurchaseId = ? AND customerId != ?').all(group.id, req.user.id) as any[];
      for (const m of members) {
        db.prepare('INSERT INTO notifications (id, userId, title, message, type, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
          .run(uuidv4(), m.customerId, 'Someone joined your group!', `${user.name} joined the group for ${group.productName}. Only ${group.targetMembers - newCount} spots left!`, 'group_join', new Date().toISOString());
      }
      io.emit('notifications_updated');
    }

    res.json({ success: true });
  });

  app.post('/api/products', authenticateToken, (req: any, res) => {
    const p = req.body;
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO products (id, vendorId, vendorName, name, description, price, currency, category, imageUrl, stock, tags, isHalalCertified, availableCountries, availableCities, variationTypes, variationCombinations, groupPrice, targetMembers, originCountry, freshness, availabilityScope, availabilityDescription)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, req.user.id, p.vendorName, p.name, p.description, p.price, p.currency || 'USD', p.category, p.imageUrl, p.stock,
      JSON.stringify(p.tags || []), p.isHalalCertified ? 1 : 0, JSON.stringify(p.availableCountries || []),
      JSON.stringify(p.availableCities || []), JSON.stringify(p.variationTypes || []), JSON.stringify(p.variationCombinations || []),
      p.groupPrice || null, p.targetMembers || null, p.originCountry || null, p.freshness || null, p.availabilityScope || 'global', p.availabilityDescription || null
    );
    res.json({ id });
    io.emit('products_updated');
  });

  app.put('/api/products/:id', authenticateToken, (req: any, res) => {
    const p = req.body;
    const stmt = db.prepare(`
      UPDATE products SET name = ?, description = ?, price = ?, currency = ?, category = ?, imageUrl = ?, stock = ?, tags = ?, isHalalCertified = ?, availableCountries = ?, availableCities = ?, variationTypes = ?, variationCombinations = ?, groupPrice = ?, targetMembers = ?, originCountry = ?, freshness = ?, availabilityScope = ?, availabilityDescription = ?
      WHERE id = ? AND vendorId = ?
    `);
    stmt.run(
      p.name, p.description, p.price, p.currency || 'USD', p.category, p.imageUrl, p.stock,
      JSON.stringify(p.tags || []), p.isHalalCertified ? 1 : 0, JSON.stringify(p.availableCountries || []),
      JSON.stringify(p.availableCities || []), JSON.stringify(p.variationTypes || []), JSON.stringify(p.variationCombinations || []),
      p.groupPrice || null, p.targetMembers || null, p.originCountry || null, p.freshness || null, p.availabilityScope || 'global', p.availabilityDescription || null,
      req.params.id, req.user.id
    );
    res.json({ success: true });
    io.emit('products_updated');
  });

  app.delete('/api/products/:id', authenticateToken, (req: any, res) => {
    const stmt = db.prepare('DELETE FROM products WHERE id = ? AND vendorId = ?');
    stmt.run(req.params.id, req.user.id);
    res.json({ success: true });
    io.emit('products_updated');
  });

  // Orders
  app.get('/api/orders', authenticateToken, (req: any, res) => {
    const stmt = db.prepare('SELECT * FROM orders WHERE customerId = ? OR vendorId = ? ORDER BY createdAt DESC');
    const orders = stmt.all(req.user.id, req.user.id).map((o: any) => {
      const itemsStmt = db.prepare('SELECT * FROM order_items WHERE orderId = ?');
      const items = itemsStmt.all(o.id).map((i: any) => ({
        ...i,
        selectedVariations: JSON.parse(i.selectedVariations || '{}')
      }));
      
      const historyStmt = db.prepare('SELECT * FROM order_history WHERE orderId = ? ORDER BY timestamp DESC');
      const history = historyStmt.all(o.id);

      return {
        ...o,
        shippingDetails: JSON.parse(o.shippingDetails || '{}'),
        items,
        history
      };
    });
    res.json(orders);
  });

  app.post('/api/orders', authenticateToken, (req: any, res) => {
    const { vendorId, vendorName, items, totalAmount, shippingDetails, paymentMethod } = req.body;

    if (vendorId === req.user.id) {
      return res.status(400).json({ error: 'You cannot purchase your own product.' });
    }

    const orderId = uuidv4();
    const createdAt = new Date().toISOString();

    // Insert order
    const stmt = db.prepare(`
      INSERT INTO orders (id, customerId, customerName, vendorId, vendorName, status, totalAmount, currency, createdAt, shippingDetails, paymentMethod)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Get customer name
    const userStmt = db.prepare('SELECT name FROM users WHERE id = ?');
    const customer = userStmt.get(req.user.id) as any;

    stmt.run(
      orderId, req.user.id, customer.name, vendorId, vendorName, 'pending', totalAmount, req.body.currency || 'USD', createdAt,
      JSON.stringify(shippingDetails), paymentMethod
    );

    // Save shipping details for future use
    const updateShippingStmt = db.prepare('UPDATE users SET lastShippingDetails = ? WHERE id = ?');
    updateShippingStmt.run(JSON.stringify(shippingDetails), req.user.id);

    // Insert items and update stock
    const itemStmt = db.prepare(`
      INSERT INTO order_items (id, orderId, productId, productName, price, currency, quantity, selectedVariations, imageUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const updateStockStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    
    for (const item of items) {
      itemStmt.run(
        uuidv4(), orderId, item.productId, item.productName, item.price, item.currency || 'USD', item.quantity,
        JSON.stringify(item.selectedVariations || {}), item.imageUrl
      );
      
      // Decrement stock
      updateStockStmt.run(item.quantity, item.productId);
    }

    // Insert initial history
    const historyStmt = db.prepare('INSERT INTO order_history (id, orderId, status, description, timestamp) VALUES (?, ?, ?, ?, ?)');
    historyStmt.run(uuidv4(), orderId, 'pending', 'Order placed successfully', createdAt);

    res.json({ success: true, orderId });
    
    // Notify vendor
    const vendorNotifStmt = db.prepare('INSERT INTO notifications (id, userId, title, message, type, orderId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
    vendorNotifStmt.run(
      uuidv4(),
      vendorId,
      'New Order Received',
      `You have received a new order #${orderId.slice(0, 8).toUpperCase()} from ${customer.name}.`,
      'new_order',
      orderId,
      createdAt
    );

    io.emit('orders_updated');
    io.emit('notifications_updated');
  });

  app.put('/api/orders/:id/status', authenticateToken, (req: any, res) => {
    const { status, description } = req.body;
    const orderId = req.params.id;
    
    const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ? AND vendorId = ?');
    const result = stmt.run(status, orderId, req.user.id);
    
    if (result.changes > 0) {
      const historyStmt = db.prepare('INSERT INTO order_history (id, orderId, status, description, timestamp) VALUES (?, ?, ?, ?, ?)');
      const now = new Date().toISOString();
      historyStmt.run(uuidv4(), orderId, status, description || `Order status updated to ${status}`, now);
      
      // Create notification for customer
      const order = db.prepare('SELECT customerId, vendorName, totalAmount, currency FROM orders WHERE id = ?').get(orderId) as any;
      if (order) {
        const notifStmt = db.prepare('INSERT INTO notifications (id, userId, title, message, type, orderId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
        notifStmt.run(
          uuidv4(), 
          order.customerId, 
          'Order Update', 
          `Your order from ${order.vendorName} is now ${status}. ${description || ''}`,
          'order_update',
          orderId,
          now
        );

        // Handle profit distribution if order is delivered
        if (status === 'delivered') {
          const items = db.prepare('SELECT productId, price, quantity FROM order_items WHERE orderId = ?').all(orderId) as any[];
          const month = now.substring(0, 7); // YYYY-MM

          for (const item of items) {
            // Update sales stats
            db.prepare(`
              INSERT INTO product_sales_stats (productId, month, unitsSold, revenue)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(productId, month) DO UPDATE SET
                unitsSold = unitsSold + ?,
                revenue = revenue + ?
            `).run(item.productId, month, item.quantity, item.price * item.quantity, item.quantity, item.price * item.quantity);

            // Find active investments for this product
            const opportunity = db.prepare("SELECT id, profitSharingPct FROM investment_opportunities WHERE productId = ? AND status = 'active'").get(item.productId) as any;
            if (opportunity) {
              const investments = db.prepare("SELECT * FROM investments WHERE opportunityId = ? AND status = 'active'").all(opportunity.id) as any[];
              
              // Total profit to share for this item (simplified: sharing a percentage of revenue)
              const totalRevenue = item.price * item.quantity;
              const totalToShare = totalRevenue * (opportunity.profitSharingPct / 100);

              // Distribute proportionally to current funding share
              const totalFunding = db.prepare('SELECT currentFunding FROM investment_opportunities WHERE id = ?').get(opportunity.id) as any;
              
              if (totalFunding && totalFunding.currentFunding > 0) {
                for (const inv of investments) {
                  const investorShare = (inv.amount / totalFunding.currentFunding) * totalToShare;
                  
                  // Update investment earnedSoFar
                  db.prepare('UPDATE investments SET earnedSoFar = earnedSoFar + ? WHERE id = ?').run(investorShare, inv.id);
                  
                  // Update investor wallet
                  db.prepare(`
                    INSERT INTO investor_wallets (userId, balance, totalEarned, updatedAt)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(userId) DO UPDATE SET
                      balance = balance + ?,
                      totalEarned = totalEarned + ?,
                      updatedAt = ?
                  `).run(inv.investorId, investorShare, investorShare, now, investorShare, investorShare, now);
                  
                  // Record transaction
                  db.prepare('INSERT INTO wallet_transactions (id, userId, amount, type, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
                    .run(uuidv4(), inv.investorId, investorShare, 'earning', `Profit share from ${item.productName} sale`, now);
                }
              }
            }
          }
          io.emit('wallet_updated');
        }
      }

      res.json({ success: true });
      io.emit('orders_updated');
      io.emit('notifications_updated');
    } else {
      res.status(403).json({ error: 'Not authorized to update this order' });
    }
  });

  app.get('/api/notifications', authenticateToken, (req: any, res: any) => {
    const stmt = db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC');
    const notifications = stmt.all(req.user.id);
    res.json(notifications);
  });

  app.put('/api/notifications/:id/read', authenticateToken, (req: any, res: any) => {
    const stmt = db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?');
    stmt.run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Reviews
  app.get('/api/reviews/product/:id', (req, res) => {
    const stmt = db.prepare('SELECT * FROM reviews WHERE productId = ? ORDER BY createdAt DESC');
    const reviews = stmt.all(req.params.id);
    res.json(reviews);
  });

  app.get('/api/reviews/vendor/:id', (req, res) => {
    const stmt = db.prepare('SELECT * FROM reviews WHERE vendorId = ? ORDER BY createdAt DESC');
    const reviews = stmt.all(req.params.id);
    res.json(reviews);
  });

  app.post('/api/reviews', authenticateToken, (req: any, res) => {
    const { productId, vendorId, rating, comment } = req.body;
    const userId = req.user.id;
    
    // Check if user already reviewed this product or vendor
    if (productId) {
      const existing = db.prepare('SELECT id FROM reviews WHERE userId = ? AND productId = ?').get(userId, productId);
      if (existing) return res.status(400).json({ error: 'You have already reviewed this product' });
    } else if (vendorId) {
      const existing = db.prepare('SELECT id FROM reviews WHERE userId = ? AND vendorId = ?').get(userId, vendorId);
      if (existing) return res.status(400).json({ error: 'You have already reviewed this vendor' });
    }

    // Check if it's a verified purchase
    let isVerifiedPurchase = 0;
    if (productId) {
      const purchase = db.prepare(`
        SELECT oi.id 
        FROM order_items oi
        JOIN orders o ON oi.orderId = o.id
        WHERE o.customerId = ? AND oi.productId = ? AND o.status = 'delivered'
      `).get(userId, productId);
      if (purchase) isVerifiedPurchase = 1;
    } else if (vendorId) {
      const purchase = db.prepare(`
        SELECT id FROM orders WHERE customerId = ? AND vendorId = ? AND status = 'delivered'
      `).get(userId, vendorId);
      if (purchase) isVerifiedPurchase = 1;
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    // Get user info
    const user = db.prepare('SELECT name, profileImage FROM users WHERE id = ?').get(userId) as any;
    
    const stmt = db.prepare(`
      INSERT INTO reviews (id, userId, userName, userProfileImage, productId, vendorId, rating, comment, isVerifiedPurchase, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId, user.name, user.profileImage, productId || null, vendorId || null, rating, comment, isVerifiedPurchase, createdAt);
    
    res.json({ success: true, id });
    
    // Notify vendor if it's a vendor review or a review on their product
    let targetVendorId = vendorId;
    if (productId && !vendorId) {
      const product = db.prepare('SELECT vendorId FROM products WHERE id = ?').get(productId) as any;
      if (product) targetVendorId = product.vendorId;
    }
    
    if (targetVendorId) {
      const notifStmt = db.prepare('INSERT INTO notifications (id, userId, title, message, type, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
      notifStmt.run(
        uuidv4(),
        targetVendorId,
        'New Review Received',
        `${user.name} left a ${rating}-star review.`,
        'new_review',
        createdAt
      );
      io.emit('notifications_updated');
    }
    
    io.emit('products_updated');
    io.emit('vendors_updated');
  });

  // Chat
  app.get('/api/chat/conversations', authenticateToken, (req: any, res: any) => {
    const userId = req.user.id;
    // Get unique users that the current user has chatted with
    const stmt = db.prepare(`
      SELECT DISTINCT 
        CASE WHEN senderId = ? THEN receiverId ELSE senderId END as otherUserId
      FROM messages 
      WHERE senderId = ? OR receiverId = ?
    `);
    const otherUsers = stmt.all(userId, userId, userId) as any[];
    
    const conversations = otherUsers.map(u => {
      const otherUserId = u.otherUserId;
      const otherUser = db.prepare('SELECT id, name, profileImage, role, storeName FROM users WHERE id = ?').get(otherUserId) as any;
      
      const lastMessage = db.prepare(`
        SELECT * FROM messages 
        WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
        ORDER BY createdAt DESC LIMIT 1
      `).get(userId, otherUserId, otherUserId, userId) as any;
      
      const unreadCount = db.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE senderId = ? AND receiverId = ? AND isRead = 0
      `).get(otherUserId, userId) as any;
      
      return {
        otherUser,
        lastMessage: {
          ...lastMessage,
          isRead: Boolean(lastMessage.isRead)
        },
        unreadCount: unreadCount.count
      };
    });
    
    // Sort by last message time
    conversations.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
    
    res.json(conversations);
  });

  app.get('/api/chat/messages/:otherUserId', authenticateToken, (req: any, res: any) => {
    const userId = req.user.id;
    const otherUserId = req.params.otherUserId;
    
    const stmt = db.prepare(`
      SELECT * FROM messages 
      WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
      ORDER BY createdAt ASC
    `);
    const messages = stmt.all(userId, otherUserId, otherUserId, userId).map((m: any) => ({
      ...m,
      isRead: Boolean(m.isRead)
    }));
    
    // Mark as read
    db.prepare('UPDATE messages SET isRead = 1 WHERE senderId = ? AND receiverId = ?').run(otherUserId, userId);
    
    res.json(messages);
  });

  app.post('/api/chat/send', authenticateToken, (req: any, res: any) => {
    const { receiverId, content } = req.body;
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    const stmt = db.prepare('INSERT INTO messages (id, senderId, receiverId, content, createdAt) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, req.user.id, receiverId, content, createdAt);
    
    const message = { id, senderId: req.user.id, receiverId, content, isRead: false, createdAt };
    
    // Emit to both sender and receiver
    io.to(receiverId).emit('new_message', message);
    io.to(req.user.id).emit('new_message', message);
    
    res.json(message);
  });

  // Recalculate Top-Rated Vendors
  app.post('/api/admin/recalculate-top-rated', authenticateToken, (req: any, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    try {
      const vendors = db.prepare("SELECT id FROM users WHERE role = 'vendor'").all() as { id: string }[];
      
      for (const vendor of vendors) {
        // Get average rating
        const ratingResult = db.prepare(`
          SELECT AVG(rating) as avgRating 
          FROM reviews r
          JOIN products p ON r.productId = p.id
          WHERE p.vendorId = ?
        `).get(vendor.id) as { avgRating: number | null };
        
        // Get total orders
        const orderCountResult = db.prepare(`
          SELECT COUNT(*) as count FROM orders WHERE vendorId = ?
        `).get(vendor.id) as { count: number };
        
        // Get completion rate
        const deliveredCountResult = db.prepare(`
          SELECT COUNT(*) as count FROM orders WHERE vendorId = ? AND status = 'delivered'
        `).get(vendor.id) as { count: number };
        
        const avgRating = ratingResult.avgRating || 0;
        const totalOrders = orderCountResult.count;
        const completionRate = totalOrders > 0 ? (deliveredCountResult.count / totalOrders) : 0;
        
        // Criteria for Top-Rated
        const isTopRated = avgRating >= 4.0 && totalOrders >= 5 && completionRate >= 0.8;
        
        db.prepare("UPDATE users SET isTopRated = ? WHERE id = ?").run(isTopRated ? 1 : 0, vendor.id);
      }
      
      res.json({ success: true, message: 'Top-rated status recalculated for all vendors' });
    } catch (error) {
      console.error('Recalculation error:', error);
      res.status(500).json({ error: 'Failed to recalculate' });
    }
  });

  // Investment Marketplace
  app.get('/api/investments/opportunities', (req, res) => {
    const opportunities = db.prepare("SELECT * FROM investment_opportunities WHERE status = 'active'").all() as any[];
    const opportunitiesWithTiers = opportunities.map(o => {
      const tiers = db.prepare('SELECT * FROM investment_tiers WHERE opportunityId = ?').all(o.id);
      const salesStats = db.prepare('SELECT * FROM product_sales_stats WHERE productId = ? ORDER BY month DESC LIMIT 6').all(o.productId);
      return { ...o, tiers, salesStats };
    });
    res.json(opportunitiesWithTiers);
  });

  app.post('/api/investments/opportunities', authenticateToken, (req: any, res) => {
    console.log('POST /api/investments/opportunities', JSON.stringify(req.body, null, 2));
    const { productId, fundingGoal, totalUnits, profitSharingPct, tiers, riskLevel } = req.body;
    
    try {
      const product = db.prepare('SELECT name, vendorId FROM products WHERE id = ?').get(productId) as any;
      
      if (!product || product.vendorId !== req.user.id) {
        console.error('Not authorized or product not found', { productId, vendorId: req.user.id });
        return res.status(403).json({ error: 'Not authorized or product not found' });
      }

      const id = uuidv4();
      const createdAt = new Date().toISOString();
      
      db.transaction(() => {
        db.prepare(`
          INSERT INTO investment_opportunities (id, productId, productName, vendorId, fundingGoal, totalUnits, profitSharingPct, riskLevel, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, productId, product.name, req.user.id, fundingGoal, totalUnits, profitSharingPct, riskLevel || 'medium', createdAt);

        const tierStmt = db.prepare(`
          INSERT INTO investment_tiers (id, opportunityId, name, amount, returnPct, estimatedEarnings)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const tier of tiers) {
          tierStmt.run(uuidv4(), id, tier.name, tier.amount, tier.returnPct, tier.estimatedEarnings);
        }
      })();

      res.json({ success: true, id });
      io.emit('investments_updated');
    } catch (error: any) {
      console.error('Error creating investment opportunity:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/investments/invest', authenticateToken, (req: any, res) => {
    const { opportunityId, tierId } = req.body;
    const opportunity = db.prepare('SELECT * FROM investment_opportunities WHERE id = ?').get(opportunityId) as any;
    const tier = db.prepare('SELECT * FROM investment_tiers WHERE id = ?').get(tierId) as any;

    if (!opportunity || !tier) return res.status(404).json({ error: 'Not found' });
    if (opportunity.status !== 'active') return res.status(400).json({ error: 'Opportunity not active' });

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    db.transaction(() => {
      // Record investment
      db.prepare(`
        INSERT INTO investments (id, opportunityId, productId, productName, investorId, tierId, tierName, amount, expectedReturnPct, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, opportunityId, opportunity.productId, opportunity.productName, req.user.id, tierId, tier.name, tier.amount, tier.returnPct, createdAt);

      // Update opportunity funding
      db.prepare('UPDATE investment_opportunities SET currentFunding = currentFunding + ? WHERE id = ?').run(tier.amount, opportunityId);

      // Record transaction (negative balance for now, assuming external payment or wallet balance)
      db.prepare('INSERT INTO wallet_transactions (id, userId, amount, type, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), req.user.id, -tier.amount, 'investment', `Investment in ${opportunity.productName} (${tier.name})`, createdAt);

      // Update wallet balance (if using internal wallet)
      db.prepare(`
        INSERT INTO investor_wallets (userId, balance, updatedAt)
        VALUES (?, ?, ?)
        ON CONFLICT(userId) DO UPDATE SET
          balance = balance - ?,
          updatedAt = ?
      `).run(req.user.id, -tier.amount, createdAt, tier.amount, createdAt);
    })();

    res.json({ success: true, id });
    io.emit('investments_updated');
    io.emit('wallet_updated');
  });

  app.get('/api/investments/my-investments', authenticateToken, (req: any, res) => {
    const investments = db.prepare('SELECT * FROM investments WHERE investorId = ? ORDER BY createdAt DESC').all(req.user.id);
    res.json(investments);
  });

  app.get('/api/vendor/investments', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Vendor only' });
    
    const opportunities = db.prepare('SELECT id FROM investment_opportunities WHERE vendorId = ?').all(req.user.id) as { id: string }[];
    const opportunityIds = opportunities.map(o => o.id);
    
    if (opportunityIds.length === 0) return res.json([]);
    
    const placeholders = opportunityIds.map(() => '?').join(',');
    const investments = db.prepare(`SELECT * FROM investments WHERE opportunityId IN (${placeholders}) ORDER BY createdAt DESC`).all(...opportunityIds);
    res.json(investments);
  });

  app.get('/api/investments/wallet', authenticateToken, (req: any, res) => {
    const wallet = db.prepare('SELECT * FROM investor_wallets WHERE userId = ?').get(req.user.id) as any;
    const transactions = db.prepare('SELECT * FROM wallet_transactions WHERE userId = ? ORDER BY createdAt DESC').all(req.user.id);
    res.json({ ...wallet, transactions });
  });

  app.post('/api/investments/withdraw', authenticateToken, (req: any, res) => {
    const { amount } = req.body;
    const wallet = db.prepare('SELECT balance FROM investor_wallets WHERE userId = ?').get(req.user.id) as any;

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    db.transaction(() => {
      db.prepare('UPDATE investor_wallets SET balance = balance - ?, updatedAt = ? WHERE userId = ?').run(amount, createdAt, req.user.id);
      db.prepare('INSERT INTO wallet_transactions (id, userId, amount, type, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), req.user.id, -amount, 'withdrawal', 'Withdrawal to bank account', createdAt);
    })();

    res.json({ success: true });
    io.emit('wallet_updated');
  });

  // Catch-all for API routes to ensure JSON response
  app.all('/api/*', (req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Socket.io connection
  io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Vite middleware or static serving
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV !== "production" || !hasDist) {
    console.log(`Serving using Vite middleware (NODE_ENV=${process.env.NODE_ENV}, hasDist=${hasDist})`);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(`Serving static files from ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
