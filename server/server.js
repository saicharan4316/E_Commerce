import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import cors from "cors";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import { Redis } from "@upstash/redis";
import Razorpay from "razorpay";
dotenv.config();
// Upstash Redis Client
const redisClient = new Redis({
  url:process.env.UPSTASH_REDIS_REST_URL || "https://glad-wallaby-5351.upstash.io",
  token:process.env.UPSTASH_REDIS_REST_TOKEN || "ARTnAAImcDJjNzg0N2YwOWVjOWI0ZGMwYjczMzc0MGRlZmQzNzY2Y3AyNTM1MQ",
});

const app = express();
const port = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'https://e-commerce-api-cb8d.onrender.com';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.get('/auth/google/callback', async (req, res) => {
  res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
});

const JWT_SECRET = process.env.JWT_SECRET || "jwt-secret";

// Rate Limiter Middleware
const rateLimiter = (limit, window) => {
  return async (req, res, next) => {
    try {
      const userId = req.headers["x-user-id"] || req.ip;
      const key = `ratelimit:${userId}:${req.path}`;
      const current = await redisClient.incr(key);
      if (current === 1) await redisClient.expire(key, window);
      if (current > limit) {
        const ttl = await redisClient.ttl(key);
        return res.status(429).json({ message: `Too many requests. Try again in ${ttl} seconds.` });
      }
      next();
    } catch (err) {
      next();
    }
  };
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://e-commerce-chi-three-69.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/login_with_google/authentication`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        let existingUser = null;

        try {
          const response = await axios.get(
            `${API_URL}/check_user?email=${email}`,
            {
              timeout: 30000,
              headers: { 'Content-Type': 'application/json' }
            }
          );
          existingUser = response.data;
        } catch (err) {
          if (err.response && err.response.status === 404) {
            console.log('User not found, will create new user');
          } else if (err.code === 'ECONNABORTED') {
            return done(new Error('API timeout - server waking up. Try again in 30 seconds.'));
          } else {
            throw err;
          }
        }
        if (existingUser && existingUser.email) {
          const token = jwt.sign(
            {
              email: existingUser.email,
              name: existingUser.name,
              customer_id: existingUser.customer_id || existingUser.id
            },
            JWT_SECRET,
            { expiresIn: "24h" }
          );
          return done(null, { ...existingUser, token });
        }
        const dummyPassword = bcrypt.hashSync(Math.random().toString(36).slice(-8), 10);
        const newUser = {
          googleId: profile.id,
          name: name,
          email: email,
          password: dummyPassword
        };

        const createdUser = await axios.post(
          `${API_URL}/user`,
          newUser,
          {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
          }
        );

        const token = jwt.sign(
          {
            email: createdUser.data.email,
            name: createdUser.data.name,
            customer_id: createdUser.data.customer_id || createdUser.data.id
          },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        return done(null, { ...createdUser.data, token });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((user, cb) => cb(null, user));

// ----------------------
// Google Login
// ----------------------
app.get("/login_with_google", passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" }));

app.get('/login_with_google/authentication',
  passport.authenticate('google', { 
    failureRedirect: `${FRONTEND_URL}/login`,
    session: false 
  }),
  (req, res) => {
    try {
      const token = req.user.token;
      const userData = encodeURIComponent(JSON.stringify({
        email: req.user.email,
        name: req.user.name,
        phone:req.user.phone,
        addesss:req.user.address,
        customer_id: req.user.customer_id || req.user.id
      }));
    
      res.redirect(`${FRONTEND_URL}/google_callback?token=${token}&user=${userData}`);
    } catch (error) {
      res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

// ----------------------
// 🔹 LOGIN
// ----------------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const response = await axios.post(`${API_URL}/api/login`, { email, password }, {
  headers: { "Content-Type": "application/json" }
});
    const microUser = response.data; 

    if (!microUser) return res.status(404).json({ message: "User not found" });
const token = microUser.token || jwt.sign(
      { customer_id: microUser.customer_id, email: microUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, user: microUser });

  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || "Login failed";
    res.status(status).json({ message });
  }
});

// ----------------------
// 🔹 SIGNUP
// ----------------------
app.post("/signup", async (req, res) => {
  try {
    const { name, mobile, email, address, password } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 10);

    const params = new URLSearchParams({ 
      name, 
      mobile, 
      email, 
      address, 
      password: hashedPassword 
    }).toString();

    const response = await axios.post(`${API_URL}/signup`, params, { 
      headers: { "Content-Type": "application/x-www-form-urlencoded" } 
    });

    if (!response.data?.encodedUser) 
      return res.status(500).json({ message: "Signup failed" });

    const microUser = JSON.parse(decodeURIComponent(response.data.encodedUser));

    const token = jwt.sign(
      { customer_id: microUser.customer_id, name: microUser.name, email: microUser.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ user: microUser, token });

  } catch (err) {
    res.status(500).json({ message: err.response?.data?.message || "Signup failed" });
  }
});


// ----------------------
// Profile Editing
// ----------------------
app.put("/profile/update", rateLimiter(5, 60), async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Missing token" });

    const apiRes = await axios.put(`${API_URL}/profile/update`, req.body, { headers: { Authorization: token } });
    res.json(apiRes.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ message: err.response?.data?.message || "Error updating profile" });
  }
});

