import React from 'react';
import { Navbar as BSNavbar, Nav, Container } from 'react-bootstrap';
import { FaDumbbell } from 'react-icons/fa';
import logoIBAF from '../img/logo_ibaf.png';
import './Navbar.css';

export default function Navbar() {
  return (
    <BSNavbar bg="dark" expand="lg" className="navbar-custom">
      <Container>
        <BSNavbar.Brand href="#home" className="brand-logo">
          <img src={logoIBAF} alt="IBAF UPI Logo" className="logo-img" />
          <span className="brand-text">IBAF UPI</span>
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto nav-custom">
            <Nav.Link href="#informasi-umum" className="nav-link-custom">Informasi</Nav.Link>
            <Nav.Link href="#ketua-umum" className="nav-link-custom">Ketua Umum</Nav.Link>
            <Nav.Link href="#berita" className="nav-link-custom">Berita</Nav.Link>
            <Nav.Link href="#dokumentasi" className="nav-link-custom">Dokumentasi</Nav.Link>
            <Nav.Link href="#spotify" className="nav-link-custom">Spotify</Nav.Link>
            <Nav.Link href="#nara-hubung" className="nav-link-custom">Kontak</Nav.Link>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}
