"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {addDoc,collection,writeBatch,doc,serverTimestamp} from "firebase/firestore";
import {DB} from '../../lib/firebaseConfig';
import {useMarketplaceCart} from '../../context/MarketplaceCartContext';
import { tunisiaLocations } from "../../lib/tunisiaLocations";
import {FiArrowLeft,FiCheck,FiLoader,FiX,FiAlertCircle,FiTruck,FiShield} from "react-icons/fi";
import "./checkout.css";

export default function CheckoutPage() {

    const router = useRouter();

    const {cart,cartSubtotal,shippingFee,cartTotal,clearCart} = useMarketplaceCart();

    const [clientName,setClientName] = useState("");
    const [clientPhone,setClientPhone] = useState("");
    const [governorate,setGovernorate] = useState("");
    const [delegation,setDelegation] = useState("");
    const [clientAddress,setClientAddress] = useState("");
    const [loading,setLoading] = useState(false);
    const [success,setSuccess] = useState(false);
    const [toast,setToast] = useState(null);

    const delegations = governorate ? tunisiaLocations[governorate] || [] : [];

    /* TOTAL ITEMS */
    const totalItems = useMemo(() => {

        return cart.reduce((acc, item) => acc + item.quantity, 0);

    }, [cart]);

    /* TOAST */
    const showToast = (message,type = "error") => {

        setToast({message,type});

        setTimeout(() => {
            setToast(null);
        }, 3500);
    };

    //SUBMIT
    async function handleSubmit(e) {

        e.preventDefault();

        if (loading) return;

        //NAME
        if (!clientName.trim()) {

            showToast("Veuillez saisir votre nom complet");

            return;
        }

        //PHONE
        if (!clientPhone.trim()) {

            showToast("Veuillez saisir votre numéro");

            return;
        }

        //CLEAN
        const cleanPhone = clientPhone.replace(/\s/g,"");

        //TUNISIA
        const tunisianPhoneRegex = /^[259]\d{7}$/;

        if (!tunisianPhoneRegex.test(cleanPhone)) {

            showToast("Le numéro doit contenir 8 chiffres et commencer par 2, 5 ou 9");

            return;
        }

        //ADDRESS
        if (!governorate) {

            showToast("Veuillez sélectionner un gouvernorat");

            return;
        }

        if (!delegation) {

            showToast("Veuillez sélectionner une délégation");

            return;
        }

        if (!clientAddress.trim()) {

            showToast("Veuillez saisir votre adresse détaillée");

            return;
        }

        try {

            setLoading(true);

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

                const orderRef = doc(collection(DB,"orders"));

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

                const subtotal = orderItems.reduce((sum,item) => sum + item.total,0);

                const totalAmount = subtotal + storeOrder.shipping_fee;

                batch.set(orderRef,{
                    source: "marketplace",

                    storeId: storeOrder.storeId,

                    storeName: storeOrder.storeName,

                    storeSlug: storeOrder.storeSlug,

                    items: orderItems,

                    itemsCount: storeOrder.items.reduce((sum,item) =>sum + item.quantity,0),

                    subtotal,

                    shipping_fee: storeOrder.shipping_fee,

                    total_amount: totalAmount,

                    clientName: clientName.trim(),

                    clientPhone: cleanPhone,

                    governorate,

                    delegation,

                    clientAddress: clientAddress.trim(),

                    fullAddress: `${clientAddress.trim()}, ${delegation}, ${governorate}`,

                    payment_method: "cash_on_delivery",

                    status: "pending",

                    createdAt: serverTimestamp(),
                });

            });

            await batch.commit();

            setSuccess(true);

            clearCart();

            setTimeout(() => {

                router.push(`/`);

            }, 2200);

        } catch (error) {

            console.log(error);

            showToast("Une erreur est survenue");

        } finally {

            setLoading(false);

        }
    }

    //EMPTY
    if (cart.length === 0 && !success) {

        return (
            <div className="checkout-empty">

                <h1>
                    Votre panier est vide
                </h1>

                <p>
                    Ajoutez des produits avant de passer commande.
                </p>

                <Link
                    href="/"
                    className="checkout-back-btn"
                >

                    Retour à la boutique

                </Link>

            </div>
        );
    }

    //SUCCESS
    if (success) {

        return (
            <div className="checkout-success-page">

                <div className="checkout-success-card">

                    <div className="success-icon">
                        <FiCheck />
                    </div>

                    <h1>
                        Commande confirmée
                    </h1>

                    <p>
                        Votre commande a été envoyée avec succès.
                    </p>

                    <span>
                        Redirection vers la boutique...
                    </span>

                </div>

            </div>
        );
    }

    return (
        <div className="checkout-page">

            <div className="checkout-top">

                <Link
                    href="/cart"
                    className="checkout-back"
                >

                    <FiArrowLeft />

                    Retour au panier

                </Link>

                <div>

                    <h1>
                        Finaliser la commande
                    </h1>

                    <p>
                        Complétez vos informations de livraison
                    </p>

                </div>

            </div>

            <div className="checkout-layout">

                <form
                    onSubmit={handleSubmit}
                    className="checkout-form"
                >

                    <div className="checkout-card">

                        <h3>
                            Informations client
                        </h3>

                        <div className="checkout-trust">

                            <div>
                                <FiTruck />
                                Livraison rapide
                            </div>

                            <div>
                                <FiShield />
                                Paiement à la livraison
                            </div>

                        </div>

                        <div className="double-grid">

                            <div className="form-group">

                                <label>
                                    Nom complet
                                </label>

                                <input
                                    type="text"
                                    placeholder="Votre nom complet"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Numéro de téléphone
                                </label>

                                <input
                                    type="tel"
                                    placeholder="21 234 567"
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                />

                            </div>
                        </div>

                        <div className="double-grid">

                            {/* GOVERNORATE */}
                            <div className="form-group">

                                <label>
                                    Gouvernorat
                                </label>

        <select
            value={governorate}
            onChange={(e) => {

                setGovernorate(e.target.value);
                setDelegation("");

            }}
        >

            <option value="">
                Sélectionner
            </option>

            {Object.keys(tunisiaLocations).map((gov) => (

                <option
                    key={gov}
                    value={gov}
                >

                    {gov}

                </option>

            ))}

        </select>

    </div>

    {/* DELEGATION */}
    <div className="form-group">

        <label>
            Délégation
        </label>

        <select
            value={delegation}
            disabled={!governorate}
            onChange={(e) =>
                setDelegation(e.target.value)
            }
        >

            <option value="">
                Sélectionner
            </option>

            {delegations.map((city) => (

                <option
                    key={city}
                    value={city}
                >

                    {city}

                </option>

            ))}

        </select>

    </div>

</div>

<div className="form-group">

    <label>
        Adresse détaillée
    </label>

    <input
        type="text"
        placeholder="Rue, immeuble, appartement..."
        value={clientAddress}
        onChange={(e) =>
            setClientAddress(e.target.value)
        }
    />

</div>

                    </div>

                    {/* TOAST */}
                    {toast && (

                        <div className={`checkout-toast ${toast.type}`}>
                            <div className="toast-left">

                                <div className="toast-icon">
                                    <FiAlertCircle />
                                </div>

                                <p>
                                    {toast.message}
                                </p>

                            </div>

                            <button
                                type="button"
                                className="toast-close"
                                onClick={() => setToast(null)}
                            >
                                <FiX />
                            </button>
                        </div>
                    )}

                    {/* BUTTON */}
                    <button
                        type="submit"
                        className="place-order-btn"
                        disabled={loading}
                    >

                        {loading ? (
                            <>
                                <FiLoader className="spin-icon" />
                                Traitement...
                            </>
                        ) : (
                            <>
                                Confirmer la commande
                            </>
                        )}

                    </button>

                </form>

                {/* SUMMARY */}
                <div className="checkout-summary">

                    <div className="checkout-summary-card">
                        <h3>
                            Résumé de la commande
                        </h3>

                        {/* ITEMS */}
                        <div className="summary-items">

                            {cart.map((item) => (

                                <div
                                    key={item.id}
                                    className="summary-item"
                                >

                                    <div>

                                        <h4>
                                            {item.name}
                                        </h4>

                                        <p>
                                            Quantité :{" "}{item.quantity}
                                        </p>

                                    </div>

                                    <strong>
                                        {item.selectedLot ? Number(item.finalPrice || 0) : Number(item.finalPrice || 0) * item.quantity}{" "} TND
                                    </strong>

                                </div>
                            ))}

                        </div>

                        <div className="summary-divider"></div>

                        {/* ROW */}
                        <div className="summary-row">

                            <span>
                                Sous-total
                            </span>

                            <strong>
                                {cartSubtotal} TND
                            </strong>

                        </div>

                        <div className="summary-row">

                            <span>
                                Livraison
                            </span>

                            <strong>
                                {shippingFee} TND
                            </strong>

                        </div>

                        <div className="summary-divider"></div>

                        {/* TOTAL */}
                        <div className="summary-total">

                            <span>
                                Total
                            </span>

                            <h2>
                                {cartTotal} TND
                            </h2>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}