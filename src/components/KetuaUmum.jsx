import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import ketumFoto from '../img/ketum.png';
import './KetuaUmum.css';
import { BsInstagram } from 'react-icons/bs';

export default function KetuaUmum() {
  const ref = useIntersectionObserver();
  const ketua = {
    nama: 'Rully Sulistiawan',
    BsInstagram: '@rullysulistiawan_',
    jabatan: 'Ketua Umum IBAF UPI',
    periode: '2025 - 2026',
    visi: 'Membangun IBAF UPI menjadi organisasi yang lebih kuat dan berdampak bagi mahasiswa UPI',
    sambutan: 'Selamat datang di IBAF UPI! Kami bangga memiliki komunitas yang solid dan saling mendukung. Bersama-sama, kita akan terus berkembang dan mencapai prestasi yang lebih tinggi. Terima kasih telah menjadi bagian dari keluarga besar IBAF UPI.',
    foto: 'placeholder'
  };
  return (
    <section className="ketua-umum fade-in-section" ref={ref} id="ketua-umum">
      <Container>
        <div className="section-header">
          <h2>Ketua Umum</h2>
          <p>Memimpin IBAF UPI menuju masa depan yang cerah</p>
        </div>

        <Row className="align-items-center g-4">
          <Col md={5}>
            <div className="ketua-image">
              <img src={ketumFoto} alt={ketua.nama} className="ketua-foto" />
            </div>
          </Col>
          <Col md={7}>
            <Card className="ketua-card">
              <Card.Body>
                <h3 className="ketua-nama">{ketua.nama}</h3>
                <p className="ketua-instagram">
                  <BsInstagram className="me-2" />
                  {ketua.BsInstagram}
                </p>
                <h4 className="ketua-jabatan">{ketua.jabatan}</h4>
                <p className="ketua-periode">{ketua.periode}</p>
                
                <div className="divider"></div>
                
                <h5>Visi</h5>
                <p className="ketua-text">{ketua.visi}</p>
                
                <h5>Sambutan</h5>
                <p className="ketua-text">{ketua.sambutan}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
