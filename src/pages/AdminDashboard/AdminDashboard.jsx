import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  query,
  where,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userFilterTab, setUserFilterTab] = useState('all'); // all, approved, pending, rejected
  const [messages, setMessages] = useState([]);
  const [userInboxes, setUserInboxes] = useState([]); // Array of users with their message counts
  const [selectedUserForMessages, setSelectedUserForMessages] = useState(null); // User selected to view messages
  const [userMessages, setUserMessages] = useState([]); // Messages from selected user
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserLogs, setSelectedUserLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingVerifications: 0,
    totalMessages: 0,
    pendingMessages: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchMessages()]);
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
      setFilteredUsers(usersData);
      
      const activeCount = usersData.filter(u => u.isActive !== false).length;
      const pendingVerifications = usersData.filter(u => u.verificationStatus === 'pending').length;
      setStats(prev => ({
        ...prev,
        totalUsers: usersData.length,
        activeUsers: activeCount,
        pendingVerifications: pendingVerifications
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'userMessages'));
      const messagesData = [];
      querySnapshot.forEach((doc) => {
        messagesData.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by createdAt descending
      messagesData.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
      
      setMessages(messagesData);
      
      // Group messages by user for inbox view
      const inboxMap = new Map();
      messagesData.forEach(msg => {
        if (!inboxMap.has(msg.userId)) {
          inboxMap.set(msg.userId, {
            userId: msg.userId,
            userName: msg.userName,
            userEmail: msg.userEmail,
            messages: [],
            unreadCount: 0,
            lastMessageDate: msg.createdAt
          });
        }
        const inbox = inboxMap.get(msg.userId);
        inbox.messages.push(msg);
        if (msg.status === 'pending') inbox.unreadCount++;
        // Update last message date if newer
        if (new Date(msg.createdAt) > new Date(inbox.lastMessageDate)) {
          inbox.lastMessageDate = msg.createdAt;
        }
      });
      
      // Convert to array and sort by last message date
      const inboxArray = Array.from(inboxMap.values()).sort((a, b) => {
        return new Date(b.lastMessageDate) - new Date(a.lastMessageDate);
      });
      
      setUserInboxes(inboxArray);
      
      const pendingCount = messagesData.filter(m => m.status === 'pending').length;
      setStats(prev => ({
        ...prev,
        totalMessages: messagesData.length,
        pendingMessages: pendingCount
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchUserWorkoutLogs = async (userId) => {
    try {
      const q = query(
        collection(db, 'workoutLogs'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const logs = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      // Sort client-side to avoid needing composite index
      logs.sort((a, b) => {
        if (a.week !== b.week) return a.week - b.week;
        return a.day - b.day;
      });
      setSelectedUserLogs(logs);
    } catch (error) {
      console.error('Error fetching workout logs:', error);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (!window.confirm('Ubah status akun user ini?')) return;

    try {
      const newStatus = !currentStatus;
      await updateDoc(doc(db, 'users', userId), {
        isActive: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      fetchUsers();
      alert(`User ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Gagal mengubah status user');
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Ban user ini? User tidak akan bisa login.')) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: false,
        isBanned: true,
        bannedAt: new Date().toISOString()
      });
      
      fetchUsers();
      alert('User berhasil di-ban');
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Gagal ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    if (!window.confirm('Unban user ini?')) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: true,
        isBanned: false,
        unbannedAt: new Date().toISOString()
      });
      
      fetchUsers();
      alert('User berhasil di-unban');
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Gagal unban user');
    }
  };

  const handleReplyMessage = async (messageId) => {
    if (!replyText.trim()) {
      alert('Tulis balasan terlebih dahulu');
      return;
    }

    try {
      await updateDoc(doc(db, 'userMessages', messageId), {
        reply: replyText.trim(),
        status: 'replied',
        repliedAt: new Date().toISOString(),
        repliedBy: currentUser.email
      });
      
      setReplyText('');
      fetchMessages();
      alert('Balasan berhasil dikirim');
    } catch (error) {
      console.error('Error replying message:', error);
      alert('Gagal mengirim balasan');
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await updateDoc(doc(db, 'userMessages', messageId), {
        status: 'read',
        readAt: new Date().toISOString()
      });
      fetchMessages();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Hapus pesan ini?')) return;

    try {
      await deleteDoc(doc(db, 'userMessages', messageId));
      fetchMessages();
      
      // Refresh selected user messages if viewing
      if (selectedUserForMessages) {
        handleViewUserMessages(selectedUserForMessages);
      }
      
      alert('Pesan berhasil dihapus');
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Gagal menghapus pesan');
    }
  };

  const handleViewUserMessages = (inbox) => {
    setSelectedUserForMessages(inbox);
    setUserMessages(inbox.messages);
  };

  const handleBackToInbox = () => {
    setSelectedUserForMessages(null);
    setUserMessages([]);
    setReplyText('');
  };

  const handleViewUserDetails = async (user) => {
    setSelectedUser(user);
    await fetchUserWorkoutLogs(user.id);
    setActiveTab('user-detail');
  };

  const handleApproveUser = async (userId, isIbafMember) => {
    if (!window.confirm(`Setujui verifikasi user ini sebagai ${isIbafMember ? 'Anggota IBAF' : 'Non-Anggota IBAF'}?`)) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        verificationStatus: 'approved',
        isIbafMember: isIbafMember,
        isActive: true,
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser.email
      });
      
      fetchUsers();
      alert('User berhasil disetujui!');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Gagal menyetujui user');
    }
  };

  const handleRejectUser = async (userId) => {
    const reason = window.prompt('Masukkan alasan penolakan:');
    if (!reason) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        verificationStatus: 'rejected',
        isActive: false,
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
        rejectedBy: currentUser.email
      });
      
      fetchUsers();
      alert('User ditolak');
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Gagal menolak user');
    }
  };

  const handleSendMessageToUser = async (user) => {
    const message = window.prompt(`Kirim pesan ke ${user.name || user.email}:`);
    if (!message) return;

    try {
      await addDoc(collection(db, 'adminMessages'), {
        userId: user.id,
        userEmail: user.email,
        userName: user.name || user.fullName || 'User',
        message: message,
        sentBy: currentUser.email,
        sentAt: new Date().toISOString(),
        read: false
      });
      
      alert('Pesan berhasil dikirim!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Gagal mengirim pesan');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`⚠️ PERHATIAN!\n\nAnda akan menghapus akun:\n${userName}\n\nSemua data user ini akan dihapus permanen:\n- Data profil\n- Workout logs\n- Riwayat pesan\n\nApakah Anda yakin?`)) return;

    const confirmText = window.prompt('Ketik "HAPUS" untuk konfirmasi penghapusan akun:');
    if (confirmText !== 'HAPUS') {
      alert('Penghapusan dibatalkan');
      return;
    }

    try {
      setLoading(true);
      
      // Delete user's workout logs
      const logsQuery = query(collection(db, 'workoutLogs'), where('userId', '==', userId));
      const logsSnapshot = await getDocs(logsQuery);
      const deleteLogsPromises = logsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteLogsPromises);
      
      // Delete user's messages
      const messagesQuery = query(collection(db, 'userMessages'), where('userId', '==', userId));
      const messagesSnapshot = await getDocs(messagesQuery);
      const deleteMessagesPromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteMessagesPromises);
      
      // Delete admin messages
      const adminMessagesQuery = query(collection(db, 'adminMessages'), where('userId', '==', userId));
      const adminMessagesSnapshot = await getDocs(adminMessagesQuery);
      const deleteAdminMessagesPromises = adminMessagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteAdminMessagesPromises);
      
      // Finally delete user document
      await deleteDoc(doc(db, 'users', userId));
      
      fetchUsers();
      alert('✅ Akun berhasil dihapus beserta semua datanya');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('❌ Gagal menghapus akun: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterUsersByTab = (tabName) => {
    setUserFilterTab(tabName);
    let filtered = [...users];
    
    switch(tabName) {
      case 'approved':
        filtered = users.filter(u => u.verificationStatus === 'approved');
        break;
      case 'pending':
        filtered = users.filter(u => u.verificationStatus === 'pending');
        break;
      case 'rejected':
        filtered = users.filter(u => u.verificationStatus === 'rejected');
        break;
      case 'not_submitted':
        filtered = users.filter(u => !u.verificationStatus || u.verificationStatus === 'not_submitted');
        break;
      case 'all':
      default:
        filtered = users;
    }
    
    setFilteredUsers(filtered);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const calculateTotalVolume = (logs) => {
    return logs.reduce((total, log) => total + (log.totalVolume || 0), 0);
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="brand-section">
            <Link to="/" className="back-home-link">
              ← Kembali ke Halaman Utama
            </Link>
          </div>
          <div className="header-actions">
            <span className="admin-badge">👑 Admin</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-container">
        {/* Sidebar Navigation */}
        <div className="dashboard-sidebar">
          <div className="admin-info-card">
            <div className="admin-avatar">
              <div className="avatar-placeholder">A</div>
            </div>
            <h3>Admin Panel</h3>
            <p className="admin-email">{currentUser?.email}</p>
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
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="nav-icon">👥</span>
              Kelola Users
            </button>
            <button
              className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              <span className="nav-icon">💬</span>
              Pesan Users
              {stats.pendingMessages > 0 && (
                <span className="badge">{stats.pendingMessages}</span>
              )}
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="dashboard-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h2>Dashboard Overview</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h4>Total Users</h4>
                    <p className="stat-number">{stats.totalUsers}</p>
                  </div>
                </div>

                <div className="stat-card active">
                  <div className="stat-icon">✓</div>
                  <div className="stat-content">
                    <h4>Active Users</h4>
                    <p className="stat-number">{stats.activeUsers}</p>
                  </div>
                </div>

                <div className="stat-card pending">
                  <div className="stat-icon">📋</div>
                  <div className="stat-content">
                    <h4>Pending Verifikasi</h4>
                    <p className="stat-number">{stats.pendingVerifications}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">💬</div>
                  <div className="stat-content">
                    <h4>Total Pesan</h4>
                    <p className="stat-number">{stats.totalMessages}</p>
                  </div>
                </div>

                <div className="stat-card pending">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-content">
                    <h4>Pesan Pending</h4>
                    <p className="stat-number">{stats.pendingMessages}</p>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button onClick={() => setActiveTab('users')} className="action-btn">
                    👥 Kelola Users
                  </button>
                  <button onClick={() => setActiveTab('messages')} className="action-btn">
                    💬 Lihat Pesan
                  </button>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Aktivitas Terbaru</h3>
                <div className="activity-list">
                  {messages.slice(0, 5).map((msg) => (
                    <div key={msg.id} className="activity-item">
                      <div className="activity-icon">💬</div>
                      <div className="activity-content">
                        <p><strong>{msg.userName}</strong> mengirim pesan</p>
                        <span className="activity-time">
                          {new Date(msg.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="users-tab">
              <h2>Kelola Users</h2>
              
              {/* Filter Tabs */}
              <div className="user-filter-tabs">
                <button 
                  className={`filter-tab ${userFilterTab === 'all' ? 'active' : ''}`}
                  onClick={() => filterUsersByTab('all')}
                >
                  <span className="tab-icon">👥</span>
                  <span className="tab-label">Semua Users</span>
                  <span className="tab-count">{users.length}</span>
                </button>
                <button 
                  className={`filter-tab ${userFilterTab === 'approved' ? 'active' : ''}`}
                  onClick={() => filterUsersByTab('approved')}
                >
                  <span className="tab-icon">✅</span>
                  <span className="tab-label">Terverifikasi</span>
                  <span className="tab-count">{users.filter(u => u.verificationStatus === 'approved').length}</span>
                </button>
                <button 
                  className={`filter-tab ${userFilterTab === 'pending' ? 'active' : ''}`}
                  onClick={() => filterUsersByTab('pending')}
                >
                  <span className="tab-icon">⏳</span>
                  <span className="tab-label">Pending</span>
                  <span className="tab-count">{users.filter(u => u.verificationStatus === 'pending').length}</span>
                </button>
                <button 
                  className={`filter-tab ${userFilterTab === 'rejected' ? 'active' : ''}`}
                  onClick={() => filterUsersByTab('rejected')}
                >
                  <span className="tab-icon">❌</span>
                  <span className="tab-label">Ditolak</span>
                  <span className="tab-count">{users.filter(u => u.verificationStatus === 'rejected').length}</span>
                </button>
                <button 
                  className={`filter-tab ${userFilterTab === 'not_submitted' ? 'active' : ''}`}
                  onClick={() => filterUsersByTab('not_submitted')}
                >
                  <span className="tab-icon">⚪</span>
                  <span className="tab-label">Belum Submit</span>
                  <span className="tab-count">{users.filter(u => !u.verificationStatus || u.verificationStatus === 'not_submitted').length}</span>
                </button>
              </div>
              
              <div className="table-controls">
                <input 
                  type="text" 
                  placeholder="🔍 Cari nama atau email..." 
                  className="search-input"
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase();
                    if (!value.trim()) {
                      filterUsersByTab(userFilterTab);
                    } else {
                      let baseUsers = [...users];
                      
                      // Apply tab filter first
                      if (userFilterTab === 'approved') {
                        baseUsers = users.filter(u => u.verificationStatus === 'approved');
                      } else if (userFilterTab === 'pending') {
                        baseUsers = users.filter(u => u.verificationStatus === 'pending');
                      } else if (userFilterTab === 'rejected') {
                        baseUsers = users.filter(u => u.verificationStatus === 'rejected');
                      } else if (userFilterTab === 'not_submitted') {
                        baseUsers = users.filter(u => !u.verificationStatus || u.verificationStatus === 'not_submitted');
                      }
                      
                      // Then apply search
                      const filtered = baseUsers.filter(u => 
                        u.name?.toLowerCase().includes(value) || 
                        u.email?.toLowerCase().includes(value) ||
                        u.fullName?.toLowerCase().includes(value)
                      );
                      setFilteredUsers(filtered);
                    }
                  }}
                />
              </div>

              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Nama</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Verifikasi</th>
                      <th>Member IBAF</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-photo">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.name} />
                            ) : (
                              <div className="photo-placeholder">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong>{user.name || 'No Name'}</strong>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td>
                          {user.verificationStatus === 'pending' ? (
                            <span className="badge-pending">⏳ Pending</span>
                          ) : user.verificationStatus === 'approved' ? (
                            <span className="badge-active">✓ Disetujui</span>
                          ) : user.verificationStatus === 'rejected' ? (
                            <span className="badge-inactive">❌ Ditolak</span>
                          ) : (
                            <span className="badge-inactive">⚪ Belum Submit</span>
                          )}
                        </td>
                        <td>
                          {user.isIbafMember ? (
                            <span className="badge-active">✓ Member</span>
                          ) : (
                            <span style={{color: '#6c757d'}}>-</span>
                          )}
                        </td>
                        <td>
                          {user.isBanned ? (
                            <span className="status-badge banned">🚫 Banned</span>
                          ) : user.isActive !== false ? (
                            <span className="status-badge active">✓ Aktif</span>
                          ) : (
                            <span className="status-badge inactive">✗ Tidak Aktif</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            <button
                              onClick={() => handleViewUserDetails(user)}
                              className="btn-view"
                              title="👁️ Lihat detail lengkap user termasuk data verifikasi dan workout logs"
                            >
                              👁️
                            </button>
                            
                            {user.verificationStatus === 'pending' && user.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => handleApproveUser(user.id, user.isIbafMember)}
                                  className="btn-approve"
                                  title="✓ Setujui verifikasi user - User dapat akses dashboard penuh"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user.id)}
                                  className="btn-reject"
                                  title="❌ Tolak verifikasi user - Akan diminta alasan penolakan"
                                >
                                  ❌
                                </button>
                              </>
                            )}
                            
                            <button
                              onClick={() => handleSendMessageToUser(user)}
                              className="btn-message"
                              title="💬 Kirim pesan pribadi ke user - Pesan akan muncul di dashboard user"
                            >
                              💬
                            </button>
                            
                            {user.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => handleToggleUserStatus(user.id, user.isActive !== false)}
                                  className={user.isActive !== false ? 'btn-deactivate' : 'btn-activate'}
                                  title={user.isActive !== false ? '⏸️ Nonaktifkan user - User tidak dapat login' : '▶️ Aktifkan user - User dapat login kembali'}
                                >
                                  {user.isActive !== false ? '⏸️' : '▶️'}
                                </button>
                                {user.isBanned ? (
                                  <button
                                    onClick={() => handleUnbanUser(user.id)}
                                    className="btn-unban"
                                    title="✓ Unban user - Cabut status banned"
                                  >
                                    ✓
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBanUser(user.id)}
                                    className="btn-ban"
                                    title="🚫 Ban user - User akan di-banned permanen"
                                  >
                                    🚫
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                                  className="btn-delete-user"
                                  title="🗑️ HAPUS AKUN - Menghapus user dan semua datanya secara permanen (TIDAK DAPAT DIBATALKAN!)"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Messages Tab - Inbox per User */}
          {activeTab === 'messages' && (
            <div className="messages-tab">
              {!selectedUserForMessages ? (
                <>
                  <h2>📬 Inbox Pesan User</h2>
                  <p className="inbox-description">Klik pada user untuk melihat semua pesan dari user tersebut</p>
                  
                  {userInboxes.length === 0 ? (
                    <p className="no-data">Belum ada pesan masuk</p>
                  ) : (
                    <div className="inbox-list">
                      {userInboxes.map((inbox) => (
                        <div 
                          key={inbox.userId} 
                          className={`inbox-card ${inbox.unreadCount > 0 ? 'has-unread' : ''}`}
                          onClick={() => handleViewUserMessages(inbox)}
                        >
                          <div className="inbox-user-avatar">
                            <div className="avatar-placeholder">
                              {inbox.userName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          </div>
                          <div className="inbox-info">
                            <div className="inbox-header">
                              <strong className="inbox-user-name">{inbox.userName || 'User'}</strong>
                              {inbox.unreadCount > 0 && (
                                <span className="unread-badge">{inbox.unreadCount} baru</span>
                              )}
                            </div>
                            <p className="inbox-email">{inbox.userEmail}</p>
                            <div className="inbox-stats">
                              <span className="message-count">
                                💬 {inbox.messages.length} pesan
                              </span>
                              <span className="last-message-date">
                                🕒 {new Date(inbox.lastMessageDate).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="inbox-arrow">→</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="messages-header">
                    <button onClick={handleBackToInbox} className="back-to-inbox-btn">
                      ← Kembali ke Inbox
                    </button>
                    <h2>💬 Pesan dari {selectedUserForMessages.userName}</h2>
                    <p className="user-email-header">{selectedUserForMessages.userEmail}</p>
                  </div>
                  
                  <div className="messages-thread">
                    {userMessages.map((msg) => (
                      <div key={msg.id} className={`message-card ${msg.status}`}>
                        <div className="message-header">
                          <div className="message-meta">
                            <span className={`message-status-badge ${msg.status}`}>
                              {msg.status === 'pending' ? '⏳ Pending' : 
                               msg.status === 'read' ? '👁️ Dibaca' : '✓ Dibalas'}
                            </span>
                            <span className="message-date">
                              {new Date(msg.createdAt).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        <div className="message-content">
                          <p>{msg.message}</p>
                        </div>

                        {msg.reply && (
                          <div className="admin-reply-display">
                            <strong>Balasan Anda:</strong>
                            <p>{msg.reply}</p>
                            <span className="reply-date">
                              Dibalas: {new Date(msg.repliedAt).toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}

                        <div className="message-actions">
                          {msg.status === 'pending' && (
                            <button
                              onClick={() => handleMarkAsRead(msg.id)}
                              className="btn-mark-read"
                            >
                              Tandai Dibaca
                            </button>
                          )}
                          {!msg.reply && (
                            <div className="reply-form">
                              <textarea
                                placeholder="Tulis balasan..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows="3"
                              />
                              <button
                                onClick={() => handleReplyMessage(msg.id)}
                                className="btn-reply"
                              >
                                Kirim Balasan
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="btn-delete"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* User Detail Tab */}
          {activeTab === 'user-detail' && selectedUser && (
            <div className="user-detail-tab">
              <div className="detail-header">
                <button onClick={() => setActiveTab('users')} className="back-btn">
                  ← Kembali ke Daftar Users
                </button>
                <h2>Detail User: {selectedUser.name}</h2>
              </div>

              <div className="user-detail-card">
                <div className="user-detail-photo">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt={selectedUser.name} />
                  ) : (
                    <div className="photo-placeholder-large">
                      {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                <div className="user-detail-info">
                  <h3>Informasi Akun</h3>
                  <div className="info-row">
                    <label>Nama:</label>
                    <span>{selectedUser.name || '-'}</span>
                  </div>
                  <div className="info-row">
                    <label>Email:</label>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="info-row">
                    <label>Role:</label>
                    <span className={`role-badge ${selectedUser.role}`}>
                      {selectedUser.role || 'user'}
                    </span>
                  </div>
                  <div className="info-row">
                    <label>Status:</label>
                    {selectedUser.isBanned ? (
                      <span className="status-badge banned">🚫 Banned</span>
                    ) : selectedUser.isActive !== false ? (
                      <span className="status-badge active">✓ Aktif</span>
                    ) : (
                      <span className="status-badge inactive">✗ Tidak Aktif</span>
                    )}
                  </div>
                  <div className="info-row">
                    <label>Bergabung:</label>
                    <span>
                      {selectedUser.createdAt ? 
                        new Date(selectedUser.createdAt).toLocaleDateString('id-ID', { 
                          year: 'numeric', month: 'long', day: 'numeric' 
                        }) : '-'}
                    </span>
                  </div>
                </div>

                {/* Verification Data Section */}
                <div className="verification-data-section">
                  <h3>Data Verifikasi</h3>
                  <div className="verification-status-card">
                    <div className="info-row">
                      <label>Status Verifikasi:</label>
                      {selectedUser.verificationStatus === 'pending' ? (
                        <span className="badge-pending">⏳ Pending</span>
                      ) : selectedUser.verificationStatus === 'approved' ? (
                        <span className="badge-active">✓ Disetujui</span>
                      ) : selectedUser.verificationStatus === 'rejected' ? (
                        <span className="badge-inactive">❌ Ditolak</span>
                      ) : (
                        <span className="badge-inactive">⚪ Belum Submit</span>
                      )}
                    </div>
                    
                    {selectedUser.fullName && (
                      <>
                        <div className="info-row">
                          <label>Nama Lengkap:</label>
                          <span>{selectedUser.fullName}</span>
                        </div>
                        <div className="info-row">
                          <label>NIM:</label>
                          <span>{selectedUser.nim || '-'}</span>
                        </div>
                        <div className="info-row">
                          <label>Program Studi:</label>
                          <span>{selectedUser.prodi || '-'}</span>
                        </div>
                        <div className="info-row">
                          <label>Angkatan:</label>
                          <span>{selectedUser.angkatan || '-'}</span>
                        </div>
                        <div className="info-row">
                          <label>No. Telepon:</label>
                          <span>{selectedUser.phoneNumber || '-'}</span>
                        </div>
                        <div className="info-row">
                          <label>Jenis Kelamin:</label>
                          <span>{selectedUser.jenisKelamin || '-'}</span>
                        </div>
                        <div className="info-row">
                          <label>Anggota IBAF:</label>
                          {selectedUser.isIbafMember ? (
                            <span className="badge-active">✓ Ya</span>
                          ) : (
                            <span className="badge-inactive">✗ Tidak</span>
                          )}
                        </div>
                        {selectedUser.isIbafMember && selectedUser.ibafMembershipNumber && (
                          <div className="info-row">
                            <label>No. Anggota IBAF:</label>
                            <span>{selectedUser.ibafMembershipNumber}</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {selectedUser.verificationRequestedAt && (
                      <div className="info-row">
                        <label>Tanggal Pengajuan:</label>
                        <span>
                          {new Date(selectedUser.verificationRequestedAt).toLocaleString('id-ID', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    
                    {selectedUser.approvedAt && (
                      <>
                        <div className="info-row">
                          <label>Disetujui Pada:</label>
                          <span>
                            {new Date(selectedUser.approvedAt).toLocaleString('id-ID', {
                              year: 'numeric', month: 'long', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="info-row">
                          <label>Disetujui Oleh:</label>
                          <span>{selectedUser.approvedBy || '-'}</span>
                        </div>
                      </>
                    )}
                    
                    {selectedUser.rejectedAt && (
                      <>
                        <div className="info-row">
                          <label>Ditolak Pada:</label>
                          <span>
                            {new Date(selectedUser.rejectedAt).toLocaleString('id-ID', {
                              year: 'numeric', month: 'long', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="info-row">
                          <label>Ditolak Oleh:</label>
                          <span>{selectedUser.rejectedBy || '-'}</span>
                        </div>
                        <div className="info-row rejection-reason-row">
                          <label>Alasan Penolakan:</label>
                          <span className="rejection-text">{selectedUser.rejectionReason || '-'}</span>
                        </div>
                      </>
                    )}
                    
                    {!selectedUser.fullName && selectedUser.verificationStatus !== 'approved' && (
                      <div className="no-verification-data">
                        <p>⚠️ User belum mengisi data verifikasi</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="workout-logs-section">
                <h3>Workout Logs</h3>
                {selectedUserLogs.length === 0 ? (
                  <p className="no-data">User belum memiliki workout log</p>
                ) : (
                  <>
                    <div className="workout-summary">
                      <div className="summary-card">
                        <h4>Total Workouts</h4>
                        <p>{selectedUserLogs.length}</p>
                      </div>
                      <div className="summary-card">
                        <h4>Total Volume</h4>
                        <p>{calculateTotalVolume(selectedUserLogs).toFixed(1)} kg</p>
                      </div>
                      <div className="summary-card">
                        <h4>Weeks Logged</h4>
                        <p>{[...new Set(selectedUserLogs.map(log => log.week))].length} / 8</p>
                      </div>
                    </div>

                    <div className="workout-logs-list">
                      {selectedUserLogs.map((log) => (
                        <div key={log.id} className="workout-log-card">
                          <div className="log-header">
                            <h4>Minggu {log.week} - {log.dayName}</h4>
                            <span className="log-date">
                              {new Date(log.createdAt).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          <div className="log-exercises">
                            {log.exercises.map((exercise, idx) => (
                              <div key={idx} className="exercise-item">
                                <h5>{exercise.name}</h5>
                                <table className="sets-table-small">
                                  <thead>
                                    <tr>
                                      <th>Set</th>
                                      <th>Weight</th>
                                      <th>Reps</th>
                                      <th>Volume</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {exercise.sets.map((set, setIdx) => (
                                      <tr key={setIdx}>
                                        <td>{setIdx + 1}</td>
                                        <td>{set.weight} kg</td>
                                        <td>{set.reps}</td>
                                        <td>{(parseFloat(set.weight) * parseInt(set.reps)).toFixed(1)} kg</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ))}
                          </div>
                          <div className="log-total">
                            <strong>Total Volume: {log.totalVolume.toFixed(1)} kg</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
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
