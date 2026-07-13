import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "saangsm_secret_key_2026_jwt";
const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || "SaanGSMAdmin2026!";

app.use(express.json());

// Initialize SQLite Database
const db = new Database("saangsm.db");
db.pragma("foreign_keys = ON");

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('customer', 'admin')) DEFAULT 'customer',
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT CHECK(type IN ('imei', 'server', 'rental')) NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'TZS',
    delivery_label TEXT NOT NULL,
    requires_input TEXT, -- JSON string representing input fields
    is_featured INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    stock INTEGER DEFAULT 999,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_ref TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    service_id INTEGER,
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    total_amount REAL NOT NULL,
    customer_input TEXT, -- JSON string containing submitted fields
    status TEXT CHECK(status IN ('pending_payment', 'paid', 'processing', 'completed', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending_payment',
    admin_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    provider TEXT, -- e.g. M-Pesa, Tigo Pesa, Airtel Money, HaloPesa
    phone_number TEXT,
    amount REAL,
    external_transaction_id TEXT,
    status TEXT CHECK(status IN ('initiated', 'success', 'failed')) DEFAULT 'initiated',
    raw_response TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    tool_name TEXT NOT NULL,
    access_credentials TEXT,
    starts_at TEXT,
    expires_at TEXT,
    status TEXT CHECK(status IN ('active', 'expired', 'pending')) DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  );
`);

// Pre-populate (Seed) database if empty
const categoryCount = db.prepare("SELECT count(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  // Insert Categories
  const insertCat = db.prepare(`
    INSERT INTO categories (name, slug, type, description) VALUES (?, ?, ?, ?)
  `);
  
  insertCat.run(
    "IMEI & FRP Bypass",
    "imei-frp-bypass",
    "imei",
    "Huduma za kufungua simu kwa kutumia IMEI au Serial Number pekee bila kutuma kifaa. Inahusisha kuondoa FRP (Google Lock), MDM bypass, iCloud na Demo Mode."
  );
  
  insertCat.run(
    "Server & Activations",
    "server-activations",
    "server",
    "Anzisha (Activate) au weka upya usajili wa account za zana (GSM Tools) maarufu kama UnlockTool, DFT Pro, EFT Pro na nyinginezo."
  );
  
  insertCat.run(
    "Tool Rentals (Kodi)",
    "tool-rentals",
    "rental",
    "Kodisha akaunti za zana za GSM kwa saa chache au siku moja ili umalize kazi za wateja bila kununua zana nzima kwa gharama kubwa."
  );

  // Retrieve category IDs
  const imeiCatId = (db.prepare("SELECT id FROM categories WHERE type = 'imei'").get() as any).id;
  const serverCatId = (db.prepare("SELECT id FROM categories WHERE type = 'server'").get() as any).id;
  const rentalCatId = (db.prepare("SELECT id FROM categories WHERE type = 'rental'").get() as any).id;

  // Insert Services
  const insertServ = db.prepare(`
    INSERT INTO services (category_id, title, slug, description, price, currency, delivery_label, requires_input, is_featured, is_active, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // IMEI services
  insertServ.run(
    imeiCatId,
    "SAMSUNG FRP Bypass (IMEI/SN)",
    "samsung-frp-bypass",
    "Ondoa FRP (Google Account) lock kwenye simu zote za Samsung duniani kote. Kazi inafanyika kwa IMEI au Serial Number na inakamilika haraka sana.",
    15000,
    "TZS",
    "Dakika 5 - 30",
    JSON.stringify([
      { name: "imei_or_sn", label: "IMEI au Serial Number ya Simu", type: "text", placeholder: "Ingiza IMEI 15 au Serial Number ya simu", required: true },
      { name: "phone_model", label: "Model ya Simu (Mfano: A32, S21)", type: "text", placeholder: "Ingiza model ya simu mfano: Galaxy A14", required: true }
    ]),
    1, 1, 999
  );

  insertServ.run(
    imeiCatId,
    "IPHONE iCloud Clean Removal (IMEI/SN)",
    "iphone-icloud-removal",
    "Ondoa kabisa iCloud lock kwenye iPhone zilizo safi (Clean Devices pekee, zisiwe Blacklisted/Lost). Inasaidia kutoka iPhone 6 hadi 15 Pro Max.",
    45000,
    "TZS",
    "Masaa 1 - 24",
    JSON.stringify([
      { name: "imei", label: "Namba ya IMEI (15)", type: "text", placeholder: "Weka IMEI ya simu yako", required: true },
      { name: "sn", label: "Serial Number (SN)", type: "text", placeholder: "Weka Serial Number ya iPhone (Kama ipo)", required: false }
    ]),
    1, 1, 999
  );

  insertServ.run(
    imeiCatId,
    "TECNO/INFINIX/ITEL MDM Lock Bypass",
    "tecno-mdm-bypass",
    "Bypass MDM lock (Simu za mkopo au kampuni kama d.light, M-Kopa) kwenye simu zote za chipsets za MTK na SPD kwa namba ya IMEI pekee.",
    25000,
    "TZS",
    "Masaa 1 - 3",
    JSON.stringify([
      { name: "imei", label: "IMEI ya Simu (IMEI 1)", type: "text", placeholder: "Weka IMEI 1 ya simu", required: true },
      { name: "brand", label: "Chapa ya Simu (Brand)", type: "select", options: ["Tecno", "Infinix", "Itel"], required: true }
    ]),
    0, 1, 999
  );

  // Server/Activation services
  insertServ.run(
    serverCatId,
    "UnlockTool Activation - Miezi 3",
    "unlocktool-3months",
    "Activation rasmi ya UnlockTool kwa muda wa miezi mitatu. Ni zana yenye nguvu kubwa inayoweza kufungua simu karibu zote za sasa (FRP, MI Account, MDM).",
    65000,
    "TZS",
    "Dakika 10 - 20",
    JSON.stringify([
      { name: "username", label: "UnlockTool Jina la Mtumiaji (Username)", type: "text", placeholder: "Weka Username uliyosajili kwenye UnlockTool", required: true },
      { name: "email", label: "UnlockTool Email", type: "email", placeholder: "Weka Email uliyosajili", required: true }
    ]),
    1, 1, 999
  );

  insertServ.run(
    serverCatId,
    "DFT Pro Activation - Mwaka 1",
    "dft-pro-1year",
    "Kuwezesha (Activation) account yako ya DFT Pro kwa mwaka mmoja mzima. Inasaidia sana katika Xiaomi, Huawei, Samsung na Vivo.",
    185000,
    "TZS",
    "Dakika 15 - 30",
    JSON.stringify([
      { name: "username", label: "DFT Pro Username", type: "text", placeholder: "Ingiza jina lako la DFT Pro", required: true },
      { name: "email", label: "DFT Pro Email Address", type: "email", placeholder: "Ingiza email uliyojisajilia", required: true }
    ]),
    1, 1, 999
  );

  insertServ.run(
    serverCatId,
    "EFT Pro Dongle / Tool Activation - Mwaka 1",
    "eft-pro-1year",
    "Weka upya leseni (renew) ya EFT Pro Tool/Dongle kwa mwaka mmoja. Inatambulika kwa uwezo wake mkubwa wa kuandika vyeti na kuflash simu za Samsung.",
    110000,
    "TZS",
    "Dakika 10 - 30",
    JSON.stringify([
      { name: "username", label: "EFT Pro Username/Serial Number", type: "text", placeholder: "Weka jina la akaunti au Serial Number ya kopo (Dongle SN)", required: true }
    ]),
    0, 1, 999
  );

  // Rental services
  insertServ.run(
    rentalCatId,
    "Kodi UnlockTool - Masaa 3",
    "rent-unlocktool-3h",
    "Kodisha akaunti ya UnlockTool kwa masaa 3. Utapokea taarifa za kuingia (Username, Password na OTP Token) mara baada ya kulipia ili umalize kazi za wateja wako.",
    4500,
    "TZS",
    "Papo hapo (Automatic)",
    JSON.stringify([
      { name: "notes", label: "Mawasiliano ya haraka ya WhatsApp", type: "text", placeholder: "Weka namba ya WhatsApp (Mfano: 0712345678) kupokea login token kwa haraka", required: true }
    ]),
    1, 1, 50
  );

  insertServ.run(
    rentalCatId,
    "Kodi DFT Pro - Masaa 6",
    "rent-dftpro-6h",
    "Kodisha DFT Pro kwa saa 6. Pata access mara moja kwenye kompyuta yako kupitia mfumo wetu salama wa sharing au direct credentials.",
    7500,
    "TZS",
    "Papo hapo (Automatic)",
    JSON.stringify([
      { name: "notes", label: "Namba ya WhatsApp", type: "text", placeholder: "Namba yako ya WhatsApp kwa ajili ya usaidizi", required: true }
    ]),
    0, 1, 20
  );
}

// Custom Rate Limiter
const ipLimits = new Map<string, { count: number; resetAt: number }>();
function rateLimiter(limit: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const now = Date.now();
    let record = ipLimits.get(ip);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      ipLimits.set(ip, record);
    } else {
      record.count++;
    }
    if (record.count > limit) {
      return res.status(429).json({ error: "Maombi yako ni mengi mno kwa sasa. Tafadhali subiri kidogo na ujaribu tena." });
    }
    next();
  };
}

