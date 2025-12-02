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
      description: 'Mewujudkan mahasiswa UPI yang sehat, bugar, dan memiliki bentuk tubuh ideal, serta membekali mereka dengan pengetahuan yang komprehensif tentang olahraga dan gizi, sehingga dapat menjalani gaya hidup aktif dan sehat secara berkelanjutan.'
    },
    {
      title: 'Misi Kami',
      description: 'IBAF UPI berkomitmen untuk meningkatkan kesehatan dan kebugaran mahasiswa melalui edukasi, fasilitas, dan program latihan yang komprehensif. Kami memberdayakan anggota dengan pengetahuan gizi dan olahraga, membangun komunitas yang suportif, serta menjalin kemitraan strategis untuk terus mengembangkan potensi dan kualitas program kami.'
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
                  Ideal Body and Fitness (IBAF) merupakan organisasi mahasiswa di bawah naungan UPI gym yang berfokus pada aktivitas fisik, olahraga, dan kegiatan sejenis yang mendukung kesehatan serta kebugaran mahasiswa. Organisasi ini bertujuan untuk meningkatkan kualitas kesehatan dan kebugaran mahasiswa dengan mengedepankan nilai-nilai disiplin, edukatif, produktif, serta berwawasan luas, sehingga dapat berperan aktif dalam mewujudkan generasi mahasiswa yang sehat, kuat, dan berdaya saing tinggi. Untuk mencapai tujuan tersebut, dilaksanakan program kerja UKM IBAF yang merupakan hasil dari Rapat Kerja Pengurus bersama Ketua UKM dan anggota bidang terkait. Program kerja yang direncanakan membutuhkan prosedur yang sistematis dan terorganisasi untuk memastikan administrasi yang rapi serta keseragaman dalam pelaksanaan setiap kegiatan. Selain itu, diperlukan juga pengelolaan kekayaan/inventaris UKM IBAF yang terstruktur dengan baik. Oleh karena itu, dibutuhkan kejelasan aturan dan teknis pelaksanaan yang selanjutnya disebut sebagai SOP (Standar Operasional Prosedur) Kesekretariatan UKM IBAF.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
