"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { DB } from "../../../../lib/firebaseConfig";
import { uploadToCloudinary } from "../../../../lib/uploadToCloudinary";
import { useStore } from "../../../../context/StoreContext";
import { categories } from "../../../../data/categories";
import Link from "next/link";
import {
    FiArrowLeft, FiUpload, FiX, FiStar, FiAlertCircle, FiCheckCircle,
    FiChevronDown, FiImage, FiTag, FiPackage, FiPercent, FiFileText,
    FiLayers, FiPlus, FiTrash2, FiLoader, FiSave,
} from "react-icons/fi";
import { LuBoxes, LuArchive } from "react-icons/lu";
import "./newProduct.css";

/* ─── HELPERS ─────────────────────────────────────────── */

function formatPrice(value) {
    return new Intl.NumberFormat("fr-TN", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    }).format(Number(value || 0));
}

function buildPriceData({ hasDiscount, price, discountedPrice }) {
    if (hasDiscount) {
        return { hasDiscount: true, price: Number(discountedPrice || 0), oldPrice: Number(price || 0) };
    }
    return { hasDiscount: false, price: Number(price || 0), oldPrice: null };
}

function SectionCard({ icon: Icon, title, subtitle, rightSlot, children }) {
    return (
        <div className="np-card">
            <div className="np-card-head">
                <div className="np-card-title-wrap">
                    <div className="np-card-icon"><Icon size={18} /></div>
                    <div>
                        <h3>{title}</h3>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                </div>
                {rightSlot}
            </div>
            <div className="np-card-body">{children}</div>
        </div>
    );
}

function Toggle({ checked, onChange }) {
    return (
        <label className="np-toggle">
            <input type="checkbox" checked={checked} onChange={onChange} />
            <span className="np-toggle-track" />
        </label>
    );
}

