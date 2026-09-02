"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "../../context/StoreContext";
import { useDashboard } from "../../context/DashboardContext";
import { useRouter } from "next/navigation";
import {
    FiBox, FiExternalLink, FiCopy, FiCheck, FiShoppingBag,
    FiDollarSign, FiPlus, FiPhone, FiLogOut, FiAlertCircle,
    FiClock, FiTrendingUp, FiZap, FiArrowUpRight, FiUsers,
    FiStar, FiLoader, FiChevronRight, FiGlobe,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import "./dashboard.css";

const STATUS_LABEL = {
    "en-attente": "En attente",
    confirmee:    "Confirmée",
    expediee:     "Expédiée",
    livree:       "Livrée",
    annulee:      "Annulée",
};

const STATUS_CLASS = {
    "en-attente": "ds-badge-amber",
    confirmee:    "ds-badge-blue",
    expediee:     "ds-badge-purple",
    livree:       "ds-badge-green",
    annulee:      "ds-badge-gray",
};

// Same mapping used on the orders dashboard page — derives the 5-state
// display status from the real order.status / order.shippingStatus fields.
function getDisplayStatus(order) {
    if (order.status === "cancelled") return "annulee";
    if (order.status === "pending") return "en-attente";
    if (order.shippingStatus === "livree") return "livree";
    if (order.shippingStatus === "expediee") return "expediee";
    return "confirmee";
}

function orderCreatedAtMs(order) {
    if (!order?.createdAt) return 0;
    return order.createdAt?.toDate ? order.createdAt.toDate().getTime() : new Date(order.createdAt).getTime();
}

function orderItemsSummary(order) {
    const items = order.items || [];
    if (items.length === 0) return "Commande";
    if (items.length === 1) {
        return `${items[0].quantity}× ${items[0].productName}`;
    }
    return `${items[0].quantity}× ${items[0].productName} +${items.length - 1} autre${items.length - 1 > 1 ? "s" : ""}`;
}

export default function DashboardHome() {

    const { store, loading: storeLoading } = useStore();
    const { products, orders, loading, pendingOrders, completedOrders, revenue } = useDashboard();
    const router = useRouter();

    const [copied, setCopied]           = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    const handleLogout = async () => {
        try { setLogoutLoading(true); router.replace("/"); }
        catch (err) { console.error(err); }
        finally { setLogoutLoading(false); }
    };

    /* ── Loading ── */
    if (storeLoading || loading) {
        return (
            <div className="ds-loading-screen">
                <div className="ds-loading-card">
                    <FiLoader className="spin-icon" size={28} />
                    <h3>Chargement du tableau de bord...</h3>
                    <p>Préparation de votre boutique</p>
                </div>
            </div>
        );
    }

    /* ── No store ── */
    if (!store) {
        return (
            <div className="ds-empty-page">
                <div className="ds-empty-icon-lg"><FiShoppingBag /></div>
                <h2>Aucune boutique trouvée</h2>
                <p>Créez votre boutique pour commencer à vendre en ligne.</p>
                <button className="ds-logout-btn" onClick={handleLogout} disabled={logoutLoading}>
                    <FiLogOut />
                    {logoutLoading ? "Déconnexion..." : "Déconnexion"}
                </button>
            </div>
        );
    }

    /* ── Store URL ── */
    const isLocal  = typeof window !== "undefined" && window.location.hostname === "localhost";
    const storeUrl = isLocal
        ? `/store/${store.slug}`
        : `https://${store.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;
    const storeDomain = `${store.slug}.tunishop.com`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(
                isLocal ? `${window.location.origin}/store/${store.slug}` : `https://${storeDomain}`
            );
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) { console.error(err); }
    };

    /* ── Quota ── */
    const ordersQuota = Number(store?.ordersQuota ?? 20);
    const ordersUsed  = Array.isArray(orders) ? orders.length : 0;
    const ordersLeft  = Math.max(0, ordersQuota - ordersUsed);
    const quotaPct    = Math.min(100, (ordersLeft / ordersQuota) * 100);
    const quotaClass  = ordersLeft <= 3 ? "danger" : ordersLeft <= 8 ? "warning" : "safe";

    /* ── Stats ── */
    const shippingOrders = (orders || []).filter(
        (o) => getDisplayStatus(o) === "confirmee" || getDisplayStatus(o) === "expediee"
    ).length;

    const stats = [
        { icon: FiBox,       label: "Produits actifs",    value: products.length,          hint: products.length > 0 ? "Produits en ligne" : "Aucun produit", tint: "ds-tint-blue"  },
        { icon: FiCheck,     label: "Commandes livrées",  value: completedOrders.length,   hint: "Toutes catégories",                                          tint: "ds-tint-green" },
        { icon: FiClock,     label: "En attente",         value: pendingOrders.length,     hint: pendingOrders.length > 0 ? "À traiter" : "Aucune commande",   tint: "ds-tint-amber" },
        { icon: FiDollarSign,label: "Revenu total",       value: `${new Intl.NumberFormat("fr-TN",{minimumFractionDigits:3,maximumFractionDigits:3}).format(revenue)} TND`, hint: `${shippingOrders} en cours`, tint: "ds-tint-navy" },
    ];

    const recentOrders = [...(orders || [])]
        .sort((a, b) => orderCreatedAtMs(b) - orderCreatedAtMs(a))
        .slice(0, 5);

    const topProducts = [...(products || [])]
        .sort((a, b) => Number(b.stats?.ordersCount || 0) - Number(a.stats?.ordersCount || 0))
        .slice(0, 4);

    return (
        <div className="ds-home">

            {/* ── PAGE HEADER ── */}
            <div className="ds-page-header">
                <div className="ds-page-header-left">
                    <h1>Bonjour, {store.name} 👋</h1>
                    <p>Voici un aperçu de votre activité aujourd'hui</p>
                </div>
                <div className="ds-page-header-right">
                    {/* Store URL pill */}
                    <div className="ds-store-url-pill">
                        <FiGlobe size={13} />
                        <span>{storeDomain}</span>
                        <button
                            className={`ds-url-copy ${copied ? "ds-url-copied" : ""}`}
                            onClick={handleCopy}
                            title="Copier le lien"
                        >
                            {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
                        </button>
                        <Link
                            href={storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ds-url-open"
                            title="Ouvrir la boutique"
                        >
                            <FiExternalLink size={13} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── QUOTA BANNER ── */}
            <div className="ds-quota-banner">
                <div className="ds-quota-left">
                    <div className="ds-quota-pill">
                        <FiZap size={11} /> Quota commandes
                    </div>
                    <p className="ds-quota-number">
                        {ordersLeft}
                        <span className="ds-quota-label"> commandes restantes</span>
                    </p>
                    <p className="ds-quota-hint">
                        Chaque commande reçue consomme 1 unité de votre quota gratuit.
                    </p>
                </div>
                <div className="ds-quota-right">
                    <div className="ds-quota-bar-wrap">
                        <div className={`ds-quota-bar-fill quota-${quotaClass}`} style={{ width: `${quotaPct}%` }} />
                    </div>
                </div>
            </div>

            {/* ── STATS ── */}
            <div className="ds-stats-grid">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={i} className="ds-stat-card">
                            <div className="ds-stat-top">
                                <p className="ds-stat-label">{s.label}</p>
                                <div className={`ds-stat-icon ${s.tint}`}><Icon size={18} /></div>
                            </div>
                            <h3 className="ds-stat-value">{s.value}</h3>
                            <span className="ds-stat-hint">{s.hint}</span>
                        </div>
                    );
                })}
            </div>

            {/* ── EMPTY PRODUCTS PROMPT ── */}
            {products.length === 0 && (
                <div className="ds-empty-box">
                    <div className="ds-empty-box-left">
                        <div className="ds-empty-box-icon"><FiAlertCircle size={22} /></div>
                        <div>
                            <h3>Ajoutez votre premier produit</h3>
                            <p>Votre boutique est prête. Commencez à vendre en ajoutant vos produits.</p>
                        </div>
                    </div>
                    <Link href="/dashboard/products/new" className="ds-add-btn">
                        <FiPlus size={15} /> Ajouter un produit
                    </Link>
                </div>
            )}

            {/* ── PENDING BANNER ── */}
            {pendingOrders.length > 0 && (
                <Link href="/dashboard/orders" className="ds-pending-banner">
                    <div className="ds-pending-left">
                        <div className="ds-pending-icon"><FiShoppingBag size={18} /></div>
                        <div>
                            <h4>{pendingOrders.length} commande{pendingOrders.length > 1 ? "s" : ""} en attente</h4>
                            <p>Consultez et gérez vos nouvelles commandes</p>
                        </div>
                    </div>
                    <span className="ds-pending-cta">Voir <FiChevronRight size={14} /></span>
                </Link>
            )}

            {/* ── TWO-COL ── */}
            <div className="ds-two-col">

                <div className="ds-card">
                    <div className="ds-card-head">
                        <div>
                            <h2>Commandes récentes</h2>
                            <p>Les 5 dernières commandes reçues</p>
                        </div>
                        <Link href="/dashboard/orders" className="ds-card-link">
                            Voir tout <FiArrowUpRight size={12} />
                        </Link>
                    </div>
                    <div className="ds-order-list">
                        {recentOrders.length === 0 ? (
                            <p className="ds-empty-msg">Aucune commande pour le moment.</p>
                        ) : recentOrders.map((o) => {
                            const status = getDisplayStatus(o);
                            const location = o.delegation && o.governorate
                                ? `${o.delegation}, ${o.governorate}`
                                : o.fullAddress || o.clientAddress || "";

                            return (
                                <div key={o.id} className="ds-order-row">
                                    <div className="ds-order-avatar"><FiShoppingBag size={16} /></div>
                                    <div className="ds-order-info">
                                        <p className="ds-order-name">{orderItemsSummary(o)}</p>
                                        <p className="ds-order-meta">
                                            {o.clientName || "Client"}
                                            {location ? ` · ${location}` : ""}
                                        </p>
                                    </div>
                                    <div className="ds-order-right">
                                        <p className="ds-order-price">{o.total_amount ?? o.subtotal ?? 0} TND</p>
                                        <span className={`ds-badge ${STATUS_CLASS[status] || "ds-badge-gray"}`}>
                                            {STATUS_LABEL[status] || status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="ds-card">
                    <div className="ds-card-head">
                        <div>
                            <h2>Top produits</h2>
                            <p>Par ventes</p>
                        </div>
                        <Link href="/dashboard/products" className="ds-card-link">
                            Gérer <FiArrowUpRight size={12} />
                        </Link>
                    </div>
                    <div className="ds-product-list">
                        {topProducts.length === 0 ? (
                            <p className="ds-empty-msg">Aucun produit pour le moment.</p>
                        ) : topProducts.map((p, i) => (
                            <div key={p.id} className="ds-product-row">
                                <span className="ds-product-rank">{i + 1}</span>
                                <div className="ds-product-info">
                                    <p className="ds-product-name">{p.name}</p>
                                    <p className="ds-product-meta">{p.price} TND · {p.inventory ?? p.stock ?? 0} en stock</p>
                                </div>
                                <div className="ds-product-sales">
                                    <FiTrendingUp size={12} className="ds-trend-icon" />
                                    {Number(p.stats?.ordersCount || 0)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
}