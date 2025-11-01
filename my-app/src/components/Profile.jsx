import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";
import  CircularProgress  from "@mui/material/CircularProgress";
 function ProfileView({ user }) {
  const navigate = useNavigate();

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
        <CircularProgress />
        <span style={{ marginTop: 10 }}>Loading Profile...</span>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        <button className="edit-button" onClick={() => navigate("/profile/edit")}>
          Edit
        </button>
      </div>

      <div className="profile-avatar">
        {user.name && user.name[0].toUpperCase()}
      </div>

      <div className="profile-row">
        <label>Username:</label>
        <span>{user.name}</span>
      </div>
      <div className="profile-row">
        <label>Mobile Number:</label>
        <span>{user.phone}</span>
      </div>
      <div className="profile-row">
        <label>Email:</label>
        <span>{user.email}</span>
      </div>
      <div className="profile-row">
        <label>Address:</label>
        <span>{user.address}</span>
      </div>
    </div>
  );
}

export default ProfileView;
