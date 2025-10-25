import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCart } from "./CartContext";
import axios from "axios";
import "../styles/Productview.css";
import { toast } from "react-toastify";
const API_URL_3000 = import.meta.env.VITE_API_URL_3000 || 'https://e-commerce-server-xezh.onrender.com';
const API_URL_5000 = import.meta.env.VITE_API_URL_5000 || 'https://e-commerce-api-cb8d.onrender.com';

export default function ProductView() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_URL_3000}/products/Display_product?productId=${productId}`);
        setProduct(res.data[0]);
      } catch (err) {  toast.error("Failed to fetch product"); }
    };
    fetchProduct();
  }, [productId]);

  if (!product) return <div>Product not found</div>;

  const handleBuyNow = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API_URL_3000}/create-order`, { amount: product.price, product_id: product.product_id, customer_id: user.customer_id }, { headers: { Authorization: `Bearer ${token}` } });
      const { order, key_Id } = data;

      const options = {
        key: key_Id,
        amount: product.price * 100,
        currency: "INR",
        description: product.name,
        image: product.image_url,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verify = await axios.post(`${API_URL_3000}/verify/payment`, { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature }, { headers: { Authorization: `Bearer ${token}` } });
            if (verify.data.success) {
              await axios.post(`${API_URL_5000}/create-order`, { order_id: response.razorpay_order_id, payment_id: response.razorpay_payment_id, customer_id: user.customer_id, amount: product.price, status: "paid", product_ids: [product.product_id], order_date: new Date().toISOString() }, { headers: { Authorization: `Bearer ${token}` } });
              toast.success("Order completed and saved!"); window.location.href = "/orders";
            } else { toast.error("Payment verification failed"); window.location.href = "/home"; }
          } catch (err) { toast.error("Error: " + (err.response?.data?.message || err.message)); window.location.href = "/home"; }
        },
        modal: { ondismiss: () => { window.location.href = "/home"; } },
        prefill: { name: user.name, email: user.email, contact: user.phone },
        theme: { color: "#3399cc" }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) { toast.error("Failed to start payment: " + (err.response?.data?.message || err.message)); }
  };

  return (
    <div className="product-view">
      <img src={product.image_url} alt={product.name} className="product-view-image" />
      <h2>{product.name}</h2>
      <p className="price">₹{product.price}.00</p>
      <div className="buttons">
        <button onClick={() => addToCart(product)}>Add to Cart</button>
        <button onClick={handleBuyNow} className="buy-now-btn">Buy Now</button>
      </div>
    </div>
  );
}
