import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase"; // Ensure firebase is set up
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Create AuthContext
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setRole(userSnap.data().role);
          } else {
            console.warn("User document not found in Firestore");
            setRole("pending"); // Mark role as "pending" instead of null
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
        }
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);