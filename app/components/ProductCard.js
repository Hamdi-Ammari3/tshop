"use client";

import { useRouter } from "next/navigation";

export default function ProductCard({ product }) {
  const router = useRouter();

  return (
    <div 
      className="product-card"
      //onClick={() => window.open(`/product/${product.id}`,"_blank")}
      onClick={() => router.push(`/product/${product.id}`)}
    >

      <div className="product-image-wrapper">

        {product.hasDiscount && (
            <div className="discount-badge">
                - {Math.round(((product.oldPrice - product.price) /product.oldPrice) * 100)} %
            </div>
        )}

        <img
          src={product.images?.[0]}
          alt={product.name}
        />

      </div>

      <div className="product-content">

        <h3 className="product-name">
          {product.name}
        </h3>

        <div className="product-price-container">

          {product.hasDiscount ? (
            <>
              <span className="old-price">
                {product.oldPrice} DT
              </span>

              <span className="new-price">
                {product.price} DT
              </span>
            </>
          ) : (
            <span className="new-price">
              {product.price} DT
            </span>
          )}

        </div>

      </div>

    </div>
  );
}