import React, { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import vonImg from '../img/narahubung/von.png';
import jerukImg from '../img/narahubung/jeruk.png';
import bareImg from '../img/narahubung/bare.png';
import './NaraHubung.css';

export default function NaraHubung() {
  const ref = useIntersectionObserver();
  const [contacts] = useState([
    {
      id: 1,
      nama: 'Von Stroheim',
      posisi: 'Ketua Bidan PSDO',
      whatsapp: '6281234567890',
      instagram: '@von_stroheim',
      image: vonImg
    },
    {
      id: 2,
      nama: 'Zachira Nur Rizkia',
      posisi: 'Bendahara Umum',
      whatsapp: '6282198765432',
      instagram: '@jeruk',
      image: jerukImg
    },
    {
      id: 3,
      nama: 'Muhamad Akbar Imron',
      posisi: 'Wakil Ketua Umum',
      whatsapp: '6283124681357',
      instagram: '@baret',
      image: bareImg
    }
  ]);
  return (
    <section className="nara-hubung fade-in-section" ref={ref} id="nara-hubung">
      <Container>
        <div className="section-header">
          <h2>Nara Hubung</h2>
          <p>Hubungi kami untuk informasi lebih lanjut</p>
        </div>

        <Row className="g-4 mb-5">
          {contacts.map((contact) => (
            <Col md={6} lg={4} key={contact.id}>
              <Card className="contact-card">
                <div className="contact-image">
                  <img src={contact.image} alt={contact.nama} className="contact-img" />
                </div>
                <Card.Body>
                  <Card.Title className="contact-nama">{contact.nama}</Card.Title>
                  <p className="contact-posisi">{contact.posisi}</p>
                  
                  <div className="divider"></div>
                  
                  <div className="contact-items">
                    <div className="contact-item">
                      <FaWhatsapp className="contact-icon" />
                      <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer">
                        WhatsApp
                      </a>
                    </div>
                    <div className="contact-item">
                      <FaInstagram className="contact-icon" />
                      <a href={`https://instagram.com/${contact.instagram.slice(1)}`} target="_blank" rel="noopener noreferrer">
                        {contact.instagram}
                      </a>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row>
          <Col md={12}>
            <Card className="lokasi-card">
              <Card.Body>
                <h5>Pusat Kebugaran</h5>
                <p className="lokasi-text">
                  Gedung Gymnasium, Universitas Pendidikan Indonesia<br/>
                  Jl. Dr. Setiabudhi No. 229, Bandung, Jawa Barat 40154<br/>
                  Indonesia
                </p>
              </Card.Body>
              <Card.Body>
                <h5>Sekretariat</h5>
                <p className="lokasi-text">
                  Gedung PKM, Universitas Pendidikan Indonesia<br/>
                  Jl. Dr. Setiabudhi No. 229, Bandung, Jawa Barat 40154<br/>
                  Indonesia
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
