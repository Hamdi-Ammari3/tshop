"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth, DB } from "../../lib/firebaseConfig";
import { uploadToCloudinary } from "../../lib/uploadToCloudinary";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import {
    FiArrowLeft, FiUpload, FiCheck, FiShoppingBag, FiX,
    FiAlertCircle, FiPhone, FiGlobe, FiLoader, FiStar,
    FiPackage, FiMapPin, FiMessageCircle, FiZap, FiShield,
    FiImage, FiUser,
} from "react-icons/fi";
import "./onboarding.css";

const RESEND_DELAY = 60;

function slugify(s) {
    return s.toLowerCase().normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 32);
}

export default function Onboarding() {

    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { setStore, setLoading } = useStore();

    const logoInputRef = useRef(null);
    const otpRefs = useRef([]);
    const resendTimerRef = useRef(null);

    /* ── Form state ── */
    const [storeName, setStoreName] = useState("");
    const [customSlug, setCustomSlug] = useState("");
    const [slugTouched, setSlugTouched] = useState(false);
    const [logo, setLogo] = useState(null);
    const [phone, setPhone] = useState("");
    const [hasWhatsapp, setHasWhatsapp] = useState(true);

    /* ── Slug validation ── */
    const [checkingSlug, setCheckingSlug] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState(true);

    /* ── OTP modal (only for non-logged-in users) ── */
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [resendIn, setResendIn] = useState(RESEND_DELAY);

    /* ── Async state ── */
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [done, setDone] = useState(false);

    /* ── Toast ── */
    const [toast, setToast] = useState(null);

    /* ── Derived ── */
    const autoSlug = slugify(storeName);
    const slug = (slugTouched ? customSlug : autoSlug) || "";
    const domain = slug ? `${slug}.tunishop.com` : "maboutique.tunishop.com";
    const initial = (storeName.trim()[0] || "T").toUpperCase();
    const otpFilled = otp.every((d) => d.length === 1);

    // For logged-in users: use their stored phone, no phone input needed
    const isLoggedIn = !!user;
    const effectivePhone = isLoggedIn ? (user.phone?.replace(/^\+216/, "") || "") : phone;

    const canSubmit =
        storeName.trim().length >= 2 &&
        slug.length >= 2 &&
        slugAvailable &&
        (isLoggedIn
            ? !!user.phone                          // Case 3: just need phone on account
            : /^[0-9]{8}$/.test(phone.trim()));     // Case 1 & 2: need valid phone input

    /* ── Redirect if already has store ── */
    useEffect(() => {
        if (!user) return;
        if (user.storeId) router.replace("/dashboard");
    }, [user, router]);

    /* ── Slug check ── */
    useEffect(() => {
        async function checkSlug() {
            if (!slug || slug.length < 3) { setSlugAvailable(false); return; }
            const reserved = ["admin", "dashboard", "login", "api", "support", "tunishop"];
            if (reserved.includes(slug)) { setSlugAvailable(false); return; }
            try {
                setCheckingSlug(true);
                const snap = await getDoc(doc(DB, "stores", slug));
                setSlugAvailable(!snap.exists());
            } catch { /* ignore */ }
            finally { setCheckingSlug(false); }
        }
        const t = setTimeout(checkSlug, 500);
        return () => clearTimeout(t);
    }, [slug]);

    /* ── Cleanup blob URLs ── */
    useEffect(() => {
        return () => {
            if (logo?.preview?.startsWith("blob:")) URL.revokeObjectURL(logo.preview);
        };
    }, []);

    /* ── Toast helper ── */
    const showToast = (message, type = "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    /* ── Logo handlers ── */
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { showToast("Veuillez sélectionner une image"); return; }
        if (logo?.preview?.startsWith("blob:")) URL.revokeObjectURL(logo.preview);
        setLogo({ file, preview: URL.createObjectURL(file) });
        e.target.value = "";
    };

    const removeLogo = () => {
        if (logo?.preview?.startsWith("blob:")) URL.revokeObjectURL(logo.preview);
        setLogo(null);
    };

    /* ── Resend timer ── */
    const startResendTimer = () => {
        clearInterval(resendTimerRef.current);
        setResendIn(RESEND_DELAY);
        resendTimerRef.current = setInterval(() => {
            setResendIn((r) => {
                if (r <= 1) { clearInterval(resendTimerRef.current); return 0; }
                return r - 1;
            });
        }, 1000);
    };
    useEffect(() => () => clearInterval(resendTimerRef.current), []);

    /* ── OTP input handlers ── */
    const handleOtpChange = (i, value) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const next = [...otp];
        next[i] = digit;
        setOtp(next);
        if (digit && i < 5) otpRefs.current[i + 1]?.focus();
    };

    const handleOtpKey = (i, e) => {
        if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const next = [...otp];
        text.split("").forEach((d, i) => { if (i < 6) next[i] = d; });
        setOtp(next);
        otpRefs.current[Math.min(text.length, 5)]?.focus();
    };

    /* ── Shared: upload logo + create store + update user doc ── */
    const createStore = async (uid, storeName, storePhone) => {

        let logoUrl = "";
        if (logo?.file) {
            const url = await uploadToCloudinary(
                logo.file,
                (pct) => setUploadProgress(Math.round(pct))
            );
            logoUrl = url.replace("/upload/", "/upload/f_webp,q_auto,w_1200/");
        }

        const createdAt = new Date();

        await setDoc(doc(DB, "stores", slug), {
            name: storeName.trim(),
            phone: storePhone,
            hasWhatsapp,
            slug,
            logo: logoUrl,
            ownerId: uid,
            shipping_fee: 8,
            rating: { average: 0, count: 0, total: 0 },
            aiPostsCount: 0,
            ordersQuota: 20,
            createdAt,
        });

        // Link store to user doc
        await setDoc(doc(DB, "users", uid), { storeId: slug }, { merge: true });

        // Hydrate StoreContext instantly
        setStore({
            id: slug, name: storeName.trim(), phone: storePhone, hasWhatsapp,
            slug, logo: logoUrl, ownerId: uid, shipping_fee: 8,
            rating: { average: 0, count: 0, total: 0 },
            aiPostsCount: 0, ordersQuota: 100, createdAt,
        });
        setLoading(false);
    };

    /* ────────────────────────────────────────────────────────────
       CASE 3 — Already logged in: submit directly, no OTP
    ──────────────────────────────────────────────────────────── */
    const handleLoggedInSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || submitting) return;

        // Final slug check
        const snap = await getDoc(doc(DB, "stores", slug));
        if (snap.exists()) { showToast("Ce nom de boutique est déjà utilisé."); return; }

        setSubmitting(true);
        try {
            await createStore(user.uid, storeName, user.phone);
            setDone(true);
            setTimeout(() => router.replace("/dashboard"), 1800);
        } catch (err) {
            console.error(err);
            showToast("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setSubmitting(false);
            setUploadProgress(0);
        }
    };

    /* ────────────────────────────────────────────────────────────
       CASE 1 & 2 — Not logged in: send OTP first
    ──────────────────────────────────────────────────────────── */
    const handleGuestSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || sendingOtp) return;

        const snap = await getDoc(doc(DB, "stores", slug));
        if (snap.exists()) { showToast("Ce nom de boutique est déjà utilisé."); return; }

        setSendingOtp(true);
        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: phone.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { showToast(data.error || "Impossible d'envoyer le code."); return; }

            setOtp(["", "", "", "", "", ""]);
            setShowOtp(true);
            startResendTimer();
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch {
            showToast("Connexion impossible. Vérifiez votre réseau.");
        } finally {
            setSendingOtp(false);
        }
    };

    /* ── Resend OTP ── */
    const handleResend = async () => {
        startResendTimer();
        try {
            await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: phone.trim() }),
            });
        } catch { /* silent */ }
    };

    /* ────────────────────────────────────────────────────────────
       CASE 1 & 2 — Verify OTP → sign in → create store
    ──────────────────────────────────────────────────────────── */
    const handleVerify = async (e) => {
        e.preventDefault();
        if (!otpFilled || verifying) return;

        setVerifying(true);
        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: phone.trim(),
                    code: otp.join(""),
                    name: storeName.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || "Code incorrect.");
                setOtp(["", "", "", "", "", ""]);
                otpRefs.current[0]?.focus();
                return;
            }

            // Sign into Firebase with custom token
            await signInWithCustomToken(auth, data.token);

            setSubmitting(true);

            // Use the E.164 phone from the verified response
            const storePhone = `+216${phone.trim()}`;
            await createStore(data.user.uid, storeName, storePhone);

            setDone(true);
            setTimeout(() => router.replace("/dashboard"), 1800);

        } catch (err) {
            console.error(err);
            showToast("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setVerifying(false);
            setSubmitting(false);
            setUploadProgress(0);
        }
    };

    const previewProducts = useMemo(() => [
        { name: "Produit vedette", price: "89 TND" },
        { name: "Nouveauté", price: "129 TND" },
        { name: "Best-seller", price: "59 TND" },
        { name: "Coup de cœur", price: "199 TND" },
    ], []);

    if (authLoading) {
        return (
            <div className="ob-loading">
                <FiLoader className="spin-icon" size={28} />
                <p>Chargement...</p>
            </div>
        );
    }

    // Pick the right submit handler based on auth state
    const handleFormSubmit = isLoggedIn ? handleLoggedInSubmit : handleGuestSubmit;
    const isWorking = submitting || sendingOtp;

    return (
        <div className="ob-page">

            {/* ── HERO HEADER ── */}
            <section className="ob-hero">
                <div className="ob-hero-inner">
                    <Link href="/" className="ob-back-btn">
                        <FiArrowLeft size={14} /> Retour à l'accueil
                    </Link>
                    <div className="ob-hero-content">
                        <div>
                            <div className="ob-hero-badge">
                                <FiShoppingBag size={13} /> Espace vendeurs
                            </div>
                            <h1>Créez votre boutique en ligne en quelques minutes</h1>
                            <p>
                                Choisissez votre domaine <strong>.tunishop.com</strong>,
                                personnalisez votre boutique et commencez à vendre partout en Tunisie.
                            </p>
                        </div>
                        <div className="ob-hero-pills">
                            <span><FiZap size={12} color="#006de2" /> Sans frais fixes</span>
                            <span><FiStar size={12} color="#006de2" /> +150K acheteurs/mois</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── MAIN GRID ── */}
            <div className="ob-grid">

                {/* ── LEFT: FORM ── */}
                <form className="ob-form-card" onSubmit={handleFormSubmit}>

                    <div className="ob-form-head">
                        <h2>Informations de votre boutique</h2>
                        <p>Ces informations seront affichées publiquement sur votre boutique.</p>
                    </div>

                    {/* LOGO */}
                    <div className="ob-field">
                        <label>Logo de la boutique <span className="ob-optional">(optionnel)</span></label>
                        <div className="ob-logo-row">
                            <div
                                className="ob-logo-preview"
                                onClick={() => !isWorking && logoInputRef.current?.click()}
                            >
                                {logo ? (
                                    <>
                                        <img src={logo.preview} alt="logo" />
                                        <button
                                            type="button"
                                            className="ob-logo-remove"
                                            onClick={(e) => { e.stopPropagation(); removeLogo(); }}
                                        >
                                            <FiX size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <span className="ob-logo-initial">{initial}</span>
                                )}
                            </div>
                            <div className="ob-logo-actions">
                                <button type="button" className="ob-upload-btn" onClick={() => logoInputRef.current?.click()}>
                                    <FiUpload size={13} />
                                    {logo ? "Changer le logo" : "Téléverser un logo"}
                                </button>
                                {logo && (
                                    <button type="button" className="ob-remove-text" onClick={removeLogo}>
                                        <FiX size={12} /> Retirer
                                    </button>
                                )}
                                <p className="ob-upload-hint">Sans logo, la première lettre sera utilisée comme avatar.</p>
                            </div>
                        </div>
                        <input type="file" accept="image/*" hidden ref={logoInputRef} onChange={handleImageChange} />
                    </div>

                    {/* STORE NAME */}
                    <div className="ob-field">
                        <label>Nom de la boutique</label>
                        <div className="ob-input-wrap">
                            <FiShoppingBag size={15} className="ob-input-icon" />
                            <input
                                type="text"
                                placeholder="Ex : Amina Fashion"
                                value={storeName}
                                maxLength={40}
                                onChange={(e) => setStoreName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* DOMAIN */}
                    <div className="ob-field">
                        <label>Nom de domaine</label>
                        <div className="ob-domain-wrap">
                            <span className="ob-domain-icon"><FiGlobe size={15} /></span>
                            <input
                                type="text"
                                placeholder="maboutique"
                                value={slug}
                                onChange={(e) => {
                                    setSlugTouched(true);
                                    setCustomSlug(slugify(e.target.value));
                                }}
                            />
                            <span className="ob-domain-suffix">.tunishop.com</span>
                        </div>
                        <div className="ob-slug-row">
                            <FiCheck size={12} className="ob-slug-check" />
                            <span className="ob-slug-preview">{domain}</span>
                            {slug.length >= 3 && (
                                <span className={`ob-slug-status ${slugAvailable ? "ob-available" : "ob-taken"}`}>
                                    {checkingSlug ? (
                                        <><span className="ob-slug-spinner" /> Vérification...</>
                                    ) : slugAvailable ? "Disponible" : "Déjà utilisé"}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── PHONE SECTION — conditional on auth state ── */}
                    {isLoggedIn ? (

                        /* CASE 3: show account info card, no phone input */
                        <div className="ob-field">
                            <label>Numéro de téléphone du vendeur</label>
                            <div className="ob-account-card">
                                <div className="ob-account-avatar">
                                    {(user.name?.charAt(0) || "U").toUpperCase()}
                                </div>
                                <div className="ob-account-info">
                                    <p className="ob-account-name">{user.name || "Utilisateur"}</p>
                                    <p className="ob-account-phone">
                                        <FiPhone size={12} />
                                        {user.phone
                                            ? user.phone.replace(/^\+216/, "+216 ").replace(/(\+216 )(\d{2})(\d{3})(\d{3})/, "$1$2 $3 $4")
                                            : "Numéro non disponible"}
                                    </p>
                                </div>
                                <span className="ob-account-badge">
                                    <FiCheck size={11} /> Connecté
                                </span>
                            </div>

                            {/* WhatsApp toggle still shown */}
                            <label className="ob-whatsapp-label">
                                <input
                                    type="checkbox"
                                    checked={hasWhatsapp}
                                    onChange={(e) => setHasWhatsapp(e.target.checked)}
                                />
                                <div>
                                    <span className="ob-whatsapp-title">
                                        <FiMessageCircle size={13} className="ob-whatsapp-icon" />
                                        Ce numéro est lié à un compte WhatsApp
                                    </span>
                                    <span className="ob-whatsapp-desc">
                                        Les acheteurs pourront vous contacter directement sur WhatsApp.
                                    </span>
                                </div>
                            </label>
                        </div>

                    ) : (

                        /* CASE 1 & 2: show phone input + WhatsApp toggle */
                        <div className="ob-field">
                            <label>Numéro de téléphone du vendeur</label>
                            <div className="ob-phone-wrap">
                                <span className="ob-phone-prefix">
                                    <span>🇹🇳</span> +216
                                </span>
                                <div className="ob-phone-divider" />
                                <FiPhone size={15} className="ob-input-icon" />
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={8}
                                    placeholder="12 345 678"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                                />
                            </div>
                            <label className="ob-whatsapp-label">
                                <input
                                    type="checkbox"
                                    checked={hasWhatsapp}
                                    onChange={(e) => setHasWhatsapp(e.target.checked)}
                                />
                                <div>
                                    <span className="ob-whatsapp-title">
                                        <FiMessageCircle size={13} className="ob-whatsapp-icon" />
                                        Ce numéro est lié à un compte WhatsApp
                                    </span>
                                    <span className="ob-whatsapp-desc">
                                        Les acheteurs pourront vous contacter directement sur WhatsApp.
                                    </span>
                                </div>
                            </label>
                        </div>

                    )}

                    {/* TOAST */}
                    {toast && (
                        <div className={`ob-toast ob-toast-${toast.type}`}>
                            <div className="ob-toast-left">
                                <div className="ob-toast-icon"><FiAlertCircle size={18} /></div>
                                <p>{toast.message}</p>
                            </div>
                            <button type="button" className="ob-toast-close" onClick={() => setToast(null)}>
                                <FiX size={16} />
                            </button>
                        </div>
                    )}

                    {/* SUBMIT */}
                    <button type="submit" className="ob-submit-btn" disabled={!canSubmit || isWorking}>
                        {isWorking ? (
                            <>
                                <FiLoader className="spin-icon" size={16} />
                                {uploadProgress > 0 ? `Création... ${uploadProgress}%` : "Création..."}
                            </>
                        ) : sendingOtp ? (
                            <><FiLoader className="spin-icon" size={16} /> Envoi du code...</>
                        ) : (
                            <><FiZap size={16} /> Créer ma boutique</>
                        )}
                    </button>

                    {/* hint under button differs by auth state */}
                    <p className="ob-legal">
                        {isLoggedIn
                            ? <>Votre boutique sera liée à votre compte existant.</>
                            : <>En créant votre boutique, vous acceptez les{" "}
                                <a href="#">conditions vendeurs</a> et la{" "}
                                <a href="#">politique de commissions</a>.</>
                        }
                    </p>

                </form>

                {/* ── RIGHT: LIVE PREVIEW ── */}
                <div className="ob-preview-col">
                    <div className="ob-preview-label">
                        <span className="ob-preview-dot" />
                        Aperçu en direct
                        <span className="ob-preview-sub">Ce que verront vos clients</span>
                    </div>

                    <div className="ob-preview-card">
                        <div className="ob-browser-bar">
                            <span className="ob-browser-dot ob-dot-red" />
                            <span className="ob-browser-dot ob-dot-yellow" />
                            <span className="ob-browser-dot ob-dot-green" />
                            <div className="ob-browser-url">https://{domain}</div>
                        </div>

                        <div className="ob-store-body">
                            <div className="ob-store-header-row">
                                <div className="ob-store-logo">
                                    {logo ? <img src={logo.preview} alt="logo" /> : <span>{initial}</span>}
                                </div>
                                <div className="ob-store-meta">
                                    <h3>{storeName || "Nom de votre boutique"}</h3>
                                    <p><FiGlobe size={11} /> {domain}</p>
                                </div>
                            </div>

                            <div className="ob-store-stats">
                                <div>
                                    <span><FiStar size={12} className="ob-stat-star" /> Rating</span>
                                    <small>Note</small>
                                </div>
                                <div>
                                    <span><FiPackage size={12} /> 0</span>
                                    <small>Produits</small>
                                </div>
                                <div>
                                    <span><FiMapPin size={12} /> Tunisie</span>
                                    <small>Localisation</small>
                                </div>
                            </div>

                            <div className="ob-store-contact">
                                <span className="ob-contact-phone">
                                    <FiPhone size={11} />
                                    {effectivePhone ? `+216 ${effectivePhone}` : "+216 · · ·"}
                                </span>
                                {hasWhatsapp && (
                                    <span className="ob-contact-wa">
                                        <FiMessageCircle size={11} /> WhatsApp
                                    </span>
                                )}
                            </div>

                            <div className="ob-preview-products-label">Vos produits apparaîtront ici</div>
                            <div className="ob-preview-grid">
                                {previewProducts.map((p, i) => (
                                    <div key={i} className="ob-preview-product">
                                        <div className="ob-preview-product-img"><FiImage size={20} /></div>
                                        <p>{p.name}</p>
                                        <strong>{p.price}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="ob-preview-note">
                        <FiShield size={13} />
                        {isLoggedIn
                            ? "Votre identité est déjà vérifiée — création instantanée."
                            : "Vérification par SMS requise pour activer votre boutique."}
                    </p>
                </div>

            </div>

            {/* ── OTP MODAL (Case 1 & 2 only) ── */}
            {showOtp && (
                <div className="ob-modal-backdrop">
                    <div className="ob-modal">
                        {!done ? (
                            <>
                                <div className="ob-modal-head">
                                    <div>
                                        <div className="ob-modal-icon"><FiPhone size={22} /></div>
                                        <h3>Vérifiez votre numéro</h3>
                                        <p>
                                            Un code à 6 chiffres a été envoyé au{" "}
                                            <strong>+216 {phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}</strong>.
                                        </p>
                                    </div>
                                    <button type="button" className="ob-modal-close" onClick={() => setShowOtp(false)}>
                                        <FiX size={16} />
                                    </button>
                                </div>

                                <form onSubmit={handleVerify}>
                                    <div className="ob-otp-row" onPaste={handleOtpPaste}>
                                        {otp.map((d, i) => (
                                            <input
                                                key={i}
                                                ref={(el) => (otpRefs.current[i] = el)}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={d}
                                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                                onKeyDown={(e) => handleOtpKey(i, e)}
                                                className="ob-otp-box"
                                                autoComplete="one-time-code"
                                            />
                                        ))}
                                    </div>

                                    <button
                                        type="submit"
                                        className="ob-modal-submit"
                                        disabled={!otpFilled || verifying}
                                    >
                                        {verifying ? (
                                            <>
                                                <FiLoader className="spin-icon" size={16} />
                                                {submitting && uploadProgress > 0
                                                    ? `Création... ${uploadProgress}%`
                                                    : "Vérification..."}
                                            </>
                                        ) : (
                                            <><FiCheck size={16} /> Vérifier et créer ma boutique</>
                                        )}
                                    </button>

                                    <p className="ob-resend">
                                        {resendIn > 0 ? (
                                            <>Vous n'avez pas reçu le code ? Renvoyer dans <strong>{resendIn}s</strong></>
                                        ) : (
                                            <button type="button" className="ob-resend-btn" onClick={handleResend}>
                                                Renvoyer le code
                                            </button>
                                        )}
                                    </p>
                                </form>
                            </>
                        ) : (
                            <div className="ob-modal-success">
                                <div className="ob-success-icon">✓</div>
                                <h3>Boutique créée avec succès !</h3>
                                <p>
                                    Votre boutique <strong>{storeName}</strong> est en ligne sur{" "}
                                    <span className="ob-success-domain">{domain}</span>.
                                </p>
                                <div className="ob-success-badge">
                                    <FiLoader className="spin-icon" size={13} /> Redirection en cours...
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── INLINE SUCCESS (Case 3 — logged-in user) ── */}
            {done && isLoggedIn && (
                <div className="ob-modal-backdrop">
                    <div className="ob-modal">
                        <div className="ob-modal-success">
                            <div className="ob-success-icon">✓</div>
                            <h3>Boutique créée avec succès !</h3>
                            <p>
                                Votre boutique <strong>{storeName}</strong> est en ligne sur{" "}
                                <span className="ob-success-domain">{domain}</span>.
                            </p>
                            <div className="ob-success-badge">
                                <FiLoader className="spin-icon" size={13} /> Redirection en cours...
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}