"use client";

import { useState,useEffect } from "react";
import Link from "next/link";
import {collection,query,where,getDocs,addDoc,serverTimestamp} from "firebase/firestore";
import { DB } from "../../../../lib/firebaseConfig";
import { useStore } from "../../../../context/StoreContext";
import {FiArrowLeft,FiPlus,FiAlertCircle,FiX} from "react-icons/fi";
import "./newOrder.css";

export default function NewOrderPage() {
    const { store } = useStore();

    const [products, setProducts] = useState([]);
    const [productId, setProductId] = useState("");
    const [clientName, setClientName] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [amount, setAmount] = useState("");
    const [toast, setToast] = useState(null);
    const [creating, setCreating] = useState(false);

    /* FETCH PRODUCTS */
    useEffect(() => {
        async function fetchProducts() {
            try {
                if (!store?.id) return;
    
                const q = query(
                    collection(DB, "products"),
                    where("storeId", "==", store.id)
                );
    
                const snapshot = await getDocs(q);
    
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
    
                setProducts(data);
    
            } catch (error) {
                console.log(error);
            }
        }
    
        fetchProducts();
    
    }, [store]);

    const product = products.find((p) => p.id === productId);

    const handleProduct = (v) => {
        setProductId(v);
        const p = products.find((x) => x.id === v);
        const qty = parseInt(quantity) || 1;

        if (p) {
            setAmount(String(p.price * qty));
        }
    }

    const handleQuantity = (v) => {
        setQuantity(v);
        if (product) {
            setAmount(String(product.price * (parseInt(v) || 1)));
        }
    }

    /* TOAST */
    const showToast = (message, type = "error") => {
        setToast({message,type});

        setTimeout(() => {
            setToast(null);
        }, 3500);
    }

    // CREATE ORDER
    const handleSubmit = async (e) => {
        e.preventDefault();

        if(!product) {
            showToast("Please select a product");
            return;
        }

        if(!clientName.trim()) {
            showToast("Please enter client name");
            return;
        }

        if(!clientPhone.trim()) {
            showToast("Please enter client phone");
            return;
        }


        try {

            setCreating(true);
            const qty = Math.max(1,parseInt(quantity) || 1);

            const amt = amount ? parseFloat(amount) : product.price * qty;

            await addDoc(collection(DB, "orders"), {
                storeId: store.id,
                productId: product.id,
                productName: product.name,
                clientName: clientName.trim(),
                clientPhone: clientPhone.trim(),
                quantity: qty,
                amount: amt,
                status: "pending",
                createdAt: serverTimestamp(),
            });

            // RESET
            setProductId("");
            setClientName("");
            setClientPhone("");
            setQuantity("1");
            setAmount("");
            setToast("");

        } catch (error) {
            console.log(error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="new-order-page">

            {/* TOP */}
            <Link
                href="/dashboard/orders"
                className="back-btn"
            >
                <FiArrowLeft />
                Back to orders
            </Link>

            <h1 className="new-order-title">
                Add order
            </h1>

            <p className="new-order-desc">
                Create a new customer order.
            </p>

            {/* FORM */}
            <form
                onSubmit={handleSubmit}
                className="new-order-form"
            >

                {/* PRODUCT */}
                <div className="form-group">
                    <label>
                        Product
                    </label>

                    <select
                        value={productId}
                        onChange={(e) =>
                            handleProduct(
                                e.target.value
                            )
                        }
                    >

                        <option value="">
                            Select a product
                        </option>

                        {products.map((p) => (
                        <option
                            key={p.id}
                            value={p.id}
                        >
                            {p.name} — {p.price} TND
                        </option>
                        ))}

                    </select>

                </div>

                {/* CLIENT */}
                <div className="double-grid">
                    <div className="form-group">
                        <label>
                            Client name
                        </label>

                        <input
                            type="text"
                            placeholder="Full name"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                        />

                    </div>

                    <div className="form-group">
                        <label>
                            Phone number
                        </label>

                        <input
                            type="text"
                            placeholder="Phone"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                        />

                    </div>

                </div>

                {/* QTY */}
                <div className="double-grid">
                    <div className="form-group">
                        <label>
                            Quantity
                        </label>

                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => handleQuantity(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Amount (TND)
                        </label>

                        <input
                        type="number"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </div>

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
                            className="toast-close"
                            onClick={() => setToast(null)}
                        >
                            <FiX />
                        </button>
                    </div>
                )}

                {/* ACTIONS */}
                <div className="form-actions">
                    <Link
                        href="/dashboard/orders"
                        className="cancel-btn"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        className={`save-btn ${creating ? "loading" : ""}`}
                        disabled={creating}
                    >
                        {creating ? ("Creating...") : (
                            <>
                                <FiPlus />
                                Create order
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}