import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode";

export default function GoogleCallback({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userParam = params.get("user");

    if (!token || !userParam) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(decodeURIComponent(userParam));

   
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser({ ...user, token });

    

    navigate("/home");
  }, [navigate, setUser]);

  return null;
}