function Toast({ toast, onClose }) {
    if (!toast) return null;
    const isSuccess = toast.type === "success";
    return (
        <div className={`np-toast np-toast-${toast.type}`}>
            <div className="np-toast-left">
                <div className={`np-toast-icon np-toast-icon-${toast.type}`}>
                    {isSuccess ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
                </div>
                <p>{toast.message}</p>
            </div>
            <button type="button" className="np-toast-close" onClick={onClose}>
                <FiX size={14} />
            </button>
        </div>
    );
}

/* ── Variant combo content ── */
function VariantComboContent({ variant, onVariantChange, onVariantImageChange }) {
    return (
        <div className="np-combo-content">
            {/* Image */}
            <label className="np-combo-img-upload">
                {variant.imagePreview
                    ? <img src={variant.imagePreview} alt="" />
                    : <><FiUpload size={20} /><span>Image</span></>}
                <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                        onVariantImageChange(variant.id, e.target.files?.[0]);
                        e.target.value = "";
                    }}
                />
            </label>

            {/* Fields */}
            <div className="np-combo-fields">
                <div className="np-combo-row">
                    <div className="np-field">
                        <label>Prix (TND)</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="0.000"
                            value={variant.price ?? ""}
                            onChange={(e) => onVariantChange(variant.id, "price", e.target.value)}
                        />
                    </div>
                    <div className="np-field">
                        <label>Stock</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={variant.inventory ?? ""}
                            onChange={(e) => onVariantChange(variant.id, "inventory", e.target.value)}
                        />
                    </div>
                </div>

                {/* Discount toggle */}
                <div className="np-combo-discount-toggle">
                    <div className="np-combo-discount-left">
                        <div className="np-mini-icon"><FiPercent size={13} /></div>
                        <div>
                            <p className="np-combo-discount-title">Promotion</p>
                            <p className="np-combo-discount-sub">Activer un prix réduit</p>
                        </div>
                    </div>
                    <Toggle
                        checked={variant.hasDiscount}
                        onChange={(e) => onVariantChange(variant.id, "hasDiscount", e.target.checked)}
                    />
                </div>

                {/* Discount fields */}
                {variant.hasDiscount && (
                    <div className="np-combo-row">
                        <div className="np-field">
                            <label>Prix original</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0.000"
                                value={variant.oldPrice ?? ""}
                                onChange={(e) => onVariantChange(variant.id, "oldPrice", e.target.value)}
                            />
                        </div>
                        <div className="np-field">
                            <label>Prix promotionnel</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0.000"
                                value={variant.price ?? ""}
                                onChange={(e) => onVariantChange(variant.id, "price", e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Variant combo row ── */
function VariantComboRow({
    variant, hasNestedVariants, isOpen, onToggle,
    onVariantChange, onVariantImageChange,
}) {
    const values = variant.options.map((o) => o.value);
    const label  = hasNestedVariants ? values[1] : values[0];

    return (
        <div className="np-combo-item">
            <button type="button" className="np-combo-trigger" onClick={onToggle}>
                <div className="np-combo-trigger-left">
                    <div className="np-combo-avatar">
                        {variant.imagePreview
                            ? <img src={variant.imagePreview} alt="" />
                            : <FiImage size={16} />}
                    </div>
                    <div>
                        <p className="np-combo-label">{label}</p>
                        <p className="np-combo-sub">
                            {variant.price ? `${formatPrice(variant.price)} TND` : "Prix non défini"}
                            {" · "}
                            {variant.inventory !== "" ? `${variant.inventory} en stock` : "Stock non défini"}
                        </p>
                    </div>
                </div>
                <FiChevronDown size={15} className={isOpen ? "np-rotate" : ""} />
            </button>
            {isOpen && (
                <VariantComboContent
                    variant={variant}
                    onVariantChange={onVariantChange}
                    onVariantImageChange={onVariantImageChange}
                />
            )}
        </div>
    );
}

/* ─── MAIN PAGE ───────────────────────────────────────── */

export default function NewProductPage() {

    const router = useRouter();
    const { store } = useStore();

    const imageInputRef = useRef(null);

    const [name,            setName]           = useState("");
    const [category,        setCategory]       = useState(null);
    const [subcategory,     setSubcategory]    = useState(null);
    const [description,     setDescription]    = useState("");
    const [images,          setImages]         = useState([]);
    const [price,           setPrice]          = useState("");
    const [hasDiscount,     setHasDiscount]    = useState(false);
    const [discountedPrice, setDiscountedPrice]= useState("");
    const [inventory,       setInventory]      = useState("");
    const [variantOptions,  setVariantOptions] = useState([]);
    const [variantRows,     setVariantRows]    = useState([]);
    const [variantDrafts,   setVariantDrafts]  = useState({});
    const [openedGroups,    setOpenedGroups]   = useState({});
    const [enableLots,      setEnableLots]     = useState(false);
    const [lotRules,        setLotRules]       = useState([]);
    const [loading,         setLoading]        = useState(false);
    const [uploadProgress,  setUploadProgress] = useState(0);
    const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
    const [toast,           setToast]          = useState(null);

    const MAX_VARIANT_OPTIONS = 2;
    const hasNestedVariants   = variantOptions.length > 1;

    const showToast = (message, type = "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    /* ── images ── */

    const handleFiless = (files) => {
        if (!files?.length) return;
        setImages((prev) => {
            if (prev.length >= 5) { showToast("Maximum 5 images atteint."); return prev; }
            const slots = 5 - prev.length;
            const added = [];
            for (const file of Array.from(files).slice(0, slots)) {
                if (!file.type.startsWith("image/")) continue;
                if (prev.some((i) => i.file.name === file.name && i.file.size === file.size)) continue;
                added.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) });
            }
            return [...prev, ...added];
        });
    };

    const handleFiles = (files, inputRef) => {
    if (!files?.length) return;

    const selected = Array.from(files);

    // Read current images synchronously via ref, NOT inside updater
    setImages((prev) => {
        if (prev.length >= 5) {
            // Schedule toast AFTER state update settles — never inside updater
            setTimeout(() => showToast("Maximum 5 images atteint."), 0);
            return prev;
        }

        const slots  = 5 - prev.length;
        const added  = [];
        let skipped  = 0;

        for (const file of selected.slice(0, slots)) {
            if (!file.type.startsWith("image/")) { skipped++; continue; }
            // Safe duplicate check — guard against missing .file
            const isDuplicate = prev.some(
                (i) => i.file && i.file.name === file.name && i.file.size === file.size
            );
            if (isDuplicate) { skipped++; continue; }
            added.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) });
        }

        if (skipped > 0 && added.length === 0) {
            setTimeout(() => showToast("Aucune nouvelle image valide sélectionnée."), 0);
        }

        return added.length ? [...prev, ...added] : prev;
    });

    // Reset input synchronously so the same file can be re-selected
    if (inputRef?.current) inputRef.current.value = "";
    };

    const removeImage = (index) => {
        setImages((prev) => {
            const img = prev[index];
            if (img?.preview?.startsWith("blob:")) URL.revokeObjectURL(img.preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const makeThumbnail = (index) => {
        setImages((prev) => {
            const copy = [...prev];
            const [sel] = copy.splice(index, 1);
            copy.unshift(sel);
            return copy;
        });
    };

    useEffect(() => () => {
        images.forEach((img) => { if (img.preview?.startsWith("blob:")) URL.revokeObjectURL(img.preview); });
    }, []); // eslint-disable-line

    /* ── variant image ── */

    const handleVariantImageChange = (variantId, file) => {
        if (!file?.type.startsWith("image/")) { showToast("Fichier image invalide."); return; }
        setVariantRows((prev) => prev.map((v) => {
            if (v.id !== variantId) return v;
            if (v.imagePreview?.startsWith("blob:")) URL.revokeObjectURL(v.imagePreview);
            return { ...v, imageFile: file, imagePreview: URL.createObjectURL(file) };
        }));
    };

    /* ── variant field change ── */

    const handleVariantChange = (variantId, field, value) => {
        setVariantRows((prev) => prev.map((r) =>
            r.id === variantId ? { ...r, [field]: value } : r
        ));
    };

    /* ── variant options ── */

    const addVariantOption = () => {
        if (variantOptions.length >= MAX_VARIANT_OPTIONS) { showToast("Maximum 2 variantes."); return; }
        setVariantOptions((prev) => [...prev, { id: crypto.randomUUID(), name: "", values: [] }]);
    };

    const removeVariantOption = (id) => setVariantOptions((prev) => prev.filter((o) => o.id !== id));

    const updateVariantName = (id, value) => {
        setVariantOptions((prev) => prev.map((o) => o.id === id ? { ...o, name: value } : o));
    };

    const addVariantValue = (optionId, value) => {
        if (!value.trim()) return;
        setVariantOptions((prev) => prev.map((o) => {
            if (o.id !== optionId) return o;
            if (o.values.includes(value.trim())) return o;
            return { ...o, values: [...o.values, value.trim()] };
        }));
    };

    const removeVariantValue = (optionId, index) => {
        setVariantOptions((prev) => prev.map((o) =>
            o.id !== optionId ? o : { ...o, values: o.values.filter((_, i) => i !== index) }
        ));
    };

    /* ── variant row generation (only on option structure change) ── */

    const optionStructureRef = useRef("");

    useEffect(() => {
        const validOptions = variantOptions
            .map((o) => ({ ...o, values: o.values.filter((v) => v.trim()) }))
            .filter((o) => o.name.trim() && o.values.length > 0);

        const structureKey = JSON.stringify(validOptions.map((o) => ({ name: o.name, values: o.values })));
        if (structureKey === optionStructureRef.current) return;
        optionStructureRef.current = structureKey;

        if (!validOptions.length) {
            setVariantRows((prev) => {
                prev.forEach((v) => { if (v.imagePreview?.startsWith("blob:")) URL.revokeObjectURL(v.imagePreview); });
                return [];
            });
            return;
        }

        setVariantRows((prevRows) => {
            const combinations = [];
            const generate = (index, currentOptions) => {
                if (index === validOptions.length) {
                    const existing = prevRows.find(
                        (r) => JSON.stringify(r.options) === JSON.stringify(currentOptions)
                    );
                    combinations.push({
                        id:           existing?.id ?? crypto.randomUUID(),
                        options:      currentOptions,
                        inventory:    existing?.inventory ?? "",
                        price:        existing?.price ?? "",
                        oldPrice:     existing?.oldPrice ?? "",
                        hasDiscount:  existing?.hasDiscount ?? false,
                        image:        existing?.image ?? "",
                        imageFile:    existing?.imageFile ?? null,
                        imagePreview: existing?.imagePreview ?? "",
                    });
                    return;
                }
                const option = validOptions[index];
                option.values.forEach((value) => {
                    generate(index + 1, [
                        ...currentOptions,
                        { name: option.name, value, position: index },
                    ]);
                });
            };
            generate(0, []);

            const newIds = new Set(combinations.map((c) => c.id));
            prevRows.forEach((r) => {
                if (!newIds.has(r.id) && r.imagePreview?.startsWith("blob:")) URL.revokeObjectURL(r.imagePreview);
            });

            return combinations;
        });
    }, [variantOptions]);

    /* ── lots ── */

    const addLotRule = () => setLotRules((prev) => [...prev, { id: crypto.randomUUID(), quantity: "", price: "" }]);
    const removeLotRule = (id) => setLotRules((prev) => prev.filter((l) => l.id !== id));
    const updateLotRule = (id, field, value) => {
        setLotRules((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));
    };

    /* ── toggle open state ── */

    const toggleGroup = (key) => setOpenedGroups((p) => ({ ...p, [key]: !p[key] }));

    /* ── grouped variants for 2-level display ── */

    const groupedVariants = Object.values(
        variantRows.reduce((acc, variant) => {
            const first = variant.options[0];
            const key   = first?.value || "Default";
            if (!acc[key]) acc[key] = { parentLabel: `${first?.name}: ${first?.value}`, variants: [] };
            acc[key].variants.push(variant);
            return acc;
        }, {})
    );

    //validation
    const validate = () => {
        if (!name.trim())        { showToast("Veuillez saisir le nom du produit.");    return false; }
        if (!description.trim()) { showToast("Veuillez saisir une description.");      return false; }
        if (images.length === 0) { showToast("Veuillez ajouter au moins une image."); return false; }
        if (!category)           { showToast("Veuillez choisir une catégorie.");       return false; }
        if (!subcategory)        { showToast("Veuillez choisir une sous-catégorie.");  return false; }
        if (!price || Number(price) <= 0) { showToast("Le prix doit être supérieur à 0."); return false; }

        if (hasDiscount) {
            if (!discountedPrice || Number(discountedPrice) <= 0) {
                showToast("Le prix promotionnel doit être supérieur à 0."); return false;
            }
            if (Number(discountedPrice) >= Number(price)) {
                showToast("Le prix promotionnel doit être inférieur au prix original."); return false;
            }
        }

        if (variantRows.length === 0) {
            if (!inventory || Number(inventory) <= 0) {
                showToast("Le stock doit être supérieur à 0."); 
                return false;
            }
        }

        if (variantOptions.length > 0) {
            const invalid = variantOptions.find(
                (o) => !o.name.trim() || o.values.filter((v) => v.trim()).length === 0
            );
            if (invalid) { showToast("Chaque variante doit avoir un nom et au moins une valeur."); return false; }
            if (variantRows.length === 0) { showToast("Ajoutez au moins une combinaison de variantes."); return false; }
        }

        for (const variant of variantRows) {
            if (!variant.imageFile && !variant.image) {
                showToast("Chaque variante doit avoir une image."); return false;
            }
            if (!variant.price || Number(variant.price) <= 0) {
                showToast("Chaque variante doit avoir un prix valide."); return false;
            }
            if (variant.hasDiscount) {
                if (!variant.oldPrice || Number(variant.oldPrice) <= 0) {
                    showToast("Veuillez saisir le prix original de chaque variante."); return false;
                }
                if (Number(variant.price) >= Number(variant.oldPrice)) {
                    showToast("Le prix promo doit être inférieur au prix original (variante)."); return false;
                }
            }
            if (variant.inventory === "" || Number(variant.inventory) <= 0) {
                showToast("Le stock de chaque variante doit être supérieur à 0."); return false;
            }
        }

        if (enableLots) {
            for (const lot of lotRules) {
                if (!lot.quantity || Number(lot.quantity) <= 0) {
                    showToast("La quantité de chaque lot doit être supérieure à 0.");
                    return false;
                }
                if (!lot.price || Number(lot.price) <= 0) {
                    showToast("Le prix de chaque lot doit être supérieur à 0.");
                    return false;
                }
            }
        }

        return true;
    };

    /* ── submit ── */

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading || !validate()) return;

        try {
            setLoading(true);

            const uploadedImages = [];
            for (let i = 0; i < images.length; i++) {
                setCurrentUploadIndex(i + 1);
                const url = await uploadToCloudinary(images[i].file, (pct) => {
                    setUploadProgress(Math.round(((i + pct / 100) / images.length) * 100));
                });
                uploadedImages.push(url.replace("/upload/", "/upload/f_webp,q_auto,w_1200/"));
            }

            const uploadedVariants = await Promise.all(
                variantRows.map(async (variant) => {
                    let uploadedImage = variant.image || "";
                    if (variant.imageFile) {
                        const url = await uploadToCloudinary(variant.imageFile);
                        uploadedImage = url.replace("/upload/", "/upload/f_webp,q_auto,w_800/");
                    }
                    return { ...variant, image: uploadedImage };
                })
            );

            const priceData      = buildPriceData({ hasDiscount, price, discountedPrice });
            const totalInventory = uploadedVariants.length > 0
                ? uploadedVariants.reduce((sum, v) => sum + Number(v.inventory || 0), 0)
                : Number(inventory || 0);

            await addDoc(collection(DB, "products"), {
                storeId:          store.id,
                storeSlug:        store.slug,
                storeName:        store.name,
                storeLogo:        store.logo || "",
                name:             name.trim(),
                category:         category.label,
                category_slug:    category.slug,
                subcategory:      subcategory?.label || "",
                subcategory_slug: subcategory?.slug  || "",
                description:      description.trim(),
                price:            priceData.price,
                hasDiscount:      priceData.hasDiscount,
                oldPrice:         priceData.oldPrice,
                images:           uploadedImages,
                thumbnail:        uploadedImages[0],
                shipping_fee:     Number(store?.shipping_fee || 8),
                stats:            { ordersCount: 0, weeklyOrders: 0, views: 0, favorites: 0 },
                rating:           { average: 0, count: 0, total: 0 },
                active:           true,
                createdAt:        serverTimestamp(),
                updatedAt:        serverTimestamp(),
                inventory:        totalInventory,
                hasVariants:      uploadedVariants.length > 0,
                options:          uploadedVariants.length > 0
                    ? variantOptions.filter((o) => o.name.trim()).map((o) => ({
                        name: o.name.trim(), values: o.values.filter((v) => v.trim()),
                    }))
                    : [],
                variants: uploadedVariants.length > 0
                    ? uploadedVariants.map((v) => ({
                        id:          v.id,
                        variantKey:  v.options.map((o) => o.value).join("-").toLowerCase(),
                        options:     v.options,
                        inventory:   Number(v.inventory || 0),
                        price:       Number(v.price || 0),
                        hasDiscount: v.hasDiscount,
                        oldPrice:    v.hasDiscount ? Number(v.oldPrice || 0) : null,
                        image:       v.image || "",
                        active:      true,
                    }))
                    : [],
                lotRules: enableLots
                    ? { enabled: true, lots: lotRules.map((l) => ({ quantity: Number(l.quantity || 0), price: Number(l.price || 0) })) }
                    : { enabled: false, lots: [] },
            });

            router.push("/dashboard/products");

        } catch (err) {
            console.error("Submit error:", err);
            showToast("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setLoading(false);
            setUploadProgress(0);
            setCurrentUploadIndex(0);
        }
    };

    const progressLabel = loading
        ? currentUploadIndex > 0 ? `Image ${currentUploadIndex}/${images.length} — ${uploadProgress}%` : "Enregistrement..."
        : null;

    /* ── render ── */

    return (
        <div className="np-page">

            <Link href="/dashboard/products" className="np-back">
                <FiArrowLeft size={14} /> Retour aux produits
            </Link>

            <div className="np-header">
                <h1>Ajouter un produit</h1>
                <p>Ajoutez un nouvel article à votre boutique</p>
            </div>

            <form onSubmit={handleSubmit} className="np-form">

                {/* 1 — DETAILS */}
                <SectionCard icon={FiPackage} title="Détails du produit" subtitle="Informations principales visibles par les clients.">
                    <div className="np-field">
                        <label>Nom du produit</label>
                        <input type="text" placeholder="Ex : T-shirt en coton" value={name} maxLength={120} onChange={(e) => setName(e.target.value.trimStart())} />
                    </div>
                    <div className="np-field">
                        <label>Description</label>
                        <textarea rows={5} maxLength={3000} placeholder="Décrivez votre produit..." value={description} onChange={(e) => setDescription(e.target.value.trimStart())} />
                        <small>Ajoutez les détails importants (matière, dimensions, utilisation…).</small>
                    </div>
                </SectionCard>

                {/* 2 — IMAGES */}
                <SectionCard icon={FiImage} title="Images" subtitle="La première image sera utilisée comme miniature principale.">
                    <div className="np-images-grid">
                        {images.map((img, i) => (
                            <div key={img.id} className="np-img-item">
                                <img src={img.preview} alt="" />
                                {i === 0 && <span className="np-thumb-badge">Miniature</span>}
                                <div className="np-img-overlay">
                                    {i !== 0 && (
                                        <button type="button" onClick={() => makeThumbnail(i)} title="Définir comme miniature">
                                            <FiStar size={14} />
                                        </button>
                                    )}
                                    <button type="button" className="np-img-remove" onClick={() => removeImage(i)} title="Supprimer">
                                        <FiX size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {images.length < 5 && (
                            <label className="np-img-add">
                                <FiUpload size={18} />
                                <span>Ajouter</span>
                                <small>Max 5</small>
                                <input 
                                    ref={imageInputRef}
                                    type="file" 
                                    accept="image/*" 
                                    multiple 
                                    hidden 
                                    onChange={(e) => handleFiles(e.target.files, imageInputRef)}
                                    //onChange={(e) => { handleFiles(e.target.files); e.target.value = ""}} 
                                />
                            </label>
                        )}
                    </div>
                </SectionCard>

                {/* 3 — CATEGORY */}
                <SectionCard icon={FiFileText} title="Catégorie" subtitle="Choisissez la catégorie principale du produit.">
                    <div className="np-categories-grid">
                        {categories.map((cat) => (
                            <button key={cat.slug} type="button" className={`np-cat-card ${category?.slug === cat.slug ? "np-cat-active" : ""}`}
                                onClick={() => { setCategory(cat); setSubcategory(null); }}>
                                <img src={cat.image} alt={cat.label} />
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </SectionCard>

                {/* 4 — SUBCATEGORY */}
                {category && (
                    <SectionCard icon={FiLayers} title="Sous-catégorie" subtitle="Précisez le type du produit.">
                        <div className="np-subcats">
                            {category.subcategories.map((sub) => (
                                <button key={sub.slug} type="button"
                                    className={`np-subcat-pill ${subcategory?.slug === sub.slug ? "np-subcat-active" : ""}`}
                                    onClick={() => setSubcategory(sub)}>
                                    {sub.label}
                                </button>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {/* 5 — PRICE */}
                <SectionCard icon={FiTag} title="Prix" subtitle="Définissez le prix de vente du produit.">
                    {!hasDiscount ? (
                        <div className="np-field np-field-sm">
                            <label>Prix (TND)</label>
                            <input type="number" min="0" placeholder="0.000" value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>
                    ) : (
                        <div className="np-two-col">
                            <div className="np-field">
                                <label>Prix original (barré)</label>
                                <input type="number" min="0" placeholder="0.000" value={price} onChange={(e) => setPrice(e.target.value)} />
                            </div>
                            <div className="np-field">
                                <label>Prix promotionnel</label>
                                <input type="number" min="0" placeholder="0.000" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} />
                            </div>
                        </div>
                    )}
                    <div className="np-toggle-row">
                        <div className="np-toggle-info">
                            <div className="np-mini-icon"><FiPercent size={13} /></div>
                            <div>
                                <p className="np-toggle-title">Promotion</p>
                                <p className="np-toggle-sub">Afficher un prix barré avec un prix réduit</p>
                            </div>
                        </div>
                        <Toggle checked={hasDiscount} onChange={() => { setHasDiscount((v) => !v); setDiscountedPrice(""); }} />
                    </div>
                </SectionCard>

                {/* 6 — INVENTORY */}
                <SectionCard icon={LuBoxes} title="Inventaire" subtitle="Nombre de pièces disponibles à la vente.">
                    <div className="np-field np-field-sm">
                        <label>Quantité disponible</label>
                        <input
                            type="number"
                            min="1"
                            placeholder="Ex : 50"
                            value={inventory}
                            disabled={variantRows.length > 0}
                            onChange={(e) => setInventory(e.target.value)}
                        />
                        <small>
                            {variantRows.length > 0
                                ? "Le stock total est calculé automatiquement depuis chaque variante."
                                : "Nombre de pièces disponibles à la vente."}
                        </small>
                    </div>
                </SectionCard>

                {/* 7 — VARIANTS */}
                <SectionCard icon={FiLayers} title="Variantes" subtitle="Tailles, couleurs ou toute autre option."
                    rightSlot={
                        variantOptions.length < MAX_VARIANT_OPTIONS && (
                            <button type="button" className="np-outline-btn" onClick={addVariantOption}>
                                <FiPlus size={13} /> Ajouter
                            </button>
                        )
                    }>
                    {variantOptions.length === 0 ? (
                        <div className="np-empty-box">
                            <FiLayers size={28} />
                            <h4>Aucune variante</h4>
                            <p>Ajoutez des options comme taille ou couleur pour gérer prix, images et stocks par variante.</p>
                            <button type="button" className="np-outline-btn" onClick={addVariantOption}>
                                <FiPlus size={13} /> Ajouter une variante
                            </button>
                        </div>
                    ) : (
                        <div className="np-variants-list">
                            {variantOptions.map((option) => (
                                <div key={option.id} className="np-variant-card">
                                    <div className="np-variant-head">
                                        <div className="np-field" style={{ flex: 1 }}>
                                            <label>Nom de la variante</label>
                                            <input type="text" placeholder="Ex : Taille, Couleur…" value={option.name}
                                                onChange={(e) => updateVariantName(option.id, e.target.value)} />
                                        </div>
                                        <button type="button" className="np-danger-icon-btn" onClick={() => removeVariantOption(option.id)}>
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="np-field"><label>Options</label></div>
                                    <div className="np-option-input-row">
                                        <input type="text" placeholder="Ajouter une option + Entrée"
                                            value={variantDrafts[option.id] || ""}
                                            onChange={(e) => setVariantDrafts((p) => ({ ...p, [option.id]: e.target.value }))}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === ",") {
                                                    e.preventDefault();
                                                    const v = (variantDrafts[option.id] || "").trim();
                                                    if (!v) return;
                                                    addVariantValue(option.id, v);
                                                    setVariantDrafts((p) => ({ ...p, [option.id]: "" }));
                                                }
                                            }} />
                                        <button type="button" className="np-option-add-btn"
                                            onClick={() => {
                                                const v = (variantDrafts[option.id] || "").trim();
                                                if (!v) return;
                                                addVariantValue(option.id, v);
                                                setVariantDrafts((p) => ({ ...p, [option.id]: "" }));
                                            }}>
                                            <FiPlus size={13} /> Ajouter
                                        </button>
                                    </div>
                                    <div className="np-tags">
                                        {option.values.map((val, idx) => (
                                            <div key={idx} className="np-tag">
                                                <span>{val}</span>
                                                <button type="button" onClick={() => removeVariantValue(option.id, idx)}>
                                                    <FiX size={11} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {variantRows.length > 0 && (
                        <>
                            <div className="np-divider" />
                            <div className="np-combos-head">
                                <div>
                                    <h4>Combinaisons</h4>
                                    <p>Prix, promotion et stock de chaque variante.</p>
                                </div>
                                <span className="np-combos-count">{variantRows.length}</span>
                            </div>
                            <div className="np-combos-box">
                                {hasNestedVariants ? (
                                    groupedVariants.map((group, gi) => {
                                        const groupKey = `group-${gi}`;
                                        const isOpen   = openedGroups[groupKey] === true;
                                        return (
                                            <div key={gi} className="np-group">
                                                <button type="button" className="np-group-trigger"
                                                    onClick={() => toggleGroup(groupKey)}>
                                                    <div className="np-group-left">
                                                        <span className="np-group-badge">{group.parentLabel}</span>
                                                        <span className="np-group-count">{group.variants.length} variantes</span>
                                                    </div>
                                                    <FiChevronDown size={14} className={isOpen ? "np-rotate" : ""} />
                                                </button>
                                                {isOpen && (
                                                    <div className="np-group-content">
                                                        {group.variants.map((v) => (
                                                            <VariantComboRow
                                                                key={v.id}
                                                                variant={v}
                                                                hasNestedVariants={hasNestedVariants}
                                                                isOpen={openedGroups[v.id] === true}
                                                                onToggle={() => toggleGroup(v.id)}
                                                                onVariantChange={handleVariantChange}
                                                                onVariantImageChange={handleVariantImageChange}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    variantRows.map((v) => (
                                        <VariantComboRow
                                            key={v.id}
                                            variant={v}
                                            hasNestedVariants={hasNestedVariants}
                                            isOpen={openedGroups[v.id] === true}
                                            onToggle={() => toggleGroup(v.id)}
                                            onVariantChange={handleVariantChange}
                                            onVariantImageChange={handleVariantImageChange}
                                        />
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </SectionCard>

                {/* 8 — LOTS */}
                <SectionCard icon={LuArchive} title="Vente en lot" subtitle="Tarifs dégressifs pour les achats en grande quantité."
                    rightSlot={
                        <div className="np-switch-wrap">
                            <span>Activer</span>
                            <Toggle checked={enableLots} onChange={() => setEnableLots((v) => !v)} />
                        </div>
                    }>
                    {!enableLots ? (
                        <div className="np-empty-box">
                            <LuArchive size={24} />
                            <h4>Vente en lot désactivée</h4>
                            <p>Activez pour proposer des prix spéciaux à l'achat de plusieurs pièces.</p>
                        </div>
                    ) : (
                        <div className="np-lots-wrap">
                            {lotRules.length === 0 && <p className="np-lots-empty">Aucun lot ajouté.</p>}
                            {lotRules.map((lot, i) => (
                                <div key={lot.id} className="np-lot-card">
                                    <div className="np-lot-head">
                                        <div>
                                            <p className="np-lot-title">Lot {i + 1}</p>
                                            <p className="np-lot-sub">Configurez ce pack.</p>
                                        </div>
                                        <button type="button" className="np-danger-icon-btn" onClick={() => removeLotRule(lot.id)}>
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="np-two-col">
                                        <div className="np-field">
                                            <label>Pièces / lot</label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                placeholder="Ex : 10" 
                                                value={lot.quantity} 
                                                onChange={(e) => updateLotRule(lot.id, "quantity", e.target.value)} 
                                            />
                                        </div>
                                        <div className="np-field">
                                            <label>Prix du lot (TND)</label>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                placeholder="0.000" 
                                                alue={lot.price} 
                                                onChange={(e) => updateLotRule(lot.id, "price", e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" className="np-add-lot-btn" onClick={addLotRule}>
                                <FiPlus size={14} /> Ajouter un lot
                            </button>
                        </div>
                    )}
                </SectionCard>

                {/* 9 — SUMMARY + SUBMIT */}
                <SectionCard icon={FiFileText} title="Résumé" subtitle="Vérifiez avant de publier.">
                    <div className="np-summary">
                        {[
                            ["Images",         images.length],
                            ["Variantes",      variantRows.length],
                            ["Lots",           lotRules.length],
                            ["Catégorie",      category?.label || "—"],
                            ["Sous-catégorie", subcategory?.label || "—"],
                        ].map(([label, value]) => (
                            <div key={label} className="np-summary-row">
                                <span>{label}</span>
                                <strong>{value}</strong>
                            </div>
                        ))}
                    </div>

                    <Toast toast={toast} onClose={() => setToast(null)} />

                    <div className="np-submit-wrap">
                        <button type="submit" className="np-submit-btn" disabled={loading}>
                            {loading
                                ? <><FiLoader className="np-spin" size={16} /> {progressLabel}</>
                                : <><FiSave size={15} /> Enregistrer le produit</>}
                        </button>
                        <Link href="/dashboard/products" className="np-cancel-btn">Annuler</Link>
                    </div>
                </SectionCard>

            </form>
        </div>
    );
}