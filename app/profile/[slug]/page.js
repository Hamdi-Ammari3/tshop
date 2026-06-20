"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {collection,query,where,getDocs,doc,getDoc,orderBy} from "firebase/firestore";
import { DB } from "../../../lib/firebaseConfig";
import ProductCard from "../../components/ProductCard";
import ProductSection from "../../components/ProductSection";
import {FiPhone,FiPackage,FiLoader,FiArrowLeft} from "react-icons/fi";
import "./profile.css";

export default function StoreProfilePage() {

  const { slug } = useParams();
  const router = useRouter();

  const [store,setStore] = useState(null);
  const [products,setProducts] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(() => {

    async function loadStore() {

      try {

        const storeRef = doc(DB,"stores",slug);

        const storeSnap = await getDoc(storeRef);

        if (!storeSnap.exists()) {

          setStore(null);

          return;
        }

        const storeData = {
          id: storeSnap.id,
          ...storeSnap.data(),
        };

        setStore(storeData);

        const productsQuery = query(
          collection(DB,"products"),
          where("storeId","==",storeData.id),
          orderBy("createdAt","desc")
        );

        const productsSnap =
          await getDocs(productsQuery);

        const productsData =
          productsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

        setProducts(productsData);

      } catch(error) {

        console.log(error);

      } finally {

        setLoading(false);

      }

    }

    if(slug){

      loadStore();

    }

  }, [slug]);

  if(loading){

    return (
      <div className="profile-loading">

        <FiLoader className="spin-icon"/>

      </div>
    );

  }

  if(!store){

    return (
      <div className="profile-not-found">

        <h2>
          Boutique introuvable
        </h2>

      </div>
    );

  }

  return (

    <main className="store-profile-page">

      {/* TOP */}
      <div className="product-top">

        <button
          //href="/"
          onClick={() => router.back()}
          className="back-store-btn"
        >

          <FiArrowLeft />

          Retour

        </button>

      </div>

      <section className="store-hero">

        {/* CARD */}
        <div className="store-profile-card">

          {/* LOGO */}
          <div className="store-logo-wrapper">

            {store.logo ? (

              <img
                src={store.logo}
                alt={store.name}
                className="store-logo"
              />

            ) : (

              <div className="store-logo-placeholder">

                {store.name?.charAt(0)}

              </div>

            )}

          </div>

          {/* INFO */}
          <div className="store-main-info">

            <h1>
              {store.name}
            </h1>

            <div className="store-stats">

              <div className="store-stat">

                <FiPackage />

                <span>

                  {products.length} produits

                </span>

              </div>

              {store.phone && (

                <div className="store-stat">

                  <FiPhone />

                  <span>
                    {store.phone}
                  </span>

                </div>

              )}

            </div>

          </div>

          {/* ACTIONS */}
          <div className="store-actions">

            {store.hasWhatsapp && (

              <a
                href={`https://wa.me/${store.phone}`}
                target="_blank"
                rel="noreferrer"
                className="whatsapp-btn"
              >

                WhatsApp

              </a>

            )}

          </div>

        </div>

      </section>

      {/* PRODUCTS */}
      <section className="store-products">

        {products.length === 0 ? (

          <div className="empty-products">

            Aucun produit trouvé

          </div>

        ) : (

          <ProductSection
            title="Produits de la boutique"
            products={products}
          />

        )}

      </section>

    </main>

  );

}
