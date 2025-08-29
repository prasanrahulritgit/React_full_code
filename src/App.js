// App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import "./index.css";
import "@fontsource/poppins";
import LandingPage from './components/Auth/LandingPage';
import Login from './components/Auth/Login/Login';
import AdminDashboard from "./components/Admin_Dashboard/Admin_Dashboard";
import UserReservation from "./components/User_Reservation/UserReservation";
import AdminReservation from "./components/AdminReservation/AdminReservation"; // Import the AdminReservation component
import Device from "./components/Device/Device";
import User from "./components/User/User";
import History from "./components/History/History";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<LandingPage />} />
        <Route path="/Login" element={<Login />} />

        {/* NESTED ADMIN DASHBOARD */}
        <Route path="/admin_dashboard/*" element={<AdminDashboard />}>
          {/* default tab */}
          <Route index element={<Navigate to="reservation" replace />} />
          <Route path="device" element={<Device />} />
          <Route path="user" element={<User />} />
          <Route path="reservation" element={<AdminReservation />} /> {/* Changed to AdminReservation */}
          {/* Use your actual History component if you have one */}
          <Route path="history" element={<History />} />
        </Route>

        {/* (Optional) keep direct pages if you still want them accessible */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/user_reservation" element={<UserReservation />} />
        <Route path="/admin_reservation" element={<AdminReservation />} /> {/* Added direct route for admin reservation */}
        <Route path="/device" element={<Device />} />
        <Route path="/user" element={<User />} />
      </Routes>
    </Router>
  );
};

export default App;