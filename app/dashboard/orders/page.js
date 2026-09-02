"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
    FiSearch, FiShoppingBag, FiPhone, FiMapPin, FiCheck, FiX,
    FiTruck, FiMessageCircle, FiCopy, FiChevronRight, FiLoader,
    FiPackage as FiBox,
} from "react-icons/fi";
import { collection,query as firestoreQuery,where,getDocs,updateDoc,doc,getDoc,increment } from "firebase/firestore";
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

// Derives the 5-state display status from your existing status field
// plus the new shippingStatus field, without touching your inventory logic.
function getDisplayStatus(order) {
    if (order.status === "cancelled") return "annulee";
    if (order.status === "pending") return "en-attente";
    // status === "done"
    if (order.shippingStatus === "livree") return "livree";
    if (order.shippingStatus === "expediee") return "expediee";
    return "confirmee";
}

const STATUS_META = {
    "en-attente": { label: "En attente", cls: "or-badge-pending" },
    confirmee:    { label: "Confirmée",  cls: "or-badge-confirmed" },
    expediee:     { label: "Expédiée",   cls: "or-badge-shipped" },
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

/* ─── SHIP MODAL ──────────────────────────────────────── */

function ShipModal({ orders, connections, onClose, onDone }) {
    const active = connections.filter((c) => c.active);
    const [carrierId, setCarrierId] = useState(active[0]?.id ?? "");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const submit = async () => {
        const carrier = active.find((c) => c.id === carrierId);
        if (!carrier) return;
        setLoading(true);
        try {
            await Promise.all(
                orders.map((o) => {
                    const tracking = `${carrier.provider?.toUpperCase() || "TRK"}-${Math.random()
                        .toString(36)
                        .slice(2, 10)
                        .toUpperCase()}`;
                    return updateDoc(doc(DB, "orders", o.id), {
                        shippingStatus: "expediee",
                        carrierId: carrier.id,
                        carrierName: carrier.label,
                        tracking,
                    });
                })
            );
            setLoading(false);
            setDone(true);
            setTimeout(onDone, 1100);
        } catch (err) {
            console.error(err);
            setLoading(false);
            alert("Erreur lors de l'expédition. Réessayez.");
        }
    };

    return (
        <div className="or-modal-backdrop" onClick={onClose}>
            <div className="or-modal" onClick={(e) => e.stopPropagation()}>
                {done ? (
                    <div className="or-modal-done">
                        <div className="or-modal-done-icon"><FiCheck size={22} /></div>
                        <p className="or-modal-done-title">
                            {orders.length} commande{orders.length > 1 ? "s" : ""} transmise
                            {orders.length > 1 ? "s" : ""} au transporteur
                        </p>
                        <p className="or-modal-done-sub">
                            Les numéros de suivi ont été générés automatiquement.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="or-modal-top">
                            <div>
                                <h3>Expédier {orders.length} commande{orders.length > 1 ? "s" : ""}</h3>
                                <p>Choisissez le transporteur qui prendra en charge le colis.</p>
                            </div>
                            <button className="or-modal-close" onClick={onClose} aria-label="Fermer">
                                <FiX size={16} />
                            </button>
                        </div>

                        {active.length === 0 ? (
                            <div className="or-modal-empty">
                                <FiTruck size={22} />
                                <p>Aucun transporteur actif</p>
                                <span>Connectez une société de livraison pour expédier vos commandes.</span>
                                <a href="/dashboard/shipping" className="or-btn-primary-full">
                                    <FiTruck size={14} /> Aller à la livraison
                                </a>
                            </div>
                        ) : (
                            <>
                                <div className="or-carrier-list">
                                    {active.map((c) => (
                                        <label
                                            key={c.id}
                                            className={`or-carrier-option ${carrierId === c.id ? "or-carrier-option-selected" : ""}`}
                                        >
                                            <input
                                                type="radio"
                                                name="carrier"
                                                checked={carrierId === c.id}
                                                onChange={() => setCarrierId(c.id)}
                                            />
                                            <div>
                                                <p className="or-carrier-name">{c.label}</p>
                                                <p className="or-carrier-meta">
                                                    {c.fee != null ? `${c.fee} DT / colis` : ""}
                                                    {c.fee != null && c.delay ? " · " : ""}
                                                    {c.delay || ""}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <div className="or-modal-actions">
                                    <button className="or-btn-secondary" onClick={onClose}>Annuler</button>
                                    <button
                                        className="or-btn-primary"
                                        onClick={submit}
                                        disabled={loading || !carrierId}
                                    >
                                        {loading ? "Transmission…" : "Confirmer l'expédition"}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── ORDER ROW ───────────────────────────────────────── */

function OrderRow({ order, selected, canSelect, onToggleSelect, actionLoading, onStatusChange, onShip, onDeliver }) {
    const status = getDisplayStatus(order);
    const isLoading = actionLoading === order.id;

    return (
        <div className="or-row-card">
            <div className="or-row-main">
                {canSelect ? (
                    <input
                        type="checkbox"
                        className="or-checkbox"
                        checked={selected}
                        onChange={() => onToggleSelect(order.id)}
                        aria-label={`Sélectionner ${order.id}`}
                    />
                ) : (
                    <span className="or-checkbox-spacer" />
                )}

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
                    {order.carrierName && (
                        <div className="or-tracking-chip">
                            <FiTruck size={13} />
                            <span className="or-tracking-carrier">{order.carrierName}</span>
                            <span className="or-tracking-num">{order.tracking}</span>
                            <button
                                className="or-copy-btn"
                                onClick={() => navigator.clipboard?.writeText(order.tracking || "")}
                                aria-label="Copier le numéro de suivi"
                            >
                                <FiCopy size={12} />
                            </button>
                        </div>
                    )}
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
                            <ActionBtn primary icon={FiTruck} label="Expédier" onClick={() => onShip([order.id])} />
                        )}
                        {status === "expediee" && (
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
    const [selected, setSelected] = useState([]);
    const [shipTarget, setShipTarget] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [connections, setConnections] = useState([]);
    const [toast, setToast] = useState(null);

    /* Load active shipping connections for the ship modal */
    useEffect(() => {
        if (!store?.id) return;
        (async () => {
            try {
                const q = firestoreQuery(collection(DB, "shippingConnections"), where("storeId", "==", store.id));
                const snap = await getDocs(q);
                setConnections(snap.docs.map((d) => ({ id: d.id, active: true, ...d.data() })));
            } catch (err) {
                console.error(err);
            }
        })();
    }, [store?.id]);

    const activeCarriers = connections.filter((c) => c.active);

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
        const c = { all: orders.length, "en-attente": 0, confirmee: 0, expediee: 0, livree: 0, annulee: 0 };
        orders.forEach((o) => { c[getDisplayStatus(o)] = (c[getDisplayStatus(o)] || 0) + 1; });
        return c;
    }, [orders]);

    const shippable = filtered.filter((o) => getDisplayStatus(o) === "confirmee");
    const selectedShippable = selected.filter((id) => shippable.some((o) => o.id === id));
    const allSelected = shippable.length > 0 && selectedShippable.length === shippable.length;

    const toggleSelect = (id) =>
        setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

    /* STATUS CHANGE — inventory logic fully preserved, plus stats.ordersCount tracking */
    const setStatuss = async (order, newStatus) => {
        try {
            setActionLoading(order.id);

            if (newStatus === "done" && !order.inventoryUpdated) {
                for (const item of order.items || []) {
                    const productRef = doc(DB, "products", item.productId);
                    const productSnap = await getDoc(productRef);
                    if (!productSnap.exists()) continue;
                    const productData = productSnap.data();

                    const updates = {"stats.ordersCount": increment(Number(item.quantity || 0))};

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
                    if (!productSnap.exists()) continue;
                    const productData = productSnap.data();

                    const updates = {"stats.ordersCount": increment(-Number(item.quantity || 0)),};

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
                    carrierId: null,
                    carrierName: null,
                    tracking: null,
                });

            } else {
                await updateDoc(doc(DB, "orders", order.id), { status: newStatus });
            }
        } catch (err) {
            console.error(err);
            alert("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setActionLoading(null);
        }
    };

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
                carrierId: null,
                carrierName: null,
                tracking: null,
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
                <a href="/dashboard/shipping" className="or-btn-outline">
                    <FiTruck size={14} /> Transporteurs ({activeCarriers.length})
                </a>
            </div>

            {/* NO CARRIER BANNER */}
            {activeCarriers.length === 0 && (
                <div className="or-banner">
                    <span className="or-banner-icon"><FiTruck size={20} /></span>
                    <div className="or-banner-info">
                        <p>Connectez un transporteur pour expédier en un clic</p>
                        <span>Transmettez vos commandes directement à vos transporteurs connectés.</span>
                    </div>
                    <a href="/dashboard/shipping" className="or-btn-primary-full">
                        Configurer la livraison <FiChevronRight size={14} />
                    </a>
                </div>
            )}

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
                    {["all", "en-attente", "confirmee", "expediee", "livree", "annulee"].map((k) => (
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

            {/* BULK BAR */}
            {shippable.length > 0 && (
                <div className="or-bulk-bar">
                    <label className="or-bulk-checkbox">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={(e) => setSelected(e.target.checked ? shippable.map((o) => o.id) : [])}
                        />
                        Tout sélectionner ({shippable.length} à expédier)
                    </label>
                    {selectedShippable.length > 0 && (
                        <>
                            <span className="or-bulk-count">
                                {selectedShippable.length} sélectionnée{selectedShippable.length > 1 ? "s" : ""}
                            </span>
                            <button className="or-btn-primary or-bulk-ship-btn" onClick={() => setShipTarget(selectedShippable)}>
                                <FiTruck size={14} /> Expédier la sélection
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* LIST */}
            <div className="or-list">
                {filtered.map((order) => (
                    <OrderRow
                        key={order.id}
                        order={order}
                        selected={selected.includes(order.id)}
                        canSelect={getDisplayStatus(order) === "confirmee"}
                        onToggleSelect={toggleSelect}
                        actionLoading={actionLoading}
                        onStatusChange={setStatus}
                        onShip={(ids) => setShipTarget(ids)}
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

            {shipTarget && (
                <ShipModal
                    orders={orders.filter((o) => shipTarget.includes(o.id))}
                    connections={connections}
                    onClose={() => setShipTarget(null)}
                    onDone={() => { setSelected([]); setShipTarget(null); }}
                />
            )}

            <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}