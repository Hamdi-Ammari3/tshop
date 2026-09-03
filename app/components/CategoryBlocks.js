"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

import "./CategoryBlocks.css";

export default function CategoryBlocks({ categories = [] }) {

    if (!categories.length) {
        return null;
    }

    return (

        <section className="category-blocks">

            {/* 
            <div className="category-blocks-header">

                <div>

                    <h2>
                        Explorez toutes nos catégories
                    </h2>

                    <p>
                        Découvrez les dernières nouveautés proposées par les meilleurs vendeurs en Tunisie.
                    </p>

                </div>

            </div>
            */}

            <div className="category-blocks-grid">

                {categories.map((category) => (

                    <Link
                        key={category.slug}
                        href={`/category/${category.slug}`}
                        className="category-card"
                    >

                        {/* TITLE */}

                        <h3 className="category-card-title">

                            {category.title}

                        </h3>

                        {/* IMAGES */}

                        <div className="category-card-images">

                            {category.images.map((image, index) => (

                                <div
                                    key={index}
                                    className="category-image-box"
                                >

                                    <img
                                        src={image}
                                        alt={category.label}
                                        loading="lazy"
                                    />

                                </div>

                            ))}

                        </div>

                        {/* DESCRIPTION */}

                        <p className="category-card-description">

                            {category.description}

                        </p>

                        {/* CTA */}

                        <p 
                            //href={`/category/${category.slug}`}
                            className="category-card-link"
                        >

                            {category.cta}

                            <FiArrowRight />

                        </p >

                    </Link>

                ))}

            </div>

        </section>

    );

}