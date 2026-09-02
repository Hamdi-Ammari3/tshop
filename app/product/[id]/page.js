"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProduct, getCategoryProducts } from "../../../lib/products";
import ProductSection from "../../components/ProductSection";
import { useMarketplaceCart } from "../../../context/MarketplaceCartContext";
import {
  FiMinus,
  FiPlus,
  FiArrowLeft,
  FiShoppingCart,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
  FiTruck,
  FiLoader,
  FiStar,
  FiZap,
  FiShoppingBag,
  FiRotateCcw,
  FiHeart,
  FiShare2,
  FiAlertCircle,
} from "react-icons/fi";
import "./product.css";

export default function ProductPage() {
  const router = useRouter();
  const { id } = useParams();

  const { addToCart } = useMarketplaceCart();

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedLot, setSelectedLot] = useState(null);
  const [manualImage, setManualImage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [variantError, setVariantError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getProduct(id);

        setProduct(data);

        setSelectedOptions({});
        setSelectedLot(null);
        setQuantity(1);
        setSelectedIndex(0);
        setManualImage(true);
        setVariantError("");

        if (data?.category_slug) {
          const result = await getCategoryProducts(data.category_slug, 6);

          const filtered = result.products.filter((item) => item.id !== data.id);

          setSimilarProducts(filtered);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      load();
    }
  }, [id]);

  const norm = (v) => String(v ?? "").trim().toLowerCase();

  function isValueAvailable(optionName, value, selections) {
    return !!product?.variants?.find((variant) => {
      if (!variant?.options || variant.inventory <= 0) return false;

      return variant.options.every((variantOption) => {
        const productOption = findProductOption(variantOption.name);
        if (!productOption) return false;

        // This is the group we're currently testing a candidate value for.
        if (norm(productOption.name) === norm(optionName)) {
          return norm(variantOption.value) === norm(value);
        }

        // Any other group: if the user hasn't picked a value for it yet,
        // don't let it block this candidate — treat as wildcard.
        const alreadySelected = selections[productOption.name];
        if (alreadySelected === undefined || alreadySelected === null || alreadySelected === "") {
          return true;
        }
        return norm(alreadySelected) === norm(variantOption.value);
      });
    });
  }

  function findProductOption(variantOptionName) {
    return product?.options?.find((po) => norm(po.name) === norm(variantOptionName));
  }

  function variantMatches(variant, selections) {
    if (!variant?.options) return false; // guards against empty placeholder entries
    return variant.options.every((variantOption) => {
      const productOption = findProductOption(variantOption.name);
      if (!productOption) return false;
      return norm(selections[productOption.name]) === norm(variantOption.value);
    });
  }

  const currentImage = product?.images?.[selectedIndex] || "/placeholder.png";

  const selectedVariant = product?.variants?.find((variant) =>
    variantMatches(variant, selectedOptions)
  );

  const variantSelectionRequired = !!(product?.hasVariants && product?.options?.length > 0);

  const variantSelectionComplete = !variantSelectionRequired || !!selectedVariant;

  const activeImage = manualImage ? currentImage : selectedVariant?.image || currentImage;

  /* ACTIVE PRICE */
  const activePrice = selectedVariant?.price ?? product?.price;

  /* ACTIVE OLD PRICE */
  const activeOldPrice = selectedVariant?.oldPrice ?? product?.oldPrice;

  /* ACTIVE INVENTORY */
  const activeInventory = selectedVariant?.inventory ?? product?.inventory;

  /* MAX QUANTITY */
  const maxQuantity = product?.trackInventory ? Number(activeInventory || 0) : Infinity;

  /* Lots can't be picked until a required variant has actually been
     selected — a lot's discount is tied to a specific stock number, and
     before a variant is chosen there's no reliable per-variant stock to
     validate it against. */
  const lotsLocked = variantSelectionRequired && !variantSelectionComplete;

  /* TOTAL */
  const totalPrice = useMemo(() => {
    if (!product) return 0;

    // LOT PRICE
    if (selectedLot !== null && product.lotRules?.lots?.[selectedLot]) {
      return Number(product.lotRules.lots[selectedLot].price || 0);
    }

    return Number(activePrice) * quantity;
  }, [product, quantity, activePrice, selectedLot]);

  const discountPercent =
    product?.hasDiscount && product?.oldPrice && product?.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

  //Quantity check
  const applyQuantity = (newQty) => {
    setQuantity(newQty);

    const lots = product?.lotRules?.enabled ? product?.lotRules?.lots || [] : [];
    const matchingLotIndex = lots.findIndex((lot) => Number(lot.quantity) === newQty);

    // Never auto-apply a lot while a required variant hasn't been chosen
    // yet — same guard as the lot buttons themselves.
    setSelectedLot(matchingLotIndex !== -1 && !lotsLocked ? matchingLotIndex : null);
  }

  // INCREASE QUANTITY
  const increaseQty = () => {
    if (product.trackInventory && quantity >= maxQuantity) {
      return;
    }
    applyQuantity(quantity + 1);
  };

  // DECREASE QUANTITY
  const decreaseQty = () => {
    if (quantity <= 1) return;
    applyQuantity(quantity - 1);
  };

  useEffect(() => {
    if (product?.trackInventory && quantity > maxQuantity) {
      setQuantity(maxQuantity > 0 ? maxQuantity : 1);
    }
  }, [quantity, maxQuantity, product?.trackInventory]);

  /* Re-validate the selected lot every time the active variant (and thus
     its available stock) changes. A lot chosen against one variant's
     stock — or before any variant was chosen at all — must never keep
     applying its discounted price once the real, current stock can't
     actually cover that lot's quantity. This is what closes both:
     (1) picking a lot before selecting a variant that turns out to have
         less stock than the lot requires, and
     (2) switching from a variant with enough stock to one that doesn't,
         while a lot is still active. */
  useEffect(() => {
    if (selectedLot === null) return;

    const lot = product?.lotRules?.lots?.[selectedLot];
    if (!lot) return;

    const stillValid =
      !lotsLocked &&
      (!product?.trackInventory || Number(lot.quantity) <= Number(activeInventory || 0));

    if (!stillValid) {
      setSelectedLot(null);
      setQuantity((q) => {
        if (!product?.trackInventory) return q;
        const clampMax = Number(activeInventory || 0);
        return Math.min(q, clampMax > 0 ? clampMax : 1);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant, activeInventory, lotsLocked]);

  // NEXT IMAGE — browsing the gallery always shows product images,
  // regardless of any variant currently selected.
  const nextImage = () => {
    if (!product?.images?.length) return;

    setManualImage(true);

    setSelectedIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  // PREV IMAGE
  const prevImage = () => {
    if (!product?.images?.length) return;

    setManualImage(true);

    setSelectedIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  // ADD TO CART
  const handleAddToCart = () => {
    if (!variantSelectionComplete) {
      setVariantError("Veuillez sélectionner toutes les options avant de continuer.");
      return;
    }
    setVariantError("");

    const variantKey = selectedVariant?.variantKey || "";

    const lotKey = selectedLot !== null ? `lot-${selectedLot}` : "no-lot";

    const cartItemId = `${product.id}-${variantKey}-${lotKey}`;

    addToCart(
      {
        ...product,

        cartItemId,

        selectedVariant,

        selectedOptions,

        selectedLot: selectedLot !== null ? product.lotRules.lots[selectedLot] : null,

        finalPrice: selectedLot !== null ? product.lotRules.lots[selectedLot]?.price || 0 : activePrice,
      },
      quantity
    );
  };

  // BUY NOW
  const handleBuyNow = async () => {
    if (!variantSelectionComplete) {
      setVariantError("Veuillez sélectionner toutes les options avant de continuer.");
      return;
    }
    setVariantError("");

    try {
      setOrdering(true);

      const variantKey = selectedVariant?.variantKey || "";

      const lotKey = selectedLot !== null ? `lot-${selectedLot}` : "no-lot";

      const cartItemId = `${product.id}-${variantKey}-${lotKey}`;

      addToCart(
        {
          ...product,

          cartItemId,

          selectedVariant,

          selectedOptions,

          selectedLot: selectedLot !== null ? product.lotRules.lots[selectedLot] : null,

          finalPrice: selectedLot !== null ? product.lotRules.lots[selectedLot]?.price || 0 : activePrice,
        },
        quantity
      );

      router.push("/checkout");
    } finally {
      setOrdering(false);
    }
  };

  const description = product?.description || "Aucune description disponible pour ce produit.";

  //Loading ...
  if (loading) {
    return (
      <div className="loading-page">
        <FiLoader className="spin-icon" />
      </div>
    );
  }

  /* NOT FOUND */
  if (!product) {
    return (
      <div className="product-not-found">
        <h1>Produit introuvable</h1>
        <p>Ce produit n'existe pas ou a été supprimé.</p>
        <Link href="/" className="not-found-btn">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.trackInventory && activeInventory <= 0;
  const categoryLabel = product.categoryName || product.category_slug;

  return (
    <div className="product-page">

      {/* BREADCRUMB */}
      <nav className="breadcrumb-nav">
        <Link href="/">Accueil</Link>
        <FiChevronRight size={14} />
        {categoryLabel && (
          <>
            <Link href={`/category/${product.category_slug}`}>{categoryLabel}</Link>
            <FiChevronRight size={14} />
          </>
        )}
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      <main className="product-main">
        <div className="product-grid">
          {/* GALLERY */}
          <section className="product-gallery-col">
            <div className="gallery-card">
              <div className="gallery-main">
                {product.images?.length > 1 && (
                  <>
                    <button className="gallery-arrow left-arrow" onClick={prevImage} aria-label="Image précédente">
                      <FiChevronLeft />
                    </button>

                    <button className="gallery-arrow right-arrow" onClick={nextImage} aria-label="Image suivante">
                      <FiChevronRight />
                    </button>
                  </>
                )}

                <Image src={activeImage} alt={product.name} fill className="product-main-img" />

                {discountPercent > 0 && (
                  <span className="gallery-badge-discount">-{discountPercent}%</span>
                )}

                {!manualImage && selectedVariant?.image && (
                  <span className="gallery-badge-variant">
                    {Object.values(selectedOptions).join(" / ")}
                  </span>
                )}
              </div>

              {product.images?.length > 1 && (
                <div className="product-thumbnails">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      className={`thumbnail-btn ${
                        manualImage && selectedIndex === index ? "active-thumbnail" : ""
                      }`}
                      onClick={() => {
                        setManualImage(true);
                        setSelectedIndex(index);
                      }}
                      aria-label={`Vue ${index + 1}`}
                    >
                      <img src={img} alt="" loading="lazy" className="thumbnail-image" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* DETAILS */}
          <section className="product-details-col">
            <div className="details-card">
              <h1 className="product-title">{product.name}</h1>

              {/*
              {(product.rating || product.reviews) && (
                <div className="rating-row">
                  {product.rating && (
                    <span className="rating-badge">
                      4.9
                      <FiStar size={13} />
                    </span>
                  )}
                  {(product.reviews || product.bought) && (
                    <span className="rating-meta">
                      {product.reviews ? `${product.reviews} avis` : ""}
                      {product.reviews && product.bought ? " · " : ""}
                      {product.bought ? `${product.bought}+ achetés` : ""}
                    </span>
                  )}
                </div>
              )}
              */}

              <div className="price-block">
                <div className="price-row">
                  <span className="price-current">{activePrice} TND</span>
                  {activeOldPrice && <span className="price-old">{activeOldPrice} TND</span>}
                  {discountPercent > 0 && <span className="price-discount-chip">-{discountPercent}%</span>}
                </div>
              </div>

              <div className="description-block">
                <h2 className="description-title">Description</h2>
                <p className="description-text">{description}</p>
              </div>

              {/* VARIANTS */}
              {product.hasVariants && product.options?.length > 0 && (
                <div className="product-variants-section">
                  {product.options.map((option, index) => (
                    <div key={index} className="variant-group">
                      <div className="variant-group-top">
                        <h4>{option.name}</h4>
                        <span className={selectedOptions[option.name] ? "" : "variant-unselected-hint"}>
                          {selectedOptions[option.name] || "Non sélectionné"}
                        </span>
                      </div>

                      <div className="variant-values">
                        {option.values.map((value, i) => {
                          const isOut = !isValueAvailable(option.name, value, selectedOptions);
                          const isActive = selectedOptions[option.name] === value;

                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={isOut}
                              className={`variant-btn ${isActive ? "active-variant" : ""} ${
                                isOut ? "disabled-variant" : ""
                              }`}
                              onClick={() => {
                                setVariantError("");
                                setManualImage(false);

                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [option.name]: value,
                                }));
                              }}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {variantError && (
                    <p className="variant-error">
                      <FiAlertCircle size={13} />
                      {variantError}
                    </p>
                  )}
                </div>
              )}

              {/* LOTS */}
              {product.lotRules?.enabled && product.lotRules?.lots?.length > 0 && (
                <div className="product-lots-section">
                  <div className="product-section-title">
                    <h4>Achat en lot</h4>
                    <p>
                      {lotsLocked
                        ? "Sélectionnez une option ci-dessus pour voir les lots disponibles"
                        : "Réductions pour grandes quantités"}
                    </p>
                  </div>

                  <div className="product-lots-grid">
                    {product.lotRules.lots.map((lot, index) => {
                      const selected = selectedLot === index;
                      const isDisabled =
                        lotsLocked || (product.trackInventory && lot.quantity > activeInventory);

                      return (
                        <button
                          key={index}
                          type="button"
                          disabled={isDisabled}
                          className={`product-lot-card ${selected ? "active-lot" : ""} ${
                            isDisabled ? "disabled-lot" : ""
                          }`}
                          onClick={() => {
                            setSelectedLot(index);
                            setQuantity(lot.quantity);
                          }}
                        >
                          <div>
                            <strong>{lot.quantity} pièces</strong>
                            <span>{(lot.price / lot.quantity).toFixed(2)} TND / unité</span>
                          </div>

                          <h5>{lot.price} TND</h5>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* BUY BOX */}
          <aside className="product-buybox-col">
            <div className="buybox-wrapper">
              <div className="buybox-card">
                <div className="buybox-price">{totalPrice} TND</div>

                <div className="stock-row">
                  {!variantSelectionComplete ? (
                    <span className="stock-select-hint">Sélectionnez une option pour voir la disponibilité</span>
                  ) : activeInventory > 0 ? (
                    <>
                      <span className="stock-dot" />
                      <span className="stock-text">
                        {product.trackInventory ? "En stock" : "Disponible"}
                      </span>
                      {product.trackInventory && (
                        <span className="stock-count">({activeInventory} disponibles)</span>
                      )}
                    </>
                  ) : (
                    <span className="stock-out">Rupture de stock</span>
                  )}
                </div>

                <div className="quantity-section">
                  <label>Quantité</label>
                  <div className="quantity-box">
                    <button onClick={decreaseQty} disabled={quantity <= 1} aria-label="Diminuer">
                      <FiMinus />
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={increaseQty}
                      disabled={product.trackInventory && quantity >= maxQuantity}
                      aria-label="Augmenter"
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>

                <div className="total-box">
                  <span>Total</span>
                  <h3>{totalPrice} TND</h3>
                </div>

                <div className="product-details-actions">
                  <button
                    className="add-cart-btn"
                    disabled={isOutOfStock || !variantSelectionComplete}
                    onClick={handleAddToCart}
                  >
                    <FiShoppingCart />
                    Ajouter au panier
                  </button>

                  <button
                    className="buy-now-btn"
                    disabled={ordering || isOutOfStock || !variantSelectionComplete}
                    onClick={handleBuyNow}
                  >
                    <FiZap />
                    {ordering ? "Chargement..." : "Acheter maintenant"}
                  </button>

                  {!variantSelectionComplete && (
                    <p className="variant-required-note">
                      <FiAlertCircle size={12} />
                      Choisissez {product.options.map((o) => o.name).join(", ")} pour continuer
                    </p>
                  )}

                  {/* 
                  <div className="secondary-actions">
                    <button className="secondary-btn">
                      <FiHeart size={14} /> Favoris
                    </button>
                    <button className="secondary-btn">
                      <FiShare2 size={14} /> Partager
                    </button>
                  </div>
                  */}
                  
                </div>

                <ul className="trust-list">
                  <li>
                    <FiTruck size={14} />
                    Livraison rapide
                  </li>
                  <li>
                    <FiShield size={14} />
                    Produit vérifié
                  </li>
                </ul>
              </div>

              {/* STORE CARD */}
              <Link href={`/profile/${product.storeSlug}`} className="store-card">
                <div className="store-card-top">
                  {product.storeLogo ? (
                    <img src={product.storeLogo} alt={product.storeName} className="store-logo-img" />
                  ) : (
                    <div className="store-avatar-icon">
                      <FiShoppingBag size={18} />
                    </div>
                  )}

                  <div className="store-info">
                    <p className="store-label">Vendu par</p>
                    <p className="store-name">{product.storeName}</p>
                  </div>

                  <FiChevronRight className="store-chevron" size={16} />
                </div>

                <div className="store-cta">Visiter la boutique</div>
              </Link>
            </div>
          </aside>
        </div>

        {/* SIMILAR PRODUCTS */}
        {similarProducts?.length > 0 && (
          <section className="similar-section">
            <div className="similar-header">
              <h2>Produits similaires</h2>
              <Link href={`/category/${product.category_slug}`}>Voir tout →</Link>
            </div>

            <ProductSection showTitle={false} title="" products={similarProducts} />
          </section>
        )}
      </main>
    </div>
  );
}