import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  query,
  deleteDoc,
  doc 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNotes: 0,
    activeUsers: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchAllNotes()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setStats(prev => ({ ...prev, totalUsers: usersData.length }));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAllNotes = async () => {
    try {
      const q = query(collection(db, 'notes'));
      const querySnapshot = await getDocs(q);
      const notesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by createdAt on client side
      notesData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setAllNotes(notesData);
      setStats(prev => ({ 
        ...prev, 
        totalNotes: notesData.length,
        activeUsers: new Set(notesData.map(n => n.userId)).size
      }));
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Yakin ingin menghapus catatan ini?')) return;
    
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      fetchAllNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Gagal menghapus catatan');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      personal: '#B63333',
      training: '#2563eb',
      nutrition: '#059669',
      general: '#7c3aed'
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>IBAF UPI</h2>
          <p>Admin Panel</p>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            Kelola User
          </button>
          <button 
            className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            <span className="nav-icon">📝</span>
            Semua Catatan
          </button>
          <button 
            className="nav-item"
            onClick={() => navigate('/')}
          >
            <span className="nav-icon">🏠</span>
            Beranda
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-header">
          <h1>
            {activeTab === 'overview' && 'Dashboard Admin'}
            {activeTab === 'users' && 'Manajemen User'}
            {activeTab === 'notes' && 'Semua Catatan User'}
          </h1>
          <div className="admin-info">
            <span className="admin-badge">Admin</span>
            <span>{currentUser?.email}</span>
          </div>
        </div>

        <div className="admin-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <h3>{stats.totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                <div className="stat-card success">
                  <div className="stat-icon">📝</div>
                  <div className="stat-info">
                    <h3>{stats.totalNotes}</h3>
                    <p>Total Catatan</p>
                  </div>
                </div>
                <div className="stat-card warning">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>{stats.activeUsers}</h3>
                    <p>User Aktif</p>
                  </div>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Aktivitas Terbaru</h3>
                <div className="activity-list">
                  {allNotes.slice(0, 10).map(note => (
                    <div key={note.id} className="activity-item">
                      <div className="activity-icon">📝</div>
                      <div className="activity-info">
                        <p><strong>{note.userEmail}</strong> membuat catatan</p>
                        <small>{note.title}</small>
                        <small className="activity-time">
                          {note.createdAt?.toDate ? 
                            new Date(note.createdAt.toDate()).toLocaleString('id-ID') : 
                            'Baru saja'
                          }
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="users-section">
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Bergabung</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          {user.createdAt ? 
                            new Date(user.createdAt).toLocaleDateString('id-ID') : 
                            'N/A'
                          }
                        </td>
                        <td>
                          <span className="status-active">Aktif</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Notes Tab */}
          {activeTab === 'notes' && (
            <div className="notes-section">
              <div className="notes-grid">
                {allNotes.length === 0 ? (
                  <div className="empty-state">
                    <p>Belum ada catatan dari user</p>
                  </div>
                ) : (
                  allNotes.map(note => (
                    <div key={note.id} className="note-card">
                      <div className="note-header">
                        <div 
                          className="note-category-badge" 
                          style={{ backgroundColor: getCategoryColor(note.category) }}
                        >
                          {note.category}
                        </div>
                        <button 
                          onClick={() => handleDeleteNote(note.id)}
                          className="delete-note-btn"
                          title="Hapus catatan"
                        >
                          🗑️
                        </button>
                      </div>
                      <h4>{note.title}</h4>
                      <p>{note.content}</p>
                      <div className="note-footer">
                        <div className="note-author">
                          <strong>📧 {note.userEmail}</strong>
                        </div>
                        <small>
                          {note.createdAt?.toDate ? 
                            new Date(note.createdAt.toDate()).toLocaleDateString('id-ID') : 
                            'Baru saja'
                          }
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
