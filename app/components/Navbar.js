"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import {doc,getDoc} from "firebase/firestore";
import { DB } from "../../lib/firebaseConfig";
import {useMarketplaceCart} from '../../context/MarketplaceCartContext';
import {FiShoppingCart} from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import logo from "../../public/website-logo.png"

export default function Navbar() {

  const { user, loading } = useAuth();
  const {cartCount} = useMarketplaceCart();

  const [hasStore, setHasStore] = useState(false);
  const [checkingStore, setCheckingStore] = useState(true);


  /* CHECK STORE */
  useEffect(() => {

    async function checkStore() {

      if (!user) {
        setHasStore(false);
        setCheckingStore(false);
        return;
      }

      try {

        const userRef = doc(
          DB,
          "users",
          user.uid
        );

        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {

          const userData = userSnap.data();

          setHasStore(!!userData.storeId);

        } else {

          setHasStore(false);
        }

      } catch (error) {

        console.log(error);

        setHasStore(false);

      } finally {

        setCheckingStore(false);
      }
    }

    checkStore();

  }, [user]);

  /* USER LETTER */
  const userLetter = user?.displayName?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="navbar">

      <div className="navbar-container">

        {/* LEFT */}
        <Link
          href="/"
          className="navbar-logo"
        >
          <Image
            src={logo}
            alt="T-Shop"
            priority
            className="navbar-logo-image"
          />
        </Link>

        {/* ACTIONS */}
        <div className="navbar-actions">

          {/* NOT LOGGED */}
          {!loading && !user && (
            <>
              <Link
                href="/onboarding"
                className="create-btn mobile-visible"
              >
                Créer
              </Link>

              <Link
                href="/login"
                className="signin-btn desktop-only"
              >
                Connexion
              </Link>
            </>
          )}

          {/* LOGGED */}
          {!loading && user && !checkingStore && (
            <>
              {hasStore ? (
                <Link
                  href="/dashboard"
                  className="dashboard-btn"
                >

                  <FaStore />

                  <span>
                    Store
                  </span>

                </Link>

              ) : (

                <Link
                  href="/onboarding"
                  className="create-btn mobile-visible"
                >
                  Créer
                </Link>

              )}

              <div className="navbar-avatar">
                {userLetter}
              </div>
            </>
          )}

          {/* CART */}
          <div className="store-navbar-actions">

            <Link
              href="/cart"
              className="store-cart-btn"
            >

              <FiShoppingCart />

              {cartCount > 0 && (
                <span>
                  {cartCount}
                </span>
              )}

            </Link>

          </div>

        </div>
      </div>

    </header>
  );
}