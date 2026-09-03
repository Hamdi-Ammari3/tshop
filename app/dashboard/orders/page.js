"use client";

import React, { useMemo, useState } from "react";
import {
    FiSearch, FiShoppingBag, FiPhone, FiMapPin, FiCheck, FiX,
    FiMessageCircle, FiLoader, FiPackage as FiBox,
} from "react-icons/fi";
import { collection, updateDoc, doc, getDoc, increment } from "firebase/firestore";
import { DB } from "../../../lib/firebaseConfig";
import { useStore } from "../../../context/StoreContext";
import { useDashboard } from "../../../context/DashboardContext";
import "./orders.css";

/* ─── HELPERS ─────────────────────────────────────────── */

function timeAgo(timestamp) {
    if (!timestamp) return "—";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.max(0, Date.now() - date.getTime());
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "à l'instant";
    if (h < 24) return `il y a ${h} h`;
    return `il y a ${Math.floor(h / 24)} j`;
}

// Derives the display status from the order's status field. Without a
// shipping integration yet, a "done" order is simply "confirmée" until
// the store owner marks it delivered directly.
function getDisplayStatus(order) {
    if (order.status === "cancelled") return "annulee";
    if (order.status === "pending") return "en-attente";
    if (order.shippingStatus === "livree") return "livree";
    return "confirmee";
}

const STATUS_META = {
    "en-attente": { label: "En attente", cls: "or-badge-pending" },
    confirmee:    { label: "Confirmée",  cls: "or-badge-confirmed" },
    livree:       { label: "Livrée",     cls: "or-badge-delivered" },
    annulee:      { label: "Annulée",    cls: "or-badge-cancelled" },
};

function StatusBadge({ status }) {
    const cfg = STATUS_META[status] || STATUS_META["en-attente"];
    return <span className={`or-badge ${cfg.cls}`}>{cfg.label}</span>;
}

function ActionBtn({ icon: Icon, label, onClick, primary, danger, disabled, loading }) {
    const cls = primary
        ? "or-abtn or-abtn-primary"
        : danger
            ? "or-abtn or-abtn-danger"
            : "or-abtn or-abtn-neutral";
    return (
        <button className={cls} onClick={onClick} disabled={disabled}>
            {loading ? <FiLoader className="spin-icon" size={13} /> : <Icon size={13} />}
            {label}
        </button>
    );
}

