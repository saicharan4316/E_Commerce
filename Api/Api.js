import express from "express";
import cors from "cors";
import { Pool } from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import util from "util";

dotenv.config();

const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.API_PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "jwt-secret";

// Database setup
const db = new Pool({
  connectionString: process.env.DATA_BASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
 
  max: 10,                        
  idleTimeoutMillis: 20000,      
  connectionTimeoutMillis: 30000, 
  statement_timeout: 30000,      
  query_timeout: 30000,         
  keepAlive: true,                
  keepAliveInitialDelayMillis: 10000
});

const queryWithRetry = async (text, params, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await db.query(text, params);
      return result;
    } catch (err) {
      console.error(`Query attempt ${i + 1} failed:`, err.message);
 
      if (i < retries && (
        err.code === 'ECONNRESET' || 
        err.code === '57P01' ||
        err.message.includes('Connection terminated') ||
        err.message.includes('Connection closed')
      )) {
        console.log('Retrying query after 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
     
      throw err;
    }
  }
};

db.on('error', (err) => {
  console.error('Database pool error:', err);
});

db.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log(' Database connected at:', res.rows[0].now);
  }
});


const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error("No Authorization header");
  const token = authHeader.split(" ")[1];
  if (!token) throw new Error("No token");
  return jwt.verify(token, JWT_SECRET);
};

const verifyJwt = util.promisify(jwt.verify);

// ----------------- USER ROUTES -----------------

