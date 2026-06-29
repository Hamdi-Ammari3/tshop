"use client";

import { useRef } from "react";
import ProductCard from "./ProductCard";
import { MdArrowBackIosNew,MdArrowForwardIos } from "react-icons/md";

export default function ProductSection({title,products,showMore,onShowMore,horizontal = false,featured}) {

    const scrollRef = useRef(null);

    const scrollLeft = () => {
        scrollRef.current?.scrollBy({left: -300,behavior: "smooth"});
    };

    const scrollRight = () => {
        scrollRef.current?.scrollBy({left: 300,behavior: "smooth"});
    };

    return (
        <section className={`products-section ${featured ? "featured-section" : ""}`}>

            <div className="section-header">

                <h2>{title}</h2>

                <div className="section-actions">

                    {horizontal && (
                        <>
                            <button
                                className="arrow-btn"
                                onClick={scrollLeft}
                            >
                                <MdArrowBackIosNew/>
                            </button>

                            <button
                                className="arrow-btn"
                                onClick={scrollRight}
                            >
                                <MdArrowForwardIos/>
                            </button>
                        </>
                    )}

                </div>

            </div>

                <div
                    ref={scrollRef}
                    className={horizontal ? "products-row" : "products-grid"}
                >
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                        />
                    ))}
                </div>

            {showMore && products.length > 0 && (
                <div className="load-more-wrapper">
                    <button
                        className="show-more-btn"
                        onClick={onShowMore}
                    >
                        Voir plus
                    </button>
                </div>
            )}

        </section>
    );
}