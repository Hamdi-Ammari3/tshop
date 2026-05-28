"use client";

import React, { useMemo, useState } from "react";
import {FiCheck,FiX,FiClock,FiRotateCcw,FiMapPin,FiPhone,FiLoader} from "react-icons/fi";
import { updateDoc,doc,getDoc } from "firebase/firestore";
import { DB } from "../../../lib/firebaseConfig";
import { useStore } from "../../../context/StoreContext";
import { useDashboard } from "../../../context/DashboardContext";
import "./orders.css";

export default function OrdersPage() {
  const { loading: storeLoading } = useStore();
  const { orders = [], loading } = useDashboard();

  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);

  /* FORMAT DATE */
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "Date inconnue";

    try {
      const date = timestamp?.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      return date.toLocaleString("fr-TN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "Date invalide";
    }
  };

  /* FILTERS */
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];

    switch (filter) {
      case "pending":
        return orders.filter(
          (o) => o.status === "pending"
        );

      case "week": {
        const sevenDaysAgo = new Date();

        sevenDaysAgo.setDate(
          sevenDaysAgo.getDate() - 7
        );

        return orders.filter((o) => {
          if (!o.createdAt) return false;

          const date = o.createdAt?.toDate
            ? o.createdAt.toDate()
            : new Date(o.createdAt);

          return date >= sevenDaysAgo;
        });
      }

      case "month": {
        const now = new Date();

        return orders.filter((o) => {
          if (!o.createdAt) return false;

          const date = o.createdAt?.toDate
            ? o.createdAt.toDate()
            : new Date(o.createdAt);

          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        });
      }

      default:
        return orders;
    }
  }, [orders, filter]);

  /* COUNTERS */
  const pendingCount = useMemo(() => {
    return orders.filter(
      (o) => o.status === "pending"
    ).length;
  }, [orders]);

  /* STATUS LABEL */
  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "En attente";

      case "done":
        return "Confirmée";

      case "cancelled":
        return "Annulée";

      default:
        return status;
    }
  };

  //UPDATE STATUS
  const setStatusss = async (id, status) => {
    try {
      setActionLoading(id);

      await updateDoc(
        doc(DB, "orders", id),
        {
          status,
        }
      );
    } catch (error) {
      console.log(error);
      alert(
        "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const setStatus = async (order,newStatus) => {

    try {

      setActionLoading(order.id);

      //INVENTORY UPDATE
      if (newStatus === "done" && !order.inventoryUpdated) {

        for (const item of order.items || []) {

          const productRef = doc(DB,"products",item.productId);

          const productSnap = await getDoc(productRef);

          if (!productSnap.exists()) {
            continue;
          }

          const productData = productSnap.data();

          //TRACK INVENTORY
          if (!item.trackInventory) {
            continue;
          }

          //VARIANT PRODUCT 
          if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {

            const updatedVariants = (productData.variants ||[]).map((variant) => {

              const sameVariant = variant.options.every((option) => item.selectedOptions[option.name] ===option.value);

              if (!sameVariant) {
                return variant;
              }

              return {
                ...variant,

                inventory: Math.max(0,Number(variant.inventory ||0) -Number(item.quantity ||0)),
              };

            });

            await updateDoc(productRef,{variants:updatedVariants});

          } else {

            await updateDoc(productRef,{
              inventory: Math.max(0,Number(productData.inventory ||0) - Number(item.quantity ||0)),
            });
          }

        }

        await updateDoc(doc(DB,"orders",order.id), {
          status: newStatus,

          inventoryUpdated: true,
        });

      } else if (newStatus === "pending" && order.inventoryUpdated) {

        for (const item of order.items || []) {

          const productRef = doc(DB,"products",item.productId);

          const productSnap = await getDoc(productRef);

          if (!productSnap.exists()) {
            continue         
          }

          const productData = productSnap.data();

          if (!item.trackInventory) {
            continue;
          }

          /* VARIANT */
          if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {

            const updatedVariants = (productData.variants ||[]).map((variant) => {

              const sameVariant = variant.options.every((option) => item.selectedOptions[option.name] ===option.value);

              if (!sameVariant) {
                return variant;
              }

              return {
                ...variant,
                inventory: Number(variant.inventory || 0) + Number(item.quantity || 0),
              };

            });

            await updateDoc(productRef,{
              variants: updatedVariants,
            });

          } else {

            await updateDoc(productRef,{
              inventory: Number(productData.inventory || 0) +Number(item.quantity || 0),
            });

          }

        }

        await updateDoc(doc(DB,"orders",order.id), {
          status:newStatus,

          inventoryUpdated:false,
        });

      } else {

        await updateDoc(doc(DB,"orders",order.id), {
          status: newStatus,
        });

      }

    } catch (error) {

      console.log(error);

      alert("Une erreur est survenue.");

    } finally {

      setActionLoading(null);

    }

  };

  /* LOADING */
  if (loading || storeLoading) {
    return (
      <div className="orders-loading">
        <FiLoader className="spin-icon" />
      </div>
    );
  }

  return (
    <div className="orders-page">

      {/* HEADER */}
      <div className="orders-header">

        <div>

          <h1>Commandes</h1>

          <p>
            {orders.length} commandes •{" "}
            {pendingCount} en attente
          </p>

        </div>

      </div>

      {/* FILTERS */}
      <div className="orders-filters">

        <button
          className={
            filter === "all" ? "active" : ""
          }
          onClick={() => setFilter("all")}
        >
          Toutes
        </button>

        <button
          className={
            filter === "pending"
              ? "active"
              : ""
          }
          onClick={() => setFilter("pending")}
        >
          En attente
        </button>

        <button
          className={
            filter === "week"
              ? "active"
              : ""
          }
          onClick={() => setFilter("week")}
        >
          Cette semaine
        </button>

        <button
          className={
            filter === "month"
              ? "active"
              : ""
          }
          onClick={() => setFilter("month")}
        >
          Ce mois
        </button>

      </div>

      {/* EMPTY */}
      {filteredOrders.length === 0 && (
        <div className="orders-empty">

          <h3>
            {filter === "pending"
              ? "Aucune commande en attente"
              : "Aucune commande trouvée"}
          </h3>

          <p>
            Les commandes de votre boutique
            apparaîtront ici.
          </p>

        </div>
      )}

      {/* ORDERS */}
      {filteredOrders.length > 0 && (
        <div className="mobile-orders">

          {filteredOrders.map((o) => {

            const isPending =
              o.status === "pending";

            return (
              <div
                key={o.id}
                className={`mobile-order-card ${
                  isPending
                    ? "mobile-order-pending"
                    : ""
                }`}
              >

                {/* HEADER */}
                <div className="mobile-order-header">

                  <div className="customer-left">

                    <div className="customer-avatar">
                      {o.clientName?.[0] || "C"}
                    </div>

                    <div>

                      <h3 className="customer-name">
                        {o.clientName ||
                          "Client"}
                      </h3>

                      <p className="customer-phone">
                        <FiPhone size={13} />
                        {o.clientPhone ||
                          "Numéro indisponible"}
                      </p>

                    </div>

                  </div>

                  <div className="order-right">

                    <div className="order-total">
                      {o.subtotal || 0} TND
                    </div>

                    <span
                      className={`status-badge ${o.status}`}
                    >

                      {o.status ===
                        "pending" && (
                        <FiClock />
                      )}

                      {o.status ===
                        "done" && (
                        <FiCheck />
                      )}

                      {o.status ===
                        "cancelled" && (
                        <FiX />
                      )}

                      {getStatusLabel(
                        o.status
                      )}

                    </span>

                  </div>

                </div>

                {/* PRODUCTS */}
                <div className="mobile-order-products">

                  {o.items?.map((item, index) => (
                    <div
  key={
    item.productId ||
    index
  }
  className="mobile-order-product"
>

  {/* IMAGE */}
  <div className="order-product-image">

    <img
      src={
        item.selectedVariant
          ?.image ||
        item.productImage ||
        "/placeholder.png"
      }
      alt={item.productName}
    />

  </div>

  {/* CONTENT */}
  <div className="order-product-content">

    <div className="order-product-left">

      <span className="order-product-name">

        {item.productName}

        <strong>
          {" "}
          × {item.quantity}
        </strong>

      </span>

      {/* VARIANTS */}
      {item.selectedOptions &&
        Object.keys(
          item.selectedOptions
        ).length > 0 && (

        <div className="order-variants">

          {Object.entries(
            item.selectedOptions
          ).map(
            ([key, value]) => (

            <div
              key={key}
              className="order-variant-item"
            >

              <span>
                {key}
              </span>

              <strong>
                {value}
              </strong>

            </div>

          ))}

        </div>

      )}

      {/* LOT */}
      {item.selectedLot && (

        <div className="order-lot-badge">

          Lot de{" "}
          {item.selectedLot.quantity}
          {" "} pièces

        </div>

      )}

    </div>

    <span className="order-product-total">

      {item.total} TND

    </span>

  </div>

</div>
                  ))}

                </div>

                {/* ADDRESS */}
                <div className="order-address">

                  <div className="address-row">

                    <FiMapPin
                      size={15}
                    />

                    <span>
                      {o.clientAddress ||
                        "Adresse indisponible"}
                    </span>

                  </div>

                </div>

                {/* FOOTER */}
                <div className="order-footer">

                  <p className="mobile-date">
                    {formatDateTime(
                      o.createdAt
                    )}
                  </p>

                  {isPending ? (
                    <div className="mobile-actions">

                      <button
                        className="done-btn"
                        disabled={actionLoading === o.id}
                        onClick={() => setStatus(o,"done")}
                      >

                        {actionLoading ===
                        o.id ? (
                          <FiLoader className="spin-icon" />
                        ) : (
                          <>
                            <FiCheck />
                            Confirmer
                          </>
                        )}

                      </button>

                      <button
                        className="cancel-btn"
                        disabled={
                          actionLoading ===
                          o.id
                        }
                        onClick={() => setStatus(o,"cancelled")}
                      >

                        {actionLoading ===
                        o.id ? (
                          <FiLoader className="spin-icon" />
                        ) : (
                          <>
                            <FiX />
                            Annuler
                          </>
                        )}

                      </button>

                    </div>
                  ) : (
                    <button
                      className="reopen-btn"
                      disabled={
                        actionLoading ===
                        o.id
                      }
                      onClick={() => setStatus(o,"pending")}
                    >

                      {actionLoading ===
                      o.id ? (
                        <FiLoader className="spin-icon" />
                      ) : (
                        <>
                          <FiRotateCcw />
                          Réouvrir
                        </>
                      )}

                    </button>
                  )}

                </div>

              </div>
            );
          })}

        </div>
      )}
    </div>
  );
}