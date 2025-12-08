import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import WorkoutLog from '../../components/sections/WorkoutLog/WorkoutLog';
import UserVerification from '../../components/sections/UserVerification/UserVerification';
import './UserDashboard.css';

const UserDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  
  // Profile state
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Message state
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
      fetchMessages();
    }
  }, [currentUser]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setName(data.name || '');
        setPhotoPreview(data.photoURL || null);
        
        // Check if user needs verification or profile completion
        const hasBasicProfile = data.fullName && data.nim && data.prodi;
        const status = data.verificationStatus || 'not_submitted';
        
        setVerificationStatus(status);
        setNeedsVerification(!hasBasicProfile || status === 'not_submitted');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const q = query(
        collection(db, 'userMessages'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending client-side
      msgs.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
      setMessages(msgs);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Ukuran foto maksimal 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      alert('Nama tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      let photoURL = userData?.photoURL || '';
      
      // Upload photo if new file selected
      if (photoFile) {
        const storageRef = ref(storage, `profile-photos/${currentUser.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // Update Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: name.trim(),
        photoURL: photoURL,
        updatedAt: new Date().toISOString()
      });

      setUserData({ ...userData, name: name.trim(), photoURL });
      setEditMode(false);
      setPhotoFile(null);
      alert('Profil berhasil diupdate!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal update profil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'userMessages'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: userData?.name || currentUser.email,
        message: message.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setMessage('');
      fetchMessages();
      alert('Pesan berhasil dikirim ke admin!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Gagal mengirim pesan');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="user-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="brand-section">
            <Link to="/" className="back-home-link">
              ← Kembali ke Halaman Utama
            </Link>
          </div>
          <div className="header-actions">
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      
      {/* Show verification form if not verified */}
      {needsVerification && verificationStatus === 'not_submitted' ? (
        <UserVerification userData={userData} onUpdate={fetchUserData} />
      ) : verificationStatus === 'pending' ? (
        <div className="verification-pending-container">
          <div className="pending-card">
            <div className="pending-icon">⏳</div>
            <h2>Menunggu Verifikasi</h2>
            <p>Data Anda sedang diproses oleh admin. Mohon tunggu hingga akun Anda disetujui.</p>
            <div className="pending-info">
              <p><strong>Status:</strong> Pending</p>
              <p><strong>Dikirim:</strong> {userData?.verificationRequestedAt ? new Date(userData.verificationRequestedAt).toLocaleDateString('id-ID') : '-'}</p>
            </div>
            <button onClick={handleLogout} className="btn-logout-alt">Logout</button>
          </div>
        </div>
      ) : verificationStatus === 'rejected' ? (
        <div className="verification-rejected-container">
          <div className="rejected-card">
            <div className="rejected-icon">❌</div>
            <h2>Verifikasi Ditolak</h2>
            <p>Maaf, data verifikasi Anda ditolak oleh admin.</p>
            {userData?.rejectionReason && (
              <div className="rejection-reason">
                <strong>Alasan:</strong>
                <p>{userData.rejectionReason}</p>
              </div>
            )}
            <p>Silakan hubungi admin untuk informasi lebih lanjut atau kirim ulang data yang benar.</p>
            <div className="rejected-actions">
              <button onClick={() => {
                setNeedsVerification(true);
                setVerificationStatus('not_submitted');
              }} className="btn-resubmit">
                📝 Kirim Ulang Data
              </button>
              <button onClick={handleLogout} className="btn-logout-alt">Logout</button>
            </div>
          </div>
        </div>
      ) : (
      <div className="dashboard-container">{/* Regular dashboard content */}
        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <div className="user-info-card">
            <div className="user-avatar">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">
                  {userData?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <h3>{userData?.name || 'User'}</h3>
            <p className="user-email">{currentUser?.email}</p>
            <div className={`account-status ${userData?.isActive ? 'active' : 'inactive'}`}>
              {userData?.isActive !== false ? (
                <>
                  <span className="status-dot active"></span>
                  <span>Akun Aktif</span>
                </>
              ) : (
                <>
                  <span className="status-dot inactive"></span>
                  <span>Akun Tidak Aktif</span>
                </>
              )}
            </div>
          </div>

          <nav className="dashboard-nav">
            <button
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="nav-icon">📊</span>
              Overview
            </button>
            <button
              className={`nav-item ${activeTab === 'workout' ? 'active' : ''}`}
              onClick={() => setActiveTab('workout')}
            >
              <span className="nav-icon">💪</span>
              Workout Log
            </button>
            <button
              className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              <span className="nav-icon">💬</span>
              Pesan Admin
            </button>
            <button
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="nav-icon">👤</span>
              Profile
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="dashboard-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h2>Dashboard Overview</h2>
              <div className="overview-grid">
                <div className="overview-card">
                  <div className="card-icon">💪</div>
                  <div className="card-content">
                    <h4>Status Akun</h4>
                    <p className={userData?.isActive !== false ? 'status-active' : 'status-inactive'}>
                      {userData?.isActive !== false ? 'Aktif' : 'Tidak Aktif'}
                    </p>
                  </div>
                </div>
                
                <div className="overview-card">
                  <div className="card-icon">📧</div>
                  <div className="card-content">
                    <h4>Pesan</h4>
                    <p>{messages.length} pesan</p>
                  </div>
                </div>

                <div className="overview-card">
                  <div className="card-icon">👤</div>
                  <div className="card-content">
                    <h4>Member Sejak</h4>
                    <p>{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                </div>
              </div>

              <div className="welcome-message">
                <h3>Selamat datang, {userData?.name || 'Member'}!</h3>
                <p>Gunakan menu di samping untuk mengakses fitur-fitur dashboard Anda.</p>
                <ul className="feature-list">
                  <li>📝 <strong>Workout Log:</strong> Catat dan pantau progress latihan Anda selama 8 minggu</li>
                  <li>💬 <strong>Pesan Admin:</strong> Kirim pertanyaan atau laporan ke admin</li>
                  <li>👤 <strong>Profile:</strong> Update informasi dan foto profil Anda</li>
                </ul>
              </div>
            </div>
          )}

          {/* Workout Log Tab */}
          {activeTab === 'workout' && (
            <div className="workout-tab">
              <WorkoutLog />
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="messages-tab">
              <h2>Pesan ke Admin</h2>
              
              <div className="message-form-card">
                <h3>Kirim Pesan Baru</h3>
                <form onSubmit={handleSendMessage}>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tulis pertanyaan atau laporan Anda..."
                    rows="5"
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading || !message.trim()}>
                    {loading ? 'Mengirim...' : 'Kirim Pesan'}
                  </button>
                </form>
              </div>

              <div className="messages-list">
                <h3>Riwayat Pesan</h3>
                {messages.length === 0 ? (
                  <p className="no-messages">Belum ada pesan</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="message-item">
                      <div className="message-header">
                        <span className="message-date">
                          {new Date(msg.createdAt).toLocaleString('id-ID')}
                        </span>
                        <span className={`message-status ${msg.status}`}>
                          {msg.status === 'pending' ? 'Menunggu' : msg.status === 'read' ? 'Dibaca' : 'Dibalas'}
                        </span>
                      </div>
                      <p className="message-text">{msg.message}</p>
                      {msg.reply && (
                        <div className="admin-reply">
                          <strong>Balasan Admin:</strong>
                          <p>{msg.reply}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-tab">
              <h2>Profile Saya</h2>
              
              <div className="profile-card">
                <div className="profile-photo-section">
                  <div className="profile-photo-wrapper">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="profile-photo" />
                    ) : (
                      <div className="profile-photo-placeholder">
                        {userData?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  {editMode && (
                    <div className="photo-upload">
                      <label htmlFor="photo-input" className="upload-btn">
                        📷 Pilih Foto
                      </label>
                      <input
                        id="photo-input"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                      />
                      <p className="upload-hint">Maksimal 5MB</p>
                    </div>
                  )}
                </div>

                <div className="profile-info">
                  <div className="info-group">
                    <label>Nama Lengkap</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama lengkap"
                      />
                    ) : (
                      <p>{userData?.name || '-'}</p>
                    )}
                  </div>

                  <div className="info-group">
                    <label>Email</label>
                    <p>{currentUser?.email}</p>
                  </div>

                  <div className="info-group">
                    <label>Status Akun</label>
                    <p className={userData?.isActive !== false ? 'status-active' : 'status-inactive'}>
                      {userData?.isActive !== false ? '✓ Aktif' : '✗ Tidak Aktif'}
                    </p>
                  </div>

                  <div className="info-group">
                    <label>Bergabung Sejak</label>
                    <p>{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
                  </div>

                  <div className="profile-actions">
                    {editMode ? (
                      <>
                        <button onClick={handleSaveProfile} disabled={loading} className="save-btn">
                          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                        <button onClick={() => {
                          setEditMode(false);
                          setName(userData?.name || '');
                          setPhotoFile(null);
                          setPhotoPreview(userData?.photoURL || null);
                        }} className="cancel-btn">
                          Batal
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setEditMode(true)} className="edit-btn">
                        ✏️ Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default UserDashboard;
