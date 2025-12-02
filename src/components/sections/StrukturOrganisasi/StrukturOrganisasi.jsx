import React, { useState } from 'react';
import { Container, Row, Col, Nav, TabContent, TabPane } from 'react-bootstrap';
import { FaUsers, FaChalkboardUser, FaUserTie } from 'react-icons/fa6';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import './StrukturOrganisasi.css';

export default function StrukturOrganisasi() {
  const ref = useIntersectionObserver();
  const [activeTab, setActiveTab] = useState('struktur');

  const kepengurusan = [
    {
      posisi: 'Ketua Umum',
      nama: 'Nama Ketua Umum',
      divisi: 'Pimpinan'
    },
    {
      posisi: 'Wakil Ketua Umum',
      nama: 'Nama Wakil Ketua',
      divisi: 'Pimpinan'
    },
    {
      posisi: 'Sekretaris Umum',
      nama: 'Nama Sekretaris',
      divisi: 'Administrasi'
    },
    {
      posisi: 'Bendahara Umum',
      nama: 'Nama Bendahara',
      divisi: 'Administrasi'
    }
  ];

  const divisi = [
    {
      nama: 'Divisi Pengembangan SDM',
      deskripsi: 'Bertanggung jawab atas pengembangan skill dan kemampuan anggota',
      anggota: 5
    },
    {
      nama: 'Divisi Olahraga',
      deskripsi: 'Mengelola dan mengorganisir kegiatan olahraga dan kebugaran',
      anggota: 6
    },
    {
      nama: 'Divisi Hubungan Masyarakat',
      deskripsi: 'Membangun hubungan dengan pihak eksternal dan media',
      anggota: 4
    },
    {
      nama: 'Divisi Kemitraan',
      deskripsi: 'Mencari dan menjalin kerjasama strategis dengan organisasi lain',
      anggota: 5
    }
  ];

  return (
    <section className="struktur-organisasi-section fade-in-section" ref={ref} id="struktur-organisasi">
      <Container>
        <Row className="mb-5">
          <Col lg={12} className="text-center">
            <h2 className="section-title">Struktur Organisasi</h2>
            <p className="section-subtitle">Mengenal lebih dekat struktur dan kepengurusan IBAF UPI</p>
          </Col>
        </Row>

        <Row>
          <Col lg={12}>
            <Nav fill variant="tabs" className="struktur-tabs mb-4">
              <Nav.Item>
                <Nav.Link
                  eventKey="struktur"
                  active={activeTab === 'struktur'}
                  onClick={() => setActiveTab('struktur')}
                  className="tab-link"
                >
                  <FaUsers className="me-2" />
                  Struktur Organisasi
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="kepengurusan"
                  active={activeTab === 'kepengurusan'}
                  onClick={() => setActiveTab('kepengurusan')}
                  className="tab-link"
                >
                  <FaUserTie className="me-2" />
                  Kepengurusan
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="divisi"
                  active={activeTab === 'divisi'}
                  onClick={() => setActiveTab('divisi')}
                  className="tab-link"
                >
                  <FaChalkboardUser className="me-2" />
                  Divisi
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <TabContent className="tab-content-custom">
              <TabPane eventKey="struktur" active={activeTab === 'struktur'}>
                <div className="struktur-chart">
                  <div className="chart-level level-1">
                    <div className="chart-box ketua">
                      <span className="box-title">Ketua Umum</span>
                      <span className="box-subtitle">Pimpinan Organisasi</span>
                    </div>
                  </div>

                  <div className="chart-connector"></div>

                  <div className="chart-level level-2">
                    <div className="chart-box wakil">
                      <span className="box-title">Wakil Ketua</span>
                    </div>
                    <div className="chart-box sekretaris">
                      <span className="box-title">Sekretaris</span>
                    </div>
                    <div className="chart-box bendahara">
                      <span className="box-title">Bendahara</span>
                    </div>
                  </div>

                  <div className="chart-connector"></div>

                  <div className="chart-level level-3">
                    <div className="chart-box divisi">
                      <span className="box-title">Divisi Pengembangan SDM</span>
                    </div>
                    <div className="chart-box divisi">
                      <span className="box-title">Divisi Olahraga</span>
                    </div>
                    <div className="chart-box divisi">
                      <span className="box-title">Divisi Hubungan Masyarakat</span>
                    </div>
                    <div className="chart-box divisi">
                      <span className="box-title">Divisi Kemitraan</span>
                    </div>
                  </div>
                </div>
              </TabPane>

              <TabPane eventKey="kepengurusan" active={activeTab === 'kepengurusan'}>
                <Row className="kepengurusan-grid">
                  {kepengurusan.map((pengurus, idx) => (
                    <Col lg={6} md={12} key={idx} className="mb-4">
                      <div className="pengurus-card">
                        <div className="pengurus-icon">
                          <FaUserTie />
                        </div>
                        <h5 className="pengurus-posisi">{pengurus.posisi}</h5>
                        <p className="pengurus-nama">{pengurus.nama}</p>
                        <span className="pengurus-divisi">{pengurus.divisi}</span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </TabPane>

              <TabPane eventKey="divisi" active={activeTab === 'divisi'}>
                <Row>
                  {divisi.map((div, idx) => (
                    <Col lg={6} md={12} key={idx} className="mb-4">
                      <div className="divisi-card">
                        <h5 className="divisi-nama">{div.nama}</h5>
                        <p className="divisi-deskripsi">{div.deskripsi}</p>
                        <div className="divisi-footer">
                          <span className="divisi-anggota">
                            <FaUsers className="me-2" />
                            {div.anggota} Anggota
                          </span>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </TabPane>
            </TabContent>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
