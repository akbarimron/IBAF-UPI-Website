import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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

  // Login function
  const login = async (email, password) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('AuthContext - Login successful, UID:', userCredential.user.uid);
      
      // Get user role from Firestore with error handling
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
          // Default role if no document exists
          console.log('AuthContext - No Firestore doc, using default role: user');
          setUserRole('user');
        }
      } catch (firestoreError) {
        console.warn('Firestore access error, using default role:', firestoreError);
        // Use default role if Firestore fails (permissions issue)
        setUserRole('user');
      }
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
    } catch (error) {
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
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
