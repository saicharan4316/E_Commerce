import { StrictMode, useState,useEffect } from 'react';
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './components/CartContext.jsx'
import './styles/App.css'
import App from './components/App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'

function Root() {
  const [user, setUser] = useState(null);
useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user && user.customer_id) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);
  return (
    <BrowserRouter>
      <StrictMode>
        <CartProvider state_user={user} setUser={setUser}>
          <App user={user} setUser={setUser} />
        </CartProvider>
      </StrictMode>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<Root />);

