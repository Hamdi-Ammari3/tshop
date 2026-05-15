"use client";

import Link from "next/link";
import "./productCard.css";

export default function ProductCard({ product }) {
  return (
    <Link href={`/product/${product.id}`} className="product-card">

      <div className="product-image-box">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
      </div>

      <div className="product-content">
        <h3>{product.name}</h3>
        <p className="product-store">by {product.storeName}</p>
        <p className="product-price">{product.price} TND</p>
      </div>

    </Link>
  );
}