app.get("/check_user", async (req, res) => {
  const { email } = req.query;
  try {
    const result = await db.query(
      "SELECT * FROM customers WHERE email = $1",
      [email]
    );
    if (result.rows.length > 0) return res.json(result.rows[0]);
    res.status(404).json({ message: "User not found" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/user", async (req, res) => {
  const { name, email, password } = req.body;
  const customerId = Math.floor(1000000 + Math.random() * 9000000);
  const hashedPassword = password
    ? bcrypt.hashSync(password, 10)
    : bcrypt.hashSync(Math.random().toString(36).slice(-8), 10);

  try {
    const result = await db.query(
      `INSERT INTO customers (customer_id, name, email, password) VALUES ($1, $2, $3, $4) RETURNING *`,
      [customerId, name, email, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    const result = await db.query(
      "SELECT * FROM customers WHERE LOWER(email) = $1",
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });
if (!user.password) {
  return res.status(500).json({ message: "Missing password hash" });
}
    const isMatch =await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

   const token = jwt.sign(
  { customer_id: user.customer_id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: "24h" }
);
res.json({ 
  name: user.name,
  email: user.email,
  customer_id: user.customer_id,
  address:user.address,
  phone:user.phone,
  token :token
});

  } catch (err) {

    res.status(500).json({ message: "Server error" });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { name, mobile, email, address, password } = req.body;
    const customerId = Math.floor(1000000 + Math.random() * 9000000);

    const result = await db.query(
      `INSERT INTO customers (customer_id, name, email, password, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [customerId, name, email, password, mobile, address]
    );
    const newUser = result.rows[0];
const token = jwt.sign(
  { customer_id: newUser.customer_id, email: newUser.email },
  process.env.JWT_SECRET,
  { expiresIn: "24h" }
);
    const encodedUser = encodeURIComponent(JSON.stringify(newUser));
    res.json({ encodedUser,token });
  } catch (err) {
    res.status(500).json({ message: "Signup failed" });
  }
});

app.put("/profile/update", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });
    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) return res.status(401).json({ message: "Invalid token" });

      const { name, phone, email, address } = req.body || {};
      if (!name || !phone || !email || !address) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const result = await db.query(
        "UPDATE customers SET name=$1, phone=$2, address=$3 WHERE email=$4 RETURNING *",
        [decodeURIComponent(name), decodeURIComponent(phone), decodeURIComponent(address), decodeURIComponent(email)]
      );

      res.json(result.rows[0]);
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

let otpStore = {};

app.post("/send-otp", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  jwt.verify(token, JWT_SECRET, (err) => {
    if (err) return res.status(401).json({ message: "Invalid token" });

    const email = decodeURIComponent(req.body.email);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;
    console.log(otp)
    res.json({ otp });
  });
});

app.patch("/api/profile/update-password", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  jwt.verify(token, JWT_SECRET, async () => {
    try {
      const email = decodeURIComponent(req.body.email);
      const newPassword = decodeURIComponent(req.body.password);
console.log(email,newPassword);
      if (!otpStore[email]) {
        return res.status(400).json({ message: "OTP not verified" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.query("UPDATE customers SET password=$1 WHERE email=$2", [hashedPassword, email]);

      delete otpStore[email];
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error });
      console.log(error);
    }
  });
});

// ----------------- PRODUCTS -----------------

app.get("/search", async (req, res) => {
  try {
    let query = req.query.query || "";
    query = query.trim();
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (!query) return res.json({ products: [] });
    const sqlQuery = `
      SELECT * FROM products 
      WHERE LOWER(name) LIKE $1
      LIMIT 10
    `;
    const values = [`%${query.toLowerCase()}%`];

    const dbRes = await db.query(sqlQuery, values);
    res.json({ products: dbRes.rows });
  } catch (err) {
 
    res.status(500).json({ message: "Search failed" });
  }
});


app.get("/products", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    

    const result = await db.query(
      "SELECT * FROM products ORDER BY product_id LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});


app.get("/products/Display_product", async (req, res) => {
  try {
    const product_id = parseInt(req.query.productId);
    if (!product_id) return res.status(400).json({ error: "Missing or invalid productId" });

    const result = await db.query(
      "SELECT * FROM products WHERE product_id = $1",
      [product_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/filter/products", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });
    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, async (err) => {
      if (err) return res.status(401).json({ message: "Invalid token" });

      let { minPrice, maxPrice, category, limit, offset } = req.query;
      minPrice = minPrice ? parseInt(minPrice) : 0;
      maxPrice = maxPrice && maxPrice !== "" ? parseInt(maxPrice) : null;
      limit = limit ? parseInt(limit) : 10;
      offset = offset ? parseInt(offset) : 0;

      const params = [minPrice];
      let query = `SELECT * FROM products WHERE price >= $1`;
      if (maxPrice !== null) {
        params.push(maxPrice);
        query += ` AND price <= $${params.length}`;
      }
      if (category) {
        params.push(category);
        query += ` AND category = $${params.length}`;
      }

      params.push(limit, offset);
      query += ` ORDER BY product_id LIMIT $${params.length-1} OFFSET $${params.length}`;

      try {
        const result = await db.query(query, params);
        res.json(result.rows || []);
      } catch (dbErr) {
        res.status(500).json({ message: "Database error" });
      }
    });
  } catch (error) {

    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- CART ROUTES -----------------

app.post("/cart", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No authorization header" });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET);

    const { customer_id, product_id, quantity } = req.body;

    console.log('Cart request:', { customer_id, product_id, quantity });

    if (!customer_id || !product_id || !quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ Use retry logic for Neon cold starts
    const existingItem = await queryWithRetry(
      "SELECT * FROM cart WHERE customer_id = $1 AND product_id = $2",
      [customer_id, product_id]
    );

    if (existingItem.rows.length > 0) {
      await queryWithRetry(
        "UPDATE cart SET quantity = quantity + $1 WHERE customer_id = $2 AND product_id = $3",
        [quantity, customer_id, product_id]
      );
      console.log('✅ Updated existing cart item');
    } else {
      await queryWithRetry(
        "INSERT INTO cart (customer_id, product_id, quantity) VALUES ($1, $2, $3)",
        [customer_id, product_id, quantity]
      );
      console.log('✅ Inserted new cart item');
    }

    const cart = await queryWithRetry(
      `SELECT c.*, p.name, p.price, p.image_url 
       FROM cart c 
       JOIN products p ON c.product_id = p.product_id 
       WHERE c.customer_id = $1`,
      [customer_id]
    );

    console.log('✅ Cart updated successfully. Items:', cart.rows.length);

    res.json({ success: true, cart: cart.rows });

  } catch (err) {
    console.error('❌ Cart POST error:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ 
      message: 'Failed to add item to cart',
      error: err.message 
    });
  }
});



app.delete("/cart/:productId", async (req, res) => {
  try {
    verifyToken(req);
    const productId = decodeURIComponent(req.params.productId);
    await db.query("DELETE FROM cart WHERE product_id=$1", [productId]);
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});

app.delete("/cart/clear/:customerId", async (req, res) => {
  try {
    verifyToken(req);
    const customerId = decodeURIComponent(req.params.customerId);
    await db.query("DELETE FROM cart WHERE customer_id=$1", [customerId]);
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});

app.get("/cart/:customerId", async (req, res) => {
  try {
    verifyToken(req);
    const customerId = decodeURIComponent(req.params.customerId);
    const result = await db.query(`
      SELECT 
        c.customer_id, 
        c.product_id, 
        c.quantity,
        p.name,
        p.price
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.customer_id = $1
    `, [customerId]);

    const encoded = result.rows.map(r => ({
      customer_id: encodeURIComponent(r.customer_id),
      product_id: encodeURIComponent(r.product_id),
      quantity: encodeURIComponent(parseInt(r.quantity)),
      name: r.name,
      price: r.price
    }));

    res.json(encoded);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});

// ----------------- ORDERS -----------------

app.get("/orders", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });

    const customerId = req.query.customer_id;
    if (!customerId) return res.status(400).json({ message: "Customer ID missing" });

    try {
      const query = `
        SELECT 
          oi.order_id,
          oi.product_id,
          p.name,
          p.price,
          p.image_url,
          oi.customer_id,
          o.order_date,
          o.status
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.customer_id = $1
        ORDER BY o.order_date DESC;
      `;
      const result = await db.query(query, [customerId]);
      res.status(200).json({ orders: result.rows });
    } catch (error) {
      res.status(500).json({ message: "Server error while fetching orders" });
    }
  });
});

app.post("/create-order", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });
  const token = authHeader.split(" ")[1];

  try {
    const decoded = await verifyJwt(token, JWT_SECRET);
    let customerId = decoded.customer_id;
console.log(customerId);
    if (!customerId) {
      const userIdentifier = decoded.email || decoded.name;
      const result = await db.query(
        "SELECT customer_id FROM customers WHERE email = $1 OR name = $2",
        [userIdentifier, userIdentifier]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: "Customer not found" });
      customerId = result.rows[0].customer_id;
    }

    const { order_id, amount, status, product_ids, order_date } = req.body;
console.log(order_id, amount, status, product_ids, order_date);
    await db.query(
      "INSERT INTO orders (order_id, customer_id, order_date, status, total_amount) VALUES ($1, $2, $3, $4, $5)",
      [order_id, customerId, order_date, status, amount]
    );
console.log("order inserted in orders table");
    for (let prodId of product_ids) {
      await db.query(
        "INSERT INTO order_items (order_id, product_id, customer_id) VALUES ($1, $2, $3)",
        [order_id, prodId, customerId]
      );
      console.log("product inserted into order_items ")
    }
console.log("ORDER SUCCESSFULL");
    res.status(201).json({ message: "Order and items stored successfully!" });
  } catch (error) {
console.log(error);
    res.status(500).json({ message: "Error storing order", error: error });
  }
});

// ----------------- START SERVER -----------------

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
