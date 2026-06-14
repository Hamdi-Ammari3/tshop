"use client";

import Link from "next/link";
import Image from "next/image";
import {FiMinus,FiPlus,FiTrash2,FiArrowLeft,FiShoppingBag,FiShield,FiTruck} from "react-icons/fi";
import {useMarketplaceCart} from '../../context/MarketplaceCartContext';
import "./cart.css";

export default function CartPage() {

  const {cart,cartSubtotal,shippingFee,cartTotal,updateCartQuantity,removeFromCart} = useMarketplaceCart();

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
            //href="/store/hamdi-store"
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
          //href="/store/hamdi-store"
          className="back-store-btn"
        >

          <FiArrowLeft />

          Retour

        </Link>

        <div>

          <h1>
            Panier
          </h1>

          <p>{cart.length} produit{cart.length > 1? "s": ""}{" "} dans votre panier</p>

        </div>

      </div>

      {/* LAYOUT */}
      <div className="cart-layout">

        {/* ITEMS */}
        <div className="cart-items">

          {cart.map((item) => {

            const unitPrice = Number(item.finalPrice || 0);

            const total = item.selectedLot ? Number(item.finalPrice || 0) : Number(item.finalPrice || 0) * item.quantity;

            const activeInventory = item.selectedVariant?.inventory ?? item.inventory;

            const maxQuantity = item.trackInventory ? Number(activeInventory || 0) : Infinity;

            return (
              <div
                key={item.id}
                className="cart-item-card"
              >

                {/* IMAGE */}
                <Link
                  href={`/product/${item.id}`}
                  //href={`/store/${store.slug}/product/${item.id}`}
                  className="cart-item-image"
                >

                  <Image
                    src={
                      item.selectedVariant?.image ||
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
                        {item.storeName || "Store"}
                      </p>

                      {/* VARIANTS */}
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (

                        <div className="cart-variants-list">

                          {Object.entries(item.selectedOptions).map(([key, value]) => (

                            <div
                              key={key}
                              className="cart-variant-item"
                            >

                              <span>
                                {key}
                              </span>

                              <strong>
                                {value}
                              </strong>

                            </div>

                          ))}

                        </div>

                      )}

                      {/* LOT */}
                      {item.selectedLot && (

                        <div className="cart-lot-badge">

                          Lot de{" "}{item.selectedLot.quantity} pièces

                        </div>

                      )}

                      {/* STOCK */}
                      {item.trackInventory && (

                        <div className="cart-stock-info">

                          {activeInventory > 0 ? (

                            <span className="cart-stock-available">

                              {activeInventory} disponible{activeInventory > 1 ? "s" : ""}

                            </span>

                          ) : (

                            <span className="cart-stock-empty">

                              Rupture de stock

                            </span>

                          )}

                        </div>

                      )}

                    </div>

                    <button
                      className="remove-cart-btn"
                      onClick={() => removeFromCart(item.cartItemId)}
                    >

                      <FiTrash2 />

                    </button>

                  </div>

                  {/* PRICE */}
                  <div className="cart-price-row">

                    <div className="cart-unit-price">

                      <span>

                        {item.selectedLot ? `${item.finalPrice} TND` : `${item.finalPrice} TND`}

                      </span>

                      {!item.selectedLot && item.selectedVariant?.oldPrice && (

                        <small>

                          {item.selectedVariant.oldPrice} TND

                        </small>

                      )}

                      {!item.selectedLot && !item.selectedVariant && item.oldPrice && (

                        <small>

                          {item.oldPrice} TND

                        </small>

                      )}

                    </div>

                    {/* QUANTITY */}
                    <div className="cart-quantity-box">

                      <button
                        onClick={() => updateCartQuantity(item.cartItemId,item.quantity - 1)}
                        disabled={item.quantity === 1 || item.selectedLot}
                      >

                        <FiMinus />

                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => updateCartQuantity(item.cartItemId,item.quantity + 1)}
                        disabled={item.selectedLot || (item.trackInventory && item.quantity >= maxQuantity)}
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
              //href="http://localhost:3000/store/hamdi-store/checkout"
              className="checkout-btn"
            >

              Passer à la caisse

            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}