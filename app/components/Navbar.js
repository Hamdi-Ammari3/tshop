"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useMarketplaceCart } from "../../context/MarketplaceCartContext";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebaseConfig";
import { FiSearch, FiBell, FiShoppingCart, FiUser, FiLogOut, FiPhone, FiGrid } from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import logo from "../../public/logo.png";
import './navbar.css';

export default function Navbar() {

    const router = useRouter();
    const { user, loading } = useAuth();
    const { cartCount } = useMarketplaceCart();

    const [search, setSearch] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Derive values from user (already in AuthContext — no extra Firestore read needed)
    const hasStore = !!user?.storeId;
    const userInitial = (user?.name?.charAt(0) || "U").toUpperCase();
    const userName = user?.name || "Utilisateur";
    const userPhone = user?.phone || "";

    const handleLogout = async () => {
        setMenuOpen(false);
        await signOut(auth);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const trimmed = search.trim();
        if (!trimmed) return;
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    };

    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close menu on Escape
    useEffect(() => {
        function handleEsc(e) {
            if (e.key === "Escape") setMenuOpen(false);
        }
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, []);

    return (
        <header className="navbar">
            <div className="navbar-container">

                {/* LOGO */}
                <Link href="/" className="navbar-logo">
                    <Image src={logo} alt="TuniShop" priority className="navbar-logo-image" />
                </Link>

                {/* SEARCH */}
                <form className="navbar-search" onSubmit={handleSearchSubmit}>
                    <input
                        type="search"
                        placeholder="Rechercher un produit, une boutique..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" aria-label="Rechercher"><FiSearch /></button>
                </form>

                {/* RIGHT */}
                <div className="navbar-right">

                    {/* NOT LOGGED IN */}
                    {!loading && !user && (
                        <Link href="/login" className="navbar-login-btn">
                            <FiUser />
                            <span>Connexion</span>
                        </Link>
                    )}

                    {/* LOGGED IN */}
                    {!loading && user && (

                        <>
                            {hasStore && (
                                <Link href="/dashboard" className="dashboard-btn">
                                    <FaStore />
                                    <span>Dashboard</span>
                                </Link>
                            )}

                            {/* AVATAR + DROPDOWN */}
                            <div className="navbar-avatar-wrap" ref={menuRef}>

                                <button
                                    className="navbar-avatar"
                                    onClick={() => setMenuOpen((o) => !o)}
                                    aria-expanded={menuOpen}
                                    aria-label="Menu utilisateur"
                                >
                                    {userInitial}
                                </button>

                                {menuOpen && (
                                    <div className="navbar-menu">

                                        {/* USER INFO */}
                                        <div className="navbar-menu-user">
                                            <div className="navbar-menu-avatar">{userInitial}</div>
                                            <div className="navbar-menu-info">
                                                <p className="navbar-menu-name">{userName}</p>
                                                {userPhone && (
                                                    <p className="navbar-menu-phone">
                                                        <FiPhone size={11} />
                                                        {userPhone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="navbar-menu-divider" />

                                        {/* LINKS */}
                                        {hasStore && (
                                            <Link
                                                href="/dashboard"
                                                className="navbar-menu-item"
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                <FiGrid size={15} />
                                                Dashboard
                                            </Link>
                                        )}

                                        {!hasStore && (
                                            <Link
                                                href="/onboarding"
                                                className="navbar-menu-item"
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                <FaStore size={14} />
                                                Créer ma boutique
                                            </Link>
                                        )}

                                        <div className="navbar-menu-divider" />

                                        <button className="navbar-menu-logout" onClick={handleLogout}>
                                            <FiLogOut size={15} />
                                            Déconnexion
                                        </button>

                                    </div>
                                )}

                            </div>
                        </>

                    )}

                    {/* CART */}
                    <Link href="/cart" className="navbar-icon-btn">
                        <FiShoppingCart />
                        {cartCount > 0 && (
                            <span className="navbar-count">{cartCount}</span>
                        )}
                    </Link>

                </div>

            </div>
        </header>
    );
}