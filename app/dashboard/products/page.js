"use client";

import { useState } from "react";
import Link from "next/link";
import {deleteDoc,doc} from "firebase/firestore";
import {DB} from "../../../lib/firebaseConfig";
import { useStore } from "../../../context/StoreContext";
import { useDashboard } from "../../../context/DashboardContext";
import { ClipLoader } from "react-spinners";
import {FiEdit2,FiTrash2,FiPlus,FiChevronDown,FiChevronRight,FiLayers,FiArchive,FiBox,FiImage,FiLoader} from "react-icons/fi";
import "../dashboard.css";

/* TOTAL STOCK */
function totalVariantStock(product) {

  return (
    product.variants || []
  ).reduce(
    (sum, combo) =>
      sum + Number(combo.inventory || 0),
    0
  );

}

/* STOCK BADGE */
function StockBadge({ qty }) {

  let tone = "stock-good";

  if (qty === 0) {
    tone = "stock-empty";
  }

  else if (qty < 5) {
    tone = "stock-low";
  }

  return (

    <span
      className={`stock-badge ${tone}`}
    >

      {qty === 0
        ? "Rupture"
        : `${qty} en stock`}

    </span>

  );

}

/* PRODUCT META */
function ProductMeta({ product }) {

  const variantCount = product.variants?.length || 0;

  const lotCount = product.lotRules?.lots?.length || 0;

  const stock = variantCount > 0 ? totalVariantStock(product) : product.trackInventory ? product.inventory || 0 : null;

  return (

    <div className="product-meta">

      {stock !== null && (
        <StockBadge qty={stock} />
      )}

      {variantCount > 0 && (

        <div className="product-meta-badge">

          <FiLayers />

          {variantCount} variantes

        </div>

      )}

      {lotCount > 0 && (

        <div className="product-meta-badge">

          <FiArchive />

          {lotCount} lots

        </div>

      )}

    </div>

  );

}

