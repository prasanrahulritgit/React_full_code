import { NavLink, Outlet } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  // TODO: connect these to your real auth state if needed
  const isAuthenticated = true;
  const userRole = 'admin';

  return (
    <div className="admin-dashboard">
      <nav className="admin-navbar">
        <div className="nav-container">
          <ul className="nav-menu">
            <li className="nav-item">
              <NavLink
                to="/admin_dashboard/device"
                className={({ isActive }) => `nav-link pill ${isActive ? 'active' : ''}`}
                end
              >
                Devices
              </NavLink>
            </li>

            {isAuthenticated && userRole === 'admin' && (
              <li className="nav-item">
                <NavLink
                  to="/admin_dashboard/user"
                  className={({ isActive }) => `nav-link pill ${isActive ? 'active' : ''}`}
                >
                  Users
                </NavLink>
              </li>
            )}

            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <NavLink
                    to="/admin_dashboard/reservation"
                    className={({ isActive }) => `nav-link pill ${isActive ? 'active' : ''}`}
                  >
                    Reservations
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/admin_dashboard/history"
                    className={({ isActive }) => `nav-link pill ${isActive ? 'active' : ''}`}
                  >
                    History
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          {isAuthenticated && (
            <div className="nav-logout">
              <a href="http://localhost:3000/auth" className="logout-btn pill">
                Logout
              </a>
            </div>
          )}
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
