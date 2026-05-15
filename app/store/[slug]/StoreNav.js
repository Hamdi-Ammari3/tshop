"use client";

import {
  useState,
  useEffect,
} from "react";

import Link from "next/link";

import {
  FiSearch,
  FiShoppingCart,
} from "react-icons/fi";

import { usePublicStore }
from "../../../context/PublicStoreContext";

import StoreLoading from "./StoreLoading";

export default function StoreShell({
  children,
}) {

  const {
    store,
    cartCount,
    search,
    setSearch,
    loading,
    storeFetched,
  } = usePublicStore();

  const [showContent,
    setShowContent] =
    useState(false);

  useEffect(() => {

    if (
      !loading &&
      storeFetched
    ) {

      const timer =
        setTimeout(() => {

          setShowContent(
            true
          );

        }, 120);

      return () =>
        clearTimeout(timer);
    }

  }, [
    loading,
    storeFetched,
  ]);

  /* LOADING */
  if (
    loading ||
    !storeFetched ||
    !showContent
  ) {
    return <StoreLoading />;
  }

  /* NOT FOUND */
  if (
    storeFetched &&
    !store
  ) {
    return (
      <div className="store-not-found">

        <h1>
          Boutique introuvable
        </h1>

        <p>
          Cette boutique
          n'existe pas ou a
          été supprimée.
        </p>

      </div>
    );
  }

  return (
    <div className="store-site-layout">

      {/* NAVBAR */}
      <header className="store-navbar">

        <div className="store-navbar-left">

          <Link
            href={`/store/${store.slug}`}
            className="store-brand"
          >

            <div className="store-brand-logo">

              {store.logo ? (
                <img
                  src={store.logo}
                  alt={store.name}
                />
              ) : (
                store.name?.[0]
              )}

            </div>

            <div className="store-brand-info">

              <h1>
                {store.name}
              </h1>

              <p>
                {store.bio}
              </p>

            </div>

          </Link>

        </div>

        {/* SEARCH */}
        <div className="store-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        {/* CART */}
        <div className="store-navbar-actions">

          <Link
            href={`/store/${store.slug}/cart`}
            className="store-cart-btn"
          >

            <FiShoppingCart />

            {cartCount > 0 && (
              <span>
                {cartCount}
              </span>
            )}

          </Link>

        </div>

      </header>

      {/* PAGE */}
      <main className="store-main-content">
        {children}
      </main>

    </div>
  );
}