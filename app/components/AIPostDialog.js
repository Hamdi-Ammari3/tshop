"use client";

import { useState } from "react";

import {FiX,FiCheck,FiImage,FiType,FiMessageSquare} from "react-icons/fi";

import {FaFacebook,FaInstagram} from "react-icons/fa";

import {LuSparkles} from "react-icons/lu";

import "./AIPostDialog.css";

export function AIPostDialog({product,open,onClose}) {

    const [platform,setPlatform] = useState("facebook");

    const [pieces,setPieces] = useState({image:true,text:true,caption:true});

    if(!open) return null;

    function togglePiece(key){

        const updated = {
            ...pieces,
            [key]: !pieces[key],
        };

        const selected = Object.values(updated).filter(Boolean);

        if(selected.length === 0){
            return;
        }

        setPieces(updated);

    }

    return (

        <div
            className="ai-modal-overlay"
            onClick={onClose}
        >

            <div
                className="ai-modal"
                onClick={(e) => e.stopPropagation()}
            >

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
                            onClick={onClose}
                        >
                            <FiX />
                        </button>

                    </div>                

                </div>

                <div className="ai-modal-content">

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
                                {product.category}{" • "}{product.price} TND
                            </p>

                        </div>

                    </div>

                    {/* PLATFORM */}
                    <section className="ai-section">

                        <h4 className="ai-section-title">
                            1. Choisir la plateforme
                        </h4>

                        <div className="platform-grid">

                        

                        {/* Facebook */}
                        <button
                            type="button"
                            className={`platform-card ${platform === "facebook" ? "active" : ""}`}
                            onClick={() => setPlatform("facebook")}
                        >

                            <div className="platform-overlay facebook"></div>

                            <div className="platform-content">

                                <div className="platform-icon">

                                    <FaFacebook />

                                </div>

                                <div>

                                    <h4 className="platform-name">
                                        Facebook
                                    </h4>

                                </div>

                            </div>

                        </button>

                        {/* Instagram */}
                        <button
                            type="button"
                            className={`platform-card ${ platform === "instagram" ? "active" : ""}`}
                            onClick={() => setPlatform("instagram")}
                        >

                            <div className="platform-overlay instagram"></div>

                            <div className="platform-content">

                                <div className="platform-icon">

                                    <FaInstagram />

                                </div>

                                <div>

                                    <h4 className="platform-name">
                                        Instagram
                                    </h4>

                                </div>

                            </div>

                        </button>

                    </div>

                </section>

                {/* PIECES */}
                <section className="ai-section">

                    <h4 className="ai-section-title">
                        2. Que souhaitez-vous générer ?
                    </h4>

                    <div className="pieces-list">

                        <PieceCard
                            icon={<FiImage />}
                            title="Image publicitaire"
                            active={pieces.image}
                            onClick={() => togglePiece("image")}
                        />

                        <PieceCard
                            icon={<FiType />}
                            title="Texte principal"
                            active={pieces.text}
                            onClick={() => togglePiece("text")}
                        />

                        <PieceCard
                            icon={<FiMessageSquare />}
                            title="Légende / Hashtags"
                            active={pieces.caption}
                            onClick={() => togglePiece("caption")}
                        />

                    </div>

                </section>

            </div>

            <div className="ai-modal-footer">

                <button
                    className="cancel-ai-btn"
                    onClick={onClose}
                >
                    Annuler
                </button>

                <button
                    className="generate-ai-btn"
                >

                    <LuSparkles />

                    Générer le post

                </button>

            </div>

        </div>

        </div>

    );

}

function PieceCard({icon,title,active,onClick}) {

    return (

        <button
            className={active ? "piece-card active" : "piece-card"}
            onClick={onClick}
        >

            <div className="piece-left">

                <div className="piece-icon">
                    {icon}
                </div>

                <div>

                    <h4 className="platform-name">
                        {title}
                    </h4>

                </div>

            </div>

            <div
                className={active ? "piece-check active" : "piece-check"}
            >

                {active && (
                    <FiCheck />
                )}

            </div>

        </button>

    );

}