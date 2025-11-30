import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InformasiUmum from './components/InformasiUmum';
import KetuaUmum from './components/KetuaUmum';
import BeritaInformasi from './components/BeritaInformasi';
import Dokumentasi from './components/Dokumentasi';
import Spotify from './components/Spotify';
import NaraHubung from './components/NaraHubung';
import Footer from './components/Footer';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Hero />
      <InformasiUmum />
      <KetuaUmum />
      <BeritaInformasi />
      <Dokumentasi />
      <Spotify />

      <NaraHubung />
      <Footer />
    </div>
  );
}

export default App;
