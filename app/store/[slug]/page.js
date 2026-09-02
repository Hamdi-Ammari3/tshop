"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FiArrowUpRight, FiShoppingBag, FiStar, FiChevronLeft, FiChevronRight,
  FiPhone, FiTruck, FiShield, FiRotateCcw, FiHeadphones, FiMapPin,
  FiPackage, FiShoppingCart,FiCheckCircle
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { usePublicStore } from "../../../context/PublicStoreContext";
import { useMarketplaceCart } from "../../../context/MarketplaceCartContext";
import "./store.css";

export default function StorePage() {
  const { store, filteredProducts, sortBy, setSortBy } = usePublicStore();
  const { addToCart } = useMarketplaceCart();

  const params = useParams();
  const slug = params.slug;

  const [imageIndexes, setImageIndexes] = useState({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";

  const categories = useMemo(
    () => Array.from(new Set(filteredProducts.map((p) => p.category).filter(Boolean))),
    [filteredProducts]
  );

  /*
  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return filteredProducts.filter((p) => {
      const matchCat = category === "all" || p.category === category;
      const matchQ = !q || p.name.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [filteredProducts, query, category]);
  */

  const visibleProducts = useMemo(() => {
    if (category === "all") return filteredProducts;
    return filteredProducts.filter((p) => p.category === category);
}, [filteredProducts, category]);

  const nextImage = (e, productId, imagesLength) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndexes((prev) => ({
      ...prev,
      [productId]: ((prev[productId] || 0) + 1) % imagesLength,
    }));
  };

  const prevImage = (e, productId, imagesLength) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndexes((prev) => ({
      ...prev,
      [productId]: ((prev[productId] || 0) - 1 + imagesLength) % imagesLength,
    }));
  };

  const handleQuickAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.hasVariants) return; // shouldn't happen — button is hidden for these
    addToCart(
      {
        ...product,
        cartItemId: `${product.id}--no-lot`,
        selectedVariant: null,
        selectedOptions: {},
        selectedLot: null,
        finalPrice: product.price,
      },
      1
    );
  };

  return (
    <div className="store-page">

      {/* HERO */}
      <section className="store-hero">
        <div className="store-hero-glow" />
        <div className="store-hero-inner">
          <span className="store-hero-badge">
            <FiStar size={13} /> Boutique officielle · Tunisie
          </span>

          <h1 className="store-hero-title">Bienvenue chez {store.name}</h1>

          <p className="store-hero-desc">
            {store.bio || "Découvrez nos meilleurs produits avec livraison rapide partout en Tunisie."}
          </p>

          <div className="store-hero-actions">
            {/**
             <a href="#produits" className="store-hero-btn-primary">Voir les produits</a>
            */}
            
            {store.phone && (
              <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="store-hero-btn-secondary">
                <FiPhone size={16} /> Appeler
              </a>
            )}

            {store.hasWhatsapp && (
              <a
                href={`https://wa.me/216${store.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="store-hero-btn-whatsapp"
              >
                <FaWhatsapp size={16} /> WhatsApp
              </a>
            )}
          </div>

          <div className="store-hero-meta">
            <span><FiPackage size={13} /> {filteredProducts.length} produits en ligne</span>
            
            {/*
            <span><FiMapPin size={13} /> Livraison partout en Tunisie</span>
            */}
            
            {store.phone && <span><FiPhone size={13} /> {store.phone}</span>}
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="store-trust-bar">
        <div className="store-trust-track">
          <div className="store-trust-set">
            <div className="store-trust-item">
              <span className="store-trust-icon"><FiTruck size={16} /></span>
              <div>
                <p>Livraison 24–72 h</p>
                <span>Toute la Tunisie</span>
              </div>
            </div>

            <div className="store-trust-item">
              <span className="store-trust-icon"><FiShield size={16} /></span>
              <div>
                <p>Paiement à la livraison</p>
                <span>Payez à la réception</span>
              </div>
            </div>

            <div className="store-trust-item">
              <span className="store-trust-icon"><FiCheckCircle size={16} /></span>
              <div>
                <p>Produits vérifiés</p>
                <span>Qualité contrôlée</span>
              </div>
            </div>

            <div className="store-trust-item">
              <span className="store-trust-icon"><FiHeadphones size={16} /></span>
              <div>
                <p>Support direct</p>
                <span>Appel &amp; WhatsApp</span>
              </div>
            </div>
        </div>

        <div className="store-trust-set" aria-hidden="true">
          <div className="store-trust-item">
            <span className="store-trust-icon"><FiTruck size={16} /></span>
            <div>
              <p>Livraison 24–72 h</p>
              <span>Toute la Tunisie</span>
            </div>
          </div>

          <div className="store-trust-item">
            <span className="store-trust-icon"><FiShield size={16} /></span>
            <div>
              <p>Paiement à la livraison</p>
              <span>Payez à la réception</span>
            </div>
          </div>

          <div className="store-trust-item">
            <span className="store-trust-icon"><FiCheckCircle size={16} /></span>
            <div>
              <p>Produits vérifiés</p>
              <span>Qualité contrôlée</span>
            </div>
          </div>

          <div className="store-trust-item">
            <span className="store-trust-icon"><FiHeadphones size={16} /></span>
            <div>
              <p>Support direct</p>
              <span>Appel &amp; WhatsApp</span>
            </div>
          </div>
        </div>
    </div>
</div>

      {/* PRODUCTS */}
      <section className="store-products-section" id="produits">

        <div className="store-products-top">
          <div>
            <h2>Nos produits</h2>
            <p>
              {visibleProducts.length} produit{visibleProducts.length > 1 ? "s" : ""} disponible
              {visibleProducts.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="store-controls-row">
            <div className="store-sort-box">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Plus récents</option>
                <option value="low">Prix croissant</option>
                <option value="high">Prix décroissant</option>
              </select>
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="store-category-chips">
            <button
              className={`store-chip ${category === "all" ? "store-chip-active" : ""}`}
              onClick={() => setCategory("all")}
            >
              Tout
            </button>
            {categories.map((c) => (
              <button
                key={c}
                className={`store-chip ${category === c ? "store-chip-active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* EMPTY */}
        {visibleProducts.length === 0 && (
          <div className="store-empty">
            <FiShoppingBag />
            <h3>Aucun produit trouvé</h3>
            <p>Essayez une autre recherche.</p>
          </div>
        )}

        {/* GRID */}
        <div className="store-products-grid">
          {visibleProducts.map((product) => {
            const productUrl = isLocalhost
              ? `/store/${slug}/product/${product.id}`
              : `/product/${product.id}`;

            const isOutOfStock = product.trackInventory && Number(product.inventory || 0) <= 0;

            return (
              <Link key={product.id} href={productUrl} className="store-product-card">

                {/* IMAGE */}
                <div className="store-product-image">
                  <img
                    src={product.images?.[imageIndexes[product.id] || 0] || "/placeholder.png"}
                    alt={product.name}
                    loading="lazy"
                  />

                  {product.images?.length > 1 && (
                    <>
                      <button
                        className="product-image-arrow left"
                        onClick={(e) => prevImage(e, product.id, product.images.length)}
                        aria-label="Image précédente"
                      >
                        <FiChevronLeft />
                      </button>
                      <button
                        className="product-image-arrow right"
                        onClick={(e) => nextImage(e, product.id, product.images.length)}
                        aria-label="Image suivante"
                      >
                        <FiChevronRight />
                      </button>
                    </>
                  )}

                  {product.hasDiscount && (
                    <span className="discount-badge">
                      -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                    </span>
                  )}

                  {isOutOfStock && <span className="store-oos-badge">Rupture</span>}
                </div>

                {/* INFO */}
                <div className="store-product-info">
                  <div className="store-product-top">
                    <h3>{product.name}</h3>
                    <FiArrowUpRight />
                  </div>

                  <p>{product.category || "Produit"}</p>

                  <div className="store-product-bottom">
                    <div>
                      <div className="store-product-price">
                        <span>{product.price} TND</span>
                        {product.hasDiscount && <small>{product.oldPrice} TND</small>}
                      </div>
                      {/* 
                      {product.trackInventory && (
                        <p className="store-product-stock">
                          {isOutOfStock ? "Indisponible" : `${product.inventory} en stock`}
                        </p>
                      )}
                      */}
                    </div>

                    {/* 
                    {!product.hasVariants && (
                      <button
                        className="store-quickadd-btn"
                        disabled={isOutOfStock}
                        aria-label="Ajouter au panier"
                        onClick={(e) => handleQuickAdd(e, product)}
                      >
                        <FiShoppingCart size={15} />
                      </button>
                    )}
                    */}
                  </div>
                </div>

              </Link>
            );
          })}
        </div>

      </section>

    </div>
  );
}