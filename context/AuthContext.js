"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, DB } from "../lib/firebaseConfig";

const AuthContext = createContext();

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        let unsubDoc = null;

        const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {

            if (unsubDoc) {
                unsubDoc();
                unsubDoc = null;
            }

            if (!firebaseUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            unsubDoc = onSnapshot(
                doc(DB, "users", firebaseUser.uid),
                async (snap) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        setUser({
                            uid: firebaseUser.uid,
                            name: data.name || "",
                            phone: data.phone || "",
                            storeId: data.storeId || null,
                        });
                        setLoading(false);
                    } else {
                        // Doc missing — sign out so user lands on /login cleanly
                        await signOut(auth);
                        // loading + user handled by the !firebaseUser branch above
                    }
                },
                (err) => {
                    console.error("AuthContext user doc error:", err);
                    setLoading(false);
                }
            );
        });

        return () => {
            unsubAuth();
            if (unsubDoc) unsubDoc();
        };

    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}