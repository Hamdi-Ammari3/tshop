"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FiSearch, FiShoppingCart, FiPhone, FiGlobe, FiLoader } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { usePublicStore } from "../../../context/PublicStoreContext";
import "./store.css";

export default function StoreShell({ children }) {
  const { store, cartCount, search, setSearch, loading, storeFetched } = usePublicStore();
  const params = useParams();
  const slug = params.slug;

  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!loading && storeFetched) {
      const timer = setTimeout(() => setShowContent(true), 120);
      return () => clearTimeout(timer);
    }
  }, [loading, storeFetched]);

  /* LOADING */
  if (loading || !storeFetched || !showContent) {
    return (
      <div className="store-not-found">
        <FiLoader className="spin-icon" />
      </div>
    );
  }

  /* NOT FOUND */
  if (storeFetched && !store) {
    return (
      <div className="store-not-found">
        <h1>Boutique introuvable</h1>
        <p>Cette boutique n'existe pas ou a été supprimée.</p>
      </div>
    );
  }

  const domain = typeof window !== "undefined" ? window.location.host : "";
  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
  const homeUrl = isLocalhost ? `/store/${slug}` : "/";
  const cartUrl = isLocalhost ? `/store/${slug}/cart` : "/cart";

  return (
    <div className="store-site-layout">

      <header className="store-navbar">

        <div className="store-navbar-inner">

          <Link href={homeUrl} className="store-brand">
            <div className="store-brand-logo">
              {store.logo ? (
                <img src={store.logo} alt={store.name} />
              ) : (
                store.name?.[0]
              )}
            </div>
            <div className="store-brand-info">
              <p className="store-brand-name">{store.name}</p>
              {domain && (
                <p className="store-brand-domain">
                  <FiGlobe size={11} /> {domain}
                </p>
              )}
            </div>
          </Link>

          <div className="store-search-desktop">
            <FiSearch size={15} />
            <input
              type="text"
              placeholder="Rechercher un produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="store-navbar-actions">
            <Link href={cartUrl} className="store-cart-btn" aria-label="Panier">
              <FiShoppingCart size={18} />
              {cartCount > 0 && <span>{cartCount}</span>}
            </Link>
          </div>

        </div>

        {/* MOBILE SEARCH */}
        <div className="store-search-mobile">
          <FiSearch size={15} />
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

      </header>

      {/* PAGE */}
      <main className="store-main-content">
        {children}
      </main>

    </div>
  );
}