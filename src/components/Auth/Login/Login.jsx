import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from "../../../assets/RutoMatrix_Nonbackground.png";
import tes_logo from "../../../assets/tessolve.png";
import { Eye, EyeOff, User, Lock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
<<<<<<< HEAD
 
=======

>>>>>>> bf87bfc984ccc7fc23e906caca35e52b3ae7c448
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
<<<<<<< HEAD
 
  // 🔹 Add old DOM logic here
  useEffect(() => {
 
=======

  // 🔹 Add old DOM logic here
  useEffect(() => {

>>>>>>> bf87bfc984ccc7fc23e906caca35e52b3ae7c448
    const alerts = document.querySelectorAll('.alert');
    const togglePassword = document.querySelector("#togglePassword");
    const passwordInput = document.querySelector(".password-input");
    const icon = togglePassword ? togglePassword.querySelector("i") : null;
<<<<<<< HEAD
 
=======

>>>>>>> bf87bfc984ccc7fc23e906caca35e52b3ae7c448
    if (togglePassword && passwordInput && icon) {
      const handleMouseDown = () => {
        passwordInput.setAttribute("type", "text");
        icon.setAttribute("data-lucide", "eye-off");
      };
      const handleMouseUp = () => {
        passwordInput.setAttribute("type", "password");
        icon.setAttribute("data-lucide", "eye");
      };
      const handleMouseLeave = () => {
        passwordInput.setAttribute("type", "password");
        icon.setAttribute("data-lucide", "eye");
      };
<<<<<<< HEAD
 
      togglePassword.addEventListener("mousedown", handleMouseDown);
      togglePassword.addEventListener("mouseup", handleMouseUp);
      togglePassword.addEventListener("mouseleave", handleMouseLeave);
 
=======

      togglePassword.addEventListener("mousedown", handleMouseDown);
      togglePassword.addEventListener("mouseup", handleMouseUp);
      togglePassword.addEventListener("mouseleave", handleMouseLeave);

>>>>>>> bf87bfc984ccc7fc23e906caca35e52b3ae7c448
      // cleanup
      return () => {
        togglePassword.removeEventListener("mousedown", handleMouseDown);
        togglePassword.removeEventListener("mouseup", handleMouseUp);
        togglePassword.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
<<<<<<< HEAD
 
=======

>>>>>>> bf87bfc984ccc7fc23e906caca35e52b3ae7c448
    alerts.forEach(alert => {
      setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
      }, 5000);
    });
  }, [error, success]); // rerun when alerts change
<<<<<<< HEAD
 
=======

>>>>>>> bf87bfc984ccc7fc23e906caca35e52b3ae7c448
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
            <User className="icon" size={20} />
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
            <Lock className="icon" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              className="form-control password-input"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>Password</label>
<<<<<<< HEAD
 
=======

>>>>>>> bf87bfc984ccc7fc23e906caca35e52b3ae7c448
            {/* 👁️ Toggle button */}
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: "pointer" }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
 
          <button type="submit" className="btn-login">
            Sign In
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
<<<<<<< HEAD
 
export default Login;
=======

export default Login;
>>>>>>> bf87bfc984ccc7fc23e906caca35e52b3ae7c448
