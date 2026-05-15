"use client";

import { useState } from "react";
import Link from "next/link";
import {
  deleteDoc,
  doc,
} from "firebase/firestore";

import { DB } from "../../../lib/firebaseConfig";

import { useStore } from "../../../context/StoreContext";
import { useDashboard } from "../../../context/DashboardContext";

import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiBox,
  FiLoader,
} from "react-icons/fi";

import { ClipLoader } from "react-spinners";

import "../dashboard.css";

export default function ProductsPage() {

  const { loading: storeLoading } = useStore();

  const {
    products,
    setProducts,
    loading,
  } = useDashboard();

  const [deletingId, setDeletingId] = useState(null);

  /* FORMAT PRICE */
  const formatPrice = (price) => {

    return `${new Intl.NumberFormat(
      "fr-TN",
      {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      }
    ).format(Number(price || 0))} DT`;
  };

  /* DELETE PRODUCT */
  async function handleDelete(productId) {

    const confirmDelete = window.confirm(
      "Voulez-vous vraiment supprimer ce produit ?"
    );

    if (!confirmDelete) return;

    try {

      setDeletingId(productId);

      await deleteDoc(
        doc(DB, "products", productId)
      );

      //setProducts((prev) =>
        //prev.filter(
          //(item) => item.id !== productId
        //)
      //);

    } catch (error) {

      console.log(error);

      alert(
        "Une erreur est survenue lors de la suppression."
      );

    } finally {

      setDeletingId(null);

    }
  }

  /* LOADING */
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
            Veuillez patienter quelques secondes.
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

          <p className="dashboard-subtitle">

            {products.length} produit
            {products.length > 1 ? "s" : ""}

            {" "}dans votre boutique

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

      {/* EMPTY STATE */}
      {products.length === 0 && (

        <div className="empty-products-state">

          <div className="empty-products-icon">
            <FiBox />
          </div>

          <h2>
            Aucun produit ajouté
          </h2>

          <p>
            Commencez à construire votre boutique
            en ajoutant votre premier produit.
          </p>

          <Link
            href="/dashboard/products/new"
            className="empty-products-btn"
          >

            <FiPlus />

            Ajouter mon premier produit

          </Link>

        </div>
      )}

      {/* PRODUCTS */}
      {products.length > 0 && (

        <>
          {/* MOBILE */}
          <div className="products-mobile-list">

            {products.map((product) => (

              <div
                key={product.id}
                className="product-mobile-card"
              >

                <img
                  src={
                    product.images?.[0]
                    || product.image
                    || "/placeholder.png"
                  }
                  alt={product.name}
                  loading="lazy"
                />

                {/* INFO */}
                <div className="product-mobile-info">

                  <h3>
                    {product.name}
                  </h3>

                  <p className="product-category">
                    {product.category || "Sans catégorie"}
                  </p>

                  <div className="product-price">

                    <span>
                      {formatPrice(product.price)}
                    </span>

                    {product.hasDiscount && (
                      <small>
                        {formatPrice(product.oldPrice)}
                      </small>
                    )}

                  </div>

                </div>

                {/* ACTIONS */}
                <div className="product-actions">

                  <Link
                    href={`/dashboard/products/${product.id}`}
                    className="action-btn"
                    aria-label="Modifier le produit"
                  >

                    <FiEdit2 />

                  </Link>

                  <button
                    className="action-btn delete"
                    onClick={() =>
                      handleDelete(product.id)
                    }
                    disabled={
                      deletingId === product.id
                    }
                    aria-label="Supprimer le produit"
                  >

                    {deletingId === product.id ? (
                      <FiLoader className="spin-icon" />
                    ) : (
                      <FiTrash2 />
                    )}

                  </button>

                </div>

              </div>
            ))}

          </div>

          {/* DESKTOP */}
          <div className="products-table-wrapper">

            <table className="products-table">

              <thead>

                <tr>

                  <th>
                    Produit
                  </th>

                  <th>
                    Catégorie
                  </th>

                  <th>
                    Prix
                  </th>

                  <th
                    style={{
                      textAlign: "right",
                    }}
                  >
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {products.map((product) => (

                  <tr key={product.id}>

                    {/* PRODUCT */}
                    <td>

                      <div className="table-product">

                        <img
                          src={
                            product.images?.[0]
                            || product.image
                            || "/placeholder.png"
                          }
                          alt={product.name}
                          loading="lazy"
                        />

                        <span>
                          {product.name}
                        </span>

                      </div>

                    </td>

                    {/* CATEGORY */}
                    <td className="table-category">

                      {product.category || "—"}

                    </td>

                    {/* PRICE */}
                    <td>

                      <div className="table-price">

                        <span>
                          {formatPrice(product.price)}
                        </span>

                        {product.hasDiscount && (
                          <small>
                            {formatPrice(product.oldPrice)}
                          </small>
                        )}

                      </div>

                    </td>

                    {/* ACTIONS */}
                    <td>

                      <div className="table-actions">

                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="action-btn"
                          aria-label="Modifier le produit"
                        >

                          <FiEdit2 />

                        </Link>

                        <button
                          className="action-btn delete"
                          onClick={() =>
                            handleDelete(product.id)
                          }
                          disabled={
                            deletingId === product.id
                          }
                          aria-label="Supprimer le produit"
                        >

                          {deletingId === product.id ? (
                            <FiLoader className="spin-icon" />
                          ) : (
                            <FiTrash2 />
                          )}

                        </button>

                      </div>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </>
      )}

    </div>
  );
}