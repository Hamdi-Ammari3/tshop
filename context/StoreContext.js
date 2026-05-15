"use client";

import {createContext,useContext,useEffect,useState} from "react";
import {doc,getDoc} from "firebase/firestore";
import { DB } from "../lib/firebaseConfig";
import { useAuth } from "./AuthContext";

const StoreContext = createContext();

export function StoreProvider({ children }) {
    const { user } = useAuth();

    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStore() {

            if (!user) {
                setStore(null);
                setLoading(false);
                return;
            }

            try {

                setLoading(true);

                /* USER DOC */
                const userRef = doc(DB,"users",user.uid);

                const userSnap = await getDoc(userRef);

                /* NO USER DOC */
                if (!userSnap.exists()) {
                    setStore(null);
                    return;
                }

                const userData = userSnap.data();

                /* NO STORE */
                if (!userData?.storeId) {
                    setStore(null);
                    return;
                }

                /* STORE DOC */
                const storeRef = doc(DB,"stores",userData.storeId);

                const storeSnap = await getDoc(storeRef);

                if (storeSnap.exists()) {
                    setStore({
                        id: storeSnap.id,
                        ...storeSnap.data(),
                    });
                } else {
                    setStore(null);
                }

            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        }

        fetchStore();

    }, [user]);

    return (
        <StoreContext.Provider value={{store,setStore,loading,setLoading}}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    return useContext(StoreContext);
}