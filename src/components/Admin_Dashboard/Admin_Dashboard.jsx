import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FaServer,
  FaUsers,
  FaCalendarAlt,
  FaHistory,
  FaSignOutAlt,
} from "react-icons/fa";
import "./Admin_Dashboard.css";

const AdminDashboard = () => {
  // TODO: connect these to your real auth state if needed
  const isAuthenticated = true;
  const userRole = "admin";

  return (
    <div className="admin-dashboard">
      <nav className="navbar navbar-expand-lg mb-4">
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              {/* Devices Tab */}
              <li className="nav-item">
                <NavLink
                  to="/admin_dashboard/device"
                  className={({ isActive }) =>
                    `nav-link orange ${isActive ? "active" : ""}`
                  }
                  end
                >
                  <FaServer className="me-2" /> Devices
                </NavLink>
              </li>

              {/* Users Tab (Admin Only) */}
              {isAuthenticated && userRole === "admin" && (
                <li className="nav-item">
                  <NavLink
                    to="/admin_dashboard/user"
                    className={({ isActive }) =>
                      `nav-link orange ${isActive ? "active" : ""}`
                    }
                  >
                    <FaUsers className="me-2" /> Users
                  </NavLink>
                </li>
              )}

              {/* Reservations Tab */}
              {isAuthenticated && (
                <li className="nav-item">
                  <NavLink
                    to="/admin_dashboard/reservation"
                    className={({ isActive }) =>
                      `nav-link orange ${isActive ? "active" : ""}`
                    }
                  >
                    <FaCalendarAlt className="me-2" /> Reservations
                  </NavLink>
                </li>
              )}

              {/* History Tab */}
              {isAuthenticated && (
                <li className="nav-item">
                  <NavLink
                    to="/admin_dashboard/history"
                    className={({ isActive }) =>
                      `nav-link orange ${isActive ? "active" : ""}`
                    }
                  >
                    <FaHistory className="me-2" /> History
                  </NavLink>
                </li>
              )}
            </ul>

            {/* Logout Button - Aligned to the right */}
            {isAuthenticated && (
              <div className="d-flex">
                <a
                  href="http://localhost:3000/auth"
                  className="btn btn-outline-danger"
                >
                  <FaSignOutAlt className="me-2" /> Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Child pages render here (Device/User/Reservation/History) */}
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;
