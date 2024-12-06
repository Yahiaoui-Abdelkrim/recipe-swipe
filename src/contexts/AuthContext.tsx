'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to create/update user document in Firestore
  const createOrUpdateUser = async (user: User) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    const userData = {
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      lastLoginAt: serverTimestamp(),
    };

    if (!userSnap.exists()) {
      // Create new user document
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
      });
    } else {
      // Update existing user document
      await setDoc(userRef, userData, { merge: true });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await createOrUpdateUser(user);
        } catch (error) {
          console.error('Error updating user document:', error);
        }
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await Promise.all([
        sendEmailVerification(userCredential.user),
        createOrUpdateUser(userCredential.user)
      ]);
    }
  };

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await createOrUpdateUser(userCredential.user);
  };

  const signInWithGoogle = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    await createOrUpdateUser(userCredential.user);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const sendVerificationEmail = async () => {
    if (user) {
      await sendEmailVerification(user);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    sendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
