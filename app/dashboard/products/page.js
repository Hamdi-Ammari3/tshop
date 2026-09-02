"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { deleteDoc, doc } from "firebase/firestore";
import { DB } from "../../../lib/firebaseConfig";
import { useStore } from "../../../context/StoreContext";
import { useDashboard } from "../../../context/DashboardContext";
import { AIPostDialog } from "../../components/AIPostDialog";
import {
    FiPlus, FiSearch, FiPackage, FiEdit2, FiTrash2,
    FiChevronDown, FiLayers, FiArchive, FiAlertTriangle,
    FiX, FiLoader,
} from "react-icons/fi";
import { LuSparkles } from "react-icons/lu";
import "./products.css";

/* ─── HELPERS ─────────────────────────────────────────── */

function totalVariantStock(product) {
    return (product.variants || []).reduce(
        (sum, v) => sum + Number(v.inventory || 0), 0
    );
}

function getStockValue(product) {
    if (product.variants?.length) return totalVariantStock(product);
    return product.inventory || 0;
}

function getProductStatus(product) {
    if (product.status) return product.status;
    return getStockValue(product) <= 0 ? "rupture" : "actif";
}

function StatusPill({ status }) {
    const map = {
        actif:     { cls: "pr-pill-active",  label: "Actif" },
        rupture:   { cls: "pr-pill-out",     label: "Rupture" },
    };
    const { cls, label } = map[status] || map.actif;
    return <span className={`pr-pill ${cls}`}>{label}</span>;
}

function StockInline({ stock }) {
    if (stock === 0) return <span className="pr-stock-inline pr-stock-inline-out">Rupture</span>;
    if (stock <= 5)  return <span className="pr-stock-inline pr-stock-inline-low">{stock} restants</span>;
    return <span className="pr-stock-inline pr-stock-inline-ok">{stock} en stock</span>;
}

/* ─── EXPANDED DETAILS (variants + lots) ─────────────── */

