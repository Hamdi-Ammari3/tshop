"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { collection, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { auth, DB } from "../../lib/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { useMarketplaceCart } from "../../context/MarketplaceCartContext";
import { tunisiaLocations } from "../../lib/tunisiaLocations";
import {
    FiChevronRight, FiCheck, FiLoader, FiX, FiAlertCircle,
    FiTruck, FiShield, FiUser, FiMapPin, FiPhone,
    FiLock, FiTag, FiCheckCircle, FiLogIn,
} from "react-icons/fi";
import "./checkout.css";

const RESEND_DELAY = 45;

/* ─── FIELD COMPONENTS ────────────────────────────────── */

function Field({ label, value, onChange, error, placeholder, icon, hint, inputMode, disabled }) {
    return (
        <div className="ck-field">
            <label>{label}</label>
            <div className={`ck-input-wrap ${error ? "ck-input-error" : ""} ${disabled ? "ck-input-disabled" : ""}`}>
                {icon && <span className="ck-input-icon">{icon}</span>}
                <input
                    type="text"
                    value={value}
                    inputMode={inputMode}
                    disabled={disabled}
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

/* ─── OTP MODAL (real send-otp / verify-otp flow) ────── */

function OtpModal({ phone, otp, setOtp, error, verifying, resendIn, onResend, onClose, onVerify }) {
    function setDigit(i, v) {
        const clean = v.replace(/\D/g, "").slice(-1);
        const next = [...otp];
        next[i] = clean;
        setOtp(next);
        if (clean && i < 5) document.getElementById(`ck-otp-${i + 1}`)?.focus();
    }
    function onKey(i, e) {
        if (e.key === "Backspace" && !otp[i] && i > 0) {
            document.getElementById(`ck-otp-${i - 1}`)?.focus();
        }
    }

    return (
        <div className="ck-modal-backdrop" onClick={onClose}>
            <div className="ck-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ck-modal-top">
                    <div className="ck-modal-top-left">
                        <span className="ck-modal-icon"><FiPhone size={18} /></span>
                        <div>
                            <h3>Vérification du numéro</h3>
                            <p>Dernière étape avant confirmation</p>
                        </div>
                    </div>
                    <button className="ck-modal-close" onClick={onClose} aria-label="Fermer">
                        <FiX size={16} />
                    </button>
                </div>

                <p className="ck-modal-desc">
                    Nous avons envoyé un code à 6 chiffres au <strong>{phone}</strong>.
                </p>

                <div className="ck-otp-row">
                    {otp.map((d, i) => (
                        <input
                            key={i}
                            id={`ck-otp-${i}`}
                            inputMode="numeric"
                            maxLength={1}
                            value={d}
                            onChange={(e) => setDigit(i, e.target.value)}
                            onKeyDown={(e) => onKey(i, e)}
                        />
                    ))}
                </div>

                {error && <p className="ck-otp-error">{error}</p>}

                <button type="button" className="ck-otp-verify-btn" onClick={onVerify} disabled={verifying}>
                    {verifying ? (
                        <><FiLoader className="spin-icon" size={15} /> Vérification...</>
                    ) : (
                        <><FiCheckCircle size={15} /> Vérifier et confirmer</>
                    )}
                </button>

                <div className="ck-otp-footer">
                    <button type="button" onClick={onClose}>Modifier le numéro</button>
                    {resendIn > 0 ? (
                        <span>Renvoyer dans {resendIn}s</span>
                    ) : (
                        <button type="button" onClick={onResend}>Renvoyer le code</button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── PAGE ────────────────────────────────────────────── */

export default function CheckoutPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { cart, cartSubtotal, shippingFee, cartTotal, clearCart } = useMarketplaceCart();

    const isLoggedIn = !authLoading && !!user;

    const [form, setForm] = useState({
        firstName: "", phone: "", governorate: "", delegation: "",
        address: "", notes: "", payment: "cod",
    });
    const [errors, setErrors] = useState({});
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [otpError, setOtpError] = useState("");
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [success, setSuccess] = useState(false);
    const [toast, setToast] = useState(null);
    const [resendIn, setResendIn] = useState(RESEND_DELAY);
    const resendTimerRef = useRef(null);

    /* Prefill from the logged-in account — phone is trusted already,
       so no OTP is needed for these customers. */
    useEffect(() => {
        if (isLoggedIn) {
            setForm((f) => ({
                ...f,
                firstName: f.firstName || user.name || "",
                phone: user.phone || "",
            }));
        }
    }, [isLoggedIn, user]);

    useEffect(() => () => clearInterval(resendTimerRef.current), []);

    const delegations = form.governorate ? tunisiaLocations[form.governorate] || [] : [];

    const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

    const savings = useMemo(() => cart.reduce((sum, item) => {
        if (item.selectedLot) return sum;
        const oldPrice = item.selectedVariant?.oldPrice || item.oldPrice;
        if (!oldPrice || oldPrice <= item.finalPrice) return sum;
        return sum + (oldPrice - item.finalPrice) * item.quantity;
    }, 0), [cart]);

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

        if (!isLoggedIn) {
            const cleanPhone = form.phone.replace(/\s/g, "");
            const tunisianPhoneRegex = /^[259]\d{7}$/;
            if (!tunisianPhoneRegex.test(cleanPhone)) {
                e.phone = "8 chiffres, doit commencer par 2, 5 ou 9";
            }
        }

        if (!form.governorate) e.governorate = "Sélectionnez un gouvernorat";
        if (!form.delegation) e.delegation = "Sélectionnez une délégation";
        if (form.address.trim().length < 6) e.address = "Adresse trop courte";

        setErrors(e);
        return Object.keys(e).length === 0;
    }

    /* Writes the order(s) to Firestore. Shared by the logged-in fast
       path and the post-verification guest path. */
    async function placeOrder(phone, name) {
        const batch = writeBatch(DB);
        const groupedOrders = {};

        cart.forEach((item) => {
            if (!groupedOrders[item.storeId]) {
                groupedOrders[item.storeId] = {
                    storeId: item.storeId,
                    storeName: item.storeName,
                    storeSlug: item.storeSlug,
                    shipping_fee: Number(item.shipping_fee || 0),
                    items: [],
                };
            }
            groupedOrders[item.storeId].items.push(item);
        });

        Object.values(groupedOrders).forEach((storeOrder) => {
            const orderRef = doc(collection(DB, "orders"));

            const orderItems = storeOrder.items.map((item) => {
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

            const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
            const totalAmount = subtotal + storeOrder.shipping_fee;

            batch.set(orderRef, {
                source: "marketplace",
                storeId: storeOrder.storeId,
                storeName: storeOrder.storeName,
                storeSlug: storeOrder.storeSlug,
                items: orderItems,
                itemsCount: storeOrder.items.reduce((sum, item) => sum + item.quantity, 0),
                subtotal,
                shipping_fee: storeOrder.shipping_fee,
                total_amount: totalAmount,
                clientName: name,
                clientPhone: phone,
                userId: auth.currentUser?.uid || null,
                governorate: form.governorate,
                delegation: form.delegation,
                clientAddress: form.address.trim(),
                fullAddress: `${form.address.trim()}, ${form.delegation}, ${form.governorate}`,
                notes: form.notes.trim() || null,
                payment_method: "cash_on_delivery",
                status: "pending",
                createdAt: serverTimestamp(),
            });
        });

        await batch.commit();

        setSuccess(true);
        clearCart();
        setTimeout(() => router.push("/"), 2200);
    }

    /* Form submit: logged-in customers place the order immediately;
       guests go through OTP first. */
    async function handleSubmit(ev) {
        ev.preventDefault();
        if (placingOrder || sendingOtp) return;
        if (!validate()) {
            showToast("Veuillez corriger les champs en rouge.");
            return;
        }

        if (isLoggedIn) {
            try {
                setPlacingOrder(true);
                await placeOrder(user.phone, form.firstName.trim());
            } catch (err) {
                console.error(err);
                showToast("Une erreur est survenue. Réessayez.");
            } finally {
                setPlacingOrder(false);
            }
            return;
        }

        await handleSendOtp();
    }

    async function handleSendOtp() {
        setSendingOtp(true);
        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    phone: form.phone.trim(), 
                    name: form.firstName.trim(), 
                    mode: "checkout" 
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || "Impossible d'envoyer le code.");
                return;
            }
            setOtp(["", "", "", "", "", ""]);
            setOtpError("");
            setShowOtp(true);
            startResendTimer();
        } catch {
            showToast("Connexion impossible. Vérifiez votre réseau.");
        } finally {
            setSendingOtp(false);
        }
    }

    function startResendTimer() {
        clearInterval(resendTimerRef.current);
        setResendIn(RESEND_DELAY);
        resendTimerRef.current = setInterval(() => {
            setResendIn((r) => {
                if (r <= 1) { clearInterval(resendTimerRef.current); return 0; }
                return r - 1;
            });
        }, 1000);
    }

    async function handleResend() {
        startResendTimer();
        try {
            await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    phone: form.phone.trim(), 
                    name: form.firstName.trim(), 
                    mode: "checkout"
                }),
            });
        } catch { /* silent */ }
    }

    async function handleVerifyOtp() {
        const code = otp.join("");
        if (code.length !== 6) {
            setOtpError("Saisissez les 6 chiffres.");
            return;
        }
        setOtpError("");
        setVerifying(true);

        try {
            const cleanPhone = form.phone.replace(/\s/g, "");
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: cleanPhone,
                    code,
                    name: form.firstName.trim(),
                    mode: "checkout",
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setOtpError(data.error || "Code incorrect.");
                setOtp(["", "", "", "", "", ""]);
                return;
            }

            await signInWithCustomToken(auth, data.token);

            setShowOtp(false);
            await placeOrder(cleanPhone, form.firstName.trim());
        } catch (err) {
            console.error(err);
            setOtpError("Une erreur est survenue. Réessayez.");
        } finally {
            setVerifying(false);
        }
    }

    /* EMPTY */
    if (cart.length === 0 && !success) {
        return (
            <div className="ck-page">
                <div className="ck-empty">
                    <h1>Votre panier est vide</h1>
                    <p>Ajoutez des produits avant de passer commande.</p>
                    <Link href="/" className="ck-btn-primary-full">Retour à la boutique</Link>
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
                <Link href="/" className="ck-breadcrumb-link">Accueil</Link>
                <FiChevronRight size={13} />
                <Link href="/cart" className="ck-breadcrumb-link">Mon panier</Link>
                <FiChevronRight size={13} />
                <span className="ck-breadcrumb-current">Commande</span>
            </nav>

            {/* TITLE + STEPPER */}
            <div className="ck-title-row">
                <div>
                    <h1 className="ck-title">Finaliser ma commande</h1>
                </div>
                <ol className="ck-stepper">
                    <li className="ck-step">
                        <span className="ck-step-num ck-step-num-done">1</span>
                        Panier
                    </li>
                    <span className="ck-step-sep">—</span>
                    <li className="ck-step ck-step-active">
                        <span className="ck-step-num ck-step-num-active">2</span>
                        Livraison
                    </li>
                    <span className="ck-step-sep">—</span>
                    <li className="ck-step">
                        <span className="ck-step-num">3</span>
                        {isLoggedIn ? "Confirmation" : "Vérification"}
                    </li>
                </ol>
            </div>

            <form onSubmit={handleSubmit} className="ck-layout">

                {/* FORM */}
                <section className="ck-form-col">

                    <div className="ck-card">
                        <div className="ck-card-title">
                            <FiUser size={15} /> <h2>Informations personnelles</h2>
                        </div>

                        {isLoggedIn && (
                            <div className="ck-logged-banner">
                                <FiLogIn size={14} />
                                Connecté en tant que <strong>{user.name || user.phone}</strong>
                            </div>
                        )}

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
                                disabled={isLoggedIn}
                                hint={isLoggedIn ? "Numéro de votre compte." : "Un code de vérification vous sera envoyé."}
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

                    <button type="submit" className="ck-place-order-btn" disabled={placingOrder || sendingOtp}>
                        {placingOrder || sendingOtp ? (
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
                            {savings > 0 && (
                                <div className="ck-summary-row ck-summary-row-savings">
                                    <dt><FiTag size={13} /> Économies</dt>
                                    <dd>-{savings.toFixed(2)} TND</dd>
                                </div>
                            )}
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

            {showOtp && (
                <OtpModal
                    phone={form.phone}
                    otp={otp}
                    setOtp={setOtp}
                    error={otpError}
                    verifying={verifying}
                    resendIn={resendIn}
                    onResend={handleResend}
                    onClose={() => setShowOtp(false)}
                    onVerify={handleVerifyOtp}
                />
            )}
        </div>
    );
}