"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

import {
  FiArrowUpRight,
  FiShoppingBag,
  FiStar,
} from "react-icons/fi";

import { FaWhatsapp } from "react-icons/fa";

import { usePublicStore }
from "../../../context/PublicStoreContext";

import "./store.css";

export default function StorePage() {

  const {
    store,
    filteredProducts,
    sortBy,
    setSortBy,
  } = usePublicStore();

  const params = useParams();

  const slug = params.slug;

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

          {filteredProducts.map(
            (product) => (

              <Link
                key={product.id}
                href={`/store/${slug}/product/${product.id}`}
                className="store-product-card"
              >

                {/* IMAGE */}
                <div className="store-product-image">

                  <img
                    src={
                      product
                        .images?.[0] ||
                      "/placeholder.png"
                    }
                    alt={
                      product.name
                    }
                    loading="lazy"
                  />

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
                        {
                          product.oldPrice
                        }{" "}
                        TND
                      </small>
                    )}

                  </div>

                </div>

              </Link>
            )
          )}

        </div>

      </section>

    </div>
  );
}