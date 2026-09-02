"use client";

import { useState, useEffect } from "react";
import {
    FiTruck, FiPlus, FiTrash2, FiKey, FiUser, FiLock,
    FiCheck, FiX, FiShield, FiClock, FiPackage,
    FiExternalLink, FiPower, FiLoader, FiAlertTriangle,
    FiEye, FiEyeOff,
} from "react-icons/fi";
import {collection, addDoc, getDocs, deleteDoc, doc,updateDoc, query, where, serverTimestamp} from "firebase/firestore";
import { DB } from "../../../lib/firebaseConfig";
import {PROVIDERS,getProviderById} from '../../../lib/shippingProviders';
import { useStore } from "../../../context/StoreContext";
import "./shipping.css";

/* ─── HELPERS ─────────────────────────────────────────── */

function timeAgo(ts) {
    if (!ts) return "—";
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return `il y a ${Math.floor(diff / 86400)} j`;
}

/* ─── STAT CARD ───────────────────────────────────────── */

function StatCard({ icon: Icon, label, value }) {
    return (
        <div className="sh-stat-card">
            <span className="sh-stat-icon"><Icon size={18} /></span>
            <div>
                <p className="sh-stat-value">{value}</p>
                <p className="sh-stat-label">{label}</p>
            </div>
        </div>
    );
}

/* ─── CONNECTED CARD ──────────────────────────────────── */

