import React, { useState, useEffect } from "react";
import "../styles/profile.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const API_URL_3000 = import.meta.env.VITE_API_URL_3000;

export default function ProfileEdit({ user, setUser }) {

  const navigate = useNavigate();
  const [form, setForm] = useState({
  name: (user && user.name) || "",
  phone: (user && user.phone) || "",
  email: (user && user.email) || "",
  address: (user && user.address) || ""
});
  
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        address: user.address || ""
      });
    }
  }, [user]);
if (!user) return <p>Loading profile...</p>;
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.address.trim() 
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const data = {
        name: encodeURIComponent(form.name),
        email: encodeURIComponent(form.email),
        phone: encodeURIComponent(form.phone),
        address: encodeURIComponent(form.address),
      };

      const response = await axios.put(`${API_URL_3000}/profile/update`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const decodeUserData = (encodedUser) => ({
        address: decodeURIComponent(encodedUser.address),
        customer_id: decodeURIComponent(encodedUser.customer_id),
        email: decodeURIComponent(encodedUser.email),
        phone: decodeURIComponent(encodedUser.phone),
        name: decodeURIComponent(encodedUser.name),
        token: token,
      });

      const updatedUser = decodeUserData(response.data);
      setUser && setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Profile updated successfully!");
      navigate("/profile");
    } catch (error) {
      toast.error("Failed to update profile.");
    }
  };

  return (
    <div className="profile-container">
      <h2>Edit Profile</h2>
      <form className="profile-form" onSubmit={handleSave}>
        {[
          { label: "Name", name: "name", type: "text", maxLength: 20 },
          { label: "Mobile Number", name: "phone", type: "tel", maxLength: 10, pattern: "[0-9]{10}" },
          { label: "Email", name: "email", type: "email", disabled: true },
          { label: "Address", name: "address", type: "text", maxLength: 100 }
        ].map(({ label, name, type, disabled, maxLength, pattern }) => (
          <div className="profile-row" key={name}>
            <label>{label}:</label>
            <input
              name={name}
              type={type}
              value={form[name]}
              onChange={handleChange}
              required
              disabled={disabled}
              maxLength={maxLength}
              pattern={pattern}
              title={pattern ? "Please enter valid value" : undefined}
            />
          </div>
        ))}

        <div className="profile-actions">
          <span><a href="/forgot_password">Forgot password?</a></span>
          <button type="submit" className="profile-btn save">Save</button>
          <button
            type="button"
            className="profile-btn cancel"
            onClick={() => navigate("/profile")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
