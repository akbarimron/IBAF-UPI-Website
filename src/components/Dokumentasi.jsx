import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaImages } from 'react-icons/fa';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import trainingImg from '../img/TEMP/IBAF_TRAINING.png';
import tempImg from '../img/TEMP/TEMP.png';
import './Dokumentasi.css';

export default function Dokumentasi() {
  const ref = useIntersectionObserver();
  const dokumentasi = [
    { id: 1, judul: 'Ibaf Training', bulan: 'November 2024', color: '#FF6B6B', image: trainingImg, isImage: true },
    { id: 2, judul: 'Ibaf Development', bulan: 'Oktober 2024', color: '#4ECDC4', image: tempImg, isImage: true },
    { id: 3, judul: 'Ibaf Makrab ', bulan: 'September 2024', color: '#45B7D1', image: tempImg, isImage: true },
    { id: 4, judul: 'Ibaf Fun Games', bulan: 'Agustus 2024', color: '#FFA07A', image: tempImg, isImage: true },
    { id: 5, judul: 'Ibaf Workout Party with Community', bulan: 'Juli 2024', color: '#98D8C8', image: tempImg, isImage: true },
    { id: 6, judul: 'Ibaf Mabim', bulan: 'Juni 2024', color: '#F7DC6F', image: tempImg, isImage: true }
  ];
  return (
    <section className="dokumentasi fade-in-section" ref={ref} id="dokumentasi">
      <Container>
        <div className="section-header">
          <h2>Dokumentasi</h2>
          <p>Galeri foto dan video kegiatan IBAF UPI</p>
        </div>

        <Row className="g-4">
          {dokumentasi.map((item) => (
            <Col md={6} lg={4} key={item.id}>
              <Card className="dokumen-card">
                <div className="dokumen-image" style={{ backgroundColor: item.color }}>
                  {item.isImage ? (
                    <img src={item.image} alt={item.judul} className="dokumen-img" />
                  ) : (
                    <span className="dokumen-emoji">{item.emoji}</span>
                  )}
                  <div className="overlay">
                    <FaImages size={40} />
                  </div>
                </div>
                <Card.Body>
                  <Card.Title className="dokumen-judul">{item.judul}</Card.Title>
                  <Card.Text className="dokumen-bulan">{item.bulan}</Card.Text>
                  <button className="btn btn-sm btn-danger w-100">
                    Lihat Galeri
                  </button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className="mt-5">
          <Col md={12}>
            <Card className="dokumen-info">
              <Card.Body>
                <h5>Dokumentasi Digital</h5>
                <p>
                  Kami menyimpan semua momen berharga dari setiap kegiatan IBAF UPI dalam bentuk foto dan video berkualitas tinggi. 
                  Dokumentasi ini tidak hanya menjadi kenang-kenangan, tetapi juga dapat digunakan sebagai materi promosi dan 
                  pembelajaran untuk tahun-tahun mendatang.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
