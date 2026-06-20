"use client";

import { useState } from "react";

import {FiX,FiCheck,FiImage,FiType,FiMessageSquare,FiCopy} from "react-icons/fi";

import {FaFacebook,FaInstagram} from "react-icons/fa";

import {LuSparkles} from "react-icons/lu";

import "./AIPostDialog.css";

export function AIPostDialog({product,open,onClose}) {

    const [language,setLanguage] = useState("ar");
    const [loading,setLoading] = useState(false);
    const [result,setResult] = useState(null);
    const [copied,setCopied] = useState(false);

    //Generate post
    async function handleGenerate() {

        try {

            setLoading(true);

            const response = await fetch("/api/generate-post", {
                method: "POST",

                headers: {
                    "Content-Type":"application/json",
                },

                body: JSON.stringify({
                    product,
                    language,
                    storeId: product.storeId,
                }),
            });

            const data = await response.json();

            if(data.success){

                setResult(data);

            }

        } catch(error) {

            console.log(error);

        } finally {

            setLoading(false);

        }

    }

    //Copy the result
    async function handleCopy() {

        await navigator.clipboard.writeText(result.caption);

        setCopied(true);

        setTimeout(() => {

            setCopied(false);

        }, 2000);

    }

    //Close modal
    function handleClose() {

        setResult(null);

        setLoading(false);

        setLanguage("ar");

        setCopied(false);

        onClose();

    }

    if(!open) return null;

    return (

        <div
            className="ai-modal-overlay"
            onClick={handleClose}
        >

            <div
                className="ai-modal"
                onClick={(e) => e.stopPropagation()}
            >
                
                {loading && (

                    <div className="ai-loading-overlay">

                        <div className="ai-loading-card">

                            <LuSparkles className="ai-loading-icon" />

                            <h3>
                                Génération en cours...
                            </h3>

                            <p>
                                L'IA prépare votre publication
                            </p>

                        </div>

                    </div>

                )}

                <div className="ai-modal-header">

                    <div className="ai-modal-title">

                        <div className="ai-modal-icon">
                            <LuSparkles />
                        </div>

                        <div className="ai-modal-title-text">

                            <h2>
                                Générateur de publication IA
                            </h2>

                            <p>
                                Créez une publication prête à publier pour
                                <strong> {product.name}</strong>
                            </p>

                        </div>

                        <button
                            className="close-modal-btn"
                            onClick={handleClose}
                        >
                            <FiX />
                        </button>

                    </div>                

                </div>

                <div className="ai-modal-content">

                    {result ? (

                        <div className="ai-result">

                            <div className="ai-result-card">

                                <div className="ai-result-header">

                                    <div className="ai-result-badge">

                                        ✨ Publication générée

                                    </div>

                                    <button
                                        className={`copy-btn ${copied ? "copied" : ""}`}
                                        onClick={handleCopy}
                                    >

                                        {copied ? (
                                            <FiCheck size={24}/>
                                        ) : (
                                            <FiCopy size={24}/>
                                        )}

                                    </button>

                                </div>

                                <div
                                    className="ai-result-content"
                                    dir={language === "ar" ? "rtl" : "ltr"}
                                >

                                    <p className="ai-caption">
                                        {result.caption}
                                    </p>

                                </div>

                            </div>

                            <button
                                className="generate-again-btn"
                                onClick={() => {setResult(null);}}
                            >

                                Générer une autre version

                            </button>

                        </div>

                    ) : (

                        <>

                            {/* PRODUCT */}
                            <div className="ai-product-preview">

                                <img
                                    src={product.thumbnail || product.images?.[0]}
                                    alt={product.name}
                                />

                                <div>

                                    <h3>
                                        {product.name}
                                    </h3>

                                    <p>
                                        {product.category} • {product.price} TND
                                    </p>

                                </div>

                            </div>

                            <section className="ai-section">

                                <h4 className="ai-section-title">
                                    Choisir la langue
                                </h4>

                                <div className="platform-grid">

                                    <button
                                        type="button"
                                        className={`platform-card ${language === "fr" ? "active" : ""}`}
                                        onClick={() => setLanguage("fr")}
                                    >
                                        <div className="platform-content">
                                            <h4 className="platform-name">
                                                Français
                                            </h4>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        className={`platform-card ${language === "ar" ? "active" : ""}`}
                                        onClick={() => setLanguage("ar")}
                                    >
                                        <div className="platform-content" style={{justifyContent:'flex-end'}}>
                                            <h4 className="platform-name">
                                             العربية
                                            </h4>
                                        </div>
                                    </button>

                                </div>

                            </section>

                        </>

                    )}

                </div>

                {!result && (
                <div className="ai-modal-footer">

                    <button
                        className="cancel-ai-btn"
                        onClick={handleClose}
                    >
                        Annuler
                    </button>

                    <button
                        className="generate-ai-btn"
                        onClick={handleGenerate}
                        disabled={loading}
                    >

                        <LuSparkles />
                        {loading ? "Génération..." : "Générer le post"}

                    </button>

                </div>
                )}

            </div>

        </div>

    );

}