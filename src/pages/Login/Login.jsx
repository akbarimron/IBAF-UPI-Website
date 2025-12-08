import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Harap isi semua field');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const userCredential = await login(email, password);
      
      // Get user role to redirect appropriately with fallback
      let userRole = 'user'; // default role
      try {
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          userRole = userDoc.data().role || 'user';
        }
      } catch (firestoreError) {
        console.warn('Could not fetch user role, using default:', firestoreError);
      }
      
      // Redirect based on role
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'user') {
        navigate('/dashboard');
      } else {
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

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Login</h2>
        <p className="login-subtitle">Masuk ke akun Anda</p>
        
        {error && (
          <div className="error-message">
            {error}
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
              placeholder="Masukkan email"
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
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <div className="register-link">
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
