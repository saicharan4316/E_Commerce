import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  let user = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      user = null;
    }
  }
  if (!token || !user || !user.customer_id) {
    return <Navigate to="/login" />;
  }
  try {
    const decoded = jwtDecode(token);
    const isExpired = decoded.exp * 1000 < Date.now();

    if (isExpired) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return <Navigate to="/login" />;
    }

    return children;
  } catch (error) {
    console.error("Invalid token:", error.message);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" />;
  }
}