/* VARIANTS TABLE */
function VariantsTable({ product }) {

  if (!product.hasVariants ||!product.variants ||product.variants.length === 0) {
    return null;
  }

  const headers = [...(product.options || [])].sort((a, b) => a.position - b.position).map((option) => option.name);

  return (

    <div>

      <div className="details-section-title">

        <FiLayers />

        <span>
          Combinaisons variantes
        </span>

      </div>

      <div className="variants-table-wrapper">

        <table className="variants-table">

          <thead>

            <tr>

              <th>
                Variante
              </th>

              {headers.map((header) => (

                <th key={header}>
                  {header}
                </th>

              ))}

              <th>
                Prix
              </th>

              <th>
                Stock
              </th>

            </tr>

          </thead>

          <tbody>

            {product.variants.map(
              (combo) => (

                <tr
                  key={combo.id}
                >

                  <td>

                    <div className="variant-thumb">

                      {combo.image ? (

                        <img
                          src={combo.image}
                          alt=""
                        />

                      ) : (

                        <div className="variant-placeholder">

                          <FiImage />

                        </div>

                      )}

                    </div>

                  </td>

                  {(combo.options || [])
                  .sort((a, b) => a.position - b.position)
                  .map((option, index) => (

                    <td key={index}>
                      {option.value}
                    </td>

                  ))}

                  <td className="variant-price">

                    {combo.price} TND

                    {combo.oldPrice && (

                      <span>

                        {combo.oldPrice}

                      </span>

                    )}

                  </td>

                  <td>

                    <StockBadge
                      qty={
                        combo.inventory
                      }
                    />

                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </div>

  );

}

/* LOTS TABLE */
function LotsTable({ product }) {

  if (
    !product?.lotRules?.enabled ||
    !product?.lotRules?.lots ||
    product.lotRules.lots.length === 0
  ) {
    return null;
  }

  return (

    <div>

      <div className="section-title">

        <FiArchive />

        <span>
          Vente par lot
        </span>

      </div>

      <div className="lots-grid">

        {product?.lotRules?.lots.map(
          (lot, index) => {

            const unitPrice =
              lot.price /
              lot.quantity;

            return (

              <div
                key={index}
                className="lot-card"
              >

                <div>

                  <p className="lot-title">

                    Lot de{" "}
                    {lot.quantity}

                  </p>

                  <p className="lot-unit">

                    {unitPrice.toFixed(
                      2
                    )}{" "}

                    TND / pièce

                  </p>

                </div>

                <strong>

                  {lot.price} TND

                </strong>

              </div>

            );

          }
        )}

      </div>

    </div>

  );

}

/* INVENTORY */
function InventoryLine({product}) {

  if (
    product.variants
      ?.length
  ) {
    return null;
  }

  if (
    !product.trackInventory
  ) {
    return null;
  }

  return (

    <div className="inventory-line">

      <FiBox />

      <span>
        Inventaire
      </span>

      <StockBadge
        qty={
          product.inventory || 0
        }
      />

    </div>

  );

}

/* DETAILS */
function ExpandedDetails({product}) {

  if (
    !product.variants
      ?.length &&
    !product?.lotRules?.lots?.length &&
    !product.trackInventory
  ) {

    return (

      <p className="empty-details">

        Aucun stock, variante
        ou lot configuré.

      </p>

    );

  }

  return (

    <div className="expanded-details">

      <InventoryLine
        product={product}
      />

      <VariantsTable
        product={product}
      />

      <LotsTable
        product={product}
      />

    </div>

  );

}

/* PRODUCT ROW */
function ProductRow({product}) {

  const {products,setProducts} = useDashboard();

  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const hasDetails = !!product.variants?.length || !!product?.lotRules?.lots?.length || !!product.trackInventory;

  // DELETE 
  async function handleDelete(productId) {

    const confirmDelete = window.confirm("Voulez-vous vraiment supprimer ce produit ?");

    if (!confirmDelete) return;

    if (deletingId) return;

    try {

      setDeletingId(productId);

      const product = products.find((item) => item.id === productId);

      if (!product) {
        throw new Error(
          "Produit introuvable."
        );
      }

      // MAIN PRODUCT IMAGES
      const mainImages = product.images || [];

      // VARIANT IMAGES
      const variantImages = product.variants?.map((variant) => variant.image).filter(Boolean) || [];

      // MERGE + REMOVE DUPLICATES
      const allImages = [
        ...new Set([
          ...mainImages,
          ...variantImages,
        ]),
      ];

      if (allImages.length > 0) {

        await fetch("/api/delete-cloudinary-images",{
          method: "POST",

          headers: {"Content-Type":"application/json"},

          body: JSON.stringify({images: allImages,}),
        });
      }

      await deleteDoc(
        doc(
          DB,
          "products",
          productId
        )
      );

      setProducts((prev) =>
        prev.filter(
          (item) =>
            item.id !== productId
        )
      );

    } catch (error) {

      console.log(error);

      alert("Erreur lors de la suppression.");

    } finally {

      setDeletingId(null);

    }

  }

  return (

    <div className="product-row-card">

      {/* HEADER */}
      <div className="product-row-header">

        {/* EXPAND */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          disabled={!hasDetails}
          className={`expand-btn ${!hasDetails? "disabled": ""}`}
        >

          {open ? (
            <FiChevronDown />
          ) : (
            <FiChevronRight />
          )}

        </button>

        {/* IMAGE */}
        <img
          src={product.thumbnail || product.images?.[0] || "/placeholder.png"}
          alt={product.name}
          className="product-image"
        />

        {/* INFO */}
        <div className="product-info">

          {/* TOP */}
          <div className="product-title-row">

            <p className="product-name">

              {product.name}

            </p>

            <span className="product-category">

              {product.category}

            </span>

          </div>

          {/* PRICE */}
          <div className="product-price-row">

            <strong>

              {product.price} TND

            </strong>

            {product.oldPrice && (

              <span>

                {product.oldPrice} TND

              </span>

            )}

          </div>

          {/* META */}
          <ProductMeta product={product} />

        </div>

        {/* ACTIONS */}
        <div className="product-actions">

          <Link
            href={`/dashboard/products/${product.id}`}
            className="action-btn"
          >

            <FiEdit2 />

          </Link>

          <button
            className="action-btn delete"
            onClick={() => handleDelete(product.id)}
            disabled={deletingId === product.id}
          >

            {deletingId === product.id ? (
              <FiLoader className="spin-icon" />
            ) : (
              <FiTrash2 />
            )}

          </button>

        </div>

      </div>

      {/* EXPANDED */}
      {open && hasDetails && (

        <div className="product-expanded">

          <ExpandedDetails product={product} />

        </div>

      )}

    </div>

  );

}

/* PAGE */
export default function ProductsPage() {

  const { loading: storeLoading } = useStore();

  const {products,setProducts,loading} = useDashboard();

  const [openedProducts, setOpenedProducts] = useState({});

  const [openedVariantGroups, setOpenedVariantGroups] = useState({});

    // LOADING 
  if (loading || storeLoading) {

    return (
      <div className="dashboard-loading-screen">

        <div className="dashboard-loading-card">

          <ClipLoader
            color="#006de2"
            size={46}
          />

          <h3>
            Chargement des produits...
          </h3>

          <p>
            Veuillez patienter.
          </p>

        </div>

      </div>
    );

  }

  return (
    <div className="products-page">

      {/* TOP */}
      <div className="products-top">

        <div>

          <h1>
            Produits
          </h1>

          <p>

            {
              products.length
            }{" "}

            produits dans votre boutique

          </p>

        </div>

        <Link
          href="/dashboard/products/new"
          className="add-product-btn"
        >

          <FiPlus />

          Ajouter un produit

        </Link>

      </div>

      {/* LIST */}
      <div className="products-list">

        {products.map(
          (product) => (

            <ProductRow
              key={product.id}
              product={product}
            />

          )
        )}

      </div>

    </div>

  );

}

