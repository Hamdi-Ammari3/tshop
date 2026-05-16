"use client";

import React, { useMemo, useState } from "react";
import {
  FiCheck,
  FiX,
  FiClock,
  FiRotateCcw,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";

import { updateDoc, doc } from "firebase/firestore";
import { DB } from "../../../lib/firebaseConfig";

import { useStore } from "../../../context/StoreContext";
import { useDashboard } from "../../../context/DashboardContext";

import { ClipLoader } from "react-spinners";

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

  /* UPDATE STATUS */
  const setStatus = async (id, status) => {
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

  /* LOADING */
  if (loading || storeLoading) {
    return (
      <div className="orders-loading">
        <ClipLoader
          color="#006de2"
          size={50}
        />
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
                      {o.total_amount || 0} TND
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

                      <span>
                        •{" "}
                        {item.productName}
                        <strong>
                          {" "}
                          ×{" "}
                          {item.quantity}
                        </strong>
                      </span>

                      <span>
                        {item.total} TND
                      </span>

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
                        disabled={
                          actionLoading ===
                          o.id
                        }
                        onClick={() =>
                          setStatus(
                            o.id,
                            "done"
                          )
                        }
                      >

                        {actionLoading ===
                        o.id ? (
                          <ClipLoader
                            color="#fff"
                            size={16}
                          />
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
                        onClick={() =>
                          setStatus(
                            o.id,
                            "cancelled"
                          )
                        }
                      >

                        {actionLoading ===
                        o.id ? (
                          <ClipLoader
                            color="#111"
                            size={16}
                          />
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
                      onClick={() =>
                        setStatus(
                          o.id,
                          "pending"
                        )
                      }
                    >

                      {actionLoading ===
                      o.id ? (
                        <ClipLoader
                          color="#111"
                          size={16}
                        />
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