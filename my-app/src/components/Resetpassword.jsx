import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Resetpassword.css";
import { toast } from "react-toastify";
const API_URL_3000 = import.meta.env.VITE_API_URL_3000 || 'https://e-commerce-server-xezh.onrender.com ';

export default function ResetPassword({ user }) {
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
    otp: "",
  });
  const [serverOtp, setServerOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const sendOtp = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL_3000}/send-otp`,
        { email: encodeURIComponent(user.email) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setServerOtp(response.data.otp);
      alert(`Here Is Your OTP for login: ${response.data.otp}`);
      setOtpSent(true);
    } catch (error) {
      toast.error("Failed to send OTP");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.newPassword || !form.confirmPassword || !form.otp) {
      toast.error("Please fill all fields");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.otp !== serverOtp) {
      toast.error("Invalid OTP");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL_3000}/profile/update-password`,
        { email: encodeURIComponent(user.email), password: encodeURIComponent(form.newPassword.trim()) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Password Reset Successful");
      navigate("/profile/edit");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Reset Password</h2>
      <form className="reset-password-form" onSubmit={handleSubmit}>
        <div>
          <label>New Password:</label><br />
          <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} required />
        </div>
        <div>
          <label>Re-enter New Password:</label><br />
          <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
        </div>
        <div>
          <label>OTP:</label><br />
          <input type="text" name="otp" value={form.otp} onChange={handleChange} required />
          <button type="button" onClick={sendOtp} disabled={otpSent} style={{ marginLeft: 8 }}>
            {otpSent ? "OTP Sent" : "Send OTP"}
          </button>
        </div>
        <br />
        <button type="submit">Submit</button>
        <br /><br />
        <button type="button" onClick={() => navigate("/profile/edit")}>Cancel</button>
      </form>
    </div>
  );
}
