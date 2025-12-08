import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Email/Password Login
  const login = async (email, password) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('AuthContext - Login successful, UID:', userCredential.user.uid);
      
      // Get user role from Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        console.log('AuthContext - Firestore doc exists:', userDoc.exists());
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('AuthContext - User data from Firestore:', userData);
          const role = userData.role || 'user';
          console.log('AuthContext - Setting role to:', role);
          setUserRole(role);
        } else {
          console.log('AuthContext - No Firestore doc, using default role: user');
          setUserRole('user');
        }
      } catch (firestoreError) {
        console.error('AuthContext - Error fetching role:', firestoreError);
        setUserRole('user');
      }
      
      return userCredential;
    } catch (error) {
      console.error('AuthContext - Login error:', error);
      throw error;
    }
  };

  // Google Sign-In
  const loginWithGoogle = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      console.log('AuthContext - Google login successful, UID:', userCredential.user.uid);
      
      // Check if user document exists, create if not
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document for Google sign-in
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: userCredential.user.displayName || 'User',
          email: userCredential.user.email,
          role: 'user',
          createdAt: new Date().toISOString(),
          photoURL: userCredential.user.photoURL || ''
        });
        console.log('AuthContext - Created new user document for Google user');
        setUserRole('user');
      } else {
        const userData = userDoc.data();
        const role = userData.role || 'user';
        console.log('AuthContext - Existing Google user, role:', role);
        setUserRole(role);
      }
      
      return userCredential;
    } catch (error) {
      console.error('AuthContext - Google login error:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return userRole === 'admin';
  };

  // Check if user is regular user
  const isUser = () => {
    return userRole === 'user';
  };

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role || 'user';
            setUserRole(role);
          } else {
            setUserRole('user');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user');
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    loginWithGoogle,
    logout,
    isAdmin,
    isUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
