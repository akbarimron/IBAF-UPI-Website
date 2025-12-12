import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage, auth } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateEmail, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification } from 'firebase/auth';
import { FaBell, FaExclamationTriangle, FaChartBar, FaUserShield, FaUser, FaClock, FaCheckCircle, FaCheckDouble, FaCheck, FaTrash, FaTimes, FaHome, FaFileAlt, FaChartLine, FaTrashAlt, FaCircle, FaDumbbell, FaCalendarAlt, FaClipboardList, FaHandshake, FaComments, FaUserCog, FaRocket, FaUserNinja, FaUserAstronaut, FaUserTie, FaUserGraduate, FaRobot, FaCat, FaDog, FaDragon, FaFrog, FaHorse, FaOtter, FaKiwiBird, FaFish, FaBan } from 'react-icons/fa';
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
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState({ icon: 'FaUser', color: '#B63333' });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailEdit, setShowEmailEdit] = useState(false);

  // Avatar options
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

  const avatarColors = [
    '#B63333', '#2196F3', '#4CAF50', '#FFC107', '#9C27B0',
    '#FF5722', '#00BCD4', '#8BC34A', '#FF9800', '#E91E63',
    '#3F51B5', '#009688', '#CDDC39', '#795548', '#607D8B'
  ];
  
  // Message state
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageFilter, setMessageFilter] = useState('all'); // all, sent, received
  
  // Workout statistics state
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedWeekForWorkout, setSelectedWeekForWorkout] = useState(null);
  
  // Notification count state
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  
  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  // Ref to track previous user status to avoid duplicate notifications
  const prevStatusRef = useRef({ isBanned: null, isActive: null, verificationStatus: null });
  // Refs to track previously seen message ids to avoid duplicate toasts
  const prevAdminMsgIdsRef = useRef(new Set());
  const prevRepliedUserMsgIdsRef = useRef(new Set());

  // Show notification helper
  const showNotification = useCallback((message, type = 'info') => {
    console.log('UserDashboard: showNotification called', { message, type });
    setNotification({ message, type });
  }, []);

  // Robust check whether a message should be considered read
  const isMessageRead = useCallback((m) => {
    if (!m) return false;
    try {
      // If admin message was marked read locally (fallback), honor it
      if (m.type === 'admin') {
        const key = `readAdminIds_${currentUser?.uid}`;
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        if (arr.includes(m.id)) return true;
      }
    } catch (e) {
      console.error('Error checking local read flags', e);
    }

    if (m.status === 'read') return true;
    if (m.read === true) return true;
    if (m.isRead === true) return true;
    if (m.readAt) return true;
    return false;
  }, [currentUser?.uid]);

  // Get week category and color
  const getWeekCategory = (weekNum) => {
    if (weekNum === 0) return { label: 'Pre-Test', color: '#4CAF50' }; // Hijau - Pre Test
    if (weekNum === 9) return { label: 'Post-Test', color: '#4CAF50' }; // Hijau - Post Test
    if (weekNum >= 1 && weekNum <= 3) return { label: 'Hypertrophy', color: '#2196F3' }; // Biru
    if (weekNum === 4 || weekNum === 8) return { label: 'Deload', color: '#FFC107' }; // Kuning
    if (weekNum >= 5 && weekNum <= 7) return { label: 'Strength', color: '#F44336' }; // Merah
    return { label: '', color: '#999' };
  };

  useEffect(() => {
    if (currentUser) {
      console.log('=== UserDashboard useEffect triggered ===');
      console.log('currentUser.uid:', currentUser.uid);
      fetchUserData();
      
      // Real-time listener for user data to detect ban/inactive status changes
      const userDocRef = doc(db, 'users', currentUser.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (docSnapshot) => {
        console.log('=== Real-time listener triggered ===');
        console.log('docSnapshot.exists():', docSnapshot.exists());
        
        // Check if user document has been deleted
        if (!docSnapshot.exists()) {
          showNotification('Akun Anda telah dihapus oleh admin', 'error');
          setTimeout(async () => {
            await logout();
            window.location.href = '/login';
          }, 2000);
          return;
        }
        
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          
          // Check if user is marked as deleted
          if (data.isDeleted) {
            showNotification('Akun Anda telah dihapus oleh admin', 'error');
            setTimeout(async () => {
              await logout();
              window.location.href = '/login';
            }, 2000);
            return;
          }
          
          setUserData(data);
          setName(data.fullName || data.name || '');
          setPhotoPreview(data.photoURL || null);
          
          console.log('=== Real-time listener - userData set ===');
          console.log('data:', data);
          console.log('verificationStatus:', data.verificationStatus);
          console.log('fullName:', data.fullName);
          console.log('nim:', data.nim);
          console.log('prodi:', data.prodi);
          
          // Track previous status to show notifications only on actual changes
          const prevStatus = prevStatusRef.current;
          const currentBanned = data.isBanned || false;
          const currentActive = data.isActive !== false;
          
          // Check if user is banned - immediate action
          if (currentBanned && prevStatus.isBanned !== currentBanned) {
            setVerificationStatus('banned');
            showNotification('Akun Anda telah diblokir oleh admin', 'error');
          }
          
          // Check if user became inactive
          if (!currentActive && prevStatus.isActive !== false && prevStatus.isActive !== null) {
            setActiveTab('messages');
            showNotification('Akun Anda telah dinonaktifkan. Anda hanya dapat mengirim pesan ke admin.', 'warning');
          }
          
          // Check if user became active again
          if (currentActive && prevStatus.isActive === false) {
            showNotification('Akun Anda telah diaktifkan kembali!', 'success');
          }
          
          // Check if account just got approved
          const currentVerificationStatus = data.verificationStatus;
          if (currentVerificationStatus === 'approved' && 
              prevStatus.verificationStatus !== 'approved' && 
              prevStatus.verificationStatus !== null) {
            showNotification('🎉 Akun Anda telah disetujui! Selamat datang di IBAF!', 'success');
            
            // Show tutorial if not shown before
            const tutorialShown = localStorage.getItem(`tutorial_shown_${currentUser.uid}`);
            if (!tutorialShown) {
              setTimeout(() => {
                setShowTutorial(true);
                setTutorialStep(0);
              }, 1500);
            }
          }
          
          // Update previous status
          prevStatusRef.current = {
            isBanned: currentBanned,
            isActive: currentActive,
            verificationStatus: currentVerificationStatus
          };
          
          // Update verification status if not banned
          if (!currentBanned) {
            const status = data.verificationStatus;
            setVerificationStatus(status);
            
            // User needs verification if:
            // 1. No verification status OR status is 'not_submitted'
            // 2. Missing required fields
            const hasBasicProfile = data.fullName && data.nim && data.prodi;
            
            if (!status || status === 'not_submitted' || !hasBasicProfile) {
              setNeedsVerification(true);
              if (!status) setVerificationStatus('not_submitted');
            } else {
              setNeedsVerification(false);
            }
          }
        }
      });
      
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
          // Use nullish coalescing to handle week 0 (pre-test) correctly
          const weekNum = data.weekNumber ?? data.week ?? 1;
          
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
          const qUserMessages = query(collection(db, 'userMessages'), where('userId', '==', currentUser.uid));
          const qAdminMessages = query(collection(db, 'adminMessages'), where('userId', '==', currentUser.uid));

          // Keep latest snapshots in local arrays then combine
          const unsubscribeUserMessages = onSnapshot(qUserMessages, (snapshot) => {
            const userMsgs = [];
            snapshot.forEach((doc) => {
              userMsgs.push({ id: doc.id, type: 'user', ...doc.data() });
            });

            try {
              processCombinedMessages(userMsgs, null);
            } catch (e) {
              console.error('Error processing user messages snapshot', e);
            }
          }, (err) => {
            console.error('User messages listener error', err);
            if (err.code === 'permission-denied') {
              showNotification('Akses notifikasi diblokir oleh aturan keamanan. Hubungi admin.', 'error');
            } else {
              showNotification('Gagal memuat pesan: ' + (err.message || err), 'error');
            }
          });

          const unsubscribeAdminMessages = onSnapshot(qAdminMessages, (snapshot) => {
            const adminMsgs = [];
            snapshot.forEach((doc) => {
              adminMsgs.push({ id: doc.id, type: 'admin', ...doc.data() });
            });

            try {
              processCombinedMessages(null, adminMsgs);
            } catch (e) {
              console.error('Error processing admin messages snapshot', e);
            }
          }, (err) => {
            console.error('Admin messages listener error', err);
            if (err.code === 'permission-denied') {
              showNotification('Akses notifikasi admin diblokir oleh aturan keamanan. Hubungi admin.', 'error');
            } else {
              showNotification('Gagal memuat notifikasi admin: ' + (err.message || err), 'error');
            }
          });

          // Helper to merge latest snapshots from both collections. We call it with whichever changed.
          let latestUserMsgs = [];
          let latestAdminMsgs = [];
          const processCombinedMessages = (usr, adm) => {
            if (Array.isArray(usr)) latestUserMsgs = usr;
            if (Array.isArray(adm)) latestAdminMsgs = adm;

            const userMsgs = latestUserMsgs.slice();
            const adminMsgs = latestAdminMsgs.slice();

            // Combine and sort all messages - admin messages first, then by date (newest first)
            const allMessages = [...userMsgs, ...adminMsgs];
            allMessages.sort((a, b) => {
              if (a.type === 'admin' && b.type !== 'admin') return -1;
              if (a.type !== 'admin' && b.type === 'admin') return 1;
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || a.sentAt || a.createdAt);
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || b.sentAt || b.createdAt);
              return dateB - dateA;
            });

            // Count unread admin messages and replies
            const unreadFromAdminCollection = adminMsgs.filter(msg => !isMessageRead(msg)).length;
            const unreadRepliesInUserMsgs = userMsgs.filter(msg => msg.status === 'replied' && !isMessageRead(msg)).length;
            const unreadAdminMessages = unreadFromAdminCollection + unreadRepliesInUserMsgs;
            setUnreadCount(unreadAdminMessages);

            // Show toast for newly arrived admin messages or replies (but not on initial load)
            try {
              const currentAdminIds = new Set(adminMsgs.map(m => m.id));
              const currentRepliedUserIds = new Set(userMsgs.filter(m => m.status === 'replied' && m.reply).map(m => m.id));

              const prevAdminIds = prevAdminMsgIdsRef.current || new Set();
              const prevRepliedIds = prevRepliedUserMsgIdsRef.current || new Set();

              const isInitialLoad = prevAdminIds.size === 0 && prevRepliedIds.size === 0;

              if (!isInitialLoad) {
                adminMsgs.forEach((m) => {
                  if (!prevAdminIds.has(m.id) && !isMessageRead(m)) {
                    console.log('UserDashboard: New admin message detected', { id: m.id, message: m.message || m.content, status: m.status });
                    showNotification(m.message || 'Pesan baru dari admin', 'info');
                  }
                });

                userMsgs.forEach((m) => {
                  if (m.status === 'replied' && m.reply && !prevRepliedIds.has(m.id)) {
                    console.log('UserDashboard: New reply to user message detected', { id: m.id, reply: m.reply });
                    showNotification(m.reply || 'Balasan dari admin', 'info');
                  }
                });
              }

              prevAdminMsgIdsRef.current = currentAdminIds;
              prevRepliedUserMsgIdsRef.current = currentRepliedUserIds;
            } catch (err) {
              console.error('Error handling new message notifications:', err);
            }

            setMessages(allMessages);
          };
      
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
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        });
        
        setAnnouncements(announcementsList);
      });
      
      // Cleanup
      return () => {
        unsubscribeUser();
        unsubscribeWorkout();
        unsubscribeUserMessages();
        unsubscribeAnnouncements();
      };
    }
  }, [currentUser]);

  // Debug: log messages and unreadCount changes
  useEffect(() => {
    try {
      console.log('UserDashboard: messages state changed, count=', messages.length);
      const adminUnread = messages.filter(m => m.type === 'admin' && !isMessageRead(m));
      console.log('UserDashboard: adminUnread items=', adminUnread.length, adminUnread.map(m => ({ id: m.id, message: m.message || m.content, status: m.status, read: m.read })));
    } catch (e) {
      console.error('Error logging messages state', e);
    }
  }, [messages, isMessageRead]);

  useEffect(() => {
    console.log('UserDashboard: unreadCount updated', unreadCount);
  }, [unreadCount]);

  const fetchUserData = async () => {
    try {
      console.log('=== fetchUserData called ===');
      console.log('currentUser:', currentUser);
      console.log('currentUser.uid:', currentUser?.uid);
      
      if (!currentUser) {
        console.error('No currentUser found');
        return;
      }
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      console.log('userDoc.exists():', userDoc.exists());
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('User data from Firestore:', data);
        
        setUserData(data);
        // Prioritize fullName from verification over name
        setName(data.fullName || data.name || '');
        setPhotoPreview(data.photoURL || null);
        
        console.log('UserDashboard - fetchUserData:', {
          uid: currentUser.uid,
          verificationStatus: data.verificationStatus,
          fullName: data.fullName,
          nim: data.nim,
          prodi: data.prodi,
          isBanned: data.isBanned,
          isActive: data.isActive
        });
        
        // Check if user is banned
        if (data.isBanned) {
          setVerificationStatus('banned');
          return;
        }
        
        // Redirect inactive users to messages tab
        if (data.isActive === false) {
          setActiveTab('messages');
          showNotification('Akun Anda sedang tidak aktif. Anda hanya dapat mengirim pesan ke admin.', 'warning');
        }
        
        // Check verification status
        const status = data.verificationStatus;
        setVerificationStatus(status);
        
        // User needs verification if:
        // 1. No verification status OR status is 'not_submitted'
        // 2. Missing required fields (fullName, nim, prodi, etc)
        const hasBasicProfile = data.fullName && data.nim && data.prodi;
        
        if (!status || status === 'not_submitted' || !hasBasicProfile) {
          setNeedsVerification(true);
          setVerificationStatus(status || 'not_submitted');
          console.log('User needs verification:', { status, hasBasicProfile });
        } else {
          setNeedsVerification(false);
          console.log('User verification complete:', { status, hasBasicProfile });
        }
      } else {
        console.error('User document does not exist in Firestore!');
        showNotification('Data user tidak ditemukan. Silakan logout dan login kembali.', 'error');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        showNotification('Akses ditolak. Silakan logout dan login kembali.', 'error');
        setTimeout(() => {
          logout();
        }, 2000);
      }
    }
  };

  // Initialize avatar from userData
  useEffect(() => {
    if (userData?.avatar) {
      setSelectedAvatar(userData.avatar);
    }
  }, [userData]);

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      showNotification('Email baru tidak boleh kosong', 'warning');
      return;
    }

    if (!password.trim()) {
      showNotification('Password diperlukan untuk mengubah email', 'warning');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      showNotification('Format email tidak valid', 'warning');
      return;
    }

    if (newEmail === currentUser.email) {
      showNotification('Email baru sama dengan email lama', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update email in Firebase Auth
      await updateEmail(currentUser, newEmail);

      // Send verification email
      await sendEmailVerification(currentUser);

      // Update email in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        email: newEmail,
        updatedAt: new Date().toISOString()
      });

      setShowEmailEdit(false);
      setNewEmail('');
      setPassword('');
      showNotification('Email berhasil diubah! Silakan cek email untuk verifikasi.', 'success');
    } catch (error) {
      console.error('Error updating email:', error);
      if (error.code === 'auth/wrong-password') {
        showNotification('Password salah', 'error');
      } else if (error.code === 'auth/email-already-in-use') {
        showNotification('Email sudah digunakan oleh akun lain', 'error');
      } else if (error.code === 'auth/requires-recent-login') {
        showNotification('Silakan login ulang untuk mengubah email', 'error');
      } else {
        showNotification('Gagal mengubah email: ' + error.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showNotification('Nama tidak boleh kosong', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Update Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: name.trim(),
        fullName: name.trim(),
        avatar: selectedAvatar,
        updatedAt: new Date().toISOString()
      });

      setUserData({ ...userData, name: name.trim(), fullName: name.trim(), avatar: selectedAvatar });
      setEditMode(false);
      showNotification('Profil berhasil diupdate!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Gagal update profil: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarComponent = (iconName) => {
    const avatar = avatarIcons.find(a => a.name === iconName);
    return avatar ? avatar.component : FaUser;
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

  const handleNextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      handleCloseTutorial();
    }
  };

  const handlePrevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    setTutorialStep(0);
    localStorage.setItem(`tutorial_shown_${currentUser.uid}`, 'true');
  };

  const handleGoToWorkoutLog = (weekNumber) => {
    setSelectedWeekForWorkout(weekNumber);
    setShowStatsModal(false);
    setActiveTab('workout');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tutorialSteps = [
    {
      title: 'Selamat Datang di IBAF!',
      content: 'Akun Anda telah disetujui dan sekarang Anda dapat mengakses semua fitur dashboard. Mari kita kenali fitur-fitur yang tersedia!',
      icon: 'FaHandshake'
    },
    {
      title: 'Workout Log',
      content: 'Catat progress latihan Anda selama 10 minggu (termasuk pre-test dan post-test). Sistem akan otomatis menghitung volume latihan dan memberikan statistik lengkap.',
      icon: 'FaDumbbell'
    },
    {
      title: 'Statistik & Progress',
      content: 'Lihat perkembangan Anda melalui grafik dan statistik mingguan. Bandingkan hasil pre-test dan post-test untuk melihat peningkatan performa!',
      icon: 'FaChartLine'
    },
    {
      title: 'Pesan ke Admin',
      content: 'Butuh bantuan atau ada pertanyaan? Gunakan fitur pesan untuk berkomunikasi langsung dengan admin. Kami siap membantu!',
      icon: 'FaComments'
    },
    {
      title: 'Profile',
      content: 'Kelola informasi profil Anda, update foto, dan lihat status akun Anda di menu Profile.',
      icon: 'FaUserCog'
    },
    {
      title: 'Siap Memulai!',
      content: 'Semua fitur sudah siap digunakan. Mulai catat latihan Anda hari ini dan raih target fitness Anda bersama IBAF!',
      icon: 'FaRocket'
    }
  ];

  // Helper function to format date from Firestore Timestamp or ISO string
  const formatMessageDate = (createdAt) => {
    try {
      // Handle null or undefined
      if (!createdAt) {
        console.warn('createdAt is null or undefined');
        return new Date();
      }
      
      // Handle Firestore Timestamp
      if (createdAt && typeof createdAt.toDate === 'function') {
        return createdAt.toDate();
      }
      
      // Handle ISO string or regular Date
      const date = new Date(createdAt);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date value:', createdAt);
        return new Date();
      }
      
      return date;
    } catch (error) {
      console.error('Error formatting date:', error, 'Value:', createdAt);
      return new Date(); // Fallback to current date
    }
  };

  // Mark a message as read. `type` is 'admin' or 'user'. If server update fails for admin messages, persist locally.
  const handleMarkAsRead = async (messageId, type = 'admin') => {
    // Build optimistic messages array
    const newMessages = messages.map(m => m.id === messageId ? { ...m, status: 'read', readAt: new Date().toISOString() } : m);
    // Apply optimistic update
    setMessages(newMessages);

    try {
      const payload = { status: 'read', readAt: serverTimestamp() };
      console.log('UserDashboard: marking as read, payload=', payload, 'type=', type, 'id=', messageId);
      if (type === 'admin') {
        await updateDoc(doc(db, 'adminMessages', messageId), payload);
      } else {
        await updateDoc(doc(db, 'userMessages', messageId), payload);
      }
      showNotification('Pesan ditandai sudah dibaca', 'success');
    } catch (error) {
      console.error('Error marking message as read (server):', error);
      // If permission denied for adminMessages, persist local read flag so notification won't reappear locally
      if (type === 'admin') {
        try {
          const key = `readAdminIds_${currentUser?.uid}`;
          const raw = localStorage.getItem(key);
          const arr = raw ? JSON.parse(raw) : [];
          if (!arr.includes(messageId)) {
            arr.push(messageId);
            localStorage.setItem(key, JSON.stringify(arr));
          }
        } catch (e) {
          console.error('Failed to persist local read flag', e);
        }
      }
      showNotification('Pesan ditandai sudah dibaca (lokal)', 'info');
    } finally {
      // Recompute unread count from current messages and local read flags
      try {
        const adminUnread = newMessages.filter(m => m.type === 'admin' && !isMessageRead(m)).length;
        const repliedUnread = newMessages.filter(m => m.type === 'user' && m.status === 'replied' && !isMessageRead(m)).length;
        setUnreadCount(adminUnread + repliedUnread);
      } catch (e) {
        console.error('Failed to recompute unread count', e);
      }
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
            <Link to="/" className="back-home-link">
              ← Kembali ke Halaman Utama
            </Link>
          </div>
          <div className="header-actions">
            <button 
              className="notification-btn" 
              onClick={() => setShowNotificationModal(true)}
            >
              <FaBell className="notification-icon" />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            <button onClick={handleLogout} className="logout-btn">
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
              <h3><FaBell style={{marginRight: '8px'}} /> Notifikasi</h3>
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
                          {formatMessageDate(announcement.createdAt).toLocaleDateString('id-ID', {
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

              {/* Admin Messages and Admin Replies Section */}
              {(() => {
                const adminUnread = messages.filter(m => (m.type === 'admin' && !isMessageRead(m)) || (m.type === 'user' && m.status === 'replied' && !isMessageRead(m)));
                if (adminUnread.length === 0) return null;
                return (
                  <div className="notification-section">
                    <h4 className="notification-section-title">✉️ Pesan dari Admin</h4>
                    {adminUnread.slice(0, 8).map((msg) => {
                      const isReply = msg.type === 'user' && msg.status === 'replied';
                      const displayDate = formatMessageDate(msg.sentAt || msg.createdAt || msg.repliedAt || msg.createdAt);
                      return (
                        <div
                          key={msg.id}
                          className="notification-item message-item"
                          onClick={() => {
                            // mark as read (admin collection or user message reply)
                            handleMarkAsRead(msg.id, isReply ? 'user' : 'admin');
                            setShowNotificationModal(false);
                            setActiveTab('messages');
                            setSidebarOpen(false);
                          }}
                        >
                          <div className="notification-item-header">
                            <span className="notification-item-type">{isReply ? 'Balasan dari Admin' : 'Pesan Baru'}</span>
                            <span className="notification-item-date">
                              {displayDate.toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="notification-item-from">Dari: <strong>Admin</strong></div>
                          <p className="notification-item-content">{isReply ? (msg.reply || '-') : (msg.message || msg.content || '-')}</p>
                        </div>
                      );
                    })}
                    {adminUnread.length > 8 && (
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
                );
              })()}

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
              <FaTrashAlt className="confirm-icon" />
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
      
      {/* Loading state */}
      {!userData ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Memuat data...</p>
        </div>
      ) : 
      /* Show banned page if user is banned */
      verificationStatus === 'banned' ? (
        <div className="verification-rejected-container">
          <div className="rejected-card">
            <div className="rejected-icon">🚫</div>
            <h2>Akun Diblokir</h2>
            <p>Maaf, akun Anda telah diblokir oleh admin.</p>
            {userData?.banReason && (
              <div className="rejection-reason">
                <strong>Alasan:</strong>
                <p>{userData.banReason}</p>
              </div>
            )}
            <p>Silakan hubungi admin untuk informasi lebih lanjut.</p>
            <div className="rejected-actions">
              <button onClick={handleLogout} className="btn-logout-alt">Logout</button>
            </div>
          </div>
        </div>
      ) : (needsVerification && (verificationStatus === 'not_submitted' || !verificationStatus)) ? (
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
                <FaFileAlt style={{marginRight: '8px'}} /> Kirim Ulang Data
              </button>
              <button onClick={handleLogout} className="btn-logout-alt">Logout</button>
            </div>
          </div>
        </div>
      ) : verificationStatus === 'approved' ? (
      <div className="dashboard-container">{/* Regular dashboard content - ONLY FOR APPROVED USERS */}
        {/* Sidebar */}
        <div className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
          <div className="sidebar-content">
          <div className="user-info-card">
            <div className="user-avatar">
              <div className="avatar-icon-display" style={{ color: (userData?.avatar?.color || selectedAvatar.color) }}>
                {React.createElement(getAvatarComponent(userData?.avatar?.icon || selectedAvatar.icon))}
              </div>
            </div>
            <h3>{userData?.fullName || userData?.name || 'User'}</h3>
            <p className="user-email">{userData?.email || currentUser?.email}</p>
            <div className={`account-status ${
              verificationStatus === 'approved' ? 'active' : 
              verificationStatus === 'pending' ? 'pending' : 
              verificationStatus === 'rejected' ? 'rejected' : 'inactive'
            }`}>
              {verificationStatus === 'approved' ? (
                <>
                  <FaCircle className="status-icon active" />
                  <span>Terverifikasi</span>
                </>
              ) : verificationStatus === 'pending' ? (
                <>
                  <FaCircle className="status-icon pending" />
                  <span>Menunggu Verifikasi</span>
                </>
              ) : verificationStatus === 'rejected' ? (
                <>
                  <FaCircle className="status-icon inactive" />
                  <span>Ditolak</span>
                </>
              ) : (
                <>
                  <FaCircle className="status-icon inactive" />
                  <span>Belum Verifikasi</span>
                </>
              )}
            </div>
          </div>

          <nav className="dashboard-nav">
            <button
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''} ${(userData?.isActive === false || verificationStatus !== 'approved') ? 'disabled' : ''}`}
              onClick={() => { 
                if (userData?.isActive !== false && verificationStatus === 'approved') {
                  setActiveTab('overview'); 
                  setSidebarOpen(false);
                }
              }}
              disabled={userData?.isActive === false || verificationStatus !== 'approved'}
            >
              <span className="nav-icon">●</span>
              Overview
            </button>
            <button
              className={`nav-item ${activeTab === 'workout' ? 'active' : ''} ${(userData?.isActive === false || verificationStatus !== 'approved') ? 'disabled' : ''}`}
              onClick={() => { 
                if (userData?.isActive !== false && verificationStatus === 'approved') {
                  setActiveTab('workout'); 
                  setSidebarOpen(false);
                }
              }}
              disabled={userData?.isActive === false || verificationStatus !== 'approved'}
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
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''} ${(userData?.isActive === false || verificationStatus !== 'approved') ? 'disabled' : ''}`}
              onClick={() => { 
                if (userData?.isActive !== false && verificationStatus === 'approved') {
                  setActiveTab('profile'); 
                  setSidebarOpen(false);
                }
              }}
              disabled={userData?.isActive === false || verificationStatus !== 'approved'}
            >
              <span className="nav-icon"><FaUser /></span>
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
          {/* Inactive Account Warning Banner */}
          {userData?.isActive === false && (
            <div className="inactive-warning-banner">
              <div className="warning-icon"><FaExclamationTriangle /></div>
              <div className="warning-content">
                <h4>Akun Tidak Aktif</h4>
                <p>Akun Anda sedang dalam status tidak aktif. Anda hanya dapat mengirim pesan ke admin. Hubungi admin untuk mengaktifkan kembali akun Anda.</p>
              </div>
            </div>
          )}
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h2>Dashboard Overview</h2>
              <div className="overview-grid">
                <div className="overview-card">
                  <div className="card-icon">
                    <FaCheckCircle style={{color: 
                      verificationStatus === 'approved' ? '#4CAF50' : 
                      verificationStatus === 'pending' ? '#FF9800' : 
                      verificationStatus === 'rejected' ? '#f44336' : '#757575'
                    }} />
                  </div>
                  <div className="card-content">
                    <h4>Status Verifikasi</h4>
                    <p className={
                      verificationStatus === 'approved' ? 'status-active' : 
                      verificationStatus === 'pending' ? 'status-pending' : 
                      verificationStatus === 'rejected' ? 'status-rejected' : 'status-inactive'
                    }>
                      {verificationStatus === 'approved' ? 'Terverifikasi' : 
                       verificationStatus === 'pending' ? 'Menunggu Verifikasi' : 
                       verificationStatus === 'rejected' ? 'Ditolak' : 'Belum Verifikasi'}
                    </p>
                  </div>
                </div>
                
                <div className="overview-card">
                  <div className="card-icon"><FaBell /></div>
                  <div className="card-content">
                    <h4>Pesan</h4>
                    <p>{messages.length} pesan</p>
                  </div>
                </div>

                <div className="overview-card">
                  <div className="card-icon"><FaCalendarAlt /></div>
                  <div className="card-content">
                    <h4>Member Sejak</h4>
                    <p>{userData?.createdAt ? formatMessageDate(userData.createdAt).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Weekly Volume Statistics */}
              {weeklyStats.length > 0 && (
                <div className="weekly-stats-section">
                  <h3><FaChartBar style={{marginRight: '8px'}} /> Statistik Volume Program (8 Minggu)</h3>
                  
                  {/* Legend */}
                  <div className="stats-legend">
                    <div className="legend-item">
                      <span className="legend-color" style={{backgroundColor: '#4CAF50'}}></span>
                      <span>Pre/Post Test</span>
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

                  {/* Container for Comparison and Stats side by side */}
                  <div className="stats-comparison-container">
                    {/* Pre-Test vs Post-Test Comparison */}
                    <div className="test-comparison">
                      <h4 className="comparison-title"><FaChartBar style={{marginRight: '8px'}} /> Perbandingan Pre-Test & Post-Test</h4>
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
                          <div className="stat-volume-container">
                            <div className="stat-volume-label">Volume:</div>
                            <div className="stat-volume" style={{color: stat.hasData ? stat.color : '#999'}}>
                              {stat.hasData ? stat.totalVolume.toFixed(1) : '-'}
                            </div>
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
                      <h4 className="weekly-title"><FaChartLine style={{marginRight: '8px'}} /> Statistik Latihan Mingguan</h4>
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
                        <span className="stat-detail-label"><FaDumbbell style={{marginRight: '8px'}} /> Total Volume</span>
                        <span className="stat-detail-value">{selectedWeek.totalVolume.toFixed(1)}</span>
                      </div>
                      <div className="stat-detail-item" style={{ borderLeft: `4px solid ${selectedWeek.color}` }}>
                        <span className="stat-detail-label"><FaCalendarAlt style={{marginRight: '8px'}} /> Hari Latihan</span>
                        <span className="stat-detail-value">{selectedWeek.workoutDays} hari</span>
                      </div>
                      <div className="stat-detail-item" style={{ borderLeft: `4px solid ${selectedWeek.color}` }}>
                        <span className="stat-detail-label"><FaClipboardList style={{marginRight: '8px'}} /> Total Exercises</span>
                        <span className="stat-detail-value">{selectedWeek.totalExercises} exercise</span>
                      </div>
                      <div className="stat-detail-item">
                        <span className="stat-detail-label"><FaChartBar style={{marginRight: '8px'}} /> Rata-rata Volume/Hari</span>
                        <span className="stat-detail-value">
                          {selectedWeek.workoutDays > 0 
                            ? `${(selectedWeek.totalVolume / selectedWeek.workoutDays).toFixed(1)}`
                            : '0'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="stats-modal-footer">
                      <button 
                        className="btn-goto-workout"
                        onClick={() => handleGoToWorkoutLog(selectedWeek.week)}
                      >
                        <FaDumbbell style={{marginRight: '8px'}} />
                        Pergi ke Workout Log Minggu {selectedWeek.week}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="welcome-message">
                <h3>Selamat datang, {userData?.fullName || userData?.name || 'Member'}!</h3>
                <p>Gunakan menu di samping untuk mengakses fitur-fitur dashboard Anda.</p>
                <ul className="feature-list">
                  <li><FaDumbbell style={{marginRight: '8px', color: '#B63333'}} /> <strong>Workout Log:</strong> Catat dan pantau progress latihan Anda selama 8 minggu</li>
                  <li><FaBell style={{marginRight: '8px', color: '#B63333'}} /> <strong>Pesan Admin:</strong> Kirim pertanyaan atau laporan ke admin</li>
                  <li><FaUser style={{marginRight: '8px', color: '#B63333'}} /> <strong>Profile:</strong> Update informasi dan foto profil Anda</li>
                </ul>
              </div>
            </div>
          )}

          {/* Workout Log Tab */}
          {activeTab === 'workout' && (
            <div className="workout-tab">
              <WorkoutLog 
                initialWeek={selectedWeekForWorkout}
                onWeekChange={() => setSelectedWeekForWorkout(null)}
              />
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
                      <div className="message-content-wrapper">
                        <div className="message-meta">
                          <span className="message-sender">
                            {msg.type === 'admin' ? <><FaUserShield style={{marginRight: '6px'}} /> Admin</> : <><FaUser style={{marginRight: '6px'}} /> Anda</>}
                          </span>
                          <span className="message-date">
                            {formatMessageDate(msg.createdAt).toLocaleString('id-ID', { 
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
                              {msg.status === 'pending' ? <><FaClock style={{marginRight: '4px'}} /> Menunggu</> : msg.status === 'read' ? <><FaCheckCircle style={{marginRight: '4px'}} /> Dibaca</> : <><FaCheckDouble style={{marginRight: '4px'}} /> Dibalas</>}
                            </span>
                          )}
                        </div>
                        <div className="message-text-wrapper">
                          <p className="message-text">{msg.message}</p>
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
                                <FaCheck />
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
                              <FaTrash />
                            </span>
                          </div>
                        </div>
                      </div>
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
                  <div className="profile-avatar-wrapper">
                    {React.createElement(getAvatarComponent(selectedAvatar.icon), {
                      className: 'profile-avatar-icon',
                      style: { color: selectedAvatar.color }
                    })}
                  </div>
                  {editMode && (
                    <div className="avatar-selector">
                      <button 
                        className="change-avatar-btn"
                        onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      >
                        Ganti Avatar
                      </button>
                      
                      {showAvatarPicker && (
                        <div className="avatar-picker">
                          <h4>Pilih Icon</h4>
                          <div className="avatar-icons-grid">
                            {avatarIcons.map((avatar) => (
                              <button
                                key={avatar.name}
                                className={`avatar-icon-btn ${selectedAvatar.icon === avatar.name ? 'active' : ''}`}
                                onClick={() => setSelectedAvatar({ ...selectedAvatar, icon: avatar.name })}
                                title={avatar.label}
                              >
                                {React.createElement(avatar.component)}
                              </button>
                            ))}
                          </div>
                          
                          <h4>Pilih Warna</h4>
                          <div className="avatar-colors-grid">
                            {avatarColors.map((color) => (
                              <button
                                key={color}
                                className={`avatar-color-btn ${selectedAvatar.color === color ? 'active' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setSelectedAvatar({ ...selectedAvatar, color })}
                              />
                            ))}
                          </div>
                        </div>
                      )}
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
                    {showEmailEdit ? (
                      <div className="email-edit-section">
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Email baru"
                          className="email-input"
                        />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password untuk konfirmasi"
                          className="password-input"
                        />
                        <div className="email-actions">
                          <button 
                            onClick={handleUpdateEmail} 
                            disabled={loading}
                            className="save-email-btn"
                          >
                            {loading ? 'Menyimpan...' : 'Simpan Email'}
                          </button>
                          <button 
                            onClick={() => {
                              setShowEmailEdit(false);
                              setNewEmail('');
                              setPassword('');
                            }}
                            className="cancel-email-btn"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="email-display">
                        <p>{currentUser?.email}</p>
                        <button 
                          onClick={() => setShowEmailEdit(true)}
                          className="change-email-btn"
                        >
                          Ubah Email
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="info-group">
                    <label>Status Akun</label>
                    <p className={userData?.isActive !== false ? 'status-active' : 'status-inactive'}>
                      {userData?.isActive !== false ? <><FaCheck style={{marginRight: '6px'}} /> Aktif</> : <><FaTimes style={{marginRight: '6px'}} /> Tidak Aktif</>}
                    </p>
                  </div>

                  <div className="info-group">
                    <label>Bergabung Sejak</label>
                    <p>{userData?.createdAt ? formatMessageDate(userData.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
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
      ) : (
        <div className="verification-error-container">
          <div className="verification-page">
            <div className="verification-card">
              <div className="status-icon error">
                <FaBan />
              </div>
              <h2 className="verification-title">Status Tidak Dikenali</h2>
              <p className="verification-message">
                Status verifikasi: {verificationStatus || 'null'}<br/>
                Terjadi kesalahan dengan status verifikasi akun Anda.
                Silakan logout dan login kembali.
              </p>
              <div className="verification-actions">
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="tutorial-overlay" onClick={handleCloseTutorial}>
          <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
            <button className="tutorial-close" onClick={handleCloseTutorial}>
              ✕
            </button>
            
            <div className="tutorial-content">
              <div className="tutorial-icon">
                {tutorialSteps[tutorialStep].icon === 'FaHandshake' && <FaHandshake />}
                {tutorialSteps[tutorialStep].icon === 'FaDumbbell' && <FaDumbbell />}
                {tutorialSteps[tutorialStep].icon === 'FaChartLine' && <FaChartLine />}
                {tutorialSteps[tutorialStep].icon === 'FaComments' && <FaComments />}
                {tutorialSteps[tutorialStep].icon === 'FaUserCog' && <FaUserCog />}
                {tutorialSteps[tutorialStep].icon === 'FaRocket' && <FaRocket />}
              </div>
              <h2 className="tutorial-title">
                {tutorialSteps[tutorialStep].title}
              </h2>
              <p className="tutorial-description">
                {tutorialSteps[tutorialStep].content}
              </p>
              
              <div className="tutorial-progress">
                {tutorialSteps.map((_, index) => (
                  <span 
                    key={index} 
                    className={`progress-dot ${index === tutorialStep ? 'active' : ''} ${index < tutorialStep ? 'completed' : ''}`}
                  />
                ))}
              </div>
              
              <div className="tutorial-actions">
                {tutorialStep > 0 && (
                  <button 
                    className="tutorial-btn tutorial-btn-prev"
                    onClick={handlePrevTutorialStep}
                  >
                    ← Sebelumnya
                  </button>
                )}
                <button 
                  className="tutorial-btn tutorial-btn-next"
                  onClick={handleNextTutorialStep}
                >
                  {tutorialStep < tutorialSteps.length - 1 ? 'Lanjut →' : 'Mulai!'}
                </button>
              </div>
              
              <button className="tutorial-skip" onClick={handleCloseTutorial}>
                Lewati Tutorial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
