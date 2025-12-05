import React, { useState } from 'react';
import { Container, Row, Col, Nav, TabContent, TabPane } from 'react-bootstrap';
import { FaUsers, FaChalkboardUser, FaUserTie } from 'react-icons/fa6';
import { FaGraduationCap, FaCalendarAlt } from 'react-icons/fa';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import organisasiData from './organisasiData.json';
import './StrukturOrganisasi.css';

export default function StrukturOrganisasi() {
  const ref = useIntersectionObserver();
  const [activeTab, setActiveTab] = useState('struktur');
  const [activeDivisi, setActiveDivisi] = useState(1);

  const { kepengurusan, divisi: divisiData } = organisasiData;

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
                {/* Ketua Umum */}
                <div className="ketua-section mb-5">
                  <h4 className="section-subtitle mb-4">Ketua Umum</h4>
                  <Row className="justify-content-center">
                    <Col lg={6} md={8} className="mb-4">
                      <div className="info-card ketua-card">
                        <h5 className="info-posisi">{kepengurusan.ketua_umum.posisi}</h5>
                        <h4 className="info-nama">{kepengurusan.ketua_umum.nama}</h4>
                        <div className="info-meta">
                          <div className="meta-item">
                            <FaGraduationCap className="me-2" />
                            <span>{kepengurusan.ketua_umum.prodi}</span>
                          </div>
                          <div className="meta-item">
                            <FaCalendarAlt className="me-2" />
                            <span>Angkatan {kepengurusan.ketua_umum.tahun_angkatan}</span>
                          </div>
                        </div>
                        <p className="info-deskripsi">{kepengurusan.ketua_umum.deskripsi}</p>
                        <div className="info-kontribusi">
                          <strong>Kontribusi:</strong> {kepengurusan.ketua_umum.kontribusi}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Wakil Ketua */}
                <div className="wakil-section">
                  <h4 className="section-subtitle mb-4">Wakil Ketua Umum</h4>
                  <Row className="kepengurusan-grid">
                    {kepengurusan.wakil_ketua && kepengurusan.wakil_ketua.map((wakil, idx) => (
                      <Col lg={6} md={12} key={idx} className="mb-4">
                        <div className="info-card">
                          <h5 className="info-posisi">{wakil.posisi}</h5>
                          <h5 className="info-nama">{wakil.nama}</h5>
                          <div className="info-meta">
                            <div className="meta-item">
                              <FaGraduationCap className="me-2" />
                              <span>{wakil.prodi}</span>
                            </div>
                            <div className="meta-item">
                              <FaCalendarAlt className="me-2" />
                              <span>Angkatan {wakil.tahun_angkatan}</span>
                            </div>
                          </div>
                          <p className="info-deskripsi">{wakil.deskripsi}</p>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </TabPane>

              <TabPane eventKey="divisi" active={activeTab === 'divisi'}>
                <Row className="divisi-buttons mb-4">
                  {divisiData && divisiData.map((div) => (
                    <Col lg={6} md={12} key={div.id} className="mb-3">
                      <button
                        className={`divisi-button w-100 ${activeDivisi === div.id ? 'active' : ''}`}
                        onClick={() => setActiveDivisi(div.id)}
                      >
                        <FaUsers className="me-2" />
                        {div.nama}
                      </button>
                    </Col>
                  ))}
                </Row>

                {activeDivisi && (
                  <div className="divisi-detail">
                    {divisiData && divisiData
                      .filter((div) => div.id === activeDivisi)
                      .map((div) => (
                        <div key={div.id}>
                          <h3 className="divisi-title mb-4">{div.nama}</h3>
                          <p className="divisi-deskripsi mb-4">{div.deskripsi}</p>

                          {/* Kepala Divisi */}
                          {div.kepala_divisi && (
                            <div className="kepala-divisi-section mb-5">
                              <h5 className="section-subtitle mb-3">Kepala Divisi</h5>
                              <Row className="justify-content-center">
                                <Col lg={5} md={8}>
                                  <div className="info-card kepala-divisi-card">
                                    <h5 className="info-nama">{div.kepala_divisi.nama}</h5>
                                    <div className="info-meta justify-content-center">
                                      <div className="meta-item">
                                        <FaGraduationCap className="me-2" />
                                        <span>{div.kepala_divisi.prodi}</span>
                                      </div>
                                      <div className="meta-item">
                                        <FaCalendarAlt className="me-2" />
                                        <span>Angkatan {div.kepala_divisi.tahun_angkatan}</span>
                                      </div>
                                    </div>
                                    <p className="info-deskripsi-small">{div.kepala_divisi.deskripsi}</p>
                                  </div>
                                </Col>
                              </Row>
                            </div>
                          )}

                          {/* Anggota Divisi */}
                          {div.anggota && div.anggota.length > 0 && (
                            <div className="anggota-divisi-section">
                              <h5 className="section-subtitle mb-3">
                                Anggota ({div.anggota.length} orang)
                              </h5>
                              <Row>
                                {div.anggota.map((anggota, idx) => (
                                  <Col lg={4} md={6} sm={12} key={idx} className="mb-4">
                                    <div className="anggota-card">
                                      <h6 className="anggota-nama">{anggota.nama}</h6>
                                      <p className="anggota-peran">{anggota.peran}</p>
                                      <div className="anggota-meta">
                                        <small>
                                          <FaGraduationCap className="me-1" />
                                          {anggota.prodi}
                                        </small>
                                      </div>
                                      <div className="anggota-meta">
                                        <small>
                                          <FaCalendarAlt className="me-1" />
                                          {anggota.tahun_angkatan}
                                        </small>
                                      </div>
                                    </div>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </TabPane>
            </TabContent>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
