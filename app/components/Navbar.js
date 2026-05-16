"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import {FiMenu,FiX,FiLogIn,FiChevronRight} from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import {doc,getDoc} from "firebase/firestore";
import { DB } from "../../lib/firebaseConfig";
import logo from "../../public/website-logo.png"

export default function Navbar() {

  const { user, loading } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [checkingStore, setCheckingStore] = useState(true);

  const closeMenu = () => setMenuOpen(false);

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

        {/* DESKTOP LINKS */}
        <nav className="navbar-links">

          <a href="#how">
            Comment ça marche
          </a>

          <a href="#benefits">
            Pourquoi T-Shop
          </a>

        </nav>

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

          {/* MENU */}
          <button
            className={`menu-toggle ${menuOpen ? "active" : ""}`}
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
          >

            {menuOpen ? (
              <FiX />
            ) : (
              <FiMenu />
            )}

          </button>

        </div>
      </div>

      {/* MOBILE MENU */}
      <div className={`mobile-menu-wrapper ${menuOpen ? "open" : ""}`}>
        <div className="mobile-menu">

          <a
            href="#how"
            onClick={closeMenu}
          >
            Comment ça marche

            <FiChevronRight />
          </a>

          <a
            href="#benefits"
            onClick={closeMenu}
          >
            Pourquoi T-Shop

            <FiChevronRight />
          </a>

          {!user && (
            <Link
              href="/login"
              onClick={closeMenu}
            >
              <div className="mobile-link-left">

                <FiLogIn />

                Connexion

              </div>

              <FiChevronRight />
            </Link>
          )}

        </div>
      </div>
    </header>
  );
}