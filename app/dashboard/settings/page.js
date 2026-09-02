"use client";

import { useEffect, useState } from "react";
import {
    FiUpload, FiSave, FiPhone, FiTruck, FiCheckCircle,
    FiX, FiAlertCircle, FiLoader, FiMessageCircle, FiShoppingBag,
} from "react-icons/fi";
import { doc, updateDoc } from "firebase/firestore";
import { DB } from "../../../lib/firebaseConfig";
import { uploadToCloudinary } from "../../../lib/uploadToCloudinary";
import { useStore } from "../../../context/StoreContext";
import "./settings.css";

export default function SettingsPage() {

    const { store } = useStore();

    const [name,         setName]         = useState("");
    const [phone,        setPhone]        = useState("");
    const [hasWhatsapp,  setHasWhatsapp]  = useState(false);
    const [shippingFee,  setShippingFee]  = useState(8);
    const [logo,         setLogo]         = useState(null);
    const [loading,      setLoading]      = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [toast,        setToast]        = useState(null);

    /* LOAD STORE */
    useEffect(() => {
        if (!store) return;
        setName(store.name || "");
        setPhone(store.phone || "");
        setHasWhatsapp(store.hasWhatsapp || false);
        setShippingFee(store.shipping_fee ?? 8);
        setLogo(store.logo ? { preview: store.logo } : null);
    }, [store]);

    /* BLOB CLEANUP */
    useEffect(() => {
        return () => {
            if (typeof logo?.preview === "string" && logo.preview.startsWith("blob:")) {
                URL.revokeObjectURL(logo.preview);
            }
        };
    }, []);

    /* TOAST */
    const showToast = (message, type = "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    /* LOGO CHANGE */
    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            showToast("Veuillez sélectionner une image.");
            return;
        }
        if (typeof logo?.preview === "string" && logo.preview.startsWith("blob:")) {
            URL.revokeObjectURL(logo.preview);
        }
        setLogo({ file, preview: URL.createObjectURL(file) });
        e.target.value = "";
    };

    const removeLogo = () => {
        if (typeof logo?.preview === "string" && logo.preview.startsWith("blob:")) {
            URL.revokeObjectURL(logo.preview);
        }
        setLogo(null);
    };

    /* VALIDATION */
    const tunisianPhoneRegex = /^(2|4|5|9)\d{7}$/;

    /* SAVE */
    async function handleSubmit(e) {
        e.preventDefault();

        if (!name.trim()) {
            showToast("Veuillez saisir le nom de la boutique.");
            return;
        }
        if (!phone.trim()) {
            showToast("Veuillez saisir un numéro de téléphone.");
            return;
        }
        if (!tunisianPhoneRegex.test(phone)) {
            showToast("Veuillez saisir un numéro tunisien valide.");
            return;
        }

        try {
            setLoading(true);

            let logoUrl = logo?.preview || "";

            if (logo?.file) {
                const url = await uploadToCloudinary(logo.file, (pct) => {
                    setUploadProgress(Math.round(pct));
                });
                logoUrl = url.replace("/upload/", "/upload/f_webp,q_auto,w_1200/");
            }

            await updateDoc(doc(DB, "stores", store.id), {
                name: name.trim(),
                phone,
                hasWhatsapp,
                shipping_fee: Number(shippingFee) || 0,
                logo: logoUrl,
            });

            showToast("Paramètres mis à jour avec succès.", "success");

        } catch (err) {
            console.error(err);
            showToast("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    }

    const initial = (name?.[0] || "B").toUpperCase();

    return (
        <div className="st-page">

            {/* TOP */}
            <div className="st-top">
                <h1>Paramètres</h1>
                <p>Gérez les informations de votre boutique</p>
            </div>

            <form onSubmit={handleSubmit} className="st-body">

                {/* ── SECTION: IDENTITÉ ── */}
                <div className="st-section">
                    <div className="st-section-head">
                        <div className="st-section-icon"><FiShoppingBag size={15} /></div>
                        <div>
                            <p className="st-section-title">Identité de la boutique</p>
                            <p className="st-section-sub">Logo et nom affichés publiquement</p>
                        </div>
                    </div>

                    {/* LOGO */}
                    <div className="st-field">
                        <label className="st-label">Logo</label>
                        <div className="st-logo-row">
                            <div className="st-logo-preview">
                                {logo?.preview
                                    ? <img src={logo.preview} alt="logo" />
                                    : <span>{initial}</span>}
                            </div>
                            <div className="st-logo-actions">
                                <label className="st-upload-btn">
                                    <FiUpload size={13} />
                                    {logo?.preview ? "Changer le logo" : "Téléverser un logo"}
                                    <input type="file" accept="image/*" hidden onChange={handleLogoChange} />
                                </label>
                                {logo?.preview && (
                                    <button type="button" className="st-remove-logo" onClick={removeLogo}>
                                        <FiX size={12} /> Retirer
                                    </button>
                                )}
                                <p className="st-logo-hint">
                                    Sans logo, la première lettre sera utilisée comme avatar.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* STORE NAME */}
                    <div className="st-field">
                        <label className="st-label">Nom de la boutique</label>
                        <div className="st-input-wrap">
                            <FiShoppingBag size={15} className="st-input-icon" />
                            <input
                                type="text"
                                placeholder="Ex : Amina Fashion"
                                value={name}
                                maxLength={40}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* ── SECTION: CONTACT ── */}
                <div className="st-section">
                    <div className="st-section-head">
                        <div className="st-section-icon"><FiPhone size={15} /></div>
                        <div>
                            <p className="st-section-title">Contact</p>
                            <p className="st-section-sub">Numéro utilisé par les clients pour vous joindre</p>
                        </div>
                    </div>

                    {/* PHONE */}
                    <div className="st-field">
                        <label className="st-label">Numéro de téléphone</label>
                        <div className="st-phone-wrap">
                            <span className="st-phone-prefix">
                                <span>🇹🇳</span> +216
                            </span>
                            <div className="st-phone-divider" />
                            <FiPhone size={14} className="st-input-icon" />
                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={8}
                                placeholder="21 234 567"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                            />
                        </div>
                        <span className="st-hint">Numéro tunisien à 8 chiffres.</span>
                    </div>

                    {/* WHATSAPP */}
                    <label className="st-checkbox-label">
                        <input
                            type="checkbox"
                            checked={hasWhatsapp}
                            onChange={(e) => setHasWhatsapp(e.target.checked)}
                        />
                        <div>
                            <span className="st-checkbox-title">
                                <FiMessageCircle size={13} className="st-wa-icon" />
                                Ce numéro est lié à un compte WhatsApp
                            </span>
                            <span className="st-checkbox-desc">
                                Les acheteurs pourront vous contacter directement sur WhatsApp.
                            </span>
                        </div>
                    </label>
                </div>

                {/* ── SECTION: LIVRAISON ── */}
                <div className="st-section">
                    <div className="st-section-head">
                        <div className="st-section-icon"><FiTruck size={15} /></div>
                        <div>
                            <p className="st-section-title">Livraison</p>
                            <p className="st-section-sub">Frais ajoutés automatiquement à chaque commande</p>
                        </div>
                    </div>

                    <div className="st-field">
                        <label className="st-label">Frais de livraison (TND)</label>
                        <div className="st-input-wrap st-input-wrap-sm">
                            <FiTruck size={14} className="st-input-icon" />
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="8"
                                value={shippingFee}
                                onChange={(e) => setShippingFee(e.target.value)}
                            />
                        </div>
                        <span className="st-hint">Laissez 0 pour la livraison gratuite.</span>
                    </div>
                </div>

                {/* ── TOAST ── */}
                {toast && (
                    <div className={`st-toast st-toast-${toast.type}`}>
                        <div className="st-toast-left">
                            <div className={`st-toast-icon st-toast-icon-${toast.type}`}>
                                {toast.type === "success"
                                    ? <FiCheckCircle size={18} />
                                    : <FiAlertCircle size={18} />}
                            </div>
                            <p>{toast.message}</p>
                        </div>
                        <button type="button" className="st-toast-close" onClick={() => setToast(null)}>
                            <FiX size={15} />
                        </button>
                    </div>
                )}

                {/* ── SAVE ── */}
                <div className="st-footer">
                    <button type="submit" className="st-save-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <FiLoader className="spin-icon" size={15} />
                                {uploadProgress > 0 ? `Envoi... ${uploadProgress}%` : "Enregistrement..."}
                            </>
                        ) : (
                            <>
                                <FiSave size={15} />
                                Enregistrer les modifications
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}