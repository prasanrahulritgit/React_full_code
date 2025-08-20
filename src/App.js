import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import "./index.css";
import "@fontsource/poppins"; // Defaults to weight 400
import LandingPage from './components/Auth/LandingPage';
import { Navigate } from 'react-router-dom';
import Login from './components/Auth/Login/Login';
import AdminDashboard from "./components/Admin_Dashboard/AdminDashboard";
import UserReservation from "./components/User_Reservation/UserReservation";


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<LandingPage />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin_dashboard" element={<AdminDashboard />} />
        <Route path="/user_reservation" element={<UserReservation />} />
    
      </Routes>
    </Router>
  );
};

export default App;
