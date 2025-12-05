import React, { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaCalendarAlt, FaUser } from 'react-icons/fa';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import sertifikasiImg from '../../../img/beritainformasi/sertifikasi_kalistenik.jpeg';
import funrunImg from '../../../img/beritainformasi/funrun.jpeg';
import batch3 from '../../../img/beritainformasi/batch_3.png';
import './BeritaInformasi.css';

export default function BeritaInformasi() {
  const ref = useIntersectionObserver();
  const [berita] = useState([
    {
      id: 1,
      judul: 'Pendaftaran Anggota Baru IBAF UPI 2025 ',
      tanggal: '1 Desember 2025',
      author: 'Admin IBAF UPI',
      deskripsi: 'halo!',
      thumbnail: batch3,
      isImage: true
    },
    {
      id: 2,
      judul: 'Awarding Sertifikasi pelatihan kebugaran spesialisasi kalistenik',
      tanggal: '17 - 18 Oktober 2025',
      author: 'Admin IBAF UPI',
      deskripsi: 'IBAF UPI dengan bangga mengumumkan pemberian sertifikasi  pelatihan kebugaran spesialisasi kalistenik yang telah berhasil di raih oleh Kang Amin ketua bidang kebugaran IBAF 2025.',
      thumbnail: sertifikasiImg,
      isImage: true
    },
    {
      id: 3,
      judul: 'Fun run IBAF X SBM',
      tanggal: '19 Oktober 2025',
      author: 'Admin IBAF UPI',
      deskripsi: 'IBAF UPI bekerja sama dengan SBM UPI mengadakan acara fun run.',
      thumbnail: funrunImg,
      isImage: true
    },
    {
      id: 3,
      judul: 'Fun run IBAF X SBM',
      tanggal: '19 Oktober 2025',
      author: 'Admin IBAF UPI',
      deskripsi: 'IBAF UPI bekerja sama dengan SBM UPI mengadakan acara fun run.',
      thumbnail: funrunImg,
      isImage: true
    },{
      id: 3,
      judul: 'Fun run IBAF X SBM',
      tanggal: '19 Oktober 2025',
      author: 'Admin IBAF UPI',
      deskripsi: 'IBAF UPI bekerja sama dengan SBM UPI mengadakan acara fun run.',
      thumbnail: funrunImg,
      isImage: true
    },
  ]);
  return (
    <section className="berita-informasi fade-in-section" ref={ref} id="berita">
      <Container>
        <div className="section-header">
          <h2>Berita & Informasi</h2>
          <p>Update terbaru dari IBAF UPI</p>
        </div>

        <Row className="g-4">
          {berita.map((item) => (
            <Col md={6} lg={4} key={item.id}>
              <Card className="berita-card h-100">
                <div className="berita-thumbnail">
                  {item.isImage ? (
                    <img src={item.thumbnail} alt={item.judul} className="berita-img" />
                  ) : (
                    <span className="thumbnail-icon">{item.thumbnail}</span>
                  )}
                </div>
                <Card.Body>
                  <Card.Title className="berita-judul">{item.judul}</Card.Title>
                  <div className="berita-meta">
                    <span className="meta-item">
                      <FaCalendarAlt className="me-2" />
                      {item.tanggal}
                    </span>
                    <span className="meta-item">
                      <FaUser className="me-2" />
                      {item.author}
                    </span>
                  </div>
                  <Card.Text className="berita-deskripsi">{item.deskripsi}</Card.Text>
                  <a href="#" className="berita-link">Baca Selengkapnya →</a>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