// Authentication Middlewares
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unatakiwa kuingia kwenye akaunti yako kwanza." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Muda wa tokeni yako umekwisha au haitambuliwi. Ingia tena." });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req: any, res: any, next: any) {
  authenticateToken(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Ruhusa inakataliwa. Kipengele hiki ni kwa ajili ya Admin pekee." });
    }
    next();
  });
}

// API: Authentication Routes
app.post("/api/auth/register", rateLimiter(15, 60000), (req, res) => {
  const { name, email, phone, password, adminSecret } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: "Tafadhali jaza taarifa zote zinazohitajika." });
  }

  // Determine user role
  let role = "customer";
  if (adminSecret) {
    if (adminSecret === ADMIN_SETUP_KEY) {
      role = "admin";
    } else {
      return res.status(400).json({ error: "Siri ya kuanzisha akaunti ya Admin (Setup Key) si sahihi." });
    }
  }

  try {
    const password_hash = bcrypt.hashSync(password, 10);
    const insert = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    const result = insert.run(name, email, phone, password_hash, role);
    
    // Create JWT
    const token = jwt.sign(
      { id: result.lastInsertRowid, email, name, role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Usajili umekamilika kikamilifu!",
      token,
      user: { id: result.lastInsertRowid, name, email, phone, role }
    });
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).json({ error: "Barua pepe (Email) hii imeshatumika na mtumiaji mwingine." });
    }
    res.status(500).json({ error: "Imeshindikana kusajili akaunti. Jaribu tena." });
  }
});

