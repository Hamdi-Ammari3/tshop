"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { DB } from "../../../../lib/firebaseConfig";
import { usePublicStore } from "../../../../context/PublicStoreContext";
import { tunisiaLocations } from "../../../../lib/tunisiaLocations";
import {
    FiChevronRight, FiCheck, FiLoader, FiX, FiAlertCircle,
    FiTruck, FiShield, FiUser, FiMapPin, FiPhone, FiLock,
} from "react-icons/fi";
import "./checkout.css";

/* ─── FIELD COMPONENTS ────────────────────────────────── */

function Field({ label, value, onChange, error, placeholder, icon, hint, inputMode }) {
    return (
        <div className="ck-field">
            <label>{label}</label>
            <div className={`ck-input-wrap ${error ? "ck-input-error" : ""}`}>
                {icon && <span className="ck-input-icon">{icon}</span>}
                <input
                    type="text"
                    value={value}
                    inputMode={inputMode}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                />
            </div>
            {error ? <p className="ck-field-error">{error}</p> : hint ? <p className="ck-field-hint">{hint}</p> : null}
        </div>
    );
}

function SelectField({ label, value, onChange, error, options, placeholder, disabled }) {
    return (
        <div className="ck-field">
            <label>{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={error ? "ck-input-error" : ""}
            >
                <option value="">{placeholder}</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {error && <p className="ck-field-error">{error}</p>}
        </div>
    );
}

function PayOption({ active, onClick, title, desc, disabled }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`ck-pay-option ${active ? "ck-pay-option-active" : ""} ${disabled ? "ck-pay-option-disabled" : ""}`}
        >
            <span className="ck-pay-radio">{active && <span className="ck-pay-radio-dot" />}</span>
            <span>
                <span className="ck-pay-title">
                    {title}
                    {disabled && <span className="ck-pay-soon">Bientôt disponible</span>}
                </span>
                <span className="ck-pay-desc">{desc}</span>
            </span>
        </button>
    );
}

/* ─── PAGE ────────────────────────────────────────────── */

