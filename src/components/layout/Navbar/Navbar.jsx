import React from 'react';
import { Navbar as BSNavbar, Nav, Container, Button } from 'react-bootstrap';
import { FaDumbbell, FaUser, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import logoIBAF from '../../../img/logo_ibaf.png';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userRole, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleDashboard = () => {
    if (userRole === 'admin') {
      navigate('/admin');
    } else if (userRole === 'user') {
      navigate('/dashboard');
    }
  };

  // Only show navigation links on home page
  const isHomePage = location.pathname === '/';

  return (
    <BSNavbar bg="dark" expand="lg" className="navbar-custom">
      <Container>
        <BSNavbar.Brand onClick={() => navigate('/')} className="brand-logo" style={{ cursor: 'pointer' }}>
          <img src={logoIBAF} alt="IBAF UPI Logo" className="logo-img" />
          <span className="brand-text">IBAF UPI</span>
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto nav-custom">
            {isHomePage && (
              <>
                <Nav.Link href="#informasi-umum" className="nav-link-custom">Informasi</Nav.Link>
                <Nav.Link href="#ketua-umum" className="nav-link-custom">Ketua Umum</Nav.Link>
                <Nav.Link href="#berita" className="nav-link-custom">Berita</Nav.Link>
                <Nav.Link href="#dokumentasi" className="nav-link-custom">Dokumentasi</Nav.Link>
                <Nav.Link href="#spotify" className="nav-link-custom">Spotify</Nav.Link>
                <Nav.Link href="#struktur-organisasi" className="nav-link-custom">Struktur</Nav.Link>
                <Nav.Link href="#nara-hubung" className="nav-link-custom">Kontak</Nav.Link>
              </>
            )}
            
            {currentUser ? (
              <>
                {(userRole === 'admin' || userRole === 'user') && (
                  <Button 
                    variant="outline-light" 
                    size="sm" 
                    className="ms-2 auth-btn"
                    onClick={handleDashboard}
                  >
                    <FaUser className="me-1" />
                    Dashboard
                  </Button>
                )}
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  className="ms-2 auth-btn"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="me-1" />
                  Logout
                </Button>
              </>
            ) : (
              <Button 
                variant="outline-light" 
                size="sm" 
                className="ms-2 auth-btn"
                onClick={handleLogin}
              >
                <FaSignInAlt className="me-1" />
                Login
              </Button>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}
