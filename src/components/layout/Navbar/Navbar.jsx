import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaSignOutAlt, FaTachometerAlt, FaSignInAlt, FaUserPlus, FaBars, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import logoIBAF from '../../../img/logo_ibaf.png';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const { currentUser, userRole, userName, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  console.log('Navbar render - currentUser:', currentUser);
  console.log('Navbar render - userRole:', userRole);
  console.log('Navbar render - showDropdown:', showDropdown);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setShowDropdown(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDashboard = () => {
    console.log('handleDashboard called - userRole:', userRole);
    if (userRole === 'admin') {
      console.log('Navigating to /admin');
      navigate('/admin');
    } else {
      console.log('Navigating to /dashboard');
      navigate('/dashboard');
    }
    setShowDropdown(false);
    setShowMobileMenu(false);
  };

  return (
    <nav className="navbar-custom">
      <div className="navbar-container">
        <div onClick={() => navigate('/')} className="brand-logo" style={{ cursor: 'pointer' }}>
          <img src={logoIBAF} alt="IBAF UPI Logo" className="logo-img" />
          <span className="brand-text">IBAF UPI</span>
        </div>
        
        <div className="navbar-auth">
          {currentUser ? (
            <>
              <div className="profile-dropdown" ref={dropdownRef}>
                <button 
                  className="profile-icon"
                  onClick={() => {
                    console.log('Icon clicked! Current state:', showDropdown);
                    setShowDropdown(!showDropdown);
                  }}
                  type="button"
                >
                  <FaUser />
                </button>
                
                {showDropdown && (
                  <div className="dropdown-menu-custom">
                    <div className="dropdown-header">
                      <div className="dropdown-user-info">
                        <strong>{userName || currentUser.displayName || currentUser.email}</strong>
                        <span className="user-role-badge">{userRole}</span>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item" onClick={handleDashboard}>
                      <FaTachometerAlt />
                      <span>Dashboard</span>
                    </button>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      <FaSignOutAlt />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mobile-menu-container" ref={mobileMenuRef}>
                <button 
                  className="hamburger-btn"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  type="button"
                  aria-label="Toggle menu"
                >
                  {showMobileMenu ? <FaTimes /> : <FaBars />}
                </button>
                
                {showMobileMenu && (
                  <div className="mobile-dropdown-menu">
                    <button className="mobile-menu-item" onClick={handleDashboard}>
                      <FaTachometerAlt />
                      <span>Dashboard</span>
                    </button>
                    <button className="mobile-menu-item" onClick={() => { navigate('/'); setShowMobileMenu(false); }}>
                      <span>🏠</span>
                      <span>Beranda</span>
                    </button>
                    <div className="mobile-menu-divider"></div>
                    <button className="mobile-menu-item logout" onClick={handleLogout}>
                      <FaSignOutAlt />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="auth-buttons desktop-only">
                <button className="auth-btn login-btn" onClick={() => navigate('/login')}>
                  <FaSignInAlt />
                  <span>Login</span>
                </button>
                <button className="auth-btn register-btn" onClick={() => navigate('/register')}>
                  <FaUserPlus />
                  <span>Register</span>
                </button>
              </div>
              
              <div className="mobile-menu-container mobile-only" ref={mobileMenuRef}>
                <button 
                  className="hamburger-btn"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  type="button"
                  aria-label="Toggle menu"
                >
                  {showMobileMenu ? <FaTimes /> : <FaBars />}
                </button>
                
                {showMobileMenu && (
                  <div className="mobile-dropdown-menu">
                    <button className="mobile-menu-item" onClick={() => { navigate('/login'); setShowMobileMenu(false); }}>
                      <FaSignInAlt />
                      <span>Login</span>
                    </button>
                    <button className="mobile-menu-item" onClick={() => { navigate('/register'); setShowMobileMenu(false); }}>
                      <FaUserPlus />
                      <span>Register</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
