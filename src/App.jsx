import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Navbar from './components/layout/Navbar/Navbar';
import Hero from './components/sections/Hero/Hero';
import InformasiUmum from './components/sections/InformasiUmum/InformasiUmum';
import KetuaUmum from './components/sections/KetuaUmum/KetuaUmum';
import BeritaInformasi from './components/sections/BeritaInformasi/BeritaInformasi';
import Dokumentasi from './components/sections/Dokumentasi/Dokumentasi';
import Spotify from './components/sections/Spotify/Spotify';
import StrukturOrganisasi from './components/sections/StrukturOrganisasi/StrukturOrganisasi';
import NaraHubung from './components/sections/NaraHubung/NaraHubung';
import Footer from './components/layout/Footer/Footer';

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
      <StrukturOrganisasi />
      <NaraHubung />
      <Footer />
    </div>
  );
}

export default App;
