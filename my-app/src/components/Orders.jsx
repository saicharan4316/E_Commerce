import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Orders.css";
import { toast } from "react-toastify";
import CircularProgress from '@mui/material/CircularProgress';

const API_URL_3000 = import.meta.env.VITE_API_URL_3000 || 'https://e-commerce-server-xezh.onrender.com';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) { alert("User not logged in"); setLoading(false); return; }
    let user;
    try { user = JSON.parse(userStr); } catch { toast.error("Invalid user data"); setLoading(false); return; }
    const customer_id = user.customer_id;
    if (!customer_id) { toast.error("Invalid customer"); setLoading(false); return; }

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL_3000}/orders`, { headers: { Authorization: `Bearer ${token}` }, params: { customer_id } });
        setOrders(response.data.orders);
      } catch (err) {
        toast.error("Failed to load orders");
      } finally { setLoading(false); }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
        <CircularProgress />
        <span style={{ marginTop: 10 }}>Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <h2>My Orders</h2>
      {orders.length === 0 ? <p>No orders found.</p> :
        orders.map(order => (
          <div key={order.order_id + "-" + (order.product_id || order.name)} className="order-card">
            <img className="order-img" src={order.image_url} alt={order.name} />
            <div className="order-details">
              <div className="order-info-block">
                <div className="order-title">{order.name}</div>
                <div className="order-price">Price: ₹{order.price}</div>
                <div className="order-status">Status: {order.status}</div>
                <div className="order-date">Ordered On: {new Date(order.order_date).toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))
      }
    </div>
  );
}
