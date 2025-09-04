import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from "../../../assets/RutoMatrix_Nonbackground.png";
import tes_logo from "../../../assets/tessolve.png";
import { Eye, EyeOff, User, Lock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [setMessages, setMessage] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

try {
    const response = await fetch('http://51.21.52.229/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });


  const data = await response.json();

  // Check if login was successful first
  if (data.success) {
    // Then redirect based on user role
    if (data.user_role === 'admin') {
     
      window.location.href = '/admin_dashboard';
    } else {
      window.location.href = '/user_reservation';
    }
  } else {
    setMessages([{ text: data.message, category: 'danger' }]);
  }
} catch (error) {
  console.error('Login error:', error);
  setError('An error occurred during login. Please try again.');
} finally {
  setIsLoading(false);
}
  }

  // Add old DOM logic here
  useEffect(() => {
    const alerts = document.querySelectorAll('.alert');
    
    alerts.forEach(alert => {
      setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
      }, 5000);
    });
  }, [error, success]); // rerun when alerts change

  return (
    <div className="login-container">
      <div className="logos-container">
        <img src={logo} alt="RutoMatrix Logo" className="logo" />
        <img src={tes_logo} alt="Tessolve Logo" className="logo" />
      </div>

      <div className="login-card">
        <div className="header">
          <h2>Sign In</h2>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span style={{ marginLeft: '8px' }}>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span style={{ marginLeft: '8px' }}>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <User className="icon" size={20} />
            <input
              type="text"
              className="form-control"
              placeholder=" "
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
            <label>Username</label>
          </div>

          <div className="form-group password-group">
            <Lock className="icon" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              className="form-control password-input"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <label>Password</label>
            {/* 👁️ Toggle button */}
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: "pointer" }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>

          <button 
            type="submit" 
            className="btn-login"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;