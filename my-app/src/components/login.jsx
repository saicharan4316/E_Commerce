import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Box, Typography, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
const API_URL_3000 = import.meta.env.VITE_API_URL_3000;

export default function Login({ setUser }) {
  const [user, setLocalUser] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setLocalUser(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validate = () => {
    const newErrors = {};
    if (!validateEmail(user.email)) newErrors.email = "Enter a valid email";
    if (user.password.length < 6) newErrors.password = "Password too short";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await axios.post(`${API_URL_3000}/login`, { email: user.email.trim().toLowerCase(), password: user.password });
      const { token, user: userData } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser({ ...userData, token });
      navigate("/home");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: 350, mx: "auto", mt: 8, p: 4, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h5" align="center" gutterBottom>Please Login Before Using</Typography>
      <TextField label="Email" name="email" type="email" fullWidth margin="normal" value={user.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} />
      <TextField label="Password" name="password" type={showPassword ? "text" : "password"} fullWidth margin="normal" value={user.password} onChange={handleChange} error={!!errors.password} helperText={errors.password}
        InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
      <Button variant="contained" type="submit" fullWidth sx={{ mt: 2 }}>Login</Button>
      <Typography variant="body2" align="center" sx={{ mt: 2 }}>
        <a href={`${API_URL_3000}/login_with_google`} style={{ textDecoration: "none", color: "#fff", backgroundColor: "#4285F4", padding: "10px 20px", borderRadius: "4px", display: "inline-block", fontWeight: "bold" }}>
          Sign in with Google
        </a>
      </Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>Not Have An Account? <a href="/signup">Signup</a></Typography>
    </Box>
  );
}