export default function CheckoutPage() {
    const router = useRouter();
    const { store, cart, cartSubtotal, shippingFee, cartTotal, clearCart } = usePublicStore();

    const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
    const slug = store?.slug;
    const homeUrl = isLocalhost ? `/store/${slug}` : "/";
    const cartUrl = isLocalhost ? `/store/${slug}/cart` : "/cart";

    const [form, setForm] = useState({
        firstName: "", phone: "", governorate: "", delegation: "",
        address: "", notes: "", payment: "cod",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [toast, setToast] = useState(null);

    const delegations = form.governorate ? tunisiaLocations[form.governorate] || [] : [];

    const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

    const setField = (k, v) => {
        setForm((f) => ({ ...f, [k]: v }));
        setErrors((e) => ({ ...e, [k]: "" }));
    };

    const showToast = (message, type = "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    function validate() {
        const e = {};
        if (!form.firstName.trim()) e.firstName = "Nom requis";

        const cleanPhone = form.phone.replace(/\s/g, "");
        const tunisianPhoneRegex = /^[259]\d{7}$/;
        if (!tunisianPhoneRegex.test(cleanPhone)) {
            e.phone = "8 chiffres, doit commencer par 2, 5 ou 9";
        }

        if (!form.governorate) e.governorate = "Sélectionnez un gouvernorat";
        if (!form.delegation) e.delegation = "Sélectionnez une délégation";
        if (form.address.trim().length < 6) e.address = "Adresse trop courte";

        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(ev) {
        ev.preventDefault();
        if (loading) return;
        if (!validate()) {
            showToast("Veuillez corriger les champs en rouge.");
            return;
        }

        try {
            setLoading(true);

            const cleanPhone = form.phone.replace(/\s/g, "");

            const orderItems = cart.map((item) => {
                const unitPrice = Number(item.finalPrice || 0);
                const total = item.selectedLot ? unitPrice : unitPrice * item.quantity;
                return {
                    productId: item.id,
                    productName: item.name,
                    productImage: item.selectedVariant?.image || item.images?.[0] || "",
                    category: item.category || "",
                    quantity: item.quantity,
                    selectedOptions: item.selectedOptions || {},
                    selectedVariant: item.selectedVariant ? {
                        id: item.selectedVariant.id || null,
                        image: item.selectedVariant.image || "",
                        inventory: item.selectedVariant.inventory ?? null,
                    } : null,
                    selectedLot: item.selectedLot || null,
                    unitPrice,
                    total,
                    oldPrice: item.selectedVariant?.oldPrice || item.oldPrice || null,
                    trackInventory: item.trackInventory || false,
                };
            });

            await addDoc(collection(DB, "orders"), {
                source: "store_website",
                storeId: store.id,
                storeName: store.name,
                storeSlug: store.slug,
                items: orderItems,
                itemsCount: totalItems,
                subtotal: cartSubtotal,
                shipping_fee: shippingFee,
                total_amount: cartTotal,
                clientName: form.firstName.trim(),
                clientPhone: cleanPhone,
                governorate: form.governorate,
                delegation: form.delegation,
                clientAddress: form.address.trim(),
                fullAddress: `${form.address.trim()}, ${form.delegation}, ${form.governorate}`,
                notes: form.notes.trim() || null,
                payment_method: "cash_on_delivery",
                status: "pending",
                createdAt: serverTimestamp(),
            });

            setSuccess(true);
            clearCart();
            setTimeout(() => router.push(homeUrl), 2200);
        } catch (error) {
            console.error(error);
            showToast("Une erreur est survenue. Réessayez.");
        } finally {
            setLoading(false);
        }
    }

    /* EMPTY */
    if (cart.length === 0 && !success) {
        return (
            <div className="ck-page">
                <div className="ck-empty">
                    <h1>Votre panier est vide</h1>
                    <p>Ajoutez des produits avant de passer commande.</p>
                    <Link href={homeUrl} className="ck-btn-primary-full">Retour à la boutique</Link>
                </div>
            </div>
        );
    }

    /* SUCCESS */
    if (success) {
        return (
            <div className="ck-page">
                <div className="ck-success-wrap">
                    <div className="ck-success-card">
                        <div className="ck-success-icon"><FiCheck size={28} /></div>
                        <h1>Commande confirmée !</h1>
                        <p>
                            Merci {form.firstName}. Votre commande a été enregistrée
                            et sera bientôt en préparation.
                        </p>
                        <span className="ck-success-redirect">Redirection vers la boutique...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ck-page">

            {/* BREADCRUMB */}
            <nav className="ck-breadcrumb">
                <Link href={homeUrl} className="ck-breadcrumb-link">Accueil</Link>
                <FiChevronRight size={13} />
                <Link href={cartUrl} className="ck-breadcrumb-link">Mon panier</Link>
                <FiChevronRight size={13} />
                <span className="ck-breadcrumb-current">Commande</span>
            </nav>

            {/* TITLE */}
            <div className="ck-title-row">
                <div>
                    <h1 className="ck-title">Finaliser ma commande</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="ck-layout">

                {/* FORM */}
                <section className="ck-form-col">

                    <div className="ck-card">
                        <div className="ck-card-title">
                            <FiUser size={15} /> <h2>Informations personnelles</h2>
                        </div>

                        <div className="ck-grid-2">
                            <Field
                                label="Nom complet" value={form.firstName}
                                onChange={(v) => setField("firstName", v)}
                                error={errors.firstName} placeholder="Mohamed Ben Ali"
                            />
                            <Field
                                label="Numéro de téléphone" value={form.phone}
                                onChange={(v) => setField("phone", v)}
                                error={errors.phone} placeholder="21 234 567"
                                icon={<FiPhone size={14} />} inputMode="tel"
                                hint="8 chiffres, commence par 2, 5 ou 9."
                            />
                        </div>
                    </div>

                    <div className="ck-card">
                        <div className="ck-card-title">
                            <FiMapPin size={15} /> <h2>Adresse de livraison</h2>
                        </div>
                        <div className="ck-grid-2">
                            <SelectField
                                label="Gouvernorat" value={form.governorate}
                                onChange={(v) => { setField("governorate", v); setField("delegation", ""); }}
                                error={errors.governorate}
                                options={Object.keys(tunisiaLocations)}
                                placeholder="Sélectionner"
                            />
                            <SelectField
                                label="Délégation" value={form.delegation}
                                onChange={(v) => setField("delegation", v)}
                                error={errors.delegation}
                                options={delegations}
                                placeholder={form.governorate ? "Sélectionner" : "Choisissez d'abord un gouvernorat"}
                                disabled={!form.governorate}
                            />
                        </div>
                        <Field
                            label="Adresse détaillée" value={form.address}
                            onChange={(v) => setField("address", v)}
                            error={errors.address}
                            placeholder="Rue, immeuble, appartement..."
                        />
                    </div>

                    <div className="ck-card">
                        <div className="ck-card-title">
                            <FiShield size={15} /> <h2>Mode de paiement</h2>
                        </div>
                        <div className="ck-grid-2">
                            <PayOption
                                active={form.payment === "cod"}
                                onClick={() => setField("payment", "cod")}
                                title="Paiement à la livraison"
                                desc="Payez en espèces à la réception."
                            />
                            <PayOption
                                active={false}
                                onClick={() => {}}
                                title="Carte bancaire"
                                desc="Paiement sécurisé en ligne."
                                disabled
                            />
                        </div>
                    </div>

                    <div className="ck-trust-strip">
                        <span><FiTruck size={14} /> Livraison rapide</span>
                        <span><FiShield size={14} /> Paiement à la livraison</span>
                    </div>

                    {toast && (
                        <div className={`ck-toast ck-toast-${toast.type}`}>
                            <div className="ck-toast-left">
                                <FiAlertCircle size={15} />
                                <p>{toast.message}</p>
                            </div>
                            <button type="button" onClick={() => setToast(null)} aria-label="Fermer">
                                <FiX size={15} />
                            </button>
                        </div>
                    )}

                    <button type="submit" className="ck-place-order-btn" disabled={loading}>
                        {loading ? (
                            <><FiLoader className="spin-icon" size={15} /> Traitement...</>
                        ) : (
                            <><FiLock size={15} /> Confirmer la commande</>
                        )}
                    </button>
                </section>

                {/* SUMMARY */}
                <aside className="ck-summary-col">
                    <div className="ck-summary-card">
                        <div className="ck-summary-header">
                            <h2>Récapitulatif de commande</h2>
                            <p>{totalItems} article{totalItems > 1 ? "s" : ""}</p>
                        </div>

                        <ul className="ck-summary-items">
                            {cart.map((item) => {
                                const unitPrice = Number(item.finalPrice || 0);
                                const total = item.selectedLot ? unitPrice : unitPrice * item.quantity;
                                return (
                                    <li key={item.cartItemId} className="ck-summary-item">
                                        <div className="ck-summary-item-img">
                                            <img
                                                src={item.selectedVariant?.image || item.images?.[0] || "/placeholder.png"}
                                                alt={item.name}
                                            />
                                            <span className="ck-summary-item-qty">{item.quantity}</span>
                                        </div>
                                        <div className="ck-summary-item-info">
                                            <p>{item.name}</p>
                                            <span>{unitPrice} TND × {item.quantity}</span>
                                        </div>
                                        <strong>{total} TND</strong>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="ck-summary-divider" />

                        <dl className="ck-summary-rows">
                            <div className="ck-summary-row">
                                <dt>Sous-total</dt>
                                <dd>{cartSubtotal} TND</dd>
                            </div>
                            <div className="ck-summary-row">
                                <dt>Livraison</dt>
                                <dd>{shippingFee > 0 ? `${shippingFee} TND` : "Gratuite"}</dd>
                            </div>
                        </dl>

                        <div className="ck-summary-divider" />

                        <div className="ck-summary-total">
                            <span>Total</span>
                            <h2>{cartTotal} TND</h2>
                        </div>

                        <p className="ck-summary-note">
                            En confirmant, vous acceptez nos conditions générales.
                        </p>
                    </div>
                </aside>

            </form>
        </div>
    );
}