function VariantsBlock({ product }) {
    if (!product.hasVariants || !product.variants?.length) return null;
    return (
        <div>
            <p className="pr-exp-heading"><FiLayers size={13} /> Variantes</p>
            <div className="pr-exp-list">
                {product.variants.map((v) => {
                    const label = (v.options || [])
                        .sort((a, b) => a.position - b.position)
                        .map((o) => o.value)
                        .join(" / ") || "Variante";
                    return (
                        <div key={v.id} className="pr-exp-row">
                            <span className="pr-exp-row-label">{label}</span>
                            <span className="pr-exp-row-meta">
                                <span className="pr-exp-row-price">{v.price} TND</span>
                                <StockInline stock={Number(v.inventory || 0)} />
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function LotsBlock({ product }) {
    if (!product?.lotRules?.enabled || !product?.lotRules?.lots?.length) return null;
    return (
        <div>
            <p className="pr-exp-heading"><FiArchive size={13} /> Lots</p>
            <div className="pr-exp-list">
                {product.lotRules.lots.map((lot, i) => (
                    <div key={i} className="pr-exp-row">
                        <span className="pr-exp-row-label">
                            Lot de {lot.quantity}
                            <span className="pr-exp-row-sub">
                                ({(lot.price / lot.quantity).toFixed(1)} TND/u)
                            </span>
                        </span>
                        <span className="pr-exp-row-meta">
                            <span className="pr-exp-row-price">{lot.price} TND</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── PRODUCT CARD ────────────────────────────────────── */

function ProductCard({ product, onRequestDelete }) {
    const [expanded, setExpanded] = useState(false);

    const hasDetails = !!(product.variants?.length || product?.lotRules?.lots?.length);
    const stock = getStockValue(product);
    const status = getProductStatus(product);

    return (
        <div className="pr-card">
            <div className="pr-card-main">
                <div className="pr-card-img">
                    <img
                        src={product.thumbnail || product.images?.[0] || "/placeholder.png"}
                        alt={product.name}
                        loading="lazy"
                    />
                </div>

                <div className="pr-card-info">
                    <div className="pr-card-title-row">
                        <p className="pr-card-name">{product.name}</p>
                        <StatusPill status={status} />
                    </div>
                    <p className="pr-card-category">{product.category || "—"}</p>
                    <div className="pr-card-meta">
                        <span className="pr-card-price">{product.price} TND</span>
                        <StockInline stock={stock} />
                        <span className="pr-card-sales">{product.sales || 0} vendus</span>
                        {product.variants?.length ? (
                            <span className="pr-chip pr-chip-secondary">
                                <FiLayers size={11} />
                                {product.variants.length} variante{product.variants.length > 1 ? "s" : ""}
                            </span>
                        ) : null}
                        {product?.lotRules?.lots?.length ? (
                            <span className="pr-chip pr-chip-primary">
                                <FiArchive size={11} />
                                {product.lotRules.lots.length} lot{product.lotRules.lots.length > 1 ? "s" : ""}
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="pr-card-actions">
                    {hasDetails && (
                        <button
                            className="pr-btn-outline"
                            onClick={() => setExpanded((v) => !v)}
                        >
                            Détails
                            <FiChevronDown
                                size={14}
                                className={`pr-chevron ${expanded ? "pr-chevron-open" : ""}`}
                            />
                        </button>
                    )}
                    <Link
                        href={`/dashboard/products/${product.id}`}
                        className="pr-icon-btn"
                        aria-label="Modifier"
                    >
                        <FiEdit2 size={16} />
                    </Link>
                    <button
                        className="pr-icon-btn pr-icon-btn-danger"
                        aria-label="Supprimer"
                        onClick={() => onRequestDelete(product)}
                    >
                        <FiTrash2 size={16} />
                    </button>
                </div>
            </div>

            {expanded && hasDetails && (
                <div className="pr-card-expanded">
                    <VariantsBlock product={product} />
                    <LotsBlock product={product} />
                </div>
            )}
        </div>
    );
}

/* ─── PAGE ────────────────────────────────────────────── */

export default function ProductsPage() {
    const { loading: storeLoading } = useStore();
    const { products, setProducts, loading } = useDashboard();

    const [query, setQuery]     = useState("");
    const [filter, setFilter]   = useState("all"); // all | actif | rupture
    const [toDelete, setToDelete] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const filtered = useMemo(() => {
        return products.filter((p) => {
            const matchQ = p.name.toLowerCase().includes(query.toLowerCase()) ||
                (p.category || "").toLowerCase().includes(query.toLowerCase());
            const matchF = filter === "all" || getProductStatus(p) === filter;
            return matchQ && matchF;
        });
    }, [products, query, filter]);

    async function handleDelete(productId) {
        if (deletingId) return;
        try {
            setDeletingId(productId);
            const p = products.find((i) => i.id === productId);
            if (!p) throw new Error("Produit introuvable.");
            const allImages = [...new Set([
                ...(p.images || []),
                ...(p.variants?.map((v) => v.image).filter(Boolean) || []),
            ])];
            if (allImages.length > 0) {
                await fetch("/api/delete-cloudinary-images", {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify({ images: allImages }),
                });
            }
            await deleteDoc(doc(DB, "products", productId));
            setProducts((prev) => prev.filter((i) => i.id !== productId));
            setToDelete(null);
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression.");
        } finally {
            setDeletingId(null);
        }
    }

    if (loading || storeLoading) {
        return (
            <div className="pr-loading">
                <FiLoader className="pr-spin" size={28} />
                <p>Chargement des produits...</p>
            </div>
        );
    }

    return (
        <div className="pr-page">

            {/* HEADER */}
            <div className="pr-page-header">
                <div>
                    <h1 className="pr-page-title">Produits</h1>
                    <p className="pr-page-subtitle">
                        {products.length} produit{products.length !== 1 ? "s" : ""} dans votre catalogue
                    </p>
                </div>
                <Link href="/dashboard/products/new" className="pr-btn-primary">
                    <FiPlus size={15} />
                    <span className="pr-btn-primary-full">Ajouter un produit</span>
                    <span className="pr-btn-primary-short">Ajouter</span>
                </Link>
            </div>

            {/* FILTERS */}
            <div className="pr-filters-row">
                <div className="pr-search-box">
                    <FiSearch size={15} className="pr-search-ico" />
                    <input
                        type="search"
                        placeholder="Rechercher un produit…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div className="pr-tabs">
                    {["all", "actif", "rupture"].map((k) => (
                        <button
                            key={k}
                            onClick={() => setFilter(k)}
                            className={`pr-tab ${filter === k ? "pr-tab-active" : ""}`}
                        >
                            {k === "all" ? "Tous"
                                : k === "actif" ? "Actifs"
                                : "Ruptures"}
                        </button>
                    ))}
                </div>
            </div>

            {/* LIST */}
            <div className="pr-list">
                {filtered.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onRequestDelete={setToDelete}
                    />
                ))}

                {filtered.length === 0 && (
                    <div className="pr-empty">
                        <div className="pr-empty-icon"><FiPackage size={22} /></div>
                        <p className="pr-empty-title">
                            {query ? "Aucun produit trouvé" : "Aucun produit"}
                        </p>
                        <p className="pr-empty-sub">
                            {query
                                ? `Essayez de modifier vos filtres ou votre recherche.`
                                : "Commencez par ajouter votre premier produit à la boutique."}
                        </p>
                        {!query && (
                            <Link href="/dashboard/products/new" className="pr-btn-primary" style={{ marginTop: 12 }}>
                                <FiPlus size={14} /> Ajouter un produit
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* DELETE CONFIRM MODAL */}
            {toDelete && (
                <div className="pr-modal-backdrop" onClick={() => !deletingId && setToDelete(null)}>
                    <div className="pr-modal pr-modal-center" onClick={(e) => e.stopPropagation()}>
                        <div className="pr-modal-danger-icon">
                            <FiAlertTriangle size={20} />
                        </div>
                        <h2 className="pr-modal-title">Supprimer ce produit ?</h2>
                        <p className="pr-modal-sub">
                            « {toDelete.name} » sera retiré définitivement de votre boutique.
                        </p>
                        <div className="pr-modal-actions">
                            <button
                                className="pr-btn-secondary"
                                onClick={() => setToDelete(null)}
                                disabled={!!deletingId}
                            >
                                Annuler
                            </button>
                            <button
                                className="pr-btn-danger"
                                onClick={() => handleDelete(toDelete.id)}
                                disabled={!!deletingId}
                            >
                                {deletingId === toDelete.id ? (
                                    <FiLoader className="pr-spin" size={14} />
                                ) : "Supprimer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}