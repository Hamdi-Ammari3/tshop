"use client";

import { useRouter } from "next/navigation";
import { FiShoppingCart, FiTrendingUp } from "react-icons/fi";
import "./ProductCard.css";

export default function ProductCard({ product }) {

    const router = useRouter();

    const discount =
        product.hasDiscount &&
        product.oldPrice > product.price
            ? Math.round(
                  ((product.oldPrice - product.price) /
                      product.oldPrice) *
                      100
              )
            : 0;

    const soldCount = Number(product.stats?.ordersCount || 0);

    return (

        <article
            className="category-product-card"
            onClick={() =>
                router.push(`/product/${product.id}`)
            }
        >

            <div className="category-product-image">

                <img
                    src={
                        product.thumbnail ||
                        product.images?.[0]
                    }
                    alt={product.name}
                    loading="lazy"
                />

                {discount > 0 && (

                    <span className="category-product-discount">

                        -{discount}%

                    </span>

                )}

            </div>

            <div className="category-product-content">

                <h3 className="product-card-name">{product.name}</h3>

                <p className="category-product-store">

                    Vendu par
                    <strong>
                        {" "}
                        {product.storeName ||
                            product.store ||
                            "Boutique"}
                    </strong>

                </p>

                {soldCount > 0 && (

                    <div className="category-product-sold">

                        <FiTrendingUp />

                        <span>{soldCount}+ vendus</span>

                    </div>

                )}

                <div className="category-product-footer">

                        <div className="category-product-price">

                            {Number(product.price).toFixed(3)} DT

                        </div>

                        {product.hasDiscount && (

                            <div className="category-product-old-price">

                                {Number(product.oldPrice).toFixed(3)} DT

                            </div>

                        )}

                </div>

            </div>

        </article>

    );

}