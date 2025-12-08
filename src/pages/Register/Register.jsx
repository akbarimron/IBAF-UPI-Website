import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Semua field harus diisi');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak sama');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // Add user data to Firestore with 'user' role
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        role: 'user',
        createdAt: new Date().toISOString()
      });

      // Redirect to user dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Email sudah terdaftar');
          break;
        case 'auth/invalid-email':
          setError('Email tidak valid');
          break;
        case 'auth/weak-password':
          setError('Password terlalu lemah');
          break;
        default:
          setError('Terjadi kesalahan saat mendaftar');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setError('');
      setLoading(true);
      const userCredential = await loginWithGoogle();
      
      // Check role and redirect
      let userRole = 'user';
      try {
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          userRole = userDoc.data().role || 'user';
        }
      } catch (firestoreError) {
        console.warn('Could not fetch user role:', firestoreError);
      }
      
      // Redirect based on role
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Google register error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Pendaftaran dibatalkan');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Koneksi internet bermasalah');
      } else {
        setError('Gagal mendaftar dengan Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-wrapper">
        {/* Left Side - Promotional */}
        <div className="register-promo">
          <div className="promo-content">
            <div className="promo-logo">
              <h1>Bergabunglah Bersama Kami</h1>
              <p className="promo-tagline">IBAF UPI - Ikatan Bodybuilding & Fitness</p>
            </div>
            <div className="promo-benefits">
              <div className="benefit-item">
                <div className="benefit-icon">✅</div>
                <div>
                  <h4>Akses Eksklusif</h4>
                  <p>Akses penuh ke semua program dan event</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">✅</div>
                <div>
                  <h4>Komunitas Aktif</h4>
                  <p>Networking dengan member se-Indonesia</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">✅</div>
                <div>
                  <h4>Tracking Progress</h4>
                  <p>Pantau dan kelola pencapaian Anda</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">✅</div>
                <div>
                  <h4>Berita Terkini</h4>
                  <p>Update event dan informasi terbaru</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="register-form-section">
          <div className="register-card">
            <h2 className="register-title">Daftar Akun Baru</h2>
            <p className="register-subtitle">Bergabung dengan IBAF UPI sekarang</p>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="name">Nama Lengkap</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  disabled={loading}
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimal 6 karakter"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Konfirmasi Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Ulangi password"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="register-button"
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Daftar Sekarang'}
              </button>
            </form>

            <div className="divider">
              <span>atau</span>
            </div>

            <button 
              onClick={handleGoogleRegister} 
              className="google-button"
              disabled={loading}
            >
              <FcGoogle className="google-icon" />
              Daftar dengan Google
            </button>

            <div className="login-link">
              Sudah punya akun? <Link to="/login">Masuk di sini</Link>
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

export default Register;
