import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Check if redirected after email verification
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      setSuccessMessage('Email berhasil diverifikasi! Silakan login.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Harap isi semua field');
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      setLoading(true);
      const userCredential = await login(email, password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        // Sign out the user
        await auth.signOut();
        setError('Email belum diverifikasi. Silakan cek inbox email Anda.');
        setLoading(false);
        return;
      }
      
      // Update emailVerified status in Firestore
      try {
        await updateDoc(doc(db, 'users', userCredential.user.uid), {
          emailVerified: true
        });
      } catch (updateError) {
        console.warn('Could not update emailVerified status:', updateError);
      }
      
      // Get user role to redirect appropriately with fallback
      let userRole = 'user'; // default role
      try {
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          userRole = userDoc.data().role || 'user';
          console.log('Login - User role from Firestore:', userRole);
        }
      } catch (firestoreError) {
        console.warn('Could not fetch user role, using default:', firestoreError);
      }
      
      // Redirect based on role
      console.log('Login - Redirecting based on role:', userRole);
      if (userRole === 'admin') {
        console.log('Navigating to /admin');
        navigate('/admin');
      } else if (userRole === 'user') {
        console.log('Navigating to /dashboard');
        navigate('/dashboard');
      } else {
        console.log('Navigating to /');
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Email tidak valid');
          break;
        case 'auth/user-disabled':
          setError('Akun telah dinonaktifkan');
          break;
        case 'auth/user-not-found':
          setError('Email tidak terdaftar');
          break;
        case 'auth/wrong-password':
          setError('Password salah');
          break;
        case 'auth/invalid-credential':
          setError('Email atau password salah');
          break;
        case 'auth/network-request-failed':
          setError('Koneksi internet bermasalah');
          break;
        case 'auth/too-many-requests':
          setError('Terlalu banyak percobaan login, coba lagi nanti');
          break;
        default:
          setError(`Terjadi kesalahan: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      console.log('Starting Google login...');
      
      const userCredential = await loginWithGoogle();
      console.log('Google login successful:', userCredential.user.uid);
      
      // Get user data including verification status
      let userRole = 'user';
      let verificationStatus = null;
      let isActive = true;
      let isBanned = false;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userRole = userData.role || 'user';
          verificationStatus = userData.verificationStatus;
          isActive = userData.isActive !== false;
          isBanned = userData.isBanned || false;
          console.log('User data:', { userRole, verificationStatus, isActive, isBanned });
        }
      } catch (firestoreError) {
        console.warn('Could not fetch user data, using default:', firestoreError);
      }
      
      // Check if account is banned
      if (isBanned) {
        await auth.signOut();
        setError('Akun Anda telah dibanned. Hubungi admin untuk informasi lebih lanjut.');
        setLoading(false);
        return;
      }
      
      // Check if account is inactive
      if (!isActive) {
        await auth.signOut();
        setError('Akun Anda tidak aktif. Hubungi admin untuk informasi lebih lanjut.');
        setLoading(false);
        return;
      }
      
      // For regular users, check verification status
      if (userRole === 'user') {
        // If not verified or rejected, redirect to dashboard (they will see verification form)
        if (!verificationStatus || verificationStatus === 'not_submitted' || verificationStatus === 'rejected') {
          console.log('User needs verification, redirecting to dashboard');
          navigate('/dashboard');
          return;
        }
        
        // If pending, allow access to dashboard (read-only)
        if (verificationStatus === 'pending') {
          console.log('User verification pending, redirecting to dashboard');
          navigate('/dashboard');
          return;
        }
        
        // Only approved users get full access
        if (verificationStatus === 'approved') {
          console.log('User verified and approved, redirecting to dashboard');
          navigate('/dashboard');
          return;
        }
      }
      
      // Redirect based on role for admin
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Google login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Login dibatalkan oleh user');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup diblokir oleh browser. Izinkan popup untuk login dengan Google');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Koneksi internet bermasalah. Cek koneksi Anda');
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('Domain tidak terotorisasi. Hubungi administrator');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError('Request popup dibatalkan');
      } else if (error.code === 'auth/internal-error') {
        setError('Terjadi kesalahan internal. Coba lagi');
      } else {
        setError(`Gagal login dengan Google: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Masukkan email Anda terlebih dahulu');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Try to login to get the user object
      const userCredential = await login(email, password);
      
      if (userCredential.user.emailVerified) {
        setSuccessMessage('Email sudah terverifikasi. Silakan login.');
        await auth.signOut();
        setLoading(false);
        return;
      }
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      await auth.signOut();
      
      setSuccessMessage('Email verifikasi telah dikirim ulang. Silakan cek inbox Anda.');
    } catch (error) {
      console.error('Resend verification error:', error);
      setError('Gagal mengirim ulang email verifikasi. Pastikan email dan password benar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Left Side - Image */}
        <div className="login-promo">
          <img 
            src="/src/img/ketum.png" 
            alt="Ketua Umum IBAF UPI" 
            className="promo-image"
          />
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-section">
          <div className="login-card">
            <h2 className="login-title">Selamat Datang Kembali!</h2>
            <p className="login-subtitle">Masuk untuk melanjutkan</p>
            
            {successMessage && (
              <div className="success-message" style={{
                padding: '12px',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #4caf50'
              }}>
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="error-message">
                {error}
                {error.includes('Email belum diverifikasi') && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading}
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Kirim Ulang Email Verifikasi
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <button 
                type="submit" 
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            <div className="divider">
              <span>atau</span>
            </div>

            <button 
              onClick={handleGoogleLogin} 
              className="google-button"
              disabled={loading}
            >
              <FcGoogle className="google-icon" />
              Masuk dengan Google
            </button>

            <div className="register-link">
              Belum punya akun? <Link to="/register">Daftar sekarang</Link>
            </div>

            <div className="back-home">
              <Link to="/">← Kembali ke Beranda</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
