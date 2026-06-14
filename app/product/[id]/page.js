"use client";

import { useMemo,useState,useEffect  } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {getProduct,getCategoryProducts} from "../../../lib/products";
import ProductSection from "../../components/ProductSection";
import {useMarketplaceCart} from '../../../context/MarketplaceCartContext';
import {FiMinus,FiPlus,FiArrowLeft,FiShoppingCart,FiChevronLeft,FiChevronRight,FiShield,FiTruck,FiLoader} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import "./product.css";

export default function ProductPage() {

  const router = useRouter();
  const { id } = useParams();

  const {addToCart} = useMarketplaceCart();

  const [product,setProduct] = useState(null);
  const [selectedImage,setSelectedImage] = useState("");
  const [similarProducts,setSimilarProducts] = useState([]);
  const [selectedIndex,setSelectedIndex] = useState(0);
  const [quantity,setQuantity] = useState(1);
  const [ordering,setOrdering] = useState(false);
  const [selectedOptions,setSelectedOptions] = useState({});
  const [selectedLot,setSelectedLot] = useState(null);
  const [manualImage,setManualImage] = useState(false);
  const [loading,setLoading] = useState(true);

  useEffect(() => {

    async function load() {

            try {

                const data = await getProduct(id);

                setProduct(data);

                setSelectedImage(data?.images?.[0]);

                if (data?.category_slug) {

                    const result = await getCategoryProducts(data.category_slug,8);

                    const filtered = result.products.filter(item => item.id !== data.id);

                    setSimilarProducts(filtered);

                }

            } catch(error) {

                console.log(error);

            } finally {

                setLoading(false);

            }

        }

        if(id) {
            load();
        }

    }, [id]);
  
  /* DEFAULT OPTIONS */
  useEffect(() => {

    if (product?.hasVariants && product.options?.length) {

      const defaults = {};

      product.options.forEach((option,index) => {

        const firstAvailable = product.variants.find((variant) => {

          const match = variant.options.find((o) => o.name === option.name);

          return (
            match && variant.inventory > 0
          );

        });

        const optionMatch = firstAvailable?.options.find((o) => o.name === option.name);

        if (optionMatch) {

          defaults[option.name] = optionMatch.value;

        }

      });

      setSelectedOptions(defaults);

    }

  }, [product]);

  const currentImage = product?.images?.[selectedIndex] || "/placeholder.png";

  /* SELECTED VARIANT */
  const selectedVariant = product?.variants?.find((variant) => {

    return variant.options.every((option) => selectedOptions[option.name] === option.value);

  });

  /* ACTIVE IMAGE */
  const activeImage = manualImage ? currentImage : (selectedVariant?.image || currentImage);

  /* ACTIVE PRICE */
  const activePrice = selectedVariant?.price || product?.price;

  /* ACTIVE OLD PRICE */
  const activeOldPrice = selectedVariant?.oldPrice || product?.oldPrice;

  /* ACTIVE INVENTORY */
  const activeInventory = selectedVariant?.inventory ?? product?.inventory;

  /* MAX QUANTITY */
  const maxQuantity = product?.trackInventory ? Number(activeInventory || 0) : Infinity; 

  /* TOTAL */
  const totalPrice = useMemo(() => {

    if (!product) return 0;

    // LOT PRICE
    if (selectedLot !== null && product.lotRules?.lots?.[selectedLot] ) {

      return Number(product.lotRules.lots[selectedLot].price || 0);

    }

    return (Number(activePrice) * quantity);

  }, [product,quantity,activePrice,selectedLot]);

  // INCREASE QUANTITY
  const increaseQty = () => {

    if (product.trackInventory && quantity >= maxQuantity) {
      return;
    }

    // REMOVE LOT SELECTION
    if (selectedLot !== null) {

      setSelectedLot(null);

    }

    setQuantity((prev) => prev + 1);

  };

  // DECREASE QUANTITY
  const decreaseQty = () => {

    if (quantity <= 1) return;

    // REMOVE LOT SELECTION
    if (selectedLot !== null) {

      setSelectedLot(null);

    }

    setQuantity((prev) => prev - 1);
  };

  useEffect(() => {

    if (product?.trackInventory && quantity > maxQuantity) {

      setQuantity(maxQuantity > 0 ? maxQuantity: 1);

    }

  }, [quantity,maxQuantity,product?.trackInventory]);

  // NEXT IMAGE
  const nextImage = () => {

    if (!product?.images?.length) return;

    setManualImage(true);

    setSelectedIndex((prev) => prev === product.images.length - 1 ? 0 : prev + 1);
  };

  // PREV IMAGE
  const prevImage = () => {

    if (!product?.images?.length) return;

    setManualImage(true);

    setSelectedIndex((prev) => prev === 0 ? product.images.length - 1 : prev - 1);
  };

  useEffect(() => {

    if (selectedVariant?.image) {

      const variantImageIndex = product.images.findIndex((img) => img ===selectedVariant.image);

      if (variantImageIndex !== -1) {

        setSelectedIndex(variantImageIndex);

      }

    }

  }, [selectedVariant,product?.images]);


  // ADD TO CART
  const handleAddToCart = () => {

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
      //router.push("http://localhost:3000/store/hamdi-store/checkout");

    } finally {
      setOrdering(false);
    }
  };

  const description = product?.description || "Aucune description disponible pour ce produit.";

  const isLongDescription = description.length > 180;

  //Loading ...
  if(loading) {
  
    return (
      <div className="loading-page">
        <FiLoader className="spin-icon"/>
      </div>
    );
  
  }

  /* NOT FOUND */
  if (!product) {
    return (
      <div className="product-not-found">

        <h1>
          Produit introuvable
        </h1>

        <p>
          Ce produit n'existe pas ou a été supprimé.
        </p>

      </div>
    );
  }

  return (
    <div className="product-page">
      <>
      {/* TOP */}
      <div className="product-top">

        <Link
          href="/"
          //href="/store/hamdi-store"
          className="back-store-btn"
        >

          <FiArrowLeft />

          Retour

        </Link>

      </div>

      {/* CONTENT */}
      <div className="product-container">

        {/* LEFT */}
        <div className="product-gallery">

          <div className="product-main-image">

            {product.images?.length > 1 && (
              <>
                <button
                  className="gallery-arrow left-arrow"
                  onClick={prevImage}
                >
                  <FiChevronLeft />
                </button>

                <button
                  className="gallery-arrow right-arrow"
                  onClick={nextImage}
                >
                  <FiChevronRight />
                </button>
              </>
            )}

            <Image
              src={activeImage}
              alt={product.name}
              fill
              className="product-main-img"
            />

            {product.hasDiscount && (
              <div className="product-discount-badge">
                - {Math.round(((product.oldPrice - product.price) /product.oldPrice) * 100)} %
              </div>
            )}

          </div>

          {/* THUMBNAILS */}
          {product.images?.length > 1 && (
            <div className="product-thumbnails">

              {product.images.map(
                (img, index) => (

                  <button
                    key={index}
                    className={`thumbnail-btn ${selectedIndex === index ? "active-thumbnail" : ""}`}
                    onClick={() => {

                      setManualImage(true);

                      setSelectedIndex(index);

                    }}
                  >

                    <img
                      src={img}
                      alt="thumbnail image"
                      loading="lazy"
                      className="thumbnail-image"
                    />

                  </button>
                )
              )}

            </div>
          )}

        </div>

        {/* RIGHT */}
        <div className="product-details">

          <div className="store-profile">

            <Link
              href={`/profile/${product.storeSlug}`}
              className="store-link"
            >
              {product.storeLogo ? (

                <img
                  src={product.storeLogo}
                  alt={product.storeName}
                  className="store-logo"
                />

              ) : (

                <div className="store-avatar">

                  {product.storeName?.charAt(0)}

                </div>

              )}

              <div>

                <h4>
                  {product.storeName}
                </h4>

              </div>

            </Link>

          </div>

          <h1>{product.name}</h1>

          <p>{product.description}</p>

          {/* PRICE */}
          <div className="product-price-box">

            <div className="product-price">

              <span>
                {activePrice} TND
              </span>

              {activeOldPrice && (
                <small>
                  {activeOldPrice} TND
                </small>
              )}

            </div>
          </div>

          {/* VARIANTS */}
          {product.hasVariants && product.options?.length > 0 && (
            <div className="product-variants-section">

              {product.options.map((option,index) => (

                <div
                  key={index}
                  className="variant-group"
                >

                  <div className="variant-group-top">

                    <h4>
                      {option.name}
                    </h4>

                    <span>
                      {selectedOptions[option.name]}
                    </span>

                  </div>

                  <div className="variant-values">

                    {option.values.map((value,index) => {

                      const matchingVariant = product.variants.find((variant) => {

                        // MUST HAVE STOCK
                        if (variant.inventory <= 0) {
                          return false;
                        }

                        // CHECK ALL CURRENT SELECTED OPTIONS
                        return variant.options.every((variantOption) => {

                          // CURRENT OPTION
                          if (variantOption.name === option.name) {
                            return (variantOption.value === value);
                          }

                          // OTHER OPTIONS
                          return (selectedOptions[variantOption.name] === variantOption.value);

                        });

                      });

                      const isOut = !matchingVariant;

                      const isActive = selectedOptions[option.name] === value;

                      return (

                        <button
                          key={index}
                          type="button"
                          disabled={isOut}
                          className={`variant-btn ${isActive ? "active-variant" : ""} ${isOut? "disabled-variant": ""}`}
                          onClick={() => {

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

            </div>

          )}

          {/* LOTS */}
          {product.lotRules?.enabled && product.lotRules?.lots?.length > 0 && (

            <div className="product-lots-section">

              <div className="product-section-title">

                <h4>
                  Achat en lot
                </h4>

                <p>
                  Réductions pour grandes quantités
                </p>

              </div>

              <div className="product-lots-grid">

                {product.lotRules.lots.map((lot,index) => {

                  const selected = selectedLot === index;

                  const isDisabled = product.trackInventory && lot.quantity > activeInventory;

                  return (

                    <button
                      key={index}
                      type="button"
                      disabled={isDisabled}
                      className={`product-lot-card ${selected ? "active-lot" : ""} ${isDisabled ? "disabled-lot" : ""}`}
                      onClick={() => {

                        setSelectedLot(index);

                        setQuantity(lot.quantity);

                      }}
                    >

                      <div>

                        <strong>
                          {lot.quantity} pièces
                        </strong>

                        <span>

                          {(lot.price / lot.quantity).toFixed(2)} TND / unité

                        </span>

                      </div>

                      <h5>
                        {lot.price} TND
                      </h5>

                    </button>

                  );

                })}

              </div>

            </div>

          )}

          {/* TRUST */}
          <div className="product-trust-box">

            <div>
              <FiTruck />
              Livraison rapide
            </div>

            <div>
              <FiShield />
              Produit vérifié
            </div>

          </div>

          {/* INVENTORY */}
          <div className="product-stock-box">

            {activeInventory > 0 ? (

              <span className="in-stock">

                {product.trackInventory ? `${activeInventory} pièce${activeInventory > 1? "s": ""} disponible${activeInventory > 1? "s": ""}` : "Disponible"}

              </span>

            ) : (

              <span className="out-stock">

                Rupture de stock

              </span>

            )}

          </div>

          {/* QUANTITY */}
          <div className="quantity-section">

            <label>
              Quantité
            </label>

            <div className="quantity-box">

              <button
                onClick={decreaseQty}
                disabled={quantity <= 1}
              >
                <FiMinus />
              </button>

              <span>
                {quantity}
              </span>

              <button
                onClick={increaseQty}
                disabled={product.trackInventory && quantity >= maxQuantity}
              >
                <FiPlus />
              </button>

            </div>

          </div>

          {/* TOTAL */}
          <div className="total-box">

            <span>
              Total
            </span>

            <h3>
              {totalPrice} TND
            </h3>

          </div>

          {/* ACTIONS */}
          <div className="product-actions">

            <button
              className="add-cart-btn"
              disabled={product.trackInventory && activeInventory <= 0}
              onClick={handleAddToCart}
            >

              <FiShoppingCart />

              Ajouter au panier

            </button>

            <button
              className="buy-now-btn"
              disabled={ordering || (product.trackInventory && activeInventory <= 0)}
              onClick={handleBuyNow}
              disabled={ordering}
            >

              {ordering ? "Chargement..." : "Acheter maintenant"}

            </button>

          </div>

        </div>

      </div>
      </>
      
      <div className="similar-products">
      <ProductSection
        title="Produits similaires"
        products={similarProducts}
      />
      </div>

    </div>
  );
}