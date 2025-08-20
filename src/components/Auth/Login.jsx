import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from "../../assets/RutoMatrix_Nonbackground.png";
import tes_logo from "../../assets/tessolve.png";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const navigate = useNavigate();

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/get-csrf');
        const data = await response.json();
        if (data.success) {
          setCsrfToken(data.csrf_token);
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };

    fetchCsrfToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        // Redirect based on user role
        if (data.user_role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/reservation');
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="logos-container">
        <img 
          src={logo}
          alt="RutoMatrix Logo" 
          className="logo" 
        />
        <img 
          src={tes_logo}
          alt="Tessolve Logo" 
          className="logo" 
        />
      </div>

      <div className="login-card">
        <div className="header">
          <h2>Sign In</h2>
        </div>

        {error && (
          <div className="alert alert-danger">
            <i data-lucide="alert-circle"></i>
            <span style={{ marginLeft: '8px' }}>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <i data-lucide="check-circle"></i>
            <span style={{ marginLeft: '8px' }}>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <i data-lucide="user" className="icon"></i>
            <input
              type="text"
              className="form-control"
              placeholder=" "
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label>Username</label>
          </div>

          <div className="form-group password-group">
            <i data-lucide="lock" className="icon"></i>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control password-input"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>Password</label>
            
            <i 
              data-lucide={showPassword ? "eye-off" : "eye"} 
              className="toggle-password"
              onClick={togglePasswordVisibility}
            ></i>
          </div>

          <button type="submit" className="btn-login">
            Sign In
            <i data-lucide="arrow-right"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
