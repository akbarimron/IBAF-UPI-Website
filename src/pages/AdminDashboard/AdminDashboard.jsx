import React, { useState, useEffect, useCallback } from 'react';
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
  addDoc,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaUser, FaUserNinja, FaUserAstronaut, FaUserTie, FaUserGraduate, FaRobot, FaDumbbell, FaCat, FaDog, FaDragon, FaFrog, FaHorse, FaOtter, FaKiwiBird, FaFish, FaTrashAlt, FaCheckCircle, FaTimesCircle, FaPaperPlane, FaBan, FaExclamationTriangle, FaUserCheck, FaUserTimes } from 'react-icons/fa';
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
  const [messageFilter, setMessageFilter] = useState('all'); // all, received, sent
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserLogs, setSelectedUserLogs] = useState([]);
  const [filteredWorkoutLogs, setFilteredWorkoutLogs] = useState([]);
  const [selectedWeekFilter, setSelectedWeekFilter] = useState('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModalData, setMessageModalData] = useState({ userId: '', userName: '', message: '' });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingVerifications: 0,
    totalMessages: 0,
    pendingMessages: 0
  });
  
  // Admin profile state
  const [adminData, setAdminData] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState({ icon: 'FaUserShield', color: '#B63333' });
  
  // Notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info'); // success, error, warning, info
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({
    type: '', // 'delete', 'approve', 'reject', 'ban', 'message'
    title: '',
    message: '',
    icon: null,
    confirmText: '',
    cancelText: 'Batal',
    onConfirm: null,
    requireInput: false,
    inputPlaceholder: '',
    inputValue: ''
  });
  
  // Avatar options (same as user)
  const avatarIcons = [
    { name: 'FaUser', component: FaUser, label: 'User' },
    { name: 'FaUserNinja', component: FaUserNinja, label: 'Ninja' },
    { name: 'FaUserAstronaut', component: FaUserAstronaut, label: 'Astronaut' },
    { name: 'FaUserTie', component: FaUserTie, label: 'Professional' },
    { name: 'FaUserGraduate', component: FaUserGraduate, label: 'Graduate' },
    { name: 'FaRobot', component: FaRobot, label: 'Robot' },
    { name: 'FaDumbbell', component: FaDumbbell, label: 'Fitness' },
    { name: 'FaCat', component: FaCat, label: 'Cat' },
    { name: 'FaDog', component: FaDog, label: 'Dog' },
    { name: 'FaDragon', component: FaDragon, label: 'Dragon' },
    { name: 'FaFrog', component: FaFrog, label: 'Frog' },
    { name: 'FaHorse', component: FaHorse, label: 'Horse' },
    { name: 'FaOtter', component: FaOtter, label: 'Otter' },
    { name: 'FaKiwiBird', component: FaKiwiBird, label: 'Bird' },
    { name: 'FaFish', component: FaFish, label: 'Fish' },
  ];
  
  // Helper function to get avatar component
  const getAvatarComponent = useCallback((iconName) => {
    const avatar = avatarIcons.find(a => a.name === iconName);
    return avatar ? avatar.component : FaUser;
  }, []);

  useEffect(() => {
    // Fetch admin profile data
    const fetchAdminData = async () => {
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setAdminData(data);
            
            // Set avatar if exists
            if (data.avatar) {
              setSelectedAvatar(data.avatar);
            }
          }
        } catch (error) {
          console.error('Error fetching admin data:', error);
        }
      }
    };
    
    fetchAdminData();
    
    // Set up real-time listeners
    // Users realtime listener
    const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      
      // Apply current filter
      filterUsersByTab(userFilterTab, usersData);
      
      // Update stats
      const activeCount = usersData.filter(u => u.isActive !== false).length;
      const pendingVerifications = usersData.filter(u => u.verificationStatus === 'pending').length;
      setStats(prev => ({
        ...prev,
        totalUsers: usersData.length,
        activeUsers: activeCount,
        pendingVerifications: pendingVerifications
      }));
    });
    
    // Set up real-time listeners for both user messages and admin messages
    const userMessagesQuery = collection(db, 'userMessages');   
    const adminMessagesQuery = collection(db, 'adminMessages');
    
    const unsubscribeUserMessages = onSnapshot(userMessagesQuery, () => {
      combineAndProcessMessages();
    });
    
    const unsubscribeAdminMessages = onSnapshot(adminMessagesQuery, () => {
      combineAndProcessMessages();
    });
    
    const combineAndProcessMessages = async () => {
      try {
        // Fetch user messages
        const userMsgsSnapshot = await getDocs(collection(db, 'userMessages'));
        const userMessagesData = [];
        userMsgsSnapshot.forEach((doc) => {
          userMessagesData.push({ 
            id: doc.id, 
            ...doc.data(),
            type: 'user',
            createdAt: doc.data().createdAt
          });
        });
        
        // Fetch admin messages
        const adminMsgsSnapshot = await getDocs(collection(db, 'adminMessages'));
        const adminMessagesData = [];
        adminMsgsSnapshot.forEach((doc) => {
          adminMessagesData.push({ 
            id: doc.id, 
            ...doc.data(),
            type: 'admin',
            createdAt: doc.data().sentAt
          });
        });
        
        // Combine all messages
        const allMessages = [...userMessagesData, ...adminMessagesData];
        
        // Sort by createdAt descending
        allMessages.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });
        
        setMessages(allMessages);
        
        // Group messages by user for inbox view
        const inboxMap = new Map();
        allMessages.forEach(msg => {
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
          if (msg.type === 'user' && msg.status === 'pending') inbox.unreadCount++;
          // Update last message date if newer
          if (new Date(msg.createdAt) > new Date(inbox.lastMessageDate)) {
            inbox.lastMessageDate = msg.createdAt;
          }
        });
        
        // Convert to array and sort by last message date
        const inboxArray = Array.from(inboxMap.values()).sort((a, b) => {
          return new Date(b.lastMessageDate) - new Date(a.lastMessageDate);
        });
        
        // Sort messages within each inbox
        inboxArray.forEach(inbox => {
          inbox.messages.sort((a, b) => {
            return new Date(a.createdAt) - new Date(b.createdAt);
          });
        });
        
        setUserInboxes(inboxArray);
        
        // Update selected user messages if viewing
        if (selectedUserForMessages) {
          const updatedInbox = inboxArray.find(inbox => inbox.userId === selectedUserForMessages.userId);
          if (updatedInbox) {
            setUserMessages(updatedInbox.messages);
          }
        }
        
        const pendingCount = userMessagesData.filter(m => m.status === 'pending').length;
        setStats(prev => ({
          ...prev,
          totalMessages: userMessagesData.length,
          pendingMessages: pendingCount
        }));
      } catch (error) {
        console.error('Error combining messages:', error);
      }
    };
    
    // Initial load
    combineAndProcessMessages();
    
    // Cleanup listeners on unmount
    return () => {
      usersUnsubscribe();
      unsubscribeUserMessages();
      unsubscribeAdminMessages();
    };
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await fetchUsers();
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
      setFilteredWorkoutLogs(logs);
      setSelectedWeekFilter('all');
      setSelectedDayFilter('all');
    } catch (error) {
      console.error('Error fetching workout logs:', error);
    }
  };

  const filterWorkoutLogs = (weekFilter, dayFilter) => {
    let filtered = [...selectedUserLogs];
    
    if (weekFilter !== 'all') {
      filtered = filtered.filter(log => log.week === parseInt(weekFilter));
    }
    
    if (dayFilter !== 'all') {
      filtered = filtered.filter(log => log.day === parseInt(dayFilter));
    }
    
    setFilteredWorkoutLogs(filtered);
  };

  const handleWeekFilterChange = (week) => {
    setSelectedWeekFilter(week);
    filterWorkoutLogs(week, selectedDayFilter);
  };

  const handleDayFilterChange = (day) => {
    setSelectedDayFilter(day);
    filterWorkoutLogs(selectedWeekFilter, day);
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
    showConfirmation({
      type: 'ban',
      title: 'Ban User',
      message: 'Apakah Anda yakin ingin memblokir user ini? User tidak akan bisa login.',
      icon: <FaBan />,
      confirmText: 'Ban User',
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'users', userId), {
            isActive: false,
            isBanned: true,
            bannedAt: new Date().toISOString()
          });
          
          fetchUsers();
          showNotif('✅ User berhasil di-ban', 'success');
        } catch (error) {
          console.error('Error banning user:', error);
          showNotif('❌ Gagal ban user', 'error');
        }
      }
    });
  };

  const handleUnbanUser = async (userId) => {
    showConfirmation({
      type: 'unban',
      title: 'Unban User',
      message: 'Apakah Anda yakin ingin membuka blokir user ini?',
      icon: <FaCheckCircle />,
      confirmText: 'Unban User',
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'users', userId), {
            isActive: true,
            isBanned: false,
            unbannedAt: new Date().toISOString()
          });
          
          fetchUsers();
          showNotif('✅ User berhasil di-unban', 'success');
        } catch (error) {
          console.error('Error unbanning user:', error);
          showNotif('❌ Gagal unban user', 'error');
        }
      }
    });
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
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    showConfirmation({
      type: 'delete',
      title: 'Hapus Pesan',
      message: 'Apakah Anda yakin ingin menghapus pesan ini? Tindakan ini tidak dapat dibatalkan.',
      icon: <FaTrashAlt />,
      confirmText: 'Hapus',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'userMessages', messageId));
          showNotif('✅ Pesan berhasil dihapus', 'success');
        } catch (error) {
          console.error('Error deleting message:', error);
          showNotif('❌ Gagal menghapus pesan', 'error');
        }
      }
    });
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

  // Show notification
  const showNotif = (message, type = 'info') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Show confirmation modal with custom config
  const showConfirmation = (config) => {
    setConfirmModalData({
      type: config.type || '',
      title: config.title || 'Konfirmasi',
      message: config.message || 'Apakah Anda yakin?',
      icon: config.icon || <FaExclamationTriangle />,
      confirmText: config.confirmText || 'Konfirmasi',
      cancelText: config.cancelText || 'Batal',
      onConfirm: config.onConfirm || null,
      requireInput: config.requireInput || false,
      inputPlaceholder: config.inputPlaceholder || '',
      inputValue: ''
    });
    setShowConfirmModal(true);
  };

  // Handle modal confirm action
  const handleModalConfirm = async () => {
    if (confirmModalData.onConfirm) {
      await confirmModalData.onConfirm(confirmModalData.inputValue);
    }
    setShowConfirmModal(false);
  };

  const handleViewUserDetails = async (user) => {
    setSelectedUser(user);
    await fetchUserWorkoutLogs(user.id);
    setActiveTab('user-detail');
  };

  const handleApproveUser = async (userId, isIbafMember) => {
    showConfirmation({
      type: 'approve',
      title: 'Setujui Verifikasi',
      message: `Apakah Anda yakin ingin menyetujui verifikasi user ini sebagai ${isIbafMember ? 'Anggota IBAF' : 'Non-Anggota IBAF'}?`,
      icon: <FaUserCheck />,
      confirmText: 'Setujui',
      onConfirm: async () => {
        try {
          const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
          const userData = userDoc.docs[0]?.data();
          
          await updateDoc(doc(db, 'users', userId), {
            verificationStatus: 'approved',
            isIbafMember: isIbafMember,
            isActive: true,
            name: userData?.fullName || userData?.name,
            approvedAt: new Date().toISOString(),
            approvedBy: currentUser.email
          });
          
          fetchUsers();
          showNotif('✅ User berhasil disetujui!', 'success');
        } catch (error) {
          console.error('Error approving user:', error);
          showNotif('❌ Gagal menyetujui user', 'error');
        }
      }
    });
  };

  const handleRejectUser = async (userId) => {
    showConfirmation({
      type: 'reject',
      title: 'Tolak Verifikasi',
      message: 'Masukkan alasan penolakan verifikasi user ini:',
      icon: <FaUserTimes />,
      confirmText: 'Tolak',
      requireInput: true,
      inputPlaceholder: 'Contoh: Foto KTM tidak jelas, data tidak lengkap...',
      onConfirm: async (reason) => {
        if (!reason || reason.trim() === '') {
          showNotif('⚠️ Alasan penolakan harus diisi!', 'warning');
          return;
        }
        
        try {
          await updateDoc(doc(db, 'users', userId), {
            verificationStatus: 'rejected',
            isActive: false,
            rejectionReason: reason,
            rejectedAt: new Date().toISOString(),
            rejectedBy: currentUser.email
          });
          
          fetchUsers();
          showNotif('✅ User berhasil ditolak', 'success');
        } catch (error) {
          console.error('Error rejecting user:', error);
          showNotif('❌ Gagal menolak user', 'error');
        }
      }
    });
  };

  const handleSendMessageToUser = async (user) => {
    showConfirmation({
      type: 'message',
      title: 'Kirim Pesan ke User',
      message: `Kirim pesan ke ${user.name || user.fullName || user.email}:`,
      icon: <FaPaperPlane />,
      confirmText: 'Kirim',
      requireInput: true,
      inputPlaceholder: 'Tulis pesan Anda di sini...',
      onConfirm: async (message) => {
        if (!message || message.trim() === '') {
          showNotif('⚠️ Pesan tidak boleh kosong!', 'warning');
          return;
        }
        
        try {
          await addDoc(collection(db, 'adminMessages'), {
            userId: user.id,
            userEmail: user.email,
            userName: user.name || user.fullName || user.email,
            message: message,
            sentBy: currentUser.email,
            sentAt: new Date().toISOString(),
            read: false,
            status: 'unread'
          });
          
          showNotif('✅ Pesan berhasil dikirim!', 'success');
        } catch (error) {
          console.error('Error sending message:', error);
          showNotif('❌ Gagal mengirim pesan', 'error');
        }
      }
    });
  };

  const handleSendMessage = async () => {
    if (!messageModalData.message.trim()) {
      alert('Pesan tidak boleh kosong');
      return;
    }

    try {
      await addDoc(collection(db, 'adminMessages'), {
        userId: messageModalData.userId,
        userEmail: messageModalData.userEmail,
        userName: messageModalData.userName,
        message: messageModalData.message,
        sentBy: currentUser.email,
        sentAt: new Date().toISOString(),
        read: false
      });
      
      alert('Pesan berhasil dikirim!');
      setShowMessageModal(false);
      setMessageModalData({ userId: '', userName: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Gagal mengirim pesan');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    showConfirmation({
      type: 'delete-user',
      title: '⚠️ Hapus User Permanen',
      message: `PERINGATAN: Anda akan menghapus akun "${userName}" secara PERMANEN!\n\nSemua data akan dihapus:\n• Data profil\n• Workout logs\n• Riwayat pesan\n• Firebase Authentication\n\nUser akan langsung ter-logout!\n\nKetik "HAPUS" untuk konfirmasi:`,
      icon: <FaTrashAlt />,
      confirmText: 'Hapus Permanen',
      requireInput: true,
      inputPlaceholder: 'Ketik HAPUS untuk konfirmasi',
      onConfirm: async (confirmText) => {
        if (confirmText !== 'HAPUS') {
          showNotif('⚠️ Penghapusan dibatalkan. Anda harus mengetik "HAPUS" untuk konfirmasi.', 'warning');
          return;
        }
        
        try {
          setLoading(true);
          
          // Mark user as deleted first (this will trigger auto-logout on user's side)
          await updateDoc(doc(db, 'users', userId), {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: currentUser.uid
          });
          
          // Wait a bit for user to be logged out
          await new Promise(resolve => setTimeout(resolve, 2000));
          
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
          
          // Delete user document from Firestore
          await deleteDoc(doc(db, 'users', userId));
          
          fetchUsers();
          showNotif('✅ Akun berhasil dihapus beserta semua datanya', 'success');
        } catch (error) {
          console.error('Error deleting user:', error);
          showNotif('❌ Gagal menghapus akun: ' + error.message, 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const filterUsersByTab = (tabName, usersData = null) => {
    setUserFilterTab(tabName);
    const usersList = usersData || users;
    let filtered = [...usersList];
    
    switch(tabName) {
      case 'approved':
        filtered = usersList.filter(u => u.verificationStatus === 'approved');
        break;
      case 'pending':
        filtered = usersList.filter(u => u.verificationStatus === 'pending');
        break;
      case 'rejected':
        filtered = usersList.filter(u => u.verificationStatus === 'rejected');
        break;
      case 'not_submitted':
        filtered = usersList.filter(u => !u.verificationStatus || u.verificationStatus === 'not_submitted');
        break;
      case 'all':
      default:
        filtered = usersList;
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

  const groupLogsByWeek = (logs) => {
    const grouped = {};
    logs.forEach(log => {
      const week = log.week || 1;
      if (!grouped[week]) {
        grouped[week] = [];
      }
      grouped[week].push(log);
    });
    
    // Sort each week's logs by day
    Object.keys(grouped).forEach(week => {
      grouped[week].sort((a, b) => (a.day || 0) - (b.day || 0));
    });
    
    return grouped;
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="brand-section">
            <button className="hamburger-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span></span>
              <span></span>
              <span></span>
            </button>
            <Link to="/" className="back-home-link">
              ← Kembali ke Halaman Utama
            </Link>
          </div>
          <div className="header-actions">
            <span className="admin-badge">⚡ Admin</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-container">
        {/* Sidebar Navigation */}
        <div className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
          <div className="sidebar-content">
          <div className="admin-info-card">
            <div className="admin-avatar">
              {adminData?.avatar ? (
                <div className="avatar-icon-display" style={{ color: adminData.avatar.color || selectedAvatar.color }}>
                  {React.createElement(getAvatarComponent(adminData.avatar.icon || selectedAvatar.icon), { size: 50 })}
                </div>
              ) : (
                <div className="avatar-placeholder">A</div>
              )}
            </div>
            <h3>Admin Panel</h3>
            <p className="admin-email">{currentUser?.email}</p>
          </div>

          <nav className="dashboard-nav">
            <button
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
            >
              <span className="nav-icon">▶</span>
              Overview
            </button>
            <button
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
            >
              <span className="nav-icon">●</span>
              Kelola Users
            </button>
            <button
              className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => { setActiveTab('messages'); setSidebarOpen(false); }}
            >
              <span className="nav-icon">✉</span>
              Pesan Users
              {stats.pendingMessages > 0 && (
                <span className="badge">{stats.pendingMessages}</span>
              )}
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
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">●</div>
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
                  <div className="stat-icon">✉</div>
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
                    ● Kelola Users
                  </button>
                  <button onClick={() => setActiveTab('messages')} className="action-btn">
                    ✉ Lihat Pesan
                  </button>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Aktivitas Terbaru</h3>
                <div className="activity-list">
                  {messages.slice(0, 5).map((msg) => (
                    <div key={msg.id} className="activity-item">
                      <div className="activity-icon">✉</div>
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
                  <div>
                    <span className="tab-icon">●</span>
                    <span className="tab-label">Semua Users</span>
                    <span className="tab-count">{users.length}</span>
                  </div>
                  <span className="tab-description">Tampilkan semua pengguna</span>
                </button>
                <button 
                  className={`filter-tab ${userFilterTab === 'approved' ? 'active' : ''}`}
                  onClick={() => filterUsersByTab('approved')}
                >
                  <div>
                    <span className="tab-icon">✅</span>
                    <span className="tab-label">Terverifikasi</span>
                    <span className="tab-count">{users.filter(u => u.verificationStatus === 'approved').length}</span>
                  </div>
                  <span className="tab-description">User yang sudah disetujui</span>
                </button>
                <button 
                  className={`filter-tab ${userFilterTab === 'pending' ? 'active' : ''}`}
                  onClick={() => filterUsersByTab('pending')}
                >
                  <div>
                    <span className="tab-icon">⏳</span>
                    <span className="tab-label">Pending</span>
                    <span className="tab-count">{users.filter(u => u.verificationStatus === 'pending').length}</span>
                  </div>
                  <span className="tab-description">Menunggu persetujuan</span>
                </button>
                <button 
                  className={`filter-tab ${userFilterTab === 'rejected' ? 'active' : ''}`}
                  onClick={() => filterUsersByTab('rejected')}
                >
                  <div>
                    <span className="tab-icon">❌</span>
                    <span className="tab-label">Ditolak</span>
                    <span className="tab-count">{users.filter(u => u.verificationStatus === 'rejected').length}</span>
                  </div>
                  <span className="tab-description">Verifikasi ditolak</span>
                </button>
                <button 
                  className={`filter-tab ${userFilterTab === 'not_submitted' ? 'active' : ''}`}
                  onClick={() => filterUsersByTab('not_submitted')}
                >
                  <div>
                    <span className="tab-icon">⚪</span>
                    <span className="tab-label">Belum Submit</span>
                    <span className="tab-count">{users.filter(u => !u.verificationStatus || u.verificationStatus === 'not_submitted').length}</span>
                  </div>
                  <span className="tab-description">Belum mengisi verifikasi</span>
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
                            {user.avatar ? (
                              <div className="avatar-icon-display" style={{ color: user.avatar.color }}>
                                {React.createElement(getAvatarComponent(user.avatar.icon), { size: 30 })}
                              </div>
                            ) : user.photoURL ? (
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
                              title="Lihat detail lengkap user termasuk data verifikasi dan workout logs"
                            >
                              <span className="btn-icon">👁</span>
                              <span className="btn-text">Lihat</span>
                            </button>
                            
                            {user.verificationStatus === 'pending' && user.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => handleApproveUser(user.id, user.isIbafMember)}
                                  className="btn-approve"
                                  title="Setujui verifikasi user - User dapat akses dashboard penuh"
                                >
                                  <span className="btn-icon">✓</span>
                                  <span className="btn-text">Setujui</span>
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user.id)}
                                  className="btn-reject"
                                  title="Tolak verifikasi user - Akan diminta alasan penolakan"
                                >
                                  <span className="btn-icon">✕</span>
                                  <span className="btn-text">Tolak</span>
                                </button>
                              </>
                            )}
                            
                            <button
                              onClick={() => handleSendMessageToUser(user)}
                              className="btn-message"
                              title="Kirim pesan pribadi ke user - Pesan akan muncul di dashboard user"
                            >
                              <span className="btn-icon">✉</span>
                              <span className="btn-text">Pesan</span>
                            </button>
                            
                            {user.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => handleToggleUserStatus(user.id, user.isActive !== false)}
                                  className={user.isActive !== false ? 'btn-deactivate' : 'btn-activate'}
                                  title={user.isActive !== false ? 'Nonaktifkan user - User tidak dapat login' : 'Aktifkan user - User dapat login kembali'}
                                >
                                  <span className="btn-icon">{user.isActive !== false ? '⏸' : '▶'}</span>
                                  <span className="btn-text">{user.isActive !== false ? 'Nonaktifkan' : 'Aktifkan'}</span>
                                </button>
                                {user.isBanned ? (
                                  <button
                                    onClick={() => handleUnbanUser(user.id)}
                                    className="btn-unban"
                                    title="Unban user - Cabut status banned"
                                  >
                                    <span className="btn-icon">✓</span>
                                    <span className="btn-text">Unban</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBanUser(user.id)}
                                    className="btn-ban"
                                    title="Ban user - User akan di-banned permanen"
                                  >
                                    <span className="btn-icon">⊝</span>
                                    <span className="btn-text">Ban</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                                  className="btn-delete-user"
                                  title="HAPUS AKUN - Menghapus user dan semua datanya secara permanen (TIDAK DAPAT DIBATALKAN!)"
                                >
                                  <span className="btn-icon">🗑</span>
                                  <span className="btn-text">Hapus</span>
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
                                ✉ {inbox.messages.length} pesan
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
                    <h2>✉ Pesan dari {selectedUserForMessages.userName}</h2>
                    <p className="user-email-header">{selectedUserForMessages.userEmail}</p>
                  </div>
                  
                  <div className="message-filter-tabs">
                    <button 
                      className={`filter-tab ${messageFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setMessageFilter('all')}
                    >
                      Semua Pesan
                    </button>
                    <button 
                      className={`filter-tab ${messageFilter === 'received' ? 'active' : ''}`}
                      onClick={() => setMessageFilter('received')}
                    >
                      Pesan Masuk
                    </button>
                    <button 
                      className={`filter-tab ${messageFilter === 'sent' ? 'active' : ''}`}
                      onClick={() => setMessageFilter('sent')}
                    >
                      Pesan Terkirim
                    </button>
                  </div>
                  
                  <div className="messages-thread">
                    {userMessages.filter(msg => {
                      if (messageFilter === 'received') return msg.type === 'user';
                      if (messageFilter === 'sent') return msg.type === 'admin';
                      return true;
                    }).map((msg) => (
                      <div key={msg.id} className={`message-card ${msg.type === 'admin' ? 'admin-message' : msg.status}`}>
                        <div className="message-header">
                          <div className="message-meta">
                            {msg.type === 'admin' ? (
                              <>
                                <span className="message-status-badge admin-sent">
                                  📤 Anda kirim
                                </span>
                                <span className="message-date">
                                  {new Date(msg.createdAt).toLocaleString('id-ID')}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className={`message-status-badge ${msg.status}`}>
                                  {msg.status === 'pending' ? '⏳ Pending' : 
                                   msg.status === 'read' ? '👁️ Dibaca' : '✓ Dibalas'}
                                </span>
                                <span className="message-date">
                                  {new Date(msg.createdAt).toLocaleString('id-ID')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="message-content">
                          <p>{msg.message}</p>
                        </div>

                        {msg.type === 'user' && msg.reply && (
                          <div className="admin-reply-display">
                            <strong>Balasan Anda:</strong>
                            <p>{msg.reply}</p>
                            <span className="reply-date">
                              Dibalas: {new Date(msg.repliedAt).toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}

                        {msg.type === 'user' && (
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
                        )}
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
                  
                  {/* Send Message Button */}
                  <div className="user-actions-row">
                    <button 
                      className="btn-send-message"
                      onClick={() => handleSendMessageToUser(selectedUser)}
                    >
                      <FaPaperPlane className="btn-icon" />
                      Kirim Pesan
                    </button>
                    
                    {selectedUser.verificationStatus === 'pending' && selectedUser.role !== 'admin' && (
                      <>
                        <button
                          onClick={() => handleApproveUser(selectedUser.id, selectedUser.isIbafMember)}
                          className="btn-approve-detail"
                        >
                          <FaUserCheck className="btn-icon" />
                          Setujui
                        </button>
                        <button
                          onClick={() => handleRejectUser(selectedUser.id)}
                          className="btn-reject-detail"
                        >
                          <FaUserTimes className="btn-icon" />
                          Tolak
                        </button>
                      </>
                    )}
                    
                    {selectedUser.role !== 'admin' && (
                      <>
                        {selectedUser.isBanned ? (
                          <button
                            onClick={() => handleUnbanUser(selectedUser.id)}
                            className="btn-unban-detail"
                          >
                            <FaCheckCircle className="btn-icon" />
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(selectedUser.id)}
                            className="btn-ban-detail"
                          >
                            <FaBan className="btn-icon" />
                            Ban
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteUser(selectedUser.id, selectedUser.name || selectedUser.fullName || selectedUser.email)}
                          className="btn-delete-detail"
                        >
                          <FaTrashAlt className="btn-icon" />
                          Hapus
                        </button>
                      </>
                    )}
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
                <div className="workout-logs-header">
                  <h3>Workout Logs</h3>
                  
                  {selectedUserLogs.length > 0 && (
                    <div className="workout-filters">
                      <div className="filter-group">
                        <label>Minggu:</label>
                        <select 
                          value={selectedWeekFilter} 
                          onChange={(e) => handleWeekFilterChange(e.target.value)}
                          className="filter-select"
                        >
                          <option value="all">Semua Minggu</option>
                          {[...new Set(selectedUserLogs.map(log => log.week))].sort((a, b) => a - b).map(week => (
                            <option key={week} value={week}>Minggu {week}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="filter-group">
                        <label>Hari:</label>
                        <select 
                          value={selectedDayFilter} 
                          onChange={(e) => handleDayFilterChange(e.target.value)}
                          className="filter-select"
                        >
                          <option value="all">Semua Hari</option>
                          {[...new Set(selectedUserLogs.map(log => log.day))].sort((a, b) => a - b).map(day => {
                            const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
                            return (
                              <option key={day} value={day}>{dayNames[day - 1] || `Hari ${day}`}</option>
                            );
                          })}
                        </select>
                      </div>
                      
                      {(selectedWeekFilter !== 'all' || selectedDayFilter !== 'all') && (
                        <button 
                          className="reset-filter-btn"
                          onClick={() => {
                            setSelectedWeekFilter('all');
                            setSelectedDayFilter('all');
                            setFilteredWorkoutLogs(selectedUserLogs);
                          }}
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {selectedUserLogs.length === 0 ? (
                  <p className="no-data">User belum memiliki workout log</p>
                ) : (
                  <>
                    <div className="workout-summary">
                      <div className="summary-card">
                        <h4>Total Workouts</h4>
                        <p>{filteredWorkoutLogs.length}</p>
                      </div>
                      <div className="summary-card">
                        <h4>Total Volume</h4>
                        <p>{calculateTotalVolume(filteredWorkoutLogs).toFixed(1)} kg</p>
                      </div>
                      <div className="summary-card">
                        <h4>Weeks Logged</h4>
                        <p>{[...new Set(filteredWorkoutLogs.map(log => log.week))].length} / 8</p>
                      </div>
                    </div>

                    {filteredWorkoutLogs.length === 0 ? (
                      <p className="no-data">Tidak ada data untuk filter yang dipilih</p>
                    ) : (
                      <div className="workout-logs-list">
                        {Object.entries(groupLogsByWeek(filteredWorkoutLogs))
                          .sort(([weekA], [weekB]) => parseInt(weekA) - parseInt(weekB))
                          .map(([week, weekLogs]) => (
                          <div key={week} className="week-group">
                            <div className="week-header">
                              <h3>Minggu {week}</h3>
                              <span className="week-stats">
                                {weekLogs.length} workout{weekLogs.length > 1 ? 's' : ''} • 
                                Total: {calculateTotalVolume(weekLogs).toFixed(1)} kg
                              </span>
                            </div>
                            
                            <div className="week-logs">
                              {weekLogs.map((log) => (
                                <div key={log.id} className="workout-log-card">
                                  <div className="log-header">
                                    <h4>{log.dayName || `Hari ${log.day}`}</h4>
                                    <span className="log-date">
                                      {log.workoutDate ? new Date(log.workoutDate + 'T00:00:00').toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      }) : new Date(log.createdAt).toLocaleDateString('id-ID')}
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
                                    <strong>Total Volume: {(log.totalVolume || 0).toFixed(1)} kg</strong>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="message-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✉️ Kirim Pesan</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowMessageModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="recipient-info">
                <label>Kepada:</label>
                <div className="recipient-details">
                  <span className="recipient-name">{messageModalData.userName}</span>
                  <span className="recipient-email">{messageModalData.userEmail}</span>
                </div>
              </div>
              
              <div className="message-input-group">
                <label>Pesan:</label>
                <textarea
                  className="message-textarea"
                  placeholder="Tulis pesan Anda di sini..."
                  value={messageModalData.message}
                  onChange={(e) => setMessageModalData({ ...messageModalData, message: e.target.value })}
                  rows={6}
                  autoFocus
                />
                <div className="char-counter">
                  {messageModalData.message.length} karakter
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowMessageModal(false)}
              >
                Batal
              </button>
              <button 
                className="btn-send"
                onClick={handleSendMessage}
                disabled={!messageModalData.message.trim()}
              >
                <span className="btn-icon">📤</span>
                Kirim Pesan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Confirmation Modal */}
      {showConfirmModal && (
        <div className="confirm-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`confirm-modal-icon ${confirmModalData.type}`}>
              {confirmModalData.icon}
            </div>
            
            <h2 className="confirm-modal-title">{confirmModalData.title}</h2>
            
            <p className="confirm-modal-message">{confirmModalData.message}</p>
            
            {confirmModalData.requireInput && (
              <textarea
                className="confirm-modal-input"
                placeholder={confirmModalData.inputPlaceholder}
                value={confirmModalData.inputValue}
                onChange={(e) => setConfirmModalData({...confirmModalData, inputValue: e.target.value})}
                rows={confirmModalData.type === 'message' ? 4 : 1}
              />
            )}
            
            <div className="confirm-modal-actions">
              <button 
                className="confirm-btn-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                {confirmModalData.cancelText}
              </button>
              <button 
                className={`confirm-btn-confirm ${confirmModalData.type}`}
                onClick={handleModalConfirm}
              >
                {confirmModalData.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Notification Toast */}
      {showNotification && (
        <div className={`admin-notification ${notificationType}`}>
          <div className="notification-content">
            {notificationType === 'success' && <FaCheckCircle className="notif-icon" />}
            {notificationType === 'error' && <FaTimesCircle className="notif-icon" />}
            {notificationType === 'warning' && <FaExclamationTriangle className="notif-icon" />}
            {notificationType === 'info' && <FaExclamationTriangle className="notif-icon" />}
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
