"use client";

import Link from "next/link";

import Image from "next/image";

import {
  FiMinus,
  FiPlus,
  FiTrash2,
  FiArrowLeft,
  FiShoppingBag,
  FiShield,
  FiTruck,
} from "react-icons/fi";

import { usePublicStore }
from "../../../../context/PublicStoreContext";

import "./cart.css";

export default function CartPage() {

  const {
    store,
    cart,
    cartSubtotal,
    shippingFee,
    cartTotal,
    updateCartQuantity,
    removeFromCart,
  } = usePublicStore();

  /* EMPTY */
  if (cart.length === 0) {

    return (
      <div className="cart-empty-page">

        <div className="cart-empty-box">

          <div className="cart-empty-icon">
            <FiShoppingBag />
          </div>

          <h1>
            Votre panier est vide
          </h1>

          <p>
            Ajoutez des produits pour continuer vos achats.
          </p>

          <Link
            href="/"
            className="continue-shopping-btn"
          >

            Continuer les achats

          </Link>

        </div>

      </div>
    );
  }

  return (
    <div className="cart-page">

      {/* TOP */}
      <div className="cart-top">

        <Link
          href="/"
          className="back-store-btn"
        >

          <FiArrowLeft />

          Retour à la boutique

        </Link>

        <div>

          <h1>
            Panier
          </h1>

          <p>
            {cart.length} produit
            {cart.length > 1
              ? "s"
              : ""}{" "}
            dans votre panier
          </p>

        </div>

      </div>

      {/* LAYOUT */}
      <div className="cart-layout">

        {/* ITEMS */}
        <div className="cart-items">

          {cart.map((item) => {

            const unitPrice =
              Number(item.price);

            const total =
              unitPrice *
              item.quantity;

            return (
              <div
                key={item.id}
                className="cart-item-card"
              >

                {/* IMAGE */}
                <Link
                  href={`/product/${item.id}`}
                  className="cart-item-image"
                >

                  <Image
                    src={
                      item.images?.[0] ||
                      "/placeholder.png"
                    }
                    alt={item.name}
                    fill
                    className="cart-image"
                  />

                </Link>

                {/* INFO */}
                <div className="cart-item-info">

                  <div className="cart-item-top">

                    <div>

                      <h3>
                        {item.name}
                      </h3>

                      <p>
                        {item.category ||
                          "Produit"}
                      </p>

                    </div>

                    <button
                      className="remove-cart-btn"
                      onClick={() =>
                        removeFromCart(
                          item.id
                        )
                      }
                    >

                      <FiTrash2 />

                    </button>

                  </div>

                  {/* PRICE */}
                  <div className="cart-price-row">

                    <div className="cart-unit-price">

                      <span>
                        {item.price} TND
                      </span>

                      {item.hasDiscount && (
                        <small>
                          {item.oldPrice} TND
                        </small>
                      )}

                    </div>

                    {/* QUANTITY */}
                    <div className="cart-quantity-box">

                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.id,
                            item.quantity - 1
                          )
                        }
                        disabled={
                          item.quantity === 1
                        }
                      >

                        <FiMinus />

                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.id,
                            item.quantity + 1
                          )
                        }
                      >

                        <FiPlus />

                      </button>

                    </div>

                  </div>

                  {/* TOTAL */}
                  <div className="cart-item-total">

                    <span>
                      Total
                    </span>

                    <h4>
                      {total} TND
                    </h4>

                  </div>

                </div>

              </div>
            );
          })}

        </div>

        {/* SUMMARY */}
        <div className="cart-summary">

          <div className="summary-card">

            <h3>
              Résumé de la commande
            </h3>

            {/* TRUST */}
            <div className="summary-trust">

              <div>
                <FiTruck />
                Livraison rapide
              </div>

              <div>
                <FiShield />
                Paiement à la livraison
              </div>

            </div>

            {/* ROW */}
            <div className="summary-row">

              <span>
                Sous-total
              </span>

              <strong>
                {cartSubtotal} TND
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Livraison
              </span>

              <strong>
                {shippingFee} TND
              </strong>

            </div>

            <div className="summary-divider"></div>

            {/* TOTAL */}
            <div className="summary-total">

              <span>
                Total
              </span>

              <h2>
                {cartTotal} TND
              </h2>

            </div>

            {/* CHECKOUT */}
            <Link
              href="/checkout"
              className="checkout-btn"
            >

              Passer à la commande

            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}