"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  FiArrowUpRight,
  FiShoppingBag,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import { FaWhatsapp } from "react-icons/fa";

import { usePublicStore }
from "../../../context/PublicStoreContext";

import "./store.css";

export default function StorePage() {

  const {store,filteredProducts,sortBy,setSortBy} = usePublicStore();

  const params = useParams();
  const slug = params.slug;

  const [imageIndexes, setImageIndexes] = useState({});

  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";

  const nextImage = (
  e,
  productId,
  imagesLength
) => {

  e.preventDefault();
  e.stopPropagation();

  setImageIndexes((prev) => ({
    ...prev,
    [productId]:
      ((prev[productId] || 0) + 1) %
      imagesLength,
  }));
};

const prevImage = (
  e,
  productId,
  imagesLength
) => {

  e.preventDefault();
  e.stopPropagation();

  setImageIndexes((prev) => ({
    ...prev,
    [productId]:
      ((prev[productId] || 0) - 1 + imagesLength) %
      imagesLength,
  }));
};

  return (
    <div className="store-page">

      {/* HERO */}
      <section className="store-hero">

  <div className="store-hero-content">

    <div className="store-hero-left">

      <div className="store-hero-badge">
        Boutique officielle
      </div>

      <h2>
        {store.name}
      </h2>

      <p>
        {store.bio ||
          "Découvrez nos meilleurs produits avec livraison rapide partout en Tunisie."}
      </p>

    </div>

    {store.hasWhatsapp && (
      <div className="store-hero-right">

        <a
          href={`https://wa.me/216${store.phone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hero-whatsapp-btn"
        >

          <FaWhatsapp size={20}/>

          Contactez sur WhatsApp

        </a>

      </div>
    )}

  </div>

</section>

      {/* PRODUCTS */}
      <section className="store-products-section">

        <div className="store-products-top">

          <div>

            <h3>
              Nos Produits
            </h3>

            <p>
              {filteredProducts.length} produit
              {filteredProducts.length > 1
                ? "s"
                : ""}{" "}
              disponible
              {filteredProducts.length > 1
                ? "s"
                : ""}
            </p>

          </div>

          <div className="store-sort-box">

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value
                )
              }
            >

              <option value="newest">
                Plus récents
              </option>

              <option value="low">
                Prix croissant
              </option>

              <option value="high">
                Prix décroissant
              </option>

            </select>

          </div>

        </div>

        {/* EMPTY */}
        {filteredProducts.length ===
          0 && (
          <div className="store-empty">

            <FiShoppingBag />

            <h3>
              Aucun produit trouvé
            </h3>

            <p>
              Essayez une autre
              recherche.
            </p>

          </div>
        )}

        {/* GRID */}
<div className="store-products-grid">

  {filteredProducts.map((product) => {

    const productUrl = isLocalhost ? `/store/${slug}/product/${product.id}` : `/product/${product.id}`;

    return (

      <Link
        key={product.id}
        href={productUrl}
        className="store-product-card"
      >

        {/* IMAGE */}
        <div className="store-product-image">

          <img
            src={
              product.images?.[
                imageIndexes[product.id] || 0
              ] || "/placeholder.png"
            }
            alt={product.name}
            loading="lazy"
          />

          {product.images?.length > 1 && (

            <>
              <button
                className="product-image-arrow left"
                onClick={(e) =>
                  prevImage(
                    e,
                    product.id,
                    product.images.length
                  )
                }
              >
                <FiChevronLeft />
              </button>

              <button
                className="product-image-arrow right"
                onClick={(e) =>
                  nextImage(
                    e,
                    product.id,
                    product.images.length
                  )
                }
              >
                <FiChevronRight />
              </button>
            </>

          )}

          {product.hasDiscount && (
            <span className="discount-badge">
              Promo
            </span>
          )}

        </div>

        {/* INFO */}
        <div className="store-product-info">

          <div className="store-product-top">

            <h3>
              {product.name}
            </h3>

            <FiArrowUpRight />

          </div>

          <p>
            {product.category ||
              "Produit"}
          </p>

          <div className="store-product-price">

            <span>
              {product.price} TND
            </span>

            {product.hasDiscount && (
              <small>
                {product.oldPrice} TND
              </small>
            )}

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