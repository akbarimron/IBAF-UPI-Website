import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaInfoCircle } from 'react-icons/fa';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import './InformasiUmum.css';

export default function InformasiUmum() {
  const ref = useIntersectionObserver();
  const informasi = [
    {
      title: 'Visi Kami',
      description: 'Menjadi organisasi mahasiswa terdepan dalam pengembangan gaya hidup sehat dan kebugaran di UPI'
    },
    {
      title: 'Misi Kami',
      description: 'Memberikan platform untuk mahasiswa mengembangkan diri melalui program fitness, edukasi, dan komunitas yang solid'
    },
    {
      title: 'Program Unggulan',
      description: 'Program latihan rutin, workshop kebugaran, kompetisi fitness, dan event community building yang menarik'
    }
  ];
  return (
    <section className="informasi-umum fade-in-section" ref={ref} id="informasi-umum">
      <Container>
        <div className="section-header">
          <h2>Informasi Umum</h2>
          <p>Ketahui lebih lanjut tentang IBAF UPI</p>
        </div>

        <Row className="g-4">
          {informasi.map((item, index) => (
            <Col md={6} lg={4} key={index}>
              <Card className="info-card h-100">
                <Card.Body>
                  <div className="card-icon">
                    <FaInfoCircle />
                  </div>
                  <Card.Title>{item.title}</Card.Title>
                  <Card.Text>{item.description}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className="mt-5">
          <Col md={12}>
            <Card className="info-card-large">
              <Card.Body>
                <h4>Tentang IBAF UPI</h4>
                <p>
                  IBAF UPI adalah organisasi mahasiswa di Universitas Pendidikan Indonesia yang berdedikasi untuk mempromosikan gaya hidup sehat dan kebugaran. 
                  Sejak didirikan, kami telah membangun komunitas yang solid dengan ribuan anggota aktif. Organisasi kami menyediakan berbagai program pelatihan, 
                  seminar kesehatan, dan event komunitas yang dirancang untuk meningkatkan kesadaran akan pentingnya kebugaran fisik dan mental.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
