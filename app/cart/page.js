"use client";

import Link from "next/link";
import Image from "next/image";
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag,FiChevronRight,FiShield, FiTruck, FiRotateCcw, FiTag} from "react-icons/fi";
import { useMarketplaceCart } from "../../context/MarketplaceCartContext";
import "./cart.css";

/* ─── HELPERS ─────────────────────────────────────────── */

function computeDiscount(item) {
    if (item.selectedLot) return 0;
    const oldPrice = item.selectedVariant?.oldPrice || item.oldPrice;
    if (!oldPrice || oldPrice <= item.finalPrice) return 0;
    return Math.round(((oldPrice - item.finalPrice) / oldPrice) * 100);
}

/* ─── CART ITEM ROW ───────────────────────────────────── */

function CartItemRow({ item, onUpdateQuantity, onRemove }) {
    const unitPrice = Number(item.finalPrice || 0);
    const total = item.selectedLot ? unitPrice : unitPrice * item.quantity;
    const activeInventory = item.selectedVariant?.inventory ?? item.inventory;
    const maxQuantity = item.trackInventory ? Number(activeInventory || 0) : Infinity;
    const discount = computeDiscount(item);
    const oldPrice = item.selectedVariant?.oldPrice || item.oldPrice;

    return (
        <li className="ct-row">
            <Link href={`/product/${item.id}`} className="ct-row-img">
                <Image
                    src={item.selectedVariant?.image || item.images?.[0] || "/placeholder.png"}
                    alt={item.name}
                    fill
                    className="ct-row-img-el"
                />
                {discount > 0 && <span className="ct-discount-badge">-{discount}%</span>}
            </Link>

            <div className="ct-row-body">
                <div className="ct-row-top">
                    <div className="ct-row-info">
                        <Link href={`/product/${item.id}`} className="ct-row-name">
                            {item.name}
                        </Link>
                        <p className="ct-row-store">{item.storeName || "Store"}</p>

                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                            <div className="ct-variants">
                                {Object.entries(item.selectedOptions).map(([key, value]) => (
                                    <span key={key} className="ct-variant-chip">
                                        {key}: <strong>{value}</strong>
                                    </span>
                                ))}
                            </div>
                        )}

                        {item.selectedLot && (
                            <span className="ct-lot-chip">Lot de {item.selectedLot.quantity} pièces</span>
                        )}

                        {item.trackInventory && (
                            <div className="ct-stock">
                                {activeInventory > 0 ? (
                                    <span className="ct-stock-ok">
                                        <span className="ct-dot ct-dot-ok" />
                                        {activeInventory} disponible{activeInventory > 1 ? "s" : ""}
                                    </span>
                                ) : (
                                    <span className="ct-stock-empty">
                                        <span className="ct-dot ct-dot-empty" />
                                        Rupture de stock
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        className="ct-remove-btn"
                        onClick={() => onRemove(item.cartItemId)}
                        aria-label="Retirer du panier"
                    >
                        <FiTrash2 size={16} />
                    </button>
                </div>

                <div className="ct-row-bottom">
                    <div className="ct-qty-box">
                        <button
                            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                            disabled={item.quantity === 1 || item.selectedLot}
                            aria-label="Diminuer"
                        >
                            <FiMinus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                            disabled={item.selectedLot || (item.trackInventory && item.quantity >= maxQuantity)}
                            aria-label="Augmenter"
                        >
                            <FiPlus size={14} />
                        </button>
                    </div>

                    <div className="ct-price-block">
                        {!item.selectedLot && (
                            <span className="ct-unit-price">{unitPrice} TND × {item.quantity}</span>
                        )}
                        <div className="ct-total-line">
                            {!item.selectedLot && oldPrice && oldPrice > unitPrice && (
                                <span className="ct-old-price">{(oldPrice * item.quantity).toFixed(2)} TND</span>
                            )}
                            <span className="ct-total-price">{total} TND</span>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
}

/* ─── EMPTY STATE ─────────────────────────────────────── */

function EmptyCart() {
    return (
        <div className="ct-empty">
            <div className="ct-empty-icon"><FiShoppingBag size={26} /></div>
            <h2>Votre panier est vide</h2>
            <p>Ajoutez des produits pour continuer vos achats.</p>
            <Link href="/" className="ct-btn-primary-full">
                Continuer les achats
            </Link>
        </div>
    );
}

/* ─── PAGE ────────────────────────────────────────────── */

export default function CartPage() {
    const {
        cart, cartSubtotal, shippingFee, cartTotal,
        updateCartQuantity, removeFromCart,
    } = useMarketplaceCart();

    const savings = cart.reduce((sum, item) => {
        if (item.selectedLot) return sum;
        const oldPrice = item.selectedVariant?.oldPrice || item.oldPrice;
        if (!oldPrice || oldPrice <= item.finalPrice) return sum;
        return sum + (oldPrice - item.finalPrice) * item.quantity;
    }, 0);

    if (cart.length === 0) {
        return (
            <div className="ct-page">
                <EmptyCart />
            </div>
        );
    }

    return (
        <div className="ct-page">

          {/* BREADCRUMB */}
            <nav className="ct-breadcrumb">
              <Link href="/" className="ct-breadcrumb-link">Accueil</Link>
              <FiChevronRight size={13} />
              <span className="ct-breadcrumb-current">Panier</span>
            </nav>

          {/* TITLE */}
          <div className="ct-title-row">
            <h1 className="ct-title">
              Panier
              <span className="ct-item-count">
                ({cart.length} produit{cart.length > 1 ? "s" : ""})
              </span>
            </h1>
          </div>

            {/* LAYOUT */}
            <div className="ct-layout">

                {/* ITEMS */}
                <section className="ct-items-col">
                    <div className="ct-items-card">
                        <div className="ct-items-header">
                            <p>{cart.length} produit{cart.length > 1 ? "s" : ""} dans le panier</p>
                            <Link href="/" className="ct-continue-link">
                                Continuer mes achats →
                            </Link>
                        </div>
                        <ul className="ct-items-list">
                            {cart.map((item) => (
                                <CartItemRow
                                    key={item.cartItemId}
                                    item={item}
                                    onUpdateQuantity={updateCartQuantity}
                                    onRemove={removeFromCart}
                                />
                            ))}
                        </ul>
                    </div>

                    <div className="ct-trust-strip">
                        <span><FiTruck size={15} /> Livraison rapide</span>
                        <span><FiShield size={15} /> Paiement sécurisé</span>
                    </div>
                </section>

                {/* SUMMARY */}
                <aside className="ct-summary-col">
                    <div className="ct-summary-card">
                        <h3>Résumé de la commande</h3>

                        <div className="ct-summary-trust">
                            <div><FiTruck size={14} /> Livraison rapide</div>
                            <div><FiShield size={14} /> Paiement à la livraison</div>
                        </div>

                        <dl className="ct-summary-rows">
                            <div className="ct-summary-row">
                                <dt>Sous-total</dt>
                                <dd>{cartSubtotal} TND</dd>
                            </div>
                            {savings > 0 && (
                                <div className="ct-summary-row ct-summary-row-savings">
                                    <dt><FiTag size={13} /> Économies</dt>
                                    <dd>-{savings.toFixed(2)} TND</dd>
                                </div>
                            )}
                            <div className="ct-summary-row">
                                <dt>Livraison</dt>
                                <dd>{shippingFee > 0 ? `${shippingFee} TND` : "Gratuite"}</dd>
                            </div>
                        </dl>

                        <div className="ct-summary-divider" />

                        <div className="ct-summary-total">
                            <span>Total</span>
                            <h2>{cartTotal} TND</h2>
                        </div>

                        <Link href="/checkout" className="ct-btn-primary-full">
                          Passer à la caisse
                        </Link>
                    </div>
                </aside>

            </div>
        </div>
    );
}