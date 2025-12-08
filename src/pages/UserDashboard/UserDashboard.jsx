import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import './UserDashboard.css';

const UserDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Notes state
  const [notes, setNotes] = useState([]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', category: 'personal' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchNotes();
    }
  }, [currentUser]);

  const fetchNotes = async () => {
    try {
      const q = query(
        collection(db, 'notes'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const notesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by createdAt on client side to handle serverTimestamp issues
      notesData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setNotes(notesData);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteForm.title || !noteForm.content) return;

    setLoading(true);
    try {
      const newNote = {
        ...noteForm,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'notes'), newNote);
      
      setNoteForm({ title: '', content: '', category: 'personal' });
      setShowNoteForm(false);
      
      // Wait a bit for serverTimestamp to be processed, then fetch
      setTimeout(() => {
        fetchNotes();
      }, 500);
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Gagal menambahkan catatan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    if (!editingNote || !noteForm.title || !noteForm.content) return;

    setLoading(true);
    try {
      const noteRef = doc(db, 'notes', editingNote.id);
      await updateDoc(noteRef, {
        title: noteForm.title,
        content: noteForm.content,
        category: noteForm.category,
        updatedAt: serverTimestamp()
      });
      setEditingNote(null);
      setNoteForm({ title: '', content: '', category: 'personal' });
      fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Gagal mengupdate catatan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Yakin ingin menghapus catatan ini?')) return;

    try {
      await deleteDoc(doc(db, 'notes', noteId));
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Gagal menghapus catatan');
    }
  };

  const startEditNote = (note) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content,
      category: note.category
    });
    setShowNoteForm(false);
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setNoteForm({ title: '', content: '', category: 'personal' });
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="user-dashboard">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>IBAF UPI</h2>
          <p>Member Dashboard</p>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            Overview
          </button>
          <button 
            className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            <span className="nav-icon">📝</span>
            Catatan Saya
          </button>
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="nav-icon">👤</span>
            Profil
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
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>
            {activeTab === 'overview' && 'Overview'}
            {activeTab === 'notes' && 'Catatan Saya'}
            {activeTab === 'profile' && 'Profil Saya'}
          </h1>
          <div className="user-info">
            <span>{currentUser?.email}</span>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="welcome-card">
                <h2>Selamat Datang! 👋</h2>
                <p>Kelola aktivitas dan catatan fitness Anda di sini</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-info">
                    <h3>{notes.length}</h3>
                    <p>Total Catatan</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💪</div>
                  <div className="stat-info">
                    <h3>Member</h3>
                    <p>Status</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-info">
                    <h3>Aktif</h3>
                    <p>Aktivitas</p>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Aksi Cepat</h3>
                <div className="action-buttons">
                  <button 
                    className="action-btn"
                    onClick={() => {
                      setActiveTab('notes');
                      setShowNoteForm(true);
                    }}
                  >
                    ➕ Buat Catatan Baru
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => navigate('/')}
                  >
                    📰 Lihat Berita
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="notes-section">
              <div className="notes-header">
                <button 
                  className="add-note-btn"
                  onClick={() => {
                    setShowNoteForm(!showNoteForm);
                    setEditingNote(null);
                    setNoteForm({ title: '', content: '', category: 'personal' });
                  }}
                >
                  {showNoteForm ? '✖ Tutup' : '➕ Tambah Catatan'}
                </button>
              </div>

              {/* Note Form */}
              {(showNoteForm || editingNote) && (
                <div className="note-form-card">
                  <h3>{editingNote ? 'Edit Catatan' : 'Catatan Baru'}</h3>
                  <form onSubmit={editingNote ? handleUpdateNote : handleAddNote}>
                    <div className="form-group">
                      <label>Judul</label>
                      <input
                        type="text"
                        value={noteForm.title}
                        onChange={(e) => setNoteForm({...noteForm, title: e.target.value})}
                        placeholder="Judul catatan"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Kategori</label>
                      <select
                        value={noteForm.category}
                        onChange={(e) => setNoteForm({...noteForm, category: e.target.value})}
                      >
                        <option value="personal">Personal</option>
                        <option value="training">Training</option>
                        <option value="nutrition">Nutrisi</option>
                        <option value="general">Umum</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Isi Catatan</label>
                      <textarea
                        value={noteForm.content}
                        onChange={(e) => setNoteForm({...noteForm, content: e.target.value})}
                        placeholder="Tulis catatan Anda..."
                        rows="5"
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Menyimpan...' : (editingNote ? 'Update' : 'Simpan')}
                      </button>
                      {editingNote && (
                        <button type="button" className="cancel-btn" onClick={cancelEdit}>
                          Batal
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* Notes List */}
              <div className="notes-grid">
                {notes.length === 0 ? (
                  <div className="empty-state">
                    <p>📝 Belum ada catatan. Buat catatan pertama Anda!</p>
                  </div>
                ) : (
                  notes.map(note => (
                    <div key={note.id} className="note-card">
                      <div 
                        className="note-category-badge" 
                        style={{ backgroundColor: getCategoryColor(note.category) }}
                      >
                        {note.category}
                      </div>
                      <h4>{note.title}</h4>
                      <p>{note.content}</p>
                      <div className="note-footer">
                        <small>
                          {note.createdAt?.toDate ? 
                            new Date(note.createdAt.toDate()).toLocaleDateString('id-ID') : 
                            'Baru saja'
                          }
                        </small>
                        <div className="note-actions">
                          <button 
                            onClick={() => startEditNote(note)}
                            className="edit-btn"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteNote(note.id)}
                            className="delete-btn"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="profile-card">
                <div className="profile-avatar">
                  <div className="avatar-circle">
                    {currentUser?.email?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="profile-info">
                  <div className="info-row">
                    <label>Email:</label>
                    <span>{currentUser?.email}</span>
                  </div>
                  <div className="info-row">
                    <label>User ID:</label>
                    <span>{currentUser?.uid}</span>
                  </div>
                  <div className="info-row">
                    <label>Status:</label>
                    <span className="status-badge">Member Aktif</span>
                  </div>
                  <div className="info-row">
                    <label>Bergabung:</label>
                    <span>{currentUser?.metadata?.creationTime ? 
                      new Date(currentUser.metadata.creationTime).toLocaleDateString('id-ID') : 
                      'N/A'
                    }</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
