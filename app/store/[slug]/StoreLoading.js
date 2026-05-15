"use client";

export default function StoreLoading() {

  return (
    <div className="store-loading-page">

      {/* NAVBAR */}
      <div className="store-loading-navbar">

        <div className="loading-brand">
          <div className="loading-logo shimmer"></div>

          <div className="loading-brand-text">
            <div className="loading-line shimmer"></div>
            <div className="loading-small-line shimmer"></div>
          </div>
        </div>

        <div className="loading-search shimmer"></div>

        <div className="loading-cart shimmer"></div>

      </div>

      {/* PRODUCTS */}
      <div className="store-loading-grid">

        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="loading-product-card"
          >

            <div className="loading-product-image shimmer"></div>

            <div className="loading-product-content">

              <div className="loading-line shimmer"></div>

              <div className="loading-small-line shimmer"></div>

              <div className="loading-price shimmer"></div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}