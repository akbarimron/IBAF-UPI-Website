import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaDumbbell, FaUsers, FaTrophy } from 'react-icons/fa';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import './Hero.css';

export default function Hero() {
  const ref = useIntersectionObserver();

  return (
    <div className="hero-section fade-in-section" ref={ref} id="home">
      <Container>
        <Row className="align-items-center min-vh-100">
          <Col lg={8} className="hero-content">
            <h1 className="hero-title">Badan Bugar Hati pun Senang</h1>
            <p className="hero-subtitle">
              IBAF   UPI adalah organisasi mahasiswa yang fokus pada pengembangan kesehatan dan kebugaran di Universitas Pendidikan Indonesia
            </p>
            <div className="hero-features mt-4">
              <div className="feature-item">
                <FaDumbbell className="feature-icon" />
                <span>Awak Aing Kumaha Aing</span>
              </div>
            </div>
          
          </Col>
        </Row>
      </Container>
    </div>
  );
}
