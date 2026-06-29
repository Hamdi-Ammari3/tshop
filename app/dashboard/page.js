"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "../../context/StoreContext";
import { useDashboard } from "../../context/DashboardContext";
import { logoutUser } from "../../lib/auth";
import { useRouter } from "next/navigation";
import {FiBox,FiExternalLink,FiCopy,FiCheck,FiShoppingBag,FiDollarSign,FiPlus,FiPhone,FiLogOut,FiAlertCircle} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import {FiLoader} from "react-icons/fi";
import "./dashboard.css";

import {
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { DB } from "../../lib/firebaseConfig";

export default function DashboardHome() {

  const {store,loading: storeLoading} = useStore();
  const {products,orders,loading,pendingOrders,completedOrders,revenue} = useDashboard();

  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  /* LOGOUT */
  const handleLogout = async () => {

    try {

      setLogoutLoading(true);

      await logoutUser();

      router.replace("/");

    } catch (error) {

      console.log(error);

    } finally {

      setLogoutLoading(false);

    }
  };

  /* LOADING */
  if (storeLoading || loading) {

    return (
      <div className="dashboard-loading-screen">

        <div className="dashboard-loading-card">

          <FiLoader className="spin-icon" />

          <h3>
            Chargement du tableau de bord...
          </h3>

          <p>
            Préparation de votre boutique
          </p>

        </div>

      </div>
    );
  }

  /* NO STORE */
  if (!store) {

    return (
      <div className="dashboard-empty-page">

        <div className="dashboard-empty-icon">
          <FiShoppingBag />
        </div>

        <h2>
          Aucune boutique trouvée
        </h2>

        <p>
          Créez votre boutique pour commencer à vendre en ligne.
        </p>

        <button
          className="dashboard-logout-btn"
          onClick={handleLogout}
          disabled={logoutLoading}
        >

          <FiLogOut />

          <span>
            {logoutLoading
              ? "Déconnexion..."
              : "Déconnexion"}
          </span>

        </button>

      </div>
    );
  }

  //ORDER QUOTA
  const ordersQuota = Number(store?.ordersQuota ?? 100);

  const ordersLeft = Math.max(0,ordersQuota - (Array.isArray(orders) ? orders.length : 0));

  let quotaClass = "safe";

  if (ordersLeft <= 10) {
    quotaClass = "danger";
  } else if (ordersLeft <= 30) {
    quotaClass = "warning";
  }

  const quotaPercentage = Math.min(100,(ordersLeft / ordersQuota) * 100);

  // STATS
  const stats = [
    {
      icon: FiBox,
      label: "Produits",
      value: products.length,
      hint: products.length > 0 ? "Produits en ligne" : "Aucun produit",
    },

    {
      icon: FiShoppingBag,
      label: "Commandes",
      value: orders.length,
      hint: pendingOrders.length > 0 ? `${pendingOrders.length} en attente` : "Aucune commande en attente",
    },

    {
    icon: FiDollarSign,
        label: "Revenus",
        value: `${new Intl.NumberFormat("fr-TN", {minimumFractionDigits: 3,maximumFractionDigits: 3}).format(revenue)} TND`,
        hint: `${completedOrders.length} commandes terminées`,
    },
  ];

  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
  const storeUrl = isLocalhost ? `/store/${store.slug}` : `https://${store.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;
  const copyStoreUrl = isLocalhost ? `${window.location.origin}/store/${store.slug}` : `https://${store.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;

  /* COPY */
  const copyStoreLinkk = async () => {
    try {
      await navigator.clipboard.writeText(copyStoreUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1500);

    } catch (error) {
      console.log(error);
    }
  };

  const copyStoreLink = async () => {

    try {

      const snapshot = await getDocs(
        collection(DB, "stores")
      );

      const batch = writeBatch(DB);

      snapshot.forEach((docSnap) => {

  const data = docSnap.data();

  if (data.ordersQuota === undefined) {

    batch.update(docSnap.ref, {
      ordersQuota: 100,
    });

  }

});

      await batch.commit();

      console.log(`${snapshot.size} stores updated successfully.`)

    } catch (error) {

      console.error(error);

    } finally {

      console.error('done');

    }

  }

  return (
    <div className="dashboard-home">

      {/* TOP */}
      <div className="dashboard-home-top">

        <div>

          <h1>
            {store.name}
          </h1>

          <p className="dashboard-subtitle">
            Gérez votre boutique et
            suivez vos ventes
          </p>

          <div className="subscription-inline">

            <div className={`subscription-pill ${quotaClass}`}>
              Quota commandes
            </div>

            <div className="subscription-inline-progress">

              <div
                className={`subscription-inline-fill ${quotaClass}`}
                style={{width: `${quotaPercentage}%`,}}
              />

            </div>

            <div className="subscription-inline-days">
              {ordersLeft} restantes
            </div>

          </div>

        </div>

        {/* LINKS */}
        <div className="store-link-container">

          <div className="store-link-box">

            <span className="store-domain">
              {store.slug}.tunyshop.com
            </span>

            <button
              className={`copy-btn ${
                copied ? "copied" : ""
              }`}
              onClick={copyStoreLink}
            >

              {copied ? (
                <FiCheck size={24}/>
              ) : (
                <FiCopy size={24}/>
              )}

            </button>

          </div>

          <div className="store-link-box">
            <button className="copy-btn">
              {store.hasWhatsapp ? (
                <FaWhatsapp size={22}/>
              ) : (
                <FiPhone size={22}/>
              )}
            </button>

            <span className="store-domain">
              +216 {store.phone}
            </span>

          </div>

        </div>

      </div>

      {/* STATS */}
      <div className="stats-grid">

        {stats.map((item, index) => {

          const Icon = item.icon;

          return (
            <div key={index} className="stat-card">
              <div className="stat-top">

                <p>
                  {item.label}
                </p>

                <div className="stat-icon">
                  <Icon />
                </div>

              </div>

              <h3>
                {item.value}
              </h3>

              <span>
                {item.hint}
              </span>

            </div>
          );
        })}

      </div>

      {/* EMPTY PRODUCTS */}
      {products.length === 0 && (

        <div className="dashboard-empty-box">

          <div className="dashboard-empty-content">

            <div className="dashboard-empty-icon-small">
              <FiAlertCircle />
            </div>

            <div>

              <h3>
                Ajoutez votre premier produit
              </h3>

              <p>
                Votre boutique est prête.
                Commencez maintenant à vendre
                en ajoutant vos produits.
              </p>

            </div>

          </div>

          <Link
            href="/dashboard/products/new"
            className="empty-action-btn"
          >

            <FiPlus />

            Ajouter un produit

          </Link>

        </div>
      )}

      {/* PENDING */}
      {pendingOrders.length > 0 && (

        <Link
          href="/dashboard/orders"
          className="pending-orders-box"
        >

          <div className="pending-left">

            <div className="pending-icon">
              <FiShoppingBag />
            </div>

            <div>

              <h4>
                {pendingOrders.length}
                {" "}
                commande
                {pendingOrders.length > 1
                  ? "s"
                  : ""}
                {" "}
                en attente
              </h4>

              <p>
                Consultez et gérez vos
                nouvelles commandes
              </p>

            </div>

          </div>

          <button>
            Voir
          </button>

        </Link>
      )}

      {/* STORE PREVIEW */}
<div className="store-preview">

  {/* BACKGROUND */}
  <div className="store-preview-background"></div>

  <div className="store-preview-content">

    {/* TOP */}
    <div className="store-preview-top">

      <div className="store-preview-left">

        {/* LOGO */}
        <div className="store-preview-logo">

          {store.logo ? (

            <img
              src={store.logo}
              alt="logo boutique"
            />

          ) : (

            <span>
              {store.name?.[0]}
            </span>

          )}

        </div>

        {/* INFO */}
        <div className="store-preview-info">

          <div className="store-preview-badge">
            Boutique active
          </div>

          <h2>
            {store.name}
          </h2>

          <p>
            Votre boutique en ligne professionnelle
          </p>

        </div>

      </div>

      {/* BUTTON */}
      <Link
        href={storeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="preview-btn"
      >

        <FiExternalLink size={20}/>

        Voir la boutique

      </Link>

    </div>

    {/* META */}
    <div className="store-preview-meta">

      <div className="preview-meta-item">

        {store.hasWhatsapp ? (
          <FaWhatsapp />
        ) : (
          <FiPhone />
        )}

        <span>
          +216 {store.phone}
        </span>

      </div>

      <div className="preview-meta-item">

        <FiBox />

        <span>
          {products.length} produit
          {products.length > 1
            ? "s"
            : ""}
        </span>

      </div>

    </div>

  </div>

</div>

    </div>
  );
}

/*
<div className="subscription-inline">

            <div className={`subscription-pill ${subscriptionClass}`} >

              {store.subscription?.plan === "free"
                ? "Essai gratuit"
                : store.subscription?.plan}

            </div>

            <div className="subscription-inline-progress">

              <div
                className={`subscription-inline-fill ${subscriptionClass}`}
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

            <div className="subscription-inline-days">
              {daysLeft} jours
            </div>

          </div>
*/