import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { CartProvider } from "./CartContext"; 
import ResetPassword from "./Resetpassword";
import ProtectedRoute from "./ProtectedRouter";
import Header from "./Header";
import Hero from "./Hero";
import Orders from "./Orders";
import ProductList from "./ProductList";
import Cart from "./Cart";
import Footer from "./Footer";
import Login from "./login";
import Signup from "./Signup";
import About from "./About";
import Contact from "./Contact";
import Explore from "./Explore";
import ProductView from "./Productview";
import ProfileView from "./Profile";
import ProfileEdit from "./Profileedit";
import Shop from "./Shop";
import { ErrorBoundary } from "react-error-boundary";
import ErrorPage from "./Errorpage";
import GoogleCallback from "./GoogleCallback";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import "../styles/App.css";

const API_URL_3000 = import.meta.env.VITE_API_URL_3000;

function Home({ products, page, setPage }) {
  return (
    <>
      <Hero />
      <ProductList products={products} page={page} setPage={setPage} /> 
    </>
  );
}

function Deals() {
  return (
    <div className="page">
      <h2>Deals Page</h2>
      <p>Special discounts coming soon!</p>
    </div>
  );
}

export default function App({ user, setUser }) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    let userData = null;
    if (userStr) {
      try { userData = JSON.parse(userStr); } 
      catch { userData = null; }
    }
    if (token && userData?.customer_id) setUser({ ...userData, token });
    else setUser(null);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const offset = (page - 1) * limit;
        const res = await fetch(`${API_URL_3000}/products?limit=${limit}&offset=${offset}`);
        const data = await res.json();
        setProducts(data);
      } catch (err) { console.error("Failed to fetch products:", err); }
    };
    fetchProducts();
  }, [page]);

  return (
  <ErrorBoundary FallbackComponent={ErrorPage}>
    <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick draggable pauseOnHover />
    <Routes>
      
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/signup" element={<Signup setUser={setUser} />} />
      <Route path="/google_callback" element={<GoogleCallback setUser={setUser} />} />
      
      
      <Route
        path="/*"
        element={
          <ProtectedRoute user={user}>
            <CartProvider state_user={user}>
              <Header />
              <Routes>
                <Route path="/" element={<Home products={products} page={page} setPage={setPage} />} />
                <Route path="/home" element={<Home products={products} page={page} setPage={setPage} />} />
                <Route path="/shop" element={<Shop products={products} page={page} setPage={setPage} />} />
                <Route path="/profile" element={<ProfileView user={user} />} />
                <Route path="/profile/edit" element={<ProfileEdit user={user} setUser={setUser} />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/forgot_password" element={<ResetPassword user={user} />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/product/:productId" element={<ProductView />} />
                <Route path="*" element={<ErrorPage />} />
              </Routes>
              <Footer />
            </CartProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  </ErrorBoundary>
);
}
