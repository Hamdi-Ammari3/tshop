"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../../lib/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import {FiArrowLeft, FiLoader, FiPhone, FiUser,FiShield, FiTruck, FiShoppingBag} from "react-icons/fi";
import "./login.css";

const RESEND_DELAY = 45;

export default function LoginPage() {

    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    /* ── mode: "login" | "signup" ── */
    const [mode,     setMode]     = useState("login");

    /* ── step: "form" | "otp" | "success" ── */
    const [step,     setStep]     = useState("form");

    /* ── fields ── */
    const [fullName, setFullName] = useState("");
    const [phone,    setPhone]    = useState("");
    const [otp,      setOtp]      = useState(["", "", "", "", "", ""]);

    /* ── async ── */
    const [resendIn,     setResendIn]     = useState(RESEND_DELAY);
    const [sendingOtp,   setSendingOtp]   = useState(false);
    const [verifying,    setVerifying]    = useState(false);
    const [error,        setError]        = useState("");

    const otpRefs        = useRef([]);
    const resendTimerRef = useRef(null);

    /* ── derived ── */
    const isSignup  = mode === "signup";
    const otpFilled = otp.every((d) => d.length === 1);

    const canSubmit = isSignup
        ? fullName.trim().length >= 2 && /^[0-9]{8}$/.test(phone.trim())
        : /^[0-9]{8}$/.test(phone.trim());

    /* ── auto-redirect if already logged in ── */
    useEffect(() => {
        if (authLoading || !user) return;
        if (user.storeId) router.replace("/dashboard");
        else router.replace("/onboarding");
    }, [user, authLoading, router]);

    /* ── reset form when switching modes ── */
    const switchMode = (newMode) => {
        if (newMode === mode) return;
        setMode(newMode);
        setStep("form");
        setFullName("");
        setPhone("");
        setOtp(["", "", "", "", "", ""]);
        setError("");
        clearInterval(resendTimerRef.current);
    };

    /* ── resend timer ── */
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
        const next  = [...otp];
        next[i]     = digit;
        setOtp(next);
        if (digit && i < 5) otpRefs.current[i + 1]?.focus();
    };

    const handleOtpKey = (i, e) => {
        if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const text  = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const next  = [...otp];
        text.split("").forEach((d, i) => { if (i < 6) next[i] = d; });
        setOtp(next);
        otpRefs.current[Math.min(text.length, 5)]?.focus();
    };

    /* ── STEP 1: send OTP ── */
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!canSubmit || sendingOtp) return;
        setError("");
        setSendingOtp(true);

        try {
            const res  = await fetch("/api/auth/send-otp", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: phone.trim(), mode }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Impossible d'envoyer le code."); return; }

            setOtp(["", "", "", "", "", ""]);
            setStep("otp");
            startResendTimer();
            setTimeout(() => otpRefs.current[0]?.focus(), 100);

        } catch {
            setError("Connexion impossible. Vérifiez votre réseau.");
        } finally {
            setSendingOtp(false);
        }
    };

    /* ── STEP 2: verify OTP ── */
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpFilled || verifying) return;
        setError("");
        setVerifying(true);

        try {
            const res  = await fetch("/api/auth/verify-otp", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    phone: phone.trim(),
                    code:  otp.join(""),
                    name:  isSignup ? fullName.trim() : "",
                    mode,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Code incorrect.");
                setOtp(["", "", "", "", "", ""]);
                otpRefs.current[0]?.focus();
                return;
            }

            /* Login mode: if no user doc exists yet, the server creates one with empty name.
               We check for this and redirect to onboarding so they can complete their profile. */
            await signInWithCustomToken(auth, data.token);
            setStep("success");

            setTimeout(() => {
                if (data.user?.storeId) router.replace("/dashboard");
                else router.replace("/onboarding");
            }, 1500);

        } catch {
            setError("Connexion impossible. Vérifiez votre réseau.");
        } finally {
            setVerifying(false);
        }
    };

    /* ── resend ── */
    const handleResend = async () => {
        startResendTimer();
        setError("");
        try {
            await fetch("/api/auth/send-otp", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ phone: phone.trim() }),
            });
        } catch { /* silent */ }
    };

    /* ── loading auth ── */
    if (authLoading) {
        return (
            <div className="login-loading-page">
                <FiLoader className="spin-icon" size={28} />
                <p>Chargement...</p>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-grid">

                {/* ── LEFT PANEL ── */}
                <aside className="login-panel">
                    <div className="login-panel-brand">
                        <div className="login-panel-logo">T</div>
                        <span className="login-panel-logo-name">-Shop</span>
                    </div>

                    <div className="login-panel-body">
                        <h1 className="login-panel-title">
                            Bienvenue sur la marketplace n°1 en Tunisie.
                        </h1>
                        <p className="login-panel-subtitle">
                            Connectez-vous en quelques secondes avec votre numéro de téléphone. Pas de mot de passe.
                        </p>
                        <ul className="login-panel-features">
                            <li>
                                <div className="login-panel-icon"><FiShield size={16} /></div>
                                <div>
                                    <p className="login-panel-feature-title">Connexion sécurisée par SMS</p>
                                    <p className="login-panel-feature-desc">Un code unique envoyé à votre numéro tunisien.</p>
                                </div>
                            </li>
                            <li>
                                <div className="login-panel-icon"><FiTruck size={16} /></div>
                                <div>
                                    <p className="login-panel-feature-title">Suivi de vos commandes</p>
                                    <p className="login-panel-feature-desc">Retrouvez votre historique et adresses de livraison.</p>
                                </div>
                            </li>
                            <li>
                                <div className="login-panel-icon"><FiShoppingBag size={16} /></div>
                                <div>
                                    <p className="login-panel-feature-title">Devenez vendeur</p>
                                    <p className="login-panel-feature-desc">Ouvrez votre boutique et vendez partout en Tunisie.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <p className="login-panel-footer">
                        © {new Date().getFullYear()} T-Shop — Tunis, Tunisie
                    </p>
                </aside>

                {/* ── RIGHT CARD ── */}
                <section className="login-card-wrapper">
                    <div className="login-card">

                        {/* ── MODE TABS ── */}
                        {step === "form" && (
                            <div className="login-tabs">
                                <button
                                    type="button"
                                    className={`login-tab ${mode === "login" ? "login-tab-active" : ""}`}
                                    onClick={() => switchMode("login")}
                                >
                                    Connexion
                                </button>
                                <button
                                    type="button"
                                    className={`login-tab ${mode === "signup" ? "login-tab-active" : ""}`}
                                    onClick={() => switchMode("signup")}
                                >
                                    Inscription
                                </button>
                            </div>
                        )}

                        {/* ══════════════════════════════
                            STEP: FORM
                        ══════════════════════════════ */}
                        {step === "form" && (
                            <>
                                <div className="login-card-header">
                                    <h2>
                                        {isSignup ? "Créer un compte" : "Content de vous revoir"}
                                    </h2>
                                    <p>
                                        {isSignup
                                            ? "Renseignez vos informations pour créer votre compte."
                                            : "Entrez votre numéro pour recevoir un code de connexion."}
                                    </p>
                                </div>

                                {error && <div className="login-error">{error}</div>}

                                <form onSubmit={handleSendOtp} className="login-form">

                                    {/* Name — signup only */}
                                    {isSignup && (
                                        <div className="login-field">
                                            <label>Nom complet</label>
                                            <div className="login-input-wrap">
                                                <FiUser size={16} className="login-input-icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Ex : Mohamed Ben Ali"
                                                    value={fullName}
                                                    autoFocus={isSignup}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Phone — always */}
                                    <div className="login-field">
                                        <label>Numéro de téléphone</label>
                                        <div className="login-input-wrap">
                                            <span className="login-phone-prefix">
                                                <span className="login-phone-flag">🇹🇳</span>
                                                +216
                                            </span>
                                            <div className="login-phone-divider" />
                                            <FiPhone size={16} className="login-input-icon" />
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={8}
                                                placeholder="12 345 678"
                                                value={phone}
                                                autoFocus={!isSignup}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                                            />
                                        </div>
                                        <span className="login-field-hint">Numéro tunisien à 8 chiffres.</span>
                                    </div>

                                    <button
                                        type="submit"
                                        className="login-btn-primary"
                                        disabled={!canSubmit || sendingOtp}
                                    >
                                        {sendingOtp
                                            ? <><FiLoader className="spin-icon" size={16} /> Envoi en cours...</>
                                            : "Recevoir le code SMS"}
                                    </button>

                                </form>

                                <p className="login-footer-text">
                                    {isSignup ? (
                                        <>Vous avez déjà un compte ?{" "}
                                            <button type="button" className="login-mode-link" onClick={() => switchMode("login")}>
                                                Connexion
                                            </button>
                                        </>
                                    ) : (
                                        <>Pas encore de compte ?{" "}
                                            <button type="button" className="login-mode-link" onClick={() => switchMode("signup")}>
                                                Créer un compte
                                            </button>
                                        </>
                                    )}
                                </p>

                                {/* Terms — signup only */}
                                {isSignup && (
                                    <p className="login-terms">
                                        En créant un compte, vous acceptez nos{" "}
                                        <a href="#">conditions d'utilisation</a> et notre{" "}
                                        <a href="#">politique de confidentialité</a>.
                                    </p>
                                )}
                            </>
                        )}

                        {/* ══════════════════════════════
                            STEP: OTP
                        ══════════════════════════════ */}
                        {step === "otp" && (
                            <>
                                <button
                                    type="button"
                                    className="login-back-step"
                                    onClick={() => { setStep("form"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                                >
                                    <FiArrowLeft size={14} />
                                    Modifier le numéro
                                </button>

                                <div className="login-otp-icon"><FiPhone size={24} /></div>

                                <div className="login-card-header">
                                    <h2>Vérifiez votre numéro</h2>
                                    <p>
                                        Nous avons envoyé un code à 6 chiffres au{" "}
                                        <strong>+216 {phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}</strong>.
                                    </p>
                                </div>

                                {error && <div className="login-error">{error}</div>}

                                <form onSubmit={handleVerifyOtp} className="login-form">
                                    <div className="login-field">
                                        <label>Code de vérification</label>
                                        <div className="login-otp-row" onPaste={handleOtpPaste}>
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
                                                    className="login-otp-input"
                                                    autoComplete="one-time-code"
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="login-btn-primary"
                                        disabled={!otpFilled || verifying}
                                    >
                                        {verifying
                                            ? <><FiLoader className="spin-icon" size={16} /> Vérification...</>
                                            : isSignup ? "Créer mon compte" : "Se connecter"}
                                    </button>

                                    <p className="login-resend">
                                        {resendIn > 0 ? (
                                            <>Code non reçu ? Renvoyer dans <strong>{resendIn}s</strong></>
                                        ) : (
                                            <button type="button" className="login-resend-btn" onClick={handleResend}>
                                                Renvoyer le code
                                            </button>
                                        )}
                                    </p>
                                </form>
                            </>
                        )}

                        {/* ══════════════════════════════
                            STEP: SUCCESS
                        ══════════════════════════════ */}
                        {step === "success" && (
                            <div className="login-success">
                                <div className="login-success-icon">✓</div>
                                <h2>
                                    {isSignup
                                        ? `Bienvenue ${fullName.split(" ")[0]} !`
                                        : "Connexion réussie !"}
                                </h2>
                                <p>
                                    {isSignup
                                        ? "Votre compte a été créé avec succès."
                                        : "Vous êtes maintenant connecté."}
                                </p>
                                <div className="login-success-badge">
                                    <FiLoader className="spin-icon" size={14} />
                                    Redirection en cours...
                                </div>
                            </div>
                        )}

                    </div>
                </section>

            </div>
        </div>
    );
}