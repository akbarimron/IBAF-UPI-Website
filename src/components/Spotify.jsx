import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaSpotify } from 'react-icons/fa';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import podcastImg from '../img/podcast/podcast.png';
import './Spotify.css';

export default function Spotify() {
  const ref = useIntersectionObserver();
  const playlists = [
  
    {
      id: 1,
      nama: 'IBAF UPI Podcast',
      deskripsi: 'Podcast seputar kebugaran, kesehatan, dan tips latihan dari para ahli',
      jumlahLagu: 2,
      spotifyUrl: 'https://open.spotify.com/show/3mmq0WiP3ovGZHaZwdb4nK?si=fa0EWvHsRBegKjJBtWXmmA&utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnvA7trCqOCaJrqik5oA9QgDlYilQbz_Yt1H0N5MI9V8L3t0WKrFcE8giDt00_aem_G1G8CqNzxBs7FZgAWygHJQ&nd=1&dlsi=2abdeb46f26a40ce'
    },
   
  ];
  return (
    <section className="spotify-section fade-in-section" ref={ref} id="spotify">
      <Container>
        <div className="section-header">
          <h2>Spotify IBAF UPI</h2>
          <p>Dengarkan playlist motivasi kami</p>
        </div>

        <Row className="g-4">
          {playlists.map((playlist) => (
            <Col md={6} lg={4} key={playlist.id}>
              <Card className="spotify-card">
          
                  <img src={podcastImg} alt={playlist.nama} className="podcast-img" />
              
                <Card.Body>
                  <Card.Title className="playlist-nama">{playlist.nama}</Card.Title>
                  <Card.Text className="playlist-deskripsi">{playlist.deskripsi}</Card.Text>
                  <div className="playlist-info">
                    <span className="badge bg-success">{playlist.jumlahLagu} Lagu</span>
                  </div>
                  <a href={playlist.spotifyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm w-100 mt-3">
                    <FaSpotify className="me-2" />
                    Dengarkan di Spotify
                  </a>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className="mt-5">
          <Col md={12}>
            <Card className="spotify-info">
              <Card.Body>
                <h5>Nikmati Musik Bersama IBAF UPI</h5>
                <p>
                  Musik adalah bagian penting dari pengalaman latihan. Kami telah menyiapkan playlist khusus di Spotify 
                  yang dirancang untuk meningkatkan motivasi dan semangat Anda saat berolahraga. Setiap playlist dipilih dengan cermat 
                  untuk memberikan energi yang tepat di setiap tahap latihan Anda.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
