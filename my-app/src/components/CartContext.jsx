import { createContext, useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const CartContext = createContext();
const API_URL_3000 = import.meta.env.VITE_API_URL_3000 || 'https://e-commerce-server-xezh.onrender.com';

export const CartProvider = ({ children, state_user }) => {
  const [cart, setCart] = useState([]);
  
  const user = state_user || JSON.parse(localStorage.getItem("user"));
  const token = state_user?.token || localStorage.getItem("token");
  const customerId = user?.customer_id;
  const isAuthenticated = useMemo(() => !!token, [token]);

 
  const fetchCart = async () => {
    if (!token || !customerId) return;
    try {
      const res = await axios.get(`${API_URL_3000}/cart/${encodeURIComponent(customerId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

  
      const cartData = Array.isArray(res.data) ? res.data : [];
      const decodedCart = cartData.map(item => ({
        customer_id: item.customer_id,
        product_id: item.product_id,
        quantity: Number(item.quantity),
        name: item.name,
        price: item.price,
      }));

      setCart(decodedCart);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      toast.error("Failed to fetch cart");
    }
  };

  useEffect(() => {
    if (token) fetchCart();
  }, [token]);

  const addToCart = async (product) => {
  // Check authentication
  if (!isAuthenticated) {
    toast.warning("Please login to add items to cart");
    return;
  }

  // Show loading state
  const toastId = toast.loading("Adding to cart...");
  const startTime = Date.now();

  try {
    console.log("🛒 Starting addToCart for product:", {
      product_id: product.product_id,
      product_name: product.name,
      customer_id: customerId,
      timestamp: new Date().toISOString()
    });

    console.log("🌐 Making request to:", `${API_URL_3000}/cart`);
    console.log("📦 Request payload:", {
      product_id: product.product_id,
      customer_id: customerId,
      quantity: 1
    });

    // Make request with increased timeout for Neon cold starts
    const response = await axios.post(
      `${API_URL_3000}/cart`,
      { 
        product_id: product.product_id, 
        customer_id: customerId, 
        quantity: 1 
      },
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000  // 30 seconds for Neon cold start
      }
    );

    const duration = Date.now() - startTime;
    console.log(`✅ Cart response received in ${duration}ms:`, response.data);

    // Update local cart state
    setCart(prev => {
      const idx = prev.findIndex(i => i.product_id === product.product_id);
      if (idx > -1) {
        console.log("📝 Updating existing cart item quantity");
        return prev.map((i, index) =>
          index === idx ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      console.log("➕ Adding new item to cart");
      return [...prev, { ...product, quantity: 1 }];
    });

    // Show success message
    toast.update(toastId, {
      render: `${product.name} added to cart!`,
      type: "success",
      isLoading: false,
      autoClose: 2000
    });

    console.log("✅ Cart state updated successfully");

  } catch (err) {
    const duration = Date.now() - startTime;
    
    console.error(`❌ Cart error after ${duration}ms:`, {
      error: err.message,
      code: err.code,
      response: err.response?.data,
      status: err.response?.status
    });

    // Detailed error logging
    if (err.code === 'ECONNABORTED') {
      console.error("⏱️ Request timed out - Neon database might be sleeping");
      toast.update(toastId, {
        render: "Request timed out. Database is waking up, please try again.",
        type: "error",
        isLoading: false,
        autoClose: 5000
      });
    } else if (err.response?.status === 401) {
      console.error("🔒 Authentication failed");
      toast.update(toastId, {
        render: "Session expired. Please login again.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } else if (err.response?.status === 500) {
      console.error("💥 Server error:", err.response.data);
      toast.update(toastId, {
        render: err.response.data.message || "Server error. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } else if (err.message === 'Network Error') {
      console.error("🌐 Network error - Server might be down");
      toast.update(toastId, {
        render: "Cannot connect to server. Please check your connection.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } else {
      console.error("❓ Unknown error:", err);
      toast.update(toastId, {
        render: "Failed to add item to cart. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    }

    // Log full error stack for debugging
    console.error("Full error stack:", err.stack);
  }
};

  const removeFromCart = async (productId) => {
    if (!isAuthenticated) return;

    try {
      await axios.delete(`${API_URL_3000}/cart/${encodeURIComponent(productId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCart(prev => prev.filter(item => item.product_id !== productId));
      toast.success("Product removed from cart");
    } catch (err) {
      toast.error("Failed to remove product");
    }
  };


  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      await axios.delete(`${API_URL_3000}/cart/clear/${encodeURIComponent(customerId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCart([]);
      toast.success("Cart cleared");
    } catch (err) {
      toast.error("Failed to clear cart");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, isAuthenticated }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
