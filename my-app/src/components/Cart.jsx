import React from "react";
import Button from '@mui/material/Button';
import { useCart } from "./CartContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/cart.css";
import { toast } from "react-toastify";
const API_URL_3000 = import.meta.env.VITE_API_URL_3000 || 'https://e-commerce-server-xezh.onrender.com';
const API_URL_5000 = import.meta.env.VITE_API_URL_5000 || 'https://e-commerce-api-cb8d.onrender.com';
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_RUrbJhzKP7pZQE';
export default function Cart() {
  const { cart, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + parseFloat(item.price) * parseInt(item.quantity, 10), 0);
  const quantity_styling = { position: "absolute", right: "20%", textAlign: "center" };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length <= 0) return toast.error("Your Cart Is Empty");
    const token = localStorage.getItem("token");
    if (!token) { toast.error("Please login first!"); navigate("/login"); return; }
let array=cart.map(item => item.product_id)
console.log(array);
    try {
      const { data } = await axios.post(`${API_URL_3000}/create-order`, { amount: total }, { headers: { Authorization: `Bearer ${token}` } });
      const { order } = data;
      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verify = await axios.post(`${API_URL_3000}/verify/payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (verify.data.success) {
              await axios.post(`${API_URL_5000}/create-order`, {
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                customer_id: JSON.parse(localStorage.getItem("user")).customer_id,
                amount: total,
                status: "paid",
                product_ids: cart.map(item => parseInt(item.product_id)),
                order_date: new Date()
              }, { headers: { Authorization: `Bearer ${token}` } });
              toast.success("Order Placed Succesfully")
              navigate("/orders");
            } else {
              toast.error("Payment verification failed.");
              navigate("/home");
            }
          } catch (err) {
            toast.error("Checkout failed: " + (err.response?.data?.message || err.message));
            navigate("/home");
          }
        },
        modal: { ondismiss: () => navigate("/home") },
        theme: { color: "#008000" }
      };
      new window.Razorpay(options).open();
    } catch (err) { toast.error("Checkout failed: " + (err.response?.data?.message || err.message)); }
  };

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>
      {cart.length !== 0 && <Button size="small" variant="contained" style={{ marginBottom: "1rem" }} onClick={() => clearCart()}>Empty Cart</Button>}
      {cart.length === 0 ? <p>No items in cart</p> : (
        <ul className="cart-list">
          {cart.map((item) => (
            <li className="cart-item" key={item.product_id}>
              <span className="cart-name">{item.name} <br /> ₹{item.price}</span>
              <span style={quantity_styling}>Quantity : <b>{item.quantity}</b></span>
              <Button variant="contained" size="small" color="error" onClick={() => removeFromCart(item.product_id)}>Remove</Button>
            </li>
          ))}
        </ul>
      )}
      <h4>Total: ₹{total}</h4>
      <button className="checkout-btn" onClick={handleCheckout}>Checkout</button>
    </div>
  );
}
