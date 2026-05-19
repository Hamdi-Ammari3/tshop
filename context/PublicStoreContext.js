"use client";
import {createContext,useContext,useEffect,useMemo,useState} from "react";
import {collection,getDocs,query,where,doc,getDoc,orderBy} from "firebase/firestore";
import { DB } from "../lib/firebaseConfig";
const PublicStoreContext = createContext();

export function PublicStoreProvider({slug,children}) {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(!!slug);
  const [storeFetched, setStoreFetched] = useState(false);

  /* FETCH STORE + PRODUCTS */
  useEffect(() => {
    if (!slug) return;

    async function fetchStoreData() {
      try {
        setLoading(true);

        const storeRef = doc(DB, "stores", slug);
        const storeSnap = await getDoc(storeRef);

        if (!storeSnap.exists()) {
          setStore(null);
          setProducts([]);
          return;
        }

        const storeData = {
          id: storeSnap.id,
          ...storeSnap.data(),
        };

        setStore(storeData);

        /* PRODUCTS */
        const productsQuery = query(
          collection(DB, "products"),
          where("storeId","==",storeData.id),
          orderBy("createdAt", "desc"),
        );

        const productsSnapshot = await getDocs(productsQuery);

        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(productsData);

      } catch (error) {
        console.log(error);
        setStore(null);
      } finally {
        setLoading(false);
        setStoreFetched(true);
      }
    }

    fetchStoreData();
  }, [slug]);

  /* LOAD CART */
  useEffect(() => {
    if (!slug) return;

    const savedCart =localStorage.getItem(`cart-${slug}`);

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        setCart([]);
      }
    }
  }, [slug]);

  /* SAVE CART */
  useEffect(() => {
    if (!slug) return;

    localStorage.setItem(`cart-${slug}`,JSON.stringify(cart));

  }, [cart, slug]);

  //Filter products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    /* SEARCH */
    filtered = filtered.filter((product) => product.name ?.toLowerCase().includes(search.toLowerCase()));

    /* SORT */
    if (sortBy === "low") {filtered.sort((a, b) => Number(a.price) - Number(b.price))}
    if (sortBy === "high") {filtered.sort((a, b) => Number(b.price) -Number(a.price))}
    if (sortBy === "newest") {filtered.sort((a, b) => new Date(b.createdAt) -new Date(a.createdAt))}

    return filtered;

  }, [products, search, sortBy]);

  /* CART COUNT */
  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  /* CART TOTAL */
  //const cartTotal = useMemo(() => {
    //return cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
  //}, [cart]);

  /* CART SUBTOTAL */
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
  }, [cart]);

  /* SHIPPING */
  const shippingFee = useMemo(() => {
    if (!cart.length) return 0;
    return Number(store?.shipping_fee || 8);
  }, [store, cart]);

  /* FINAL TOTAL */
  const cartTotal = useMemo(() => {
    return cartSubtotal + shippingFee;
  }, [cartSubtotal, shippingFee]);

  /* ADD TO CART */
  function addToCart(product,qty = 1) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      /* UPDATE */
      if (existing) {
        return prev.map((item) => item.id === product.id ? {...item, quantity: item.quantity + qty} : item)
      }

      /* NEW */
      return [...prev,{...product,quantity: qty}];
    });
  }

  /* REMOVE FROM CART */
  function removeFromCart(id) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  /* UPDATE QUANTITY */
  function updateCartQuantity(id,quantity) {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart((prev) => prev.map((item) => item.id === id ? {...item,quantity} : item));
  }

  /* CLEAR CART */
  function clearCart() {
    setCart([]);
  }

  return (
    <PublicStoreContext.Provider
      value={{
        /* STORE */
        store,
        storeFetched,

        /* PRODUCTS */
        products,
        filteredProducts,

        /* SEARCH */
        search,
        setSearch,

        /* SORT */
        sortBy,
        setSortBy,

        /* LOADING */
        loading,

        /* CART */
        cart,
        cartCount,
        cartSubtotal,
        shippingFee,  
        cartTotal,

        /* ACTIONS */
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
      }}
    >
      {children}
    </PublicStoreContext.Provider>
  );
}

export function usePublicStore() {
  return useContext(PublicStoreContext);
}