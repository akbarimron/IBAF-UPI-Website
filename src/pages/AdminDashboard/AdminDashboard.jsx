import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Selamat Datang, Admin!</h2>
          <p>Email: {currentUser?.email}</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3>Manajemen User</h3>
            <p>Kelola pengguna dan hak akses</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📰</div>
            <h3>Berita & Informasi</h3>
            <p>Tambah dan edit berita</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📸</div>
            <h3>Dokumentasi</h3>
            <p>Upload dan kelola foto</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🎙️</div>
            <h3>Podcast</h3>
            <p>Kelola episode podcast</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👔</div>
            <h3>Struktur Organisasi</h3>
            <p>Update struktur kepengurusan</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">⚙️</div>
            <h3>Pengaturan</h3>
            <p>Konfigurasi website</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
