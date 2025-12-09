import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import WorkoutLog from '../../components/sections/WorkoutLog/WorkoutLog';
import UserVerification from '../../components/sections/UserVerification/UserVerification';
import Notification from '../../components/Notification/Notification';
import './UserDashboard.css';

const UserDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState(null);
  
  // Profile state
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Message state
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageFilter, setMessageFilter] = useState('all'); // all, sent, received
  
  // Workout statistics state
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // Notification count state
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  // Show notification helper
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  // Get week category and color
  const getWeekCategory = (weekNum) => {
    if (weekNum === 0 || weekNum === 9) return { label: 'Post Test', color: '#4CAF50' }; // Hijau
    if (weekNum >= 1 && weekNum <= 3) return { label: 'Hypertrophy', color: '#2196F3' }; // Biru
    if (weekNum === 4 || weekNum === 8) return { label: 'Deload', color: '#FFC107' }; // Kuning
    if (weekNum >= 5 && weekNum <= 7) return { label: 'Strength', color: '#F44336' }; // Merah
    return { label: '', color: '#999' };
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
      
      // Initialize weeks 0-9 (including post-test weeks)
      const initialWeeks = [];
      for (let i = 0; i <= 9; i++) {
        initialWeeks.push({
          week: i,
          totalVolume: 0,
          workoutDays: 0,
          totalExercises: 0,
          hasData: false,
          ...getWeekCategory(i)
        });
      }
      setWeeklyStats(initialWeeks);
      
      // Real-time listener for workout logs to update statistics
      const workoutLogsRef = collection(db, 'workoutLogs');
      const qWorkout = query(workoutLogsRef, where('userId', '==', currentUser.uid));
      
      const unsubscribeWorkout = onSnapshot(qWorkout, (snapshot) => {
        const weekStats = {};
        
        // Initialize weeks 0-9 with default values
        for (let i = 0; i <= 9; i++) {
          weekStats[i] = {
            week: i,
            totalVolume: 0,
            workoutDays: 0,
            totalExercises: 0,
            hasData: false,
            ...getWeekCategory(i)
          };
        }
        
        // Fill in actual data from workout logs
        snapshot.forEach((doc) => {
          const data = doc.data();
          const weekNum = data.weekNumber || data.week || 1;
          
          if (weekStats[weekNum]) {
            weekStats[weekNum].totalVolume += data.totalVolume || 0;
            weekStats[weekNum].workoutDays += 1;
            weekStats[weekNum].totalExercises += data.exercises?.length || 0;
            weekStats[weekNum].hasData = true;
          }
        });
        
        // Convert to array and sort by week
        const statsArray = Object.values(weekStats).sort((a, b) => a.week - b.week);
        setWeeklyStats(statsArray);
      });
      
      // Real-time listener for messages (both user and admin messages)
      const qUserMessages = query(
        collection(db, 'userMessages'),
        where('userId', '==', currentUser.uid)
      );
      
      const qAdminMessages = query(
        collection(db, 'adminMessages'),
        where('userId', '==', currentUser.uid)
      );
      
      // Listen to user messages
      const unsubscribeUserMessages = onSnapshot(qUserMessages, (snapshot) => {
        const userMsgs = [];
        snapshot.forEach((doc) => {
          userMsgs.push({ id: doc.id, type: 'user', ...doc.data() });
        });
        
        // Listen to admin messages
        const unsubscribeAdminMessages = onSnapshot(qAdminMessages, (snapshot) => {
          const adminMsgs = [];
          snapshot.forEach((doc) => {
            adminMsgs.push({ id: doc.id, type: 'admin', ...doc.data() });
          });
          
          // Combine and sort all messages - admin messages first, then by date
          const allMessages = [...userMsgs, ...adminMsgs];
          allMessages.sort((a, b) => {
            // Admin messages first
            if (a.type === 'admin' && b.type !== 'admin') return -1;
            if (a.type !== 'admin' && b.type === 'admin') return 1;
            
            // Then sort by date (newest first)
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA;
          });
          
          // Count unread admin messages
          const unreadAdminMessages = adminMsgs.filter(msg => msg.status !== 'read').length;
          setUnreadCount(unreadAdminMessages);
          
          setMessages(allMessages);
        });
        
        // Cleanup admin messages listener
        return () => unsubscribeAdminMessages();
      });
      
      // Real-time listener for announcements
      const qAnnouncements = query(
        collection(db, 'announcements'),
        where('isActive', '==', true)
      );
      
      const unsubscribeAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
        const announcementsList = [];
        snapshot.forEach((doc) => {
          announcementsList.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by date (newest first)
        announcementsList.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });
        
        setAnnouncements(announcementsList);
      });
      
      // Cleanup
      return () => {
        unsubscribeWorkout();
        unsubscribeUserMessages();
        unsubscribeAnnouncements();
      };
    }
  }, [currentUser]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        // Prioritize fullName from verification over name
        setName(data.fullName || data.name || '');
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showNotification('Ukuran foto maksimal 5MB', 'error');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showNotification('Nama tidak boleh kosong', 'warning');
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
        fullName: name.trim(), // Update fullName as well to keep it in sync
        photoURL: photoURL,
        updatedAt: new Date().toISOString()
      });

      setUserData({ ...userData, name: name.trim(), fullName: name.trim(), photoURL });
      setEditMode(false);
      setPhotoFile(null);
      showNotification('Profil berhasil diupdate!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Gagal update profil: ' + error.message, 'error');
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
        userName: userData?.fullName || userData?.name || currentUser.email,
        message: message.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setMessage('');
      showNotification('Pesan berhasil dikirim ke admin!', 'success');
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Gagal mengirim pesan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId, messageType) => {
    setConfirmMessage('Apakah Anda yakin ingin menghapus pesan ini?');
    setConfirmAction(() => async () => {
      try {
        const collectionName = messageType === 'user' ? 'userMessages' : 'adminMessages';
        await deleteDoc(doc(db, collectionName, messageId));
        showNotification('Pesan berhasil dihapus', 'success');
        setShowConfirmDialog(false);
      } catch (error) {
        console.error('Error deleting message:', error);
        showNotification('Gagal menghapus pesan: ' + error.message, 'error');
        setShowConfirmDialog(false);
      }
    });
    setShowConfirmDialog(true);
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await updateDoc(doc(db, 'adminMessages', messageId), {
        status: 'read',
        readAt: new Date().toISOString()
      });
      showNotification('Pesan ditandai sudah dibaca', 'success');
    } catch (error) {
      console.error('Error marking message as read:', error);
      showNotification('Gagal menandai pesan: ' + error.message, 'error');
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
      {/* Notification System */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          duration={4000}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <button className="hamburger-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="brand-section">
            <Link to="/" className="back-home-link desktop-only">
              ← Kembali ke Halaman Utama
            </Link>
          </div>
          <div className="header-actions">
            <button 
              className="notification-btn" 
              onClick={() => setShowNotificationModal(true)}
            >
              <span className="notification-icon">🔔</span>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            <button onClick={handleLogout} className="logout-btn desktop-only">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="notification-modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <h3>🔔 Notifikasi</h3>
              <button 
                className="close-notification-btn"
                onClick={() => setShowNotificationModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="notification-modal-body">
              {/* Announcements Section */}
              {announcements.length > 0 && (
                <div className="notification-section">
                  <h4 className="notification-section-title">📢 Pengumuman</h4>
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="notification-item announcement-item">
                      <div className="notification-item-header">
                        <span className="notification-item-type">Pengumuman</span>
                        <span className="notification-item-date">
                          {new Date(announcement.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <h5 className="notification-item-title">{announcement.title}</h5>
                      <p className="notification-item-content">{announcement.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Admin Messages Section */}
              {messages.filter(msg => msg.type === 'admin' && msg.status !== 'read').length > 0 && (
                <div className="notification-section">
                  <h4 className="notification-section-title">✉️ Pesan dari Admin</h4>
                  {messages
                    .filter(msg => msg.type === 'admin' && msg.status !== 'read')
                    .slice(0, 5)
                    .map((msg) => (
                      <div 
                        key={msg.id} 
                        className="notification-item message-item"
                        onClick={() => {
                          handleMarkAsRead(msg.id);
                          setShowNotificationModal(false);
                          setActiveTab('messages');
                          setSidebarOpen(false);
                        }}
                      >
                        <div className="notification-item-header">
                          <span className="notification-item-type">Pesan Baru</span>
                          <span className="notification-item-date">
                            {new Date(msg.createdAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="notification-item-content">{msg.message}</p>
                      </div>
                    ))}
                  {messages.filter(msg => msg.type === 'admin' && msg.status !== 'read').length > 5 && (
                    <button 
                      className="view-all-messages-btn"
                      onClick={() => {
                        setShowNotificationModal(false);
                        setActiveTab('messages');
                        setSidebarOpen(false);
                      }}
                    >
                      Lihat Semua Pesan →
                    </button>
                  )}
                </div>
              )}

              {/* Empty State */}
              {announcements.length === 0 && messages.filter(msg => msg.type === 'admin' && msg.status !== 'read').length === 0 && (
                <div className="notification-empty">
                  <div className="empty-icon">🔕</div>
                  <p>Tidak ada notifikasi baru</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay" onClick={() => setShowConfirmDialog(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-header">
              <span className="confirm-icon">⚠️</span>
              <h3>Konfirmasi</h3>
            </div>
            <div className="confirm-dialog-body">
              <p>{confirmMessage}</p>
            </div>
            <div className="confirm-dialog-actions">
              <button 
                className="confirm-btn-cancel"
                onClick={() => setShowConfirmDialog(false)}
              >
                Batal
              </button>
              <button 
                className="confirm-btn-confirm"
                onClick={() => {
                  if (confirmAction) confirmAction();
                }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      
      {/* Show verification form if not verified */}
      {needsVerification && verificationStatus === 'not_submitted' ? (
        <UserVerification userData={userData} onUpdate={fetchUserData} showNotification={showNotification} />
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
        <div className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
          <div className="sidebar-content">
          <div className="user-info-card">
            <div className="user-avatar">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">
                  {(userData?.fullName || userData?.name)?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <h3>{userData?.fullName || userData?.name || 'User'}</h3>
            <p className="user-email">{userData?.fullName || userData?.name || currentUser?.email}</p>
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
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
            >
              <span className="nav-icon">●</span>
              Overview
            </button>
            <button
              className={`nav-item ${activeTab === 'workout' ? 'active' : ''}`}
              onClick={() => { setActiveTab('workout'); setSidebarOpen(false); }}
            >
              <span className="nav-icon">▶</span>
              Workout Log
            </button>
            <button
              className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => { setActiveTab('messages'); setSidebarOpen(false); }}
            >
              <span className="nav-icon">✉</span>
              Pesan Admin
            </button>
            <button
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
            >
              <span className="nav-icon">◉</span>
              Profile
            </button>
            
            <div className="nav-separator mobile-only"></div>
            
            <Link to="/" className="nav-item nav-link mobile-only">
              <span className="nav-icon">←</span>
              Kembali ke Halaman Utama
            </Link>
            
            <button
              className="nav-item nav-logout mobile-only"
              onClick={handleLogout}
            >
              <span className="nav-icon">🚪</span>
              Logout
            </button>
          </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="dashboard-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h2>Dashboard Overview</h2>
              <div className="overview-grid">
                <div className="overview-card">
                  <div className="card-icon">⚡</div>
                  <div className="card-content">
                    <h4>Status Akun</h4>
                    <p className={userData?.isActive !== false ? 'status-active' : 'status-inactive'}>
                      {userData?.isActive !== false ? 'Aktif' : 'Tidak Aktif'}
                    </p>
                  </div>
                </div>
                
                <div className="overview-card">
                  <div className="card-icon">✉</div>
                  <div className="card-content">
                    <h4>Pesan</h4>
                    <p>{messages.length} pesan</p>
                  </div>
                </div>

                <div className="overview-card">
                  <div className="card-icon">◉</div>
                  <div className="card-content">
                    <h4>Member Sejak</h4>
                    <p>{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Weekly Volume Statistics */}
              {weeklyStats.length > 0 && (
                <div className="weekly-stats-section">
                  <h3>📊 Statistik Volume Program (10 Minggu)</h3>
                  
                  {/* Legend */}
                  <div className="stats-legend">
                    <div className="legend-item">
                      <span className="legend-color" style={{backgroundColor: '#4CAF50'}}></span>
                      <span>Post Test</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{backgroundColor: '#2196F3'}}></span>
                      <span>Hypertrophy</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{backgroundColor: '#FFC107'}}></span>
                      <span>Deload</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{backgroundColor: '#F44336'}}></span>
                      <span>Strength</span>
                    </div>
                  </div>

                  {/* Pre-Test vs Post-Test Comparison */}
                  <div className="test-comparison">
                    <h4 className="comparison-title">📊 Perbandingan Pre-Test & Post-Test</h4>
                    <div className="comparison-grid">
                      {weeklyStats.filter(stat => stat.week === 0 || stat.week === 9).map((stat) => (
                        <div 
                          key={stat.week} 
                          className={`stat-card-simple ${!stat.hasData ? 'no-data' : ''}`}
                          style={{
                            borderLeft: `4px solid ${stat.color}`,
                            borderTop: stat.hasData ? `2px solid ${stat.color}` : '2px solid #e0e0e0'
                          }}
                          onClick={() => {
                            if (stat.hasData) {
                              setSelectedWeek(stat);
                              setShowStatsModal(true);
                            }
                          }}
                        >
                          <div className="stat-category" style={{color: stat.color}}>
                            {stat.label}
                          </div>
                          <div className="stat-week">
                            {stat.week === 0 ? 'Pre-Test' : 'Post-Test'}
                          </div>
                          <div className="stat-volume" style={{color: stat.hasData ? stat.color : '#999'}}>
                            {stat.hasData ? `Volume: ${stat.totalVolume.toFixed(1)}` : '-'}
                          </div>
                          <div className="stat-hint">
                            {stat.hasData ? 'Klik untuk detail' : 'Belum ada data'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Training Stats */}
                  <div className="weekly-training">
                    <h4 className="weekly-title">📈 Statistik Latihan Mingguan</h4>
                    <div className="stats-grid">
                      {weeklyStats.filter(stat => stat.week >= 1 && stat.week <= 8).map((stat) => (
                        <div 
                          key={stat.week} 
                          className={`stat-card-simple ${!stat.hasData ? 'no-data' : ''}`}
                          style={{
                            borderLeft: `4px solid ${stat.color}`,
                            borderTop: stat.hasData ? `2px solid ${stat.color}` : '2px solid #e0e0e0'
                          }}
                          onClick={() => {
                            if (stat.hasData) {
                              setSelectedWeek(stat);
                              setShowStatsModal(true);
                            }
                          }}
                        >
                          <div className="stat-category" style={{color: stat.color}}>
                            {stat.label}
                          </div>
                          <div className="stat-week">
                            Minggu {stat.week}
                          </div>
                          <div className="stat-volume" style={{color: stat.hasData ? stat.color : '#999'}}>
                            {stat.hasData ? `Volume: ${stat.totalVolume.toFixed(1)}` : '-'}
                          </div>
                          <div className="stat-hint">
                            {stat.hasData ? 'Klik untuk detail' : 'Belum ada data'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Detail Modal */}
              {showStatsModal && selectedWeek && (
                <div className="stats-modal-overlay" onClick={() => setShowStatsModal(false)}>
                  <div className="stats-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="stats-modal-header">
                      <h3>Detail Minggu {selectedWeek.week}</h3>
                      <button 
                        className="close-modal-btn"
                        onClick={() => setShowStatsModal(false)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="stats-modal-body">
                      <div className="stat-detail-item" style={{ borderLeft: `4px solid ${selectedWeek.color}` }}>
                        <span className="stat-detail-label">💪 Total Volume</span>
                        <span className="stat-detail-value">{selectedWeek.totalVolume.toFixed(1)}</span>
                      </div>
                      <div className="stat-detail-item" style={{ borderLeft: `4px solid ${selectedWeek.color}` }}>
                        <span className="stat-detail-label">📅 Hari Latihan</span>
                        <span className="stat-detail-value">{selectedWeek.workoutDays} hari</span>
                      </div>
                      <div className="stat-detail-item" style={{ borderLeft: `4px solid ${selectedWeek.color}` }}>
                        <span className="stat-detail-label">🏋️ Total Exercises</span>
                        <span className="stat-detail-value">{selectedWeek.totalExercises} exercise</span>
                      </div>
                      <div className="stat-detail-item">
                        <span className="stat-detail-label">📊 Rata-rata Volume/Hari</span>
                        <span className="stat-detail-value">
                          {selectedWeek.workoutDays > 0 
                            ? `${(selectedWeek.totalVolume / selectedWeek.workoutDays).toFixed(1)}`
                            : '0'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="welcome-message">
                <h3>Selamat datang, {userData?.fullName || userData?.name || 'Member'}!</h3>
                <p>Gunakan menu di samping untuk mengakses fitur-fitur dashboard Anda.</p>
                <ul className="feature-list">
                  <li>▶ <strong>Workout Log:</strong> Catat dan pantau progress latihan Anda selama 8 minggu</li>
                  <li>✉ <strong>Pesan Admin:</strong> Kirim pertanyaan atau laporan ke admin</li>
                  <li>◉ <strong>Profile:</strong> Update informasi dan foto profil Anda</li>
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
                <div className="messages-header">
                  <h3>Riwayat Pesan</h3>
                  <div className="message-filter-tabs">
                    <button 
                      className={`filter-tab ${messageFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setMessageFilter('all')}
                    >
                      Semua
                    </button>
                    <button 
                      className={`filter-tab ${messageFilter === 'sent' ? 'active' : ''}`}
                      onClick={() => setMessageFilter('sent')}
                    >
                      Terkirim
                    </button>
                    <button 
                      className={`filter-tab ${messageFilter === 'received' ? 'active' : ''}`}
                      onClick={() => setMessageFilter('received')}
                    >
                      Diterima
                    </button>
                  </div>
                </div>
                {messages.filter(msg => {
                  if (messageFilter === 'sent') return msg.type === 'user';
                  if (messageFilter === 'received') return msg.type === 'admin';
                  return true;
                }).length === 0 ? (
                  <p className="no-messages">Belum ada pesan</p>
                ) : (
                  messages.filter(msg => {
                    if (messageFilter === 'sent') return msg.type === 'user';
                    if (messageFilter === 'received') return msg.type === 'admin';
                    return true;
                  }).map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`message-item ${msg.type === 'admin' ? 'admin-message' : 'user-message'} ${msg.type === 'admin' && msg.status !== 'read' ? 'unread' : ''}`}
                    >
                      <div className="message-header">
                        <div className="message-meta">
                          <span className="message-sender">
                            {msg.type === 'admin' ? '👨‍💼 Admin' : '👤 Anda'}
                          </span>
                          <span className="message-date">
                            {new Date(msg.createdAt).toLocaleString('id-ID', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {msg.type === 'admin' && msg.status !== 'read' && (
                            <span className="unread-badge">Baru</span>
                          )}
                          {msg.type === 'user' && (
                            <span className={`message-status ${msg.status}`}>
                              {msg.status === 'pending' ? '⏳ Menunggu' : msg.status === 'read' ? '✓ Dibaca' : '✓✓ Dibalas'}
                            </span>
                          )}
                        </div>
                        <div className="message-actions">
                          {msg.type === 'admin' && msg.status !== 'read' && (
                            <span 
                              className="action-icon mark-read-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(msg.id);
                              }}
                              title="Tandai sudah dibaca"
                            >
                              ✓
                            </span>
                          )}
                          <span 
                            className="action-icon delete-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(msg.id, msg.type);
                            }}
                            title="Hapus pesan"
                          >
                            🗑️
                          </span>
                        </div>
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
                        {(userData?.fullName || userData?.name)?.charAt(0).toUpperCase() || 'U'}
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
                      <p>{userData?.fullName || userData?.name || '-'}</p>
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
                          setName(userData?.fullName || userData?.name || '');
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
