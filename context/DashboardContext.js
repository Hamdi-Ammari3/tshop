"use client";

import {createContext,useContext,useEffect,useMemo,useState} from "react";
import {collection,onSnapshot,query,where,orderBy,limit} from "firebase/firestore";
import { DB } from "../lib/firebaseConfig";
import { useStore } from "./StoreContext";
const DashboardContext = createContext();

export function DashboardProvider({ children }) {

  const {store,loading: storeLoading} = useStore();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (storeLoading) {
      return;
    }

    if (!store?.id) {

      setProducts([]);

      setOrders([]);

      setLoading(false);

      return;
    }

    setLoading(true);

    const productsQuery = query(
      collection(DB, "products"),

      where("storeId", "==", store.id),

      orderBy("createdAt", "desc"),

      //limit(20)
    );


    const ordersQuery = query(
      collection(DB, "orders"),

      where("storeId", "==", store.id),

      orderBy("createdAt", "desc"),

      //limit(20)
    );

    const unsubscribeProducts = onSnapshot(
      productsQuery,

      (snapshot) => {

        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(productsData);
      },

      (error) => {
        console.log(error);
      }
    );

    const unsubscribeOrders = onSnapshot(
      ordersQuery,

      (snapshot) => {

        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOrders(ordersData);

        setLoading(false);
      },

      (error) => {

        console.log(error);

        setLoading(false);
      }
    );

    return () => {

      unsubscribeProducts();

      unsubscribeOrders();
    };

  }, [store?.id, storeLoading]);


  /* PENDING ORDERS */
  const pendingOrders = useMemo(() => {

    return orders.filter(
      (o) => o.status === "pending"
    );

  }, [orders]);

  /* COMPLETED ORDERS */
  const completedOrders = useMemo(() => {

    return orders.filter(
      (o) => o.status === "done"
    );

  }, [orders]);

  /* REVENUE */
  const revenue = useMemo(() => {

    return completedOrders.reduce(
      (sum, order) =>
        sum + Number(order.subtotal || 0),

      0
    );

  }, [completedOrders]);

  return (
    <DashboardContext.Provider
      value={{

        /* PRODUCTS */
        products,
        setProducts,

        /* ORDERS */
        orders,
        setOrders,

        /* LOADING */
        loading,

        /* STATS */
        pendingOrders,
        completedOrders,
        revenue,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}