app.post("/api/auth/login", rateLimiter(20, 60000), (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Tafadhali weka barua pepe (Email) na neno la siri (Password)." });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      return res.status(401).json({ error: "Barua pepe au neno la siri si sahihi." });
    }

    if (user.is_active === 0) {
      return res.status(403).json({ error: "Akaunti yako imesimamishwa kwa sasa. Wasiliana na msaada wa SaanGSM." });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Barua pepe au neno la siri si sahihi." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Umeingia kwenye akaunti kwa mafanikio!",
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: "Kuna matatizo kwenye server wakati wa kuingia. Jaribu tena." });
  }
});

app.get("/api/auth/me", authenticateToken, (req: any, res: any) => {
  try {
    const user = db.prepare("SELECT id, name, email, phone, role, is_active FROM users WHERE id = ?").get(req.user.id) as any;
    if (!user) {
      return res.status(404).json({ error: "Mtumiaji hajapatikana." });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Kuna tatizo katika kupata taarifa za mtumiaji." });
  }
});

// API: Categories Routes
app.get("/api/categories", (req, res) => {
  try {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: "Kuna tatizo katika kupata kategoria za huduma." });
  }
});

// API: Services Routes
app.get("/api/services", (req, res) => {
  const { type, category_id, search, featured } = req.query;

  try {
    let queryStr = `
      SELECT s.*, c.name as category_name, c.type as category_type 
      FROM services s
      JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = 1
    `;
    const params: any[] = [];

    if (type) {
      queryStr += " AND c.type = ?";
      params.push(type);
    }
    if (category_id) {
      queryStr += " AND s.category_id = ?";
      params.push(category_id);
    }
    if (featured) {
      queryStr += " AND s.is_featured = ?";
      params.push(Number(featured));
    }
    if (search) {
      queryStr += " AND (s.title LIKE ? OR s.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    queryStr += " ORDER BY s.is_featured DESC, s.id DESC";

    const services = db.prepare(queryStr).all(...params);
    res.json({ services });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kupata orodha ya huduma." });
  }
});

app.get("/api/services/:slug", (req, res) => {
  const { slug } = req.params;

  try {
    const service = db.prepare(`
      SELECT s.*, c.name as category_name, c.type as category_type 
      FROM services s
      JOIN categories c ON s.category_id = c.id
      WHERE s.slug = ? AND s.is_active = 1
    `).get(slug) as any;

    if (!service) {
      return res.status(404).json({ error: "Huduma iliyotafutwa haipo au haijawahi kuwezeshwa." });
    }

    res.json({ service });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kupata maelezo ya huduma." });
  }
});

// API: Orders Routes
app.post("/api/orders", authenticateToken, (req: any, res: any) => {
  const { service_id, quantity, customer_input } = req.body;

  if (!service_id) {
    return res.status(400).json({ error: "Tafadhali taja huduma unayohitaji kuagiza." });
  }

  const qty = quantity ? Number(quantity) : 1;

  try {
    // Check if service exists
    const service = db.prepare("SELECT * FROM services WHERE id = ? AND is_active = 1").get(service_id) as any;
    if (!service) {
      return res.status(404).json({ error: "Huduma hiyo haipatikani kwa sasa." });
    }

    // Verify stock if rental
    if (service.stock !== null && service.stock < qty) {
      return res.status(400).json({ error: "Gharama yako inashindwa kwa sababu huduma hii haina nafasi ya kutosha kwa sasa." });
    }

    // Dynamic field validation
    if (service.requires_input) {
      const requiredFields = JSON.parse(service.requires_input);
      const inputs = customer_input || {};
      for (const field of requiredFields) {
        if (field.required && (!inputs[field.name] || inputs[field.name].trim() === "")) {
          return res.status(400).json({ error: `Tafadhali jaza nyanja ya: ${field.label}` });
        }
      }
    }

    // Generate reference code e.g. SAAN-2026-X1Y2Z
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const order_ref = `SAAN-2026-${randomHex}`;
    const total_amount = service.price * qty;

    const insert = db.prepare(`
      INSERT INTO orders (order_ref, user_id, service_id, quantity, unit_price, total_amount, customer_input, status, admin_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?)
    `);

    const result = insert.run(
      order_ref,
      req.user.id,
      service_id,
      qty,
      service.price,
      total_amount,
      JSON.stringify(customer_input || {}),
      ""
    );

    res.status(201).json({
      message: "Oda yako imetengenezwa kwa ufanisi! Tafadhali fanya malipo ili ianze kufanyiwa kazi.",
      order_id: result.lastInsertRowid,
      order_ref,
      total_amount
    });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kusajili oda yako kwenye mfumo wetu." });
  }
});

app.get("/api/orders/my", authenticateToken, (req: any, res: any) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, s.title as service_title, s.delivery_label, c.type as service_type
      FROM orders o
      JOIN services s ON o.service_id = s.id
      JOIN categories c ON s.category_id = c.id
      WHERE o.user_id = ?
      ORDER BY o.id DESC
    `).all(req.user.id);

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kupata historia yako ya oda." });
  }
});

app.get("/api/orders/:ref", authenticateToken, (req: any, res: any) => {
  const { ref } = req.params;

  try {
    // A customer can view their own, Admin can view any
    let order;
    if (req.user.role === "admin") {
      order = db.prepare(`
        SELECT o.*, s.title as service_title, s.delivery_label, s.description as service_desc, 
               u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
               c.type as service_type, c.name as category_name
        FROM orders o
        JOIN services s ON o.service_id = s.id
        JOIN categories c ON s.category_id = c.id
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.order_ref = ?
      `).get(ref) as any;
    } else {
      order = db.prepare(`
        SELECT o.*, s.title as service_title, s.delivery_label, s.description as service_desc,
               c.type as service_type, c.name as category_name
        FROM orders o
        JOIN services s ON o.service_id = s.id
        JOIN categories c ON s.category_id = c.id
        WHERE o.order_ref = ? AND o.user_id = ?
      `).get(ref, req.user.id) as any;
    }

    if (!order) {
      return res.status(404).json({ error: "Oda haijapatikana au huna haki ya kuiona." });
    }

    // Retrieve active rental info if exists and status is paid/processing/completed
    let rental = null;
    if (order.service_type === "rental") {
      rental = db.prepare("SELECT * FROM rentals WHERE order_id = ?").get(order.id) as any;
    }

    res.json({ order, rental });
  } catch (error) {
    res.status(500).json({ error: "Hitilafu imetokea wakati wa kupata taarifa za oda." });
  }
});

// API: Payments Routes
app.post("/api/payments/initiate", authenticateToken, (req: any, res: any) => {
  const { order_ref, provider, phone_number } = req.body;

  if (!order_ref || !provider || !phone_number) {
    return res.status(400).json({ error: "Tafadhali taja namba ya oda, mtandao wa malipo, na namba ya simu ya kufanyia malipo." });
  }

  try {
    // Get order
    const order = db.prepare("SELECT * FROM orders WHERE order_ref = ? AND user_id = ?").get(order_ref, req.user.id) as any;
    if (!order) {
      return res.status(404).json({ error: "Oda haijapatikana." });
    }

    if (order.status !== "pending_payment") {
      return res.status(400).json({ error: "Oda hii tayari imeshalipiwa au imefutwa." });
    }

    // Save dynamic mobile payment initiation
    const ext_trans_id = `TXN-${provider.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const insertPayment = db.prepare(`
      INSERT INTO payments (order_id, provider, phone_number, amount, external_transaction_id, status, raw_response)
      VALUES (?, ?, ?, ?, ?, 'initiated', ?)
    `);

    insertPayment.run(
      order.id,
      provider,
      phone_number,
      order.total_amount,
      ext_trans_id,
      JSON.stringify({ status: "initiated", message: "Push sent to client" })
    );

    // Dynamic payment simulation (Tanzania mobile networks USSD push takes a few seconds)
    // We launch a timer in the backend to simulate a successful client PIN approval in 5 seconds.
    // For specialized testing, if the phone number ends with "0000", we simulate a dynamic transaction failure (insufficient funds/cancelled).
    const isFailSim = phone_number.endsWith("0000");

    setTimeout(() => {
      try {
        const paymentDb = new Database("saangsm.db");
        paymentDb.pragma("foreign_keys = ON");

        // Find payment
        const paymentRecord = paymentDb.prepare("SELECT * FROM payments WHERE external_transaction_id = ?").get(ext_trans_id) as any;
        if (paymentRecord && paymentRecord.status === "initiated") {
          const finalStatus = isFailSim ? "failed" : "success";
          
          // Update payment record
          paymentDb.prepare("UPDATE payments SET status = ?, raw_response = ? WHERE id = ?").run(
            finalStatus,
            JSON.stringify({ status: finalStatus, callback_received: true, timestamp: new Date().toISOString() }),
            paymentRecord.id
          );

          if (finalStatus === "success") {
            // Update order status
            paymentDb.prepare("UPDATE orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(paymentRecord.order_id);

            // Fetch order and check if service is rental
            const orderRecord = paymentDb.prepare(`
              SELECT o.*, s.title as service_title, c.type as service_type
              FROM orders o
              JOIN services s ON o.service_id = s.id
              JOIN categories c ON s.category_id = c.id
              WHERE o.id = ?
            `).get(paymentRecord.order_id) as any;

            if (orderRecord && orderRecord.service_type === "rental") {
              // Automatically provision rental account credentials!
              const starts = new Date();
              const expires = new Date();
              
              // Determine rental hours from service title
              let hours = 3;
              if (orderRecord.service_title.includes("6h") || orderRecord.service_title.includes("Masaa 6")) {
                hours = 6;
              } else if (orderRecord.service_title.includes("12h") || orderRecord.service_title.includes("Masaa 12")) {
                hours = 12;
              } else if (orderRecord.service_title.includes("24h") || orderRecord.service_title.includes("Siku 1")) {
                hours = 24;
              }

              expires.setHours(expires.getHours() + hours);

              // Standard GSM Sharing Tool simulated credentials
              const toolsAccounts = [
                { user: "SaanGSM_VIP_01", pass: "UnlockSuccess2026!", key: "UT_KEY_88F0A2B9" },
                { user: "SaanGSM_VIP_02", pass: "DFTProSecure88!", key: "DFT_KEY_AC49E012" },
                { user: "SaanGSM_VIP_03", pass: "TanzaniaGSM99!", key: "TSM_KEY_F902BB81" }
              ];
              const randomAcc = toolsAccounts[Math.floor(Math.random() * toolsAccounts.length)];
              const credentialsText = `Zana: ${orderRecord.service_title}\nUsername: ${randomAcc.user}\nPassword: ${randomAcc.pass}\nOTP Tool Token: ${randomAcc.key}\nPakua App: https://saangsm.com/downloads/sharing-client.exe\nUsaidizi wa kuanzisha: Wasiliana nasi kupitia WhatsApp 0757224250.`;

              paymentDb.prepare(`
                INSERT INTO rentals (order_id, tool_name, access_credentials, starts_at, expires_at, status)
                VALUES (?, ?, ?, ?, ?, 'active')
              `).run(
                orderRecord.id,
                orderRecord.service_title,
                credentialsText,
                starts.toISOString(),
                expires.toISOString()
              );

              // Update order to 'completed' as rental is fully automated and credentials are sent!
              paymentDb.prepare("UPDATE orders SET status = 'completed', admin_notes = 'Muda wako wa kukodisha umeanza rasmi!', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(orderRecord.id);
            } else {
              // Non-rentals: Update to 'processing' so Admin can process manual requests (IMEI/FRP bypass, Activations)
              paymentDb.prepare("UPDATE orders SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(paymentRecord.order_id);
            }
          } else {
            // Insufficient money or cancelled sim
            paymentDb.prepare("UPDATE orders SET status = 'failed', admin_notes = 'Malipo yamekataliwa na mtandao wa simu (Salio halitoshi au umeghairi)', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(paymentRecord.order_id);
          }
        }
        paymentDb.close();
      } catch (err) {
        console.error("Payment simulation worker background error:", err);
      }
    }, 5000);

    res.json({
      message: "Push ya malipo imetumwa kwenye simu yako! Tafadhali weka PIN ya mtandao wako ili kukamilisha malipo.",
      external_transaction_id: ext_trans_id,
      order_ref
    });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kuanzisha mchakato wa kupokea malipo." });
  }
});

app.post("/api/payments/callback", (req, res) => {
  // Webhook endpoint to simulate real aggregator callbacks (AzamPay, Selcom etc)
  const { external_transaction_id, status, error_reason } = req.body;

  try {
    const payment = db.prepare("SELECT * FROM payments WHERE external_transaction_id = ?").get(external_transaction_id) as any;
    if (!payment) {
      return res.status(404).json({ error: "Muamala haukupatikana kwenye mfumo." });
    }

    if (payment.status !== "initiated") {
      return res.json({ message: "Muamala tayari ulishasindikizwa." });
    }

    const finalStatus = status === "SUCCESS" ? "success" : "failed";

    db.prepare("UPDATE payments SET status = ?, raw_response = ? WHERE id = ?").run(
      finalStatus,
      JSON.stringify(req.body),
      payment.id
    );

    if (finalStatus === "success") {
      db.prepare("UPDATE orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(payment.order_id);
      
      // Auto handle rentals if needed
      const orderRecord = db.prepare(`
        SELECT o.*, s.title as service_title, c.type as service_type
        FROM orders o
        JOIN services s ON o.service_id = s.id
        JOIN categories c ON s.category_id = c.id
        WHERE o.id = ?
      `).get(payment.order_id) as any;

      if (orderRecord && orderRecord.service_type === "rental") {
        const starts = new Date();
        const expires = new Date();
        expires.setHours(expires.getHours() + 3); // Default 3 hours

        const creds = `Username: SaanGSM_Callback\nPassword: Success77\nExpiry: ${expires.toLocaleTimeString()}`;
        db.prepare(`
          INSERT INTO rentals (order_id, tool_name, access_credentials, starts_at, expires_at, status)
          VALUES (?, ?, ?, ?, ?, 'active')
        `).run(orderRecord.id, orderRecord.service_title, creds, starts.toISOString(), expires.toISOString());

        db.prepare("UPDATE orders SET status = 'completed', admin_notes = 'Malipo yamepokelewa kupitia callback, rental imeamilishwa.', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(orderRecord.id);
      } else {
        db.prepare("UPDATE orders SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(payment.order_id);
      }
    } else {
      db.prepare("UPDATE orders SET status = 'failed', admin_notes = ? WHERE id = ?").run(
        error_reason || "Malipo yameshindikana kupitia callback.",
        payment.order_id
      );
    }

    res.json({ status: "accepted", message: "Callback processed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kusindika callback." });
  }
});

app.get("/api/payments/status/:orderRef", authenticateToken, (req: any, res: any) => {
  const { orderRef } = req.params;

  try {
    const order = db.prepare(`
      SELECT o.id, o.order_ref, o.status, o.total_amount, o.admin_notes,
             s.title as service_title, c.type as service_type
      FROM orders o
      JOIN services s ON o.service_id = s.id
      JOIN categories c ON s.category_id = c.id
      WHERE o.order_ref = ? AND o.user_id = ?
    `).get(orderRef, req.user.id) as any;

    if (!order) {
      return res.status(404).json({ error: "Oda haijapatikana." });
    }

    const payment = db.prepare("SELECT status, provider, created_at, external_transaction_id FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1").get(order.id) as any;
    const rental = db.prepare("SELECT * FROM rentals WHERE order_id = ?").get(order.id) as any;

    res.json({
      order_ref: order.order_ref,
      status: order.status,
      admin_notes: order.admin_notes,
      payment: payment || null,
      rental: rental || null
    });
  } catch (error) {
    res.status(500).json({ error: "Kushindwa kupata hali ya malipo." });
  }
});

// ==========================================
// ADMIN ROUTES (Protected, requireAdmin)
// ==========================================

// Dashboard stats
app.get("/api/admin/stats", requireAdmin, (req, res) => {
  try {
    const revenue = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status IN ('paid', 'processing', 'completed')").get() as any;
    const orderCounts = db.prepare("SELECT status, COUNT(*) as count FROM orders GROUP BY status").all();
    const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get() as any;
    const recentOrders = db.prepare(`
      SELECT o.*, u.name as customer_name, s.title as service_title
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      JOIN services s ON o.service_id = s.id
      ORDER BY o.id DESC LIMIT 10
    `).all();

    res.json({
      stats: {
        total_revenue: revenue.total || 0,
        orders_by_status: orderCounts,
        customers_count: totalCustomers.count,
        recent_orders: recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kupata takwimu za dashboard." });
  }
});

// CRUD: Categories
app.get("/api/admin/categories", requireAdmin, (req, res) => {
  try {
    const categories = db.prepare("SELECT * FROM categories ORDER BY id DESC").all();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kupata orodha ya kategoria." });
  }
});

app.post("/api/admin/categories", requireAdmin, (req, res) => {
  const { name, slug, type, description } = req.body;
  if (!name || !slug || !type) {
    return res.status(400).json({ error: "Jina, slug, na aina ya kategoria vinahitajika." });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO categories (name, slug, type, description) VALUES (?, ?, ?, ?)
    `);
    const result = insert.run(name, slug, type, description || "");
    res.status(201).json({ message: "Kategoria imeongezwa kikamilifu!", id: result.lastInsertRowid });
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).json({ error: "Kategoria yenye slug hii tayari ipo." });
    }
    res.status(500).json({ error: "Mtatizo kwenye database wakati wa kuhifadhi." });
  }
});

app.put("/api/admin/categories/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, slug, type, description } = req.body;

  if (!name || !slug || !type) {
    return res.status(400).json({ error: "Jina, slug na aina ya kategoria vinahitajika." });
  }

  try {
    db.prepare(`
      UPDATE categories SET name = ?, slug = ?, type = ?, description = ? WHERE id = ?
    `).run(name, slug, type, description || "", id);
    res.json({ message: "Kategoria imeboreshwa kikamilifu!" });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kurekebisha kategoria." });
  }
});

app.delete("/api/admin/categories/:id", requireAdmin, (req, res) => {
  const { id } = req.params;

  try {
    db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    res.json({ message: "Kategoria imefutwa kikamilifu!" });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kufuta kategoria." });
  }
});

// CRUD: Services
app.get("/api/admin/services", requireAdmin, (req, res) => {
  try {
    const services = db.prepare(`
      SELECT s.*, c.name as category_name, c.type as category_type
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      ORDER BY s.id DESC
    `).all();
    res.json({ services });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kupata orodha ya huduma." });
  }
});

app.post("/api/admin/services", requireAdmin, (req, res) => {
  const { category_id, title, slug, description, price, delivery_label, requires_input, is_featured, is_active, stock } = req.body;

  if (!category_id || !title || !slug || price === undefined || !delivery_label) {
    return res.status(400).json({ error: "Tafadhali jaza taarifa zote kuu za huduma." });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO services (category_id, title, slug, description, price, delivery_label, requires_input, is_featured, is_active, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      category_id,
      title,
      slug,
      description || "",
      price,
      delivery_label,
      requires_input || "[]",
      is_featured ? 1 : 0,
      is_active ? 1 : 0,
      stock !== undefined ? stock : 999
    );

    res.status(201).json({ message: "Huduma mpya imeandaliwa!", id: result.lastInsertRowid });
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).json({ error: "Huduma yenye slug hii tayari ipo." });
    }
    res.status(500).json({ error: "Hitilafu wakati wa kuunda huduma." });
  }
});

app.put("/api/admin/services/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { category_id, title, slug, description, price, delivery_label, requires_input, is_featured, is_active, stock } = req.body;

  if (!category_id || !title || !slug || price === undefined || !delivery_label) {
    return res.status(400).json({ error: "Tafadhali jaza taarifa zote kuu za huduma." });
  }

  try {
    db.prepare(`
      UPDATE services 
      SET category_id = ?, title = ?, slug = ?, description = ?, price = ?, delivery_label = ?, 
          requires_input = ?, is_featured = ?, is_active = ?, stock = ?
      WHERE id = ?
    `).run(
      category_id,
      title,
      slug,
      description || "",
      price,
      delivery_label,
      requires_input || "[]",
      is_featured ? 1 : 0,
      is_active ? 1 : 0,
      stock !== undefined ? stock : 999,
      id
    );
    res.json({ message: "Huduma imeboreshwa kikamilifu!" });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kusasisha huduma." });
  }
});

app.delete("/api/admin/services/:id", requireAdmin, (req, res) => {
  const { id } = req.params;

  try {
    db.prepare("DELETE FROM services WHERE id = ?").run(id);
    res.json({ message: "Huduma imefutwa kikamilifu!" });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kufuta huduma." });
  }
});

// Admin: Manage orders (GET all + PATCH status)
app.get("/api/admin/orders", requireAdmin, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone, 
             s.title as service_title, c.type as service_type
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      JOIN services s ON o.service_id = s.id
      JOIN categories c ON s.category_id = c.id
      ORDER BY o.id DESC
    `).all();

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kupata orodha ya oda zote." });
  }
});

app.patch("/api/admin/orders/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status, admin_notes, access_credentials } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Tafadhali weka hali (Status) ya oda." });
  }

  try {
    db.prepare(`
      UPDATE orders 
      SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(status, admin_notes || "", id);

    // If order was manual activation or IMEI bypass, and we completed it:
    // We can provision credentials in rentals if requested, or simply notify the user.
    if (access_credentials && status === "completed") {
      // Check if rental already exists
      const rental = db.prepare("SELECT id FROM rentals WHERE order_id = ?").get(id) as any;
      if (rental) {
        db.prepare("UPDATE rentals SET access_credentials = ?, status = 'active' WHERE order_id = ?").run(access_credentials, id);
      } else {
        const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as any;
        if (order) {
          const service = db.prepare("SELECT title FROM services WHERE id = ?").get(order.service_id) as any;
          db.prepare(`
            INSERT INTO rentals (order_id, tool_name, access_credentials, starts_at, expires_at, status)
            VALUES (?, ?, ?, ?, ?, 'active')
          `).run(
            id,
            service ? service.title : "GSM Tool",
            access_credentials,
            new Date().toISOString(),
            new Date(Date.now() + 24*60*60*1000).toISOString() // Default 24h for manual active
          );
        }
      }
    }

    res.json({ message: "Oda imesasishwa kwa ufanisi!" });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kusasisha oda ya mteja." });
  }
});

// Admin: Manage Customers
app.get("/api/admin/customers", requireAdmin, (req, res) => {
  try {
    const customers = db.prepare("SELECT id, name, email, phone, role, is_active FROM users ORDER BY id DESC").all();
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kupata orodha ya wateja." });
  }
});

app.patch("/api/admin/customers/:id/toggle", requireAdmin, (req, res) => {
  const { id } = req.params;

  try {
    const user = db.prepare("SELECT is_active, role FROM users WHERE id = ?").get(id) as any;
    if (!user) {
      return res.status(404).json({ error: "Mtumiaji hajapatikana." });
    }

    if (user.role === "admin") {
      return res.status(400).json({ error: "Huwezi kusimamisha akaunti ya Admin mwingine hapa." });
    }

    const nextState = user.is_active === 1 ? 0 : 1;
    db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(nextState, id);

    res.json({ message: nextState === 1 ? "Mteja ameruhusiwa kutumia mfumo tena." : "Mteja amesimamishwa kutumia mfumo." });
  } catch (error) {
    res.status(500).json({ error: "Imeshindikana kubadili hali ya mteja." });
  }
});


// ==========================================
// VITE OR STATIC FILE MIDDLEWARE INITIALIZATION
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SaanGSM] Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer();
