import { useState } from "react";
import { toast } from "react-toastify";
import {
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL_3000 = import.meta.env.VITE_API_URL_3000 || 'https://e-commerce-server-xezh.onrender.com';

export default function Signup({ setUser }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    address: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};

    if (!/^[a-zA-Z ]{2,30}$/.test(form.name))
      newErrors.name = "Enter a valid name (letters only)";
    if (!/^[0-9]{10}$/.test(form.mobile))
      newErrors.mobile = "Enter valid 10-digit mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Enter a valid email";
    if (form.address.trim().length < 5)
      newErrors.address = "Address must be at least 5 characters";
    if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await axios.post(
        `${API_URL_3000}/signup`,
        form,
        { headers: { "Content-Type": "application/json" } }
      );

      const { user: microUser, token } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(microUser));
      setUser({ ...microUser, token });

      navigate("/home");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: 400,
        mx: "auto",
        mt: 6,
        p: 4,
        boxShadow: 3,
        borderRadius: 2,
        backgroundColor: "#fff",
      }}
    >
      <Typography variant="h5" align="center" gutterBottom>
        Create an Account
      </Typography>

      <TextField
        label="Full Name"
        name="name"
        fullWidth
        margin="normal"
        value={form.name}
        onChange={handleChange}
        error={!!errors.name}
        helperText={errors.name}
        required
      />

      <TextField
        label="Mobile Number"
        name="mobile"
        fullWidth
        margin="normal"
        value={form.mobile}
        onChange={handleChange}
        error={!!errors.mobile}
        helperText={errors.mobile}
        required
      />

      <TextField
        label="Email"
        name="email"
        type="email"
        fullWidth
        margin="normal"
        value={form.email}
        onChange={handleChange}
        error={!!errors.email}
        helperText={errors.email}
        required
      />

      <TextField
        label="Address"
        name="address"
        fullWidth
        margin="normal"
        value={form.address}
        onChange={handleChange}
        error={!!errors.address}
        helperText={errors.address}
        required
      />

      <TextField
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        fullWidth
        margin="normal"
        value={form.password}
        onChange={handleChange}
        error={!!errors.password}
        helperText={errors.password}
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button variant="contained" type="submit" fullWidth sx={{ mt: 3 }}>
        Sign Up
      </Button>
    </Box>
  );
}
