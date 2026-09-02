"use client";

import ProductCard from "./ProductCard";
import "./ProductSection.css";
import Link from "next/link";
import {FiArrowLeft} from "react-icons/fi";
import { FiChevronRight } from "react-icons/fi";

export default function ProductSection({title,showTitle,products,showMore,onShowMore}) {

    return (

        <section className="category-products">

            {/* BREADCRUMB */}

            {showTitle && (
            <nav className="category-breadcrumb">

                <Link
                    href="/"
                    className="breadcrumb-link"
                >
                    Accueil
                </Link>

                <FiChevronRight className="breadcrumb-separator" />

                <span
                    className="breadcrumb-link"
                >
                    Catégories
                </span>

                <FiChevronRight className="breadcrumb-separator" />

                <span className="breadcrumb-current">
                    {title}
                </span>

            </nav>
            )}

            {/* TOOLBAR */}
            {showTitle && (

            
            <div className="products-toolbar">

                <div className="products-toolbar-header">
                    <h5>Catégorie</h5>
                    <h1>{title}</h1>
                </div>
                

                <div className="products-sort">

                    <span>
                        Trier par
                    </span>

                    <select
                        defaultValue="recent"
                    >

                        <option value="recent">
                            Nouveautés
                        </option>

                        <option value="price-asc">
                            Prix croissant
                        </option>

                        <option value="price-desc">
                            Prix décroissant
                        </option>

                    </select>

                </div>

            </div>
            )}

            {/* GRID */}

            <div className="category-products-grid">

                {products.map((product, index) => (

                    <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                    />

                ))}

            </div>

            {/* LOAD MORE */}

            {showMore && (

                <div className="load-more-container">

                    <button
                        onClick={onShowMore}
                        className="load-more-btn"
                    >

                        Voir plus de produits

                    </button>

                </div>

            )}

        </section>

    );

}