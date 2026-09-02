"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { DB } from "../../../lib/firebaseConfig";
import ProductSection from "../../components/ProductSection";
import {
  FiPhone,
  FiPackage,
  FiLoader,
  FiChevronRight,
  FiMessageCircle,
  FiMapPin,
  FiStar,
  FiUsers,
  FiHeart,
  FiShare2,
  FiCheckCircle,
  FiShield,
  FiTruck,
  FiClock,
} from "react-icons/fi";
import "./profile.css";

export default function StoreProfilePage() {
  const { slug } = useParams();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    async function loadStore() {
      try {
        const storeRef = doc(DB, "stores", slug);

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
          collection(DB, "products"),
          where("storeId", "==", storeData.id),
          orderBy("createdAt", "desc")
        );

        const productsSnap = await getDocs(productsQuery);

        const productsData = productsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(productsData);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadStore();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="profile-loading">
        <FiLoader className="spin-icon" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="profile-not-found">
        <h2>Boutique introuvable</h2>
      </div>
    );
  }

  const initials = store.name
    ?.split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="store-profile-page">
      {/* BREADCRUMB */}
      <div className="breadcrumb-bar">
        <nav className="breadcrumb-nav">
          <Link href="/">Accueil</Link>
          <FiChevronRight size={14} />
          <span>Boutiques</span>
          <FiChevronRight size={14} />
          <span className="breadcrumb-current">{store.name}</span>
        </nav>
      </div>

      {/* HERO */}
      <section className="store-hero">
        <div className="store-hero-blob blob-1" />
        <div className="store-hero-blob blob-2" />

        <div className="store-hero-inner">
          <div className="store-hero-main">
            {/* LOGO */}
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="store-logo" />
            ) : (
              <div className="store-logo-placeholder">{initials}</div>
            )}

            <div className="store-hero-info">
              <div className="store-name-row">
                <h1>{store.name}</h1>
                {store.verified && (
                  <span className="verified-chip">
                    <FiCheckCircle size={13} /> Vérifié
                  </span>
                )}
              </div>

              {store.tagline && <p className="store-tagline">{store.tagline}</p>}

              <div className="store-stats-row">

                {/* 
                {store.rating && (
                  <span className="stat-item stat-rating">
                    <FiStar size={15} />
                    {Number(store.rating).toFixed(1)}
                    {store.reviews && <span className="stat-muted"> ({store.reviews} avis)</span>}
                  </span>
                )}
                */}

                <span className="stat-item">
                  <FiPackage size={15} />
                  {products.length} produits
                </span>

              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="store-hero-actions">
            {store.phone && (
              <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="hero-btn hero-btn-primary">
                <FiPhone size={15} /> Appeler
              </a>
            )}

            {store.hasWhatsapp && (
              <a
                href={`https://wa.me/${store.phone?.replace(/\s/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="hero-btn hero-btn-whatsapp"
              >
                <FiMessageCircle size={15} /> WhatsApp
              </a>
            )}

            <button aria-label="Partager" className="hero-icon-btn">
              <FiShare2 size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="trust-bar">
        <div className="trust-bar-inner">
          <div className="trust-item">
            <div className="trust-icon">
              <FiShield size={16} />
            </div>
            <div>
              <p className="trust-label">Vendeur vérifié</p>
              <p className="trust-value">Identité confirmée</p>
            </div>
          </div>

          {store.responseRate && (
            <div className="trust-item">
              <div className="trust-icon">
                <FiClock size={16} />
              </div>
              <div>
                <p className="trust-label">Taux de réponse</p>
                <p className="trust-value">{store.responseRate}%</p>
              </div>
            </div>
          )}

          <div className="trust-item">
            <div className="trust-icon">
              <FiTruck size={16} />
            </div>
            <div>
              <p className="trust-label">Livraison</p>
              <p className="trust-value">Toute la Tunisie</p>
            </div>
          </div>

          {store.founded && (
            <div className="trust-item">
              <div className="trust-icon">
                <FiPackage size={16} />
              </div>
              <div>
                <p className="trust-label">Sur T-Shop depuis</p>
                <p className="trust-value">{store.founded}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRODUCTS */}
      <section className="store-products">
        {products.length === 0 ? (
          <div className="empty-products">Aucun produit trouvé</div>
        ) : (
          <ProductSection title="Produits de la boutique" products={products} />
        )}
      </section>
    </main>
  );
}