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
  const [userName, setUserName] = useState(null);
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
          const name = userData.name || userData.displayName || null;
          console.log('AuthContext - Setting role to:', role);
          
          // Auto-verify admin emails
          if (role === 'admin' && !userData.emailVerified) {
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              ...userData,
              emailVerified: true
            }, { merge: true });
            console.log('AuthContext - Auto-verified admin email:', email);
          }
          
          setUserRole(role);
          setUserName(name);
        } else {
          console.log('AuthContext - No Firestore doc, using default role: user');
          setUserRole('user');
          setUserName(null);
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
        // Create new user document for Google sign-in - NO VERIFICATION STATUS
        // User must complete verification like email/password users
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: userCredential.user.displayName || 'User',
          email: userCredential.user.email,
          role: 'user',
          createdAt: new Date().toISOString(),
          photoURL: userCredential.user.photoURL || '',
          verificationStatus: 'not_submitted', // Force verification
          emailVerified: true // Google accounts are already verified
        });
        console.log('AuthContext - Created new user document for Google user (needs verification)');
        setUserRole('user');
        setUserName(userCredential.user.displayName || 'User');
      } else {
        const userData = userDoc.data();
        const role = userData.role || 'user';
        const name = userData.name || userCredential.user.displayName || null;
        console.log('AuthContext - Existing Google user, role:', role);
        
        // Auto-verify admin emails
        if (role === 'admin' && !userData.emailVerified) {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            ...userData,
            emailVerified: true
          }, { merge: true });
          console.log('AuthContext - Auto-verified admin email:', userCredential.user.email);
        }
        
        setUserRole(role);
        setUserName(name);
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
      setUserName(null);
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
            const userData = userDoc.data();
            const role = userData.role || 'user';
            const name = userData.name || userData.displayName || user.displayName || null;
            
            // Auto-verify admin emails on auth state change
            if (role === 'admin' && !userData.emailVerified) {
              await setDoc(doc(db, 'users', user.uid), {
                ...userData,
                emailVerified: true
              }, { merge: true });
              console.log('AuthContext - Auto-verified admin email on state change:', user.email);
            }
            
            setUserRole(role);
            setUserName(name);
          } else {
            setUserRole('user');
            setUserName(user.displayName || null);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user');
          setUserName(user.displayName || null);
        }
      } else {
        setUserRole(null);
        setUserName(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userName,
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
