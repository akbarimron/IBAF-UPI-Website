import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const UserDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="user-dashboard-container">
      <div className="user-dashboard-header">
        <h1>User Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="user-dashboard-content">
        <div className="user-welcome-card">
          <h2>Selamat Datang!</h2>
          <p>Email: {currentUser?.email}</p>
        </div>

        <div className="user-info-grid">
          <div className="user-info-card">
            <div className="info-icon">📰</div>
            <h3>Berita Terbaru</h3>
            <p>Lihat informasi dan berita terkini</p>
            <button onClick={() => navigate('/')} className="info-btn">
              Lihat Berita
            </button>
          </div>

          <div className="user-info-card">
            <div className="info-icon">📸</div>
            <h3>Galeri Foto</h3>
            <p>Jelajahi dokumentasi kegiatan</p>
            <button onClick={() => navigate('/')} className="info-btn">
              Lihat Galeri
            </button>
          </div>

          <div className="user-info-card">
            <div className="info-icon">🎙️</div>
            <h3>Podcast</h3>
            <p>Dengarkan episode podcast kami</p>
            <button onClick={() => navigate('/')} className="info-btn">
              Dengarkan
            </button>
          </div>

          <div className="user-info-card">
            <div className="info-icon">👥</div>
            <h3>Struktur Organisasi</h3>
            <p>Lihat struktur kepengurusan</p>
            <button onClick={() => navigate('/')} className="info-btn">
              Lihat Struktur
            </button>
          </div>
        </div>

        <div className="profile-section">
          <h3>Profil Saya</h3>
          <div className="profile-info">
            <p><strong>Email:</strong> {currentUser?.email}</p>
            <p><strong>User ID:</strong> {currentUser?.uid}</p>
            <p><strong>Status:</strong> <span className="status-badge">Member</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
