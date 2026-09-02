"use client";

import Link from "next/link";

import {
    FiArrowRight,
    FiShoppingBag,
    FiTruck,
    FiTrendingUp,
    FiGlobe,
    FiShield,
} from "react-icons/fi";

import "./SellerCTA.css";

export default function SellerCTA() {

    const stats = [

        {
            icon: <FiGlobe />,
            title: "Site e-commerce",
            subtitle: "professionnel en quelques minutes",
        },

        {
            icon: <FiTrendingUp />,
            title: "Marketplace",
            subtitle: "plus de visibilité pour vos produits",
        },

        {
            icon: <FiShoppingBag />,
            title: "20 commandes",
            subtitle: "offertes pour commencer",
        },

        {
            icon: <FiTruck />,
            title: "Livraison",
            subtitle: "intégrée avec nos partenaires",
        },

    ];

    return (

        <section className="seller-section">

            <div className="seller-container">

                <div className="seller-background-circle seller-circle-one"></div>
                <div className="seller-background-circle seller-circle-two"></div>

                <div className="seller-grid">

                    {/* LEFT */}

                    <div className="seller-left">

                        <span className="seller-badge">

                            <FiShoppingBag />

                            Espace vendeurs

                        </span>

                        <h2>

                            Votre boutique en ligne,
                            <span> prête en quelques minutes.</span>

                        </h2>

                        <p>

                            Site e-commerce, marketplace et livraison intégrée.
                            Recevez <strong>20 commandes offertes</strong> pour démarrer.

                        </p>

                        <div className="seller-actions">

                            <Link
                                href="/onboarding"
                                className="seller-primary-btn"
                            >

                                Créer ma boutique

                                <FiArrowRight />

                            </Link>

                            <Link
                                href="/support"
                                className="seller-secondary-btn"
                            >

                                En savoir plus

                            </Link>

                        </div>

                    </div>

                    {/* RIGHT */}

                    <div className="seller-stats">

                        {stats.map((item, index) => (

                            <div
                                key={index}
                                className="seller-stat-card"
                            >

                                <div className="seller-stat-icon">

                                    {item.icon}

                                </div>

                                <h3>

                                    {item.title}

                                </h3>

                                <p>

                                    {item.subtitle}

                                </p>

                            </div>

                        ))}

                    </div>

                </div>

            </div>

        </section>

    );

}