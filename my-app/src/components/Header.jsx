import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "../styles/header.css";

const API_URL_3000 = import.meta.env.VITE_API_URL_3000 || 'https://e-commerce-server-xezh.onrender.com';

export default function Header() {
  console.log("component resendered")
  const [showSettings, setShowSettings] = useState(false);
  const [showmore, setShowmore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
        const token = localStorage.getItem("token");console.log(token)
  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!searchInput.trim()) { setSearchResults([]); return; }

    const timer = setTimeout(async () => { console.log(searchInput)
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL_3000}/search`, {
          params: { query: searchInput.toLowerCase().trim() },
          headers:token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        setSearchResults(res.data.products || []);
      } catch (err) {
        alert("Search failed");
      } finally { setLoading(false); }
    }, 500);

    setDebounceTimer(timer);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const handleClickOutside = (event) => { if (searchRef.current && !searchRef.current.contains(event.target)) setSearchResults([]); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="header">
      <div className="left-section">
        <div className="hamburger" onClick={() => { setShowmore(!showmore); setShowSettings(false); }}>
          <FontAwesomeIcon icon={faBars} />
        </div>
        <div className="profile"><Link to="/profile"><AccountCircleIcon /><small>Profile</small></Link></div>
        <h1 className="logo" onClick={() => navigate("/home")}>E-COMMERCE</h1>
      </div>
      <div className="right-section">
        <nav className="nav-links">
          <Link to="/home">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/deals">Deals</Link>
          <Link to="/orders">Orders</Link>
        </nav>
        <div style={{ position: "relative" }} ref={searchRef}>
          <input type="text" className="search-bar" placeholder="Search" value={searchInput} onChange={e =>{ setSearchInput(e.target.value); console.log(e.target.value)}} autoComplete="off"/>
          {searchInput.length > 0 && (
            <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "white", border: "1px solid #ccc", borderTop: "none", maxHeight: "200px", overflowY: "auto", margin: 0, padding: 0, listStyle: "none", zIndex: 5 }}>
              {loading ? <li style={{ padding: "0.4rem 1rem", color: "#888" }}>Searching...</li> :
                searchResults.length > 0 && searchResults.map(item => (
                  <li key={item.product_id} style={{ padding: "0.4rem 1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                      onClick={() => { setSearchInput(item.name); setSearchResults([]); navigate(`/product/${item.product_id}`); }}>
                    {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />}
                    <div><div style={{ fontWeight: 500 }}>{item.name}</div><div style={{ fontSize: "0.9rem", color: "#555" }}>₹{item.price}</div></div>
                  </li>
                ))}
            </ul>
          )}
        </div>
        <Link to="/cart" className="icon-link"><ShoppingCartCheckoutIcon /><span>Cart</span></Link>
        <div className="icon-link" onClick={() => { setShowSettings(!showSettings); setShowmore(false); }}><SettingsIcon /><span>Settings</span></div>
      </div>
      {showmore && <div className="showmore"><ul>
        <li><button onClick={() => setShowmore(false)}>Close <KeyboardArrowRightIcon /></button></li>
        <li onClick={() => { setShowmore(false); navigate("/profile"); }}>Profile</li>
        <li onClick={() => { setShowmore(false); navigate("/home"); }}>Home</li>
        <li onClick={() => { setShowmore(false); navigate("/shop"); }}>Shop</li>
        <li onClick={() => { setShowmore(false); navigate("/deals"); }}>Deals</li>
        <li onClick={()=> {setShowmore(false); navigate("/orders");}}>Orders</li>
      </ul></div>}
      {showSettings && <div className="settings-panel"><ul>
        <li onClick={() => setShowSettings(false)}><ArrowBackIcon /> Close</li>
        <li onClick={() => { setShowSettings(false); navigate("/privacy"); }}>Privacy</li>
        <li onClick={() => { setShowSettings(false); navigate("/terms"); }}>Terms</li>
        <li onClick={() => { setShowSettings(false); navigate("/explore"); }}>Explore</li>
        <li onClick={handleLogout}>Logout</li>
      </ul></div>}
    </header>
  );
}
