import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          // Force a token refresh to get latest custom claims
          const idTokenResult = await user.getIdTokenResult();
          setIsAdmin(!!idTokenResult.claims.admin);

          // Check for coordinator role
          const coordinatorRef = doc(
            db,
            "putting_league_coordinators",
            user.uid,
          );
          const coordinatorSnap = await getDoc(coordinatorRef);
          setIsCoordinator(coordinatorSnap.exists());

          // Auto-link player profile if needed
          if (user.email) {
            try {
              const q = query(
                collection(db, "putting_league_players"),
                where("email", "==", user.email),
              );
              const pSnap = await getDocs(q);

              if (!pSnap.empty) {
                const pDoc = pSnap.docs[0];
                const pData = pDoc.data();
                if (
                  pData.uid !== user.uid &&
                  (!pData.uid || pData.uid.length === 36)
                ) {
                  await updateDoc(doc(db, "putting_league_players", pDoc.id), {
                    uid: user.uid,
                  });
                }
              } else {
                // Try case-insensitive fallback by fetching all
                const allPlayersSnap = await getDocs(
                  collection(db, "putting_league_players"),
                );
                const pDoc = allPlayersSnap.docs.find(
                  (doc) =>
                    doc.data().email &&
                    doc.data().email.toLowerCase() === user.email.toLowerCase(),
                );
                if (pDoc) {
                  const pData = pDoc.data();
                  if (
                    pData.uid !== user.uid &&
                    (!pData.uid || pData.uid.length === 36)
                  ) {
                    await updateDoc(
                      doc(db, "putting_league_players", pDoc.id),
                      { uid: user.uid },
                    );
                  }
                }
              }
            } catch (err) {
              console.warn("Could not auto-link player profile", err);
            }
          }
        } catch (error) {
          console.error("Error fetching user roles:", error);
          setIsAdmin(false);
          setIsCoordinator(false);
        }
      } else {
        setIsAdmin(false);
        setIsCoordinator(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin,
    isCoordinator,
    login,
    signup,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
