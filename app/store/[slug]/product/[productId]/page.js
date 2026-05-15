"use client";

import { useMemo, useState } from "react";

import { useParams, useRouter }
from "next/navigation";

import Link from "next/link";

import Image from "next/image";

import {
  FiMinus,
  FiPlus,
  FiArrowLeft,
  FiShoppingCart,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
  FiTruck,
} from "react-icons/fi";

import { FaWhatsapp }
from "react-icons/fa";

import { usePublicStore }
from "../../../../../context/PublicStoreContext";

import "./product.css";

export default function ProductPage() {

  const router = useRouter();

  const {
    store,
    products,
    addToCart,
  } = usePublicStore();

  const params = useParams();

  const slug = params.slug;

  const productId =
    params.productId;

  const product = products.find(
    (p) => p.id === productId
  );

  const [selectedIndex,
    setSelectedIndex] =
    useState(0);

  const [quantity,
    setQuantity] =
    useState(1);

  const [ordering,
    setOrdering] =
    useState(false);

  const currentImage =
    product?.images?.[
      selectedIndex
    ] || "/placeholder.png";

  /* TOTAL */
  const totalPrice =
    useMemo(() => {

      if (!product)
        return 0;

      return (
        Number(product.price) *
        quantity
      );

    }, [product, quantity]);

  /* QUANTITY */
  const increaseQty = () => {
    setQuantity((prev) =>
      prev + 1
    );
  };

  const decreaseQty = () => {

    if (quantity <= 1)
      return;

    setQuantity((prev) =>
      prev - 1
    );
  };

  /* IMAGE NEXT */
  const nextImage = () => {

    if (
      !product?.images?.length
    ) return;

    setSelectedIndex((prev) =>
      prev ===
      product.images.length - 1
        ? 0
        : prev + 1
    );
  };

  /* IMAGE PREV */
  const prevImage = () => {

    if (
      !product?.images?.length
    ) return;

    setSelectedIndex((prev) =>
      prev === 0
        ? product.images.length - 1
        : prev - 1
    );
  };

  /* ADD TO CART */
  const handleAddToCart = () => {

    addToCart(
      product,
      quantity
    );
  };

  /* BUY NOW */
  const handleBuyNow =
    async () => {

      try {

        setOrdering(true);

        addToCart(
          product,
          quantity
        );

        router.push(
          `/store/${slug}/checkout`
        );

      } finally {

        setOrdering(false);
      }
    };

  /* NOT FOUND */
  if (!product || !store) {

    return (
      <div className="product-not-found">

        <h1>
          Produit introuvable
        </h1>

        <p>
          Ce produit n'existe pas
          ou a été supprimé.
        </p>

      </div>
    );
  }

  return (
    <div className="product-page">

      {/* TOP */}
      <div className="product-top">

        <Link
          href={`/store/${slug}`}
          className="back-store-btn"
        >

          <FiArrowLeft />

          Retour à la boutique

        </Link>

      </div>

      {/* CONTENT */}
      <div className="product-container">

        {/* LEFT */}
        <div className="product-gallery">

          <div className="product-main-image">

            {product.images?.length >
              1 && (
              <>
                <button
                  className="gallery-arrow left-arrow"
                  onClick={prevImage}
                >
                  <FiChevronLeft />
                </button>

                <button
                  className="gallery-arrow right-arrow"
                  onClick={nextImage}
                >
                  <FiChevronRight />
                </button>
              </>
            )}

            <Image
              src={currentImage}
              alt={product.name}
              fill
              priority
              className="product-main-img"
            />

            {product.hasDiscount && (
              <div className="product-discount-badge">
                Promotion
              </div>
            )}

          </div>

          {/* THUMBNAILS */}
          {product.images?.length >
            1 && (
            <div className="product-thumbnails">

              {product.images.map(
                (img, index) => (

                  <button
                    key={index}
                    className={`thumbnail-btn ${
                      selectedIndex ===
                      index
                        ? "active-thumbnail"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedIndex(
                        index
                      )
                    }
                  >

                    <Image
                      src={img}
                      alt=""
                      fill
                      className="thumbnail-image"
                    />

                  </button>
                )
              )}

            </div>
          )}

        </div>

        {/* RIGHT */}
        <div className="product-details">

          <span className="product-category">
            {product.category ||
              "Produit"}
          </span>

          <h1>
            {product.name}
          </h1>

          <p className="product-description">
            {product.description ||
              "Aucune description disponible pour ce produit."}
          </p>

          {/* PRICE */}
          <div className="product-price-box">

            <div className="product-price">

              <span>
                {product.price} TND
              </span>

              {product.hasDiscount && (
                <small>
                  {product.oldPrice} TND
                </small>
              )}

            </div>

            <p>
              Prix unitaire
            </p>

          </div>

          {/* TRUST */}
          <div className="product-trust-box">

            <div>
              <FiTruck />
              Livraison rapide
            </div>

            <div>
              <FiShield />
              Produit vérifié
            </div>

          </div>

          {/* QUANTITY */}
          <div className="quantity-section">

            <label>
              Quantité
            </label>

            <div className="quantity-box">

              <button
                onClick={
                  decreaseQty
                }
                disabled={
                  quantity <= 1
                }
              >
                <FiMinus />
              </button>

              <span>
                {quantity}
              </span>

              <button
                onClick={
                  increaseQty
                }
              >
                <FiPlus />
              </button>

            </div>

          </div>

          {/* TOTAL */}
          <div className="total-box">

            <span>
              Total
            </span>

            <h3>
              {totalPrice} TND
            </h3>

          </div>

          {/* ACTIONS */}
          <div className="product-actions">

            <button
              className="add-cart-btn"
              onClick={
                handleAddToCart
              }
            >

              <FiShoppingCart />

              Ajouter au panier

            </button>

            <button
              className="buy-now-btn"
              onClick={
                handleBuyNow
              }
              disabled={ordering}
            >

              {ordering
                ? "Chargement..."
                : "Acheter maintenant"}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

/*
          {store.hasWhatsapp && (
            <a
              href={`https://wa.me/216${store.phone}?text=Bonjour, je souhaite commander ${product.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="product-whatsapp-btn"
            >

              <FaWhatsapp />

              Commander sur WhatsApp

            </a>
          )}
*/