app.post("/send-otp", rateLimiter(3, 60), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });
    const token = authHeader.split(" ")[1];

    const apiRes = await axios.post(`${API_URL}/send-otp`, req.body, { headers: { Authorization: `Bearer ${token}` } });
    res.json(apiRes.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ message: err.message });
  }
});

app.patch("/profile/update-password",  async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "No token" });
console.log(req.body);
    const apiRes = await axios.patch(`${API_URL}/profile/update-password`, req.body, { headers: { Authorization: token } });
    res.json(apiRes.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ message: err.message });
  }
});

// ----------------------
// Logout
// ----------------------
app.get("/logout", (req, res) => res.json({ message: "Logged out successfully" }));

// ----------------------
// Products
// ----------------------
app.get("/products", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  try {
    const result = await axios.get(`${API_URL}/products`, { params: { limit, offset } });
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/products/Display_product", async (req, res) => {
  const productId = parseInt(req.query.productId);
  if (!productId) return res.status(400).json({ error: "Missing productId" });

  try {
    const result = await axios.get(`${API_URL}/products/Display_product`, { params: { productId } });
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------
// Search with caching
// ----------------------
app.get("/search", async (req, res) => {
  try {
    const query = req.query.query || "";
    const authHeader = req.headers.authorization;
    const cacheKey = `search:${query}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) return res.json(cachedData);
    const apiRes = await axios.get(`${API_URL}/search?query=${encodeURIComponent(query)}`, { headers: { Authorization: authHeader } });
    await redisClient.set(cacheKey, apiRes.data, { ex: 3600 });
    res.json(apiRes.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ message: "Search failed" });
  }
});

// ----------------------
// Cart Operations
// ----------------------
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error("No token provided");
  const token = authHeader.split(" ")[1];
  return jwt.verify(token, JWT_SECRET);
};

app.post("/cart", async (req, res) => {
  try {
    verifyToken(req);
    
    console.log('🔄 Proxying cart request to API...');
    
    const apiRes = await axios.post(
      `${API_URL}/cart`, 
      req.body, 
      { 
        headers: { Authorization: req.headers.authorization },
        timeout: 30000  // ✅ 30 second timeout for Neon
      }
    );
    
    console.log('✅ API response received');
    res.json(apiRes.data);
    
  } catch (err) {
    console.error('❌ Cart proxy error:', err.message);
    
    if (err.code === 'ECONNABORTED') {
      res.status(504).json({ message: 'Request timed out' });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
});


app.delete("/cart/:productId", async (req, res) => {
  try {
    verifyToken(req);
    const apiRes = await axios.delete(`${API_URL}/cart/${req.params.productId}`, { headers: { Authorization: req.headers.authorization } });
    res.json(apiRes.data);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});

app.delete("/cart/clear/:customerId", async (req, res) => {
  try {
    verifyToken(req);
    const apiRes = await axios.delete(`${API_URL}/cart/clear/${req.params.customerId}`, {
      headers: { Authorization: req.headers.authorization },
    });
    res.json(apiRes.data);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});

app.get("/cart/:customerId", async (req, res) => {
  try {
    verifyToken(req);
    const apiRes = await axios.get(`${API_URL}/cart/${req.params.customerId}`, {
      headers: { Authorization: req.headers.authorization },
    });
    res.json(apiRes.data);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});

// ----------------------
// Filter Products with Pagination
// ----------------------
app.get("/filter/products",  async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Missing auth token" });
    let { minPrice, maxPrice, category, limit, offset } = req.query;
    minPrice = minPrice || 0;
    limit = parseInt(limit) || 10;
    offset = parseInt(offset) || 0;

    let params = `?minPrice=${minPrice}&limit=${limit}&offset=${offset}`;
    if (maxPrice) params += `&maxPrice=${maxPrice}`;
    if (category) params += `&category=${encodeURIComponent(category)}`;

    const apiRes = await axios.get(`${API_URL}/api/filter/products${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json(apiRes.data || []);
  } catch (err) {
    res.status(err.response?.status || 500).json({ message: err.response?.data?.message || "Error fetching products" });
  }
});

// ----------------------
// Orders
// ----------------------
app.get("/orders", async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { customer_id } = req.query;
    if (!token) return res.status(401).json({ message: "No token provided" });
    if (!customer_id) return res.status(400).json({ message: "Customer ID missing" });

    const apiRes = await axios.get(`${API_URL}/orders`, {
      headers: { Authorization: token },
      params: { customer_id },
    });

    res.json(apiRes.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

// ----------------------
// Create Order
// ----------------------
app.post("/create-order", rateLimiter(3, 200), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const token = authHeader.split(" ")[1];

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) reject({ status: 401, message: "Invalid token" });
        else resolve(decoded);
      });
    });

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Cart is empty or invalid amount" });
    }
const amountInPaise = Math.round(amount * 100); 
const options = {
  amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ order, key_Id: process.env.RAZORPAY_KEY_ID });

  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Server error creating order",
    });
  }
});


// ----------------------
// Verify Payment
// ----------------------
app.post("/verify/payment", rateLimiter(3, 200), async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest === razorpay_signature) {
      res.status(200).json({ success: true, message: "Payment verified", customer: decoded });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature. Payment verification failed." });
    }
  });
});

// ----------------------
// Start Server
// ----------------------
app.listen(port, () => console.log(`Server running on port ${port}`));