function Toast({ toast, onClose }) {
    if (!toast) return null;
    return (
        <div className={`or-toast or-toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={onClose} aria-label="Fermer"><FiX size={14} /></button>
        </div>
    );
}

/* ─── ORDER ITEM THUMBNAIL LIST ───────────────────────── */

function OrderItemsPreview({ items }) {
    if (!items?.length) return null;

    return (
        <div className="or-items-preview">
            {items.map((item, idx) => {
                const img = item.selectedVariant?.image || item.productImage || "/placeholder.png";
                const options = item.selectedOptions && Object.keys(item.selectedOptions).length > 0
                    ? Object.entries(item.selectedOptions)
                    : null;

                return (
                    <div key={idx} className="or-item-preview">
                        <div className="or-item-preview-img">
                            <img src={img} alt={item.productName} />
                        </div>
                        <div className="or-item-preview-info">
                            <p className="or-item-preview-name">
                                {item.productName}
                                <span className="or-item-preview-qty"> × {item.quantity}</span>
                            </p>
                            {options && (
                                <div className="or-item-preview-variants">
                                    {options.map(([key, value]) => (
                                        <span key={key} className="or-variant-tag">
                                            {key}: <strong>{value}</strong>
                                        </span>
                                    ))}
                                </div>
                            )}
                            {item.selectedLot && (
                                <span className="or-lot-tag">Lot de {item.selectedLot.quantity} pièces</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── ORDER ROW ───────────────────────────────────────── */

function OrderRow({ order, actionLoading, onStatusChange, onDeliver }) {
    const status = getDisplayStatus(order);
    const isLoading = actionLoading === order.id;

    return (
        <div className="or-row-card">
            <div className="or-row-main">
                <div className="or-row-info">
                    <div className="or-row-title-line">
                        <StatusBadge status={status} />
                        <span className="or-row-time">{timeAgo(order.createdAt)}</span>
                    </div>

                    <OrderItemsPreview items={order.items} />

                    <div className="or-row-meta">
                        <span className="or-row-customer">{order.clientName || "Client"}</span>
                        <span className="or-row-meta-item">
                            <FiMapPin size={11} /> {order.fullAddress || order.clientAddress || "—"}
                        </span>
                        <span className="or-row-meta-item">
                            <FiPhone size={11} /> {order.clientPhone || "—"}
                        </span>
                    </div>
                </div>

                <div className="or-row-actions-col">
                    <p className="or-row-total">{order.subtotal || 0} TND</p>
                    <div className="or-row-actions">
                        {status === "en-attente" && (
                            <>
                                <ActionBtn
                                    primary icon={FiCheck} label="Confirmer"
                                    disabled={isLoading} loading={isLoading}
                                    onClick={() => onStatusChange(order, "done")}
                                />
                                <ActionBtn
                                    danger icon={FiX} label="Annuler"
                                    disabled={isLoading} loading={isLoading}
                                    onClick={() => onStatusChange(order, "cancelled")}
                                />
                            </>
                        )}
                        {status === "confirmee" && (
                            <ActionBtn
                                primary icon={FiBox} label="Marquer livrée"
                                disabled={isLoading} loading={isLoading}
                                onClick={() => onDeliver(order)}
                            />
                        )}
                        {status === "annulee" && (
                            <ActionBtn
                                icon={FiCheck} label="Réouvrir"
                                disabled={isLoading} loading={isLoading}
                                onClick={() => onStatusChange(order, "pending")}
                            />
                        )}
                        {order.clientPhone && (
                            <a href={`tel:${order.clientPhone.replace(/\s/g, "")}`} className="or-abtn or-abtn-neutral">
                                <FiPhone size={13} /> Appeler
                            </a>
                        )}
                        {order.clientPhone && (
                            <a
                                href={`https://wa.me/${order.clientPhone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="or-abtn or-abtn-whatsapp"
                            >
                                <FiMessageCircle size={13} /> WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── PAGE ────────────────────────────────────────────── */

export default function OrdersPage() {
    const { store, loading: storeLoading } = useStore();
    const { orders = [], loading } = useDashboard();

    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return orders
            .filter((o) => {
                const itemNames = (o.items || []).map((i) => i.productName).join(" ").toLowerCase();
                const matchQ =
                    !q ||
                    o.id.toLowerCase().includes(q) ||
                    (o.clientName || "").toLowerCase().includes(q) ||
                    itemNames.includes(q);
                const matchF = filter === "all" || getDisplayStatus(o) === filter;
                return matchQ && matchF;
            })
            .sort((a, b) => {
                const da = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
                const db = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
                return db - da;
            });
    }, [orders, query, filter]);

    const counts = useMemo(() => {
        const c = { all: orders.length, "en-attente": 0, confirmee: 0, livree: 0, annulee: 0 };
        orders.forEach((o) => { c[getDisplayStatus(o)] = (c[getDisplayStatus(o)] || 0) + 1; });
        return c;
    }, [orders]);

    /* STATUS CHANGE — inventory logic fully preserved, plus stats.ordersCount tracking */
    const setStatus = async (order, newStatus) => {
        try {
            setActionLoading(order.id);
            const missingProducts = [];

            if (newStatus === "done" && !order.inventoryUpdated) {
                for (const item of order.items || []) {
                    const productRef = doc(DB, "products", item.productId);
                    const productSnap = await getDoc(productRef);
                    if (!productSnap.exists()) {
                        missingProducts.push(item.productName || item.productId);
                        continue;
                    }
                    const productData = productSnap.data();

                    const updates = { "stats.ordersCount": increment(Number(item.quantity || 0)) };

                    if (item.trackInventory) {
                        if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {
                            const updatedVariants = (productData.variants || []).map((v) => {
                                const match = v.options.every((o) => item.selectedOptions[o.name] === o.value);
                                return match
                                    ? { ...v, inventory: Math.max(0, Number(v.inventory || 0) - Number(item.quantity || 0)) }
                                    : v;
                            });
                            updates.variants = updatedVariants;
                        } else {
                            updates.inventory = Math.max(0, Number(productData.inventory || 0) - Number(item.quantity || 0));
                        }
                    }

                    await updateDoc(productRef, updates);
                }
                await updateDoc(doc(DB, "orders", order.id), { status: newStatus, inventoryUpdated: true });

            } else if (newStatus === "pending" && order.inventoryUpdated) {
                for (const item of order.items || []) {
                    const productRef = doc(DB, "products", item.productId);
                    const productSnap = await getDoc(productRef);
                    if (!productSnap.exists()) {
                        missingProducts.push(item.productName || item.productId);
                        continue;
                    }
                    const productData = productSnap.data();

                    const updates = { "stats.ordersCount": increment(-Number(item.quantity || 0)) };

                    if (item.trackInventory) {
                        if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {
                            const updatedVariants = (productData.variants || []).map((v) => {
                                const match = v.options.every((o) => item.selectedOptions[o.name] === o.value);
                                return match
                                    ? { ...v, inventory: Number(v.inventory || 0) + Number(item.quantity || 0) }
                                    : v;
                            });
                            updates.variants = updatedVariants;
                        } else {
                            updates.inventory = Number(productData.inventory || 0) + Number(item.quantity || 0);
                        }
                    }

                    await updateDoc(productRef, updates);
                }
                await updateDoc(doc(DB, "orders", order.id), {
                    status: newStatus,
                    inventoryUpdated: false,
                    shippingStatus: null,
                });

            } else {
                await updateDoc(doc(DB, "orders", order.id), { status: newStatus });
            }

            if (missingProducts.length > 0) {
                setToast({
                    type: "warning",
                    message: missingProducts.length === 1
                        ? `Le produit "${missingProducts[0]}" n'existe plus. Son compteur de ventes n'a pas été mis à jour.`
                        : `${missingProducts.length} produits de cette commande n'existent plus. Leurs compteurs de ventes n'ont pas été mis à jour.`,
                });
            }
        } catch (err) {
            console.error(err);
            alert("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setActionLoading(null);
        }
    };

    const markDelivered = async (order) => {
        try {
            setActionLoading(order.id);
            await updateDoc(doc(DB, "orders", order.id), { shippingStatus: "livree" });
        } catch (err) {
            console.error(err);
            alert("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading || storeLoading) {
        return (
            <div className="ds-loading-screen">
                <div className="ds-loading-card">
                    <FiLoader className="spin-icon" size={28} />
                    <h3>Chargement des commandes...</h3>
                    <p>Veuillez patienter.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="or-page">

            {/* HEADER */}
            <div className="or-page-header">
                <div>
                    <h1 className="or-page-title">Commandes</h1>
                    <p className="or-page-subtitle">
                        {orders.length} commande{orders.length !== 1 ? "s" : ""} reçue{orders.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {/* FILTERS */}
            <div className="or-filters-row">
                <div className="or-search-box">
                    <FiSearch size={15} className="or-search-ico" />
                    <input
                        type="search"
                        placeholder="Rechercher par ID, client ou produit…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div className="or-tabs">
                    {["all", "en-attente", "confirmee", "livree", "annulee"].map((k) => (
                        <button
                            key={k}
                            className={`or-tab ${filter === k ? "or-tab-active" : ""}`}
                            onClick={() => setFilter(k)}
                        >
                            {k === "all" ? "Toutes" : STATUS_META[k].label}
                            <span className="or-tab-count">({counts[k] || 0})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* LIST */}
            <div className="or-list">
                {filtered.map((order) => (
                    <OrderRow
                        key={order.id}
                        order={order}
                        actionLoading={actionLoading}
                        onStatusChange={setStatus}
                        onDeliver={markDelivered}
                    />
                ))}

                {filtered.length === 0 && (
                    <div className="or-empty">
                        <div className="or-empty-icon"><FiShoppingBag size={22} /></div>
                        <p className="or-empty-title">Aucune commande</p>
                        <span className="or-empty-sub">Vos futures commandes apparaîtront ici.</span>
                    </div>
                )}
            </div>

            <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}