function ConnectedCard({ conn, onDelete, onToggleActive }) {
    const provider = getProviderById(conn.provider);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(false);

    const primaryField = Object.entries(conn.credentialKeys || {})[0];

    const handleDelete = async () => {
        setDeleting(true);
        try { await onDelete(conn.id); }
        finally { setDeleting(false); }
    };

    const handleToggle = async () => {
        setToggling(true);
        try { await onToggleActive(conn.id, !conn.active); }
        finally { setToggling(false); }
    };

    return (
        <div className="sh-conn-card">
            <div className="sh-conn-top">
                <ProviderAvatar provider={provider} />
                <div className="sh-conn-info">
                    <div className="sh-conn-title-row">
                        <p className="sh-conn-name">{conn.label}</p>
                        <span className={`sh-pill ${conn.active ? "sh-pill-active" : "sh-pill-paused"}`}>
                            <FiShield size={11} />
                            {conn.active ? "Actif" : "En pause"}
                        </span>
                    </div>
                    <p className="sh-conn-sub">
                        {primaryField ? `${primaryField[1]} enregistré` : "Identifiants enregistrés"}
                    </p>
                    <div className="sh-chip-row">
                        {provider?.fee != null && (
                            <span className="sh-chip">{provider.fee} DT / colis</span>
                        )}
                        {provider?.delay && <span className="sh-chip">{provider.delay}</span>}
                        <span className="sh-chip sh-chip-muted">Testé {timeAgo(conn.lastTestedAt)}</span>
                    </div>
                </div>
            </div>

            <div className="sh-conn-actions-row">
                <button className="sh-btn-outline" onClick={handleToggle} disabled={toggling}>
                    {toggling ? <FiLoader className="sh-spin" size={14} /> : <FiPower size={14} />}
                    {conn.active ? "Mettre en pause" : "Réactiver"}
                </button>
                <button className="sh-btn-outline" onClick={() => setExpanded((v) => !v)}>
                    {expanded ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                    Identifiants
                </button>
                <button
                    className="sh-link-danger"
                    onClick={() => setConfirmDelete(true)}
                >
                    <FiTrash2 size={14} />
                    Déconnecter
                </button>
            </div>

            {expanded && (
                <div className="sh-conn-expanded">
                    {Object.entries(conn.credentialKeys || {}).map(([key, display]) => (
                        <div key={key} className="sh-cred-row">
                            <span>{display}</span>
                            <code>••••••••••••</code>
                        </div>
                    ))}
                    <p className="sh-expanded-note">
                        <FiShield size={11} />
                        Les identifiants sont chiffrés et jamais affichés en clair.
                    </p>
                </div>
            )}

            {confirmDelete && (
                <div className="sh-inline-confirm">
                    <p>
                        Déconnecter <strong>{conn.label}</strong> ? Les commandes déjà expédiées
                        gardent leur suivi.
                    </p>
                    <div className="sh-inline-confirm-actions">
                        <button className="sh-btn-danger-sm" onClick={handleDelete} disabled={deleting}>
                            {deleting ? <FiLoader className="sh-spin" size={13} /> : <FiCheck size={13} />}
                            Confirmer
                        </button>
                        <button
                            className="sh-btn-outline-sm"
                            onClick={() => setConfirmDelete(false)}
                            disabled={deleting}
                        >
                            <FiX size={13} /> Annuler
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProviderAvatar({ provider, size = 45 }) {
    const [imgFailed, setImgFailed] = useState(false);

    if (provider?.logo && !imgFailed) {
        return (
            <span
                className="sh-avatar sh-avatar-img"
                style={{ width: size, height: size, backgroundColor: `${provider.color}12` }}
            >
                <img
                    src={provider.logo}
                    alt={provider.name}
                    onError={() => setImgFailed(true)}
                />
            </span>
        );
    }

    return (
        <span
            className="sh-avatar"
            style={{ width: size, height: size, backgroundColor: provider?.color ?? "#005bfd" }}
        >
            {provider?.name?.[0] || "?"}
        </span>
    );
}

/* ─── AVAILABLE PROVIDER CARD ─────────────────────────── */

function AvailableProviderCard({ provider, onConnect }) {
    return (
        <div className="sh-avail-card">
            <div className="sh-conn-top">
                <ProviderAvatar provider={provider} />
                <div className="sh-conn-info">
                    <p className="sh-conn-name">{provider.name}</p>
                </div>
            </div>
            <button className="sh-btn-connect" onClick={() => onConnect(provider.id)}>
                <FiPlus size={14} /> Connecter
            </button>
        </div>
    );
}

/* ─── CONNECT MODAL ───────────────────────────────────── */

function ConnectModal({ providerId, storeId, onClose, onSave }) {
    const provider = getProviderById(providerId);
    const [fields, setFields] = useState({});
    const [showFields, setShowFields] = useState({});
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null); // null | "ok" | "failed"
    const [testMsg, setTestMsg] = useState("");
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const allFilled = provider.fields.every((f) => (fields[f.key] || "").trim().length > 0);

    const handleTest = async () => {
        setError("");
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch("/api/shipping/connections/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider: provider.id, credentials: fields }),
            });
            const data = await res.json();
            if (data.ok) {
                setTestResult("ok");
                setTestMsg(data.message || "Connexion établie avec succès.");
            } else {
                setTestResult("failed");
                setTestMsg(data.error || "Impossible de vérifier les identifiants.");
            }
        } catch {
            setTestResult("failed");
            setTestMsg("Erreur réseau. Vérifiez votre connexion.");
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (testResult !== "ok") {
            setError("Testez la connexion avant d'enregistrer.");
            return;
        }
        setSaving(true);
        try {
            await onSave({ provider: provider.id, label: provider.name, credentials: fields });
            setSaving(false);
            setDone(true);
            setTimeout(onClose, 1100);
        } catch {
            setError("Erreur lors de l'enregistrement. Réessayez.");
            setSaving(false);
        }
    };

    return (
        <div className="sh-modal-backdrop" onClick={onClose}>
            <div className="sh-modal" onClick={(e) => e.stopPropagation()}>
                {done ? (
                    <div className="sh-modal-done">
                        <div className="sh-modal-done-icon"><FiCheck size={22} /></div>
                        <p className="sh-modal-done-title">{provider.name} connecté</p>
                        <p className="sh-modal-done-sub">
                            Vous pouvez maintenant y transmettre vos commandes.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="sh-modal-top">
                            <ProviderAvatar provider={provider} size={44} />
                            <div className="sh-modal-top-info">
                                <h3>Connecter {provider.name}</h3>
                                <p>
                                    {provider.authType === "apikey"
                                        ? "Renseignez la clé API fournie par le transporteur."
                                        : "Renseignez les identifiants de votre compte transporteur."}
                                </p>
                            </div>
                            <button className="sh-modal-close" onClick={onClose} aria-label="Fermer">
                                <FiX size={16} />
                            </button>
                        </div>

                        <div className="sh-modal-fields">
                            {provider.fields.map((f) => (
                                <label key={f.key} className="sh-field-label">
                                    <span>{f.label}</span>
                                    <span className="sh-input-wrap">
                                        {f.secret ? <FiKey size={14} /> : <FiUser size={14} />}
                                        <input
                                            type={f.secret && !showFields[f.key] ? "password" : "text"}
                                            placeholder={f.placeholder}
                                            value={fields[f.key] || ""}
                                            onChange={(e) => {
                                                setFields((prev) => ({ ...prev, [f.key]: e.target.value }));
                                                setTestResult(null);
                                            }}
                                            autoComplete="off"
                                        />
                                        {f.secret && (
                                            <button
                                                type="button"
                                                className="sh-eye-btn"
                                                onClick={() =>
                                                    setShowFields((p) => ({ ...p, [f.key]: !p[f.key] }))
                                                }
                                            >
                                                {showFields[f.key] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                                            </button>
                                        )}
                                    </span>
                                </label>
                            ))}

                            <a
                                href={provider.docsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sh-docs-link"
                            >
                                Où trouver mes identifiants {provider.name} ?
                            </a>

                            <p className="sh-security-note">
                                <FiShield size={14} />
                                Vos identifiants sont chiffrés et utilisés uniquement pour créer vos
                                bordereaux d'expédition.
                            </p>

                            {testResult && (
                                <div className={`sh-test-result sh-test-${testResult}`}>
                                    {testResult === "ok" ? <FiCheck size={14} /> : <FiAlertTriangle size={14} />}
                                    <span>{testMsg}</span>
                                </div>
                            )}
                            {error && <div className="sh-test-result sh-test-failed"><FiAlertTriangle size={14} />{error}</div>}
                        </div>

                        <div className="sh-modal-actions">
                            <button className="sh-btn-secondary" onClick={onClose}>Annuler</button>
                            {testResult === "ok" ? (
                                <button className="sh-btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? "Enregistrement…" : "Connecter"}
                                </button>
                            ) : (
                                <button
                                    className="sh-btn-primary"
                                    onClick={handleTest}
                                    disabled={!allFilled || testing}
                                >
                                    {testing ? "Test en cours…" : "Tester la connexion"}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── PAGE ────────────────────────────────────────────── */

export default function ShippingPage() {
    const { store } = useStore();
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openProvider, setOpenProvider] = useState(null);

    useEffect(() => {
        if (!store?.id) return;
        (async () => {
            try {
                setLoading(true);
                const q = query(collection(DB, "shippingConnections"), where("storeId", "==", store.id));
                const snap = await getDocs(q);
                setConnections(snap.docs.map((d) => ({ id: d.id, active: true, ...d.data() })));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [store?.id]);

    const connectedIds = new Set(connections.map((c) => c.provider));
    const available = PROVIDERS.filter((p) => !connectedIds.has(p.id));
    const activeCount = connections.filter((c) => c.active && c.testStatus !== "failed").length;
    const attentionCount = connections.filter((c) => c.testStatus === "failed" || c.testStatus === "pending").length;

    const handleSave = async ({ provider, label, credentials }) => {
        const p = getProviderById(provider);
        const credentialKeys = Object.fromEntries(p.fields.map((f) => [f.key, f.label]));

        const res = await fetch("/api/shipping/connections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider, label, credentials, storeId: store.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement.");

        setConnections((prev) => [
            ...prev,
            {
                id: data.id,
                storeId: store.id,
                provider,
                label,
                credentialKeys,
                active: true,
                testStatus: "ok",
                lastTestedAt: new Date(),
            },
        ]);
    };

    const handleDelete = async (id) => {
        await deleteDoc(doc(DB, "shippingConnections", id));
        setConnections((prev) => prev.filter((c) => c.id !== id));
    };

    const handleToggleActive = async (id, active) => {
        await updateDoc(doc(DB, "shippingConnections", id), { active });
        setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
    };

    if (loading) {
        return (
            <div className="sh-loading">
                <FiLoader className="sh-spin" size={28} />
                <p>Chargement des connexions...</p>
            </div>
        );
    }

    return (
        <div className="sh-page">
            {/* HEADER */}
            <div className="sh-page-header">
                <div>
                    <h1 className="sh-page-title">Livraison</h1>
                    <p className="sh-page-subtitle">
                        Connectez vos transporteurs et expédiez vos commandes en un clic
                    </p>
                </div>
            </div>

            {/* STATS */}
            <div className="sh-stats-grid">
                <StatCard icon={FiTruck} label="Transporteurs connectés" value={connections.length} />
                <StatCard icon={FiShield} label="Connexions actives" value={activeCount} />
                <StatCard icon={FiClock} label="À vérifier" value={attentionCount} />
            </div>

            {/* CONNECTED */}
            <section className="sh-section">
                <h2 className="sh-section-title">Mes transporteurs</h2>
                {connections.length === 0 ? (
                    <div className="sh-empty-dashed">
                        <div className="sh-empty-icon"><FiTruck size={20} /></div>
                        <p className="sh-empty-title">Aucun transporteur connecté</p>
                        <p className="sh-empty-sub">
                            Connectez une société de livraison ci-dessous pour transmettre vos
                            commandes automatiquement.
                        </p>
                    </div>
                ) : (
                    <div className="sh-conn-grid">
                        {connections.map((conn) => (
                            <ConnectedCard
                                key={conn.id}
                                conn={conn}
                                onDelete={handleDelete}
                                onToggleActive={handleToggleActive}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* AVAILABLE */}
            <section className="sh-section">
                <h2 className="sh-section-title">Sociétés de livraison disponibles</h2>
                {available.length === 0 ? (
                    <p className="sh-all-connected">
                        Tous les transporteurs disponibles sont déjà connectés 🎉
                    </p>
                ) : (
                    <div className="sh-avail-grid">
                        {available.map((p) => (
                            <AvailableProviderCard key={p.id} provider={p} onConnect={setOpenProvider} />
                        ))}
                    </div>
                )}
            </section>

            {openProvider && (
                <ConnectModal
                    providerId={openProvider}
                    storeId={store?.id}
                    onClose={() => setOpenProvider(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}