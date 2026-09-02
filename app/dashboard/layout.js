"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { DashboardProvider } from "../../context/DashboardContext";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebaseConfig";
import {
    FiLoader, FiGrid, FiBox, FiShoppingCart,
    FiSettings, FiMenu, FiX, FiLogOut, FiExternalLink, FiTruck,
} from "react-icons/fi";
import "./dashboard.css";

const NAV_ITEMS = [
    { href: "/dashboard",          label: "Ma Boutique", icon: FiGrid        },
    { href: "/dashboard/products", label: "Produits",    icon: FiBox         },
    { href: "/dashboard/orders",   label: "Commandes",   icon: FiShoppingCart},
    { href: "/dashboard/shipping", label: "Livraison",   icon: FiTruck       },
    { href: "/dashboard/settings", label: "Paramètres",  icon: FiSettings    },
];

export default function DashboardLayout({ children }) {

    const router   = useRouter();
    const pathname = usePathname();
    const { user, loading: authLoading } = useAuth();
    const { store } = useStore();

    const [menuOpen,      setMenuOpen]      = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) router.replace("/");
    }, [user, authLoading, router]);

    const handleLogout = async () => {
        try {
            setLogoutLoading(true);
            await signOut(auth);
            router.replace("/");
        } catch (err) {
            console.error(err);
        } finally {
            setLogoutLoading(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="ds-layout-loading">
                <FiLoader className="spin-icon" size={28} />
            </div>
        );
    }

    const isLocal  = typeof window !== "undefined" && window.location.hostname === "localhost";
    const storeUrl = store
        ? isLocal
            ? `/store/${store.slug}`
            : `https://${store.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
        : null;

    const SidebarContent = () => (
        <>
            {/* Brand */}
            <Link href="/" className="ds-sidebar-brand">
                <span className="ds-brand-logo">T</span>
                <span className="ds-brand-name">-Shop</span>
            </Link>

            {/* Nav */}
            <nav className="ds-sidebar-nav">
                {NAV_ITEMS.map((item) => {
                    const Icon   = item.icon;
                    const active = item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`ds-nav-link ${active ? "ds-nav-link-active" : ""}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            <Icon size={17} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

            </nav>

            {/* Logout */}
            <button
                className="ds-sidebar-logout"
                onClick={handleLogout}
                disabled={logoutLoading}
            >
                <FiLogOut size={15} />
                <span>{logoutLoading ? "Déconnexion..." : "Se déconnecter"}</span>
            </button>
        </>
    );

    return (
        <DashboardProvider>
            <div className="ds-layout">

                {/* DESKTOP SIDEBAR */}
                <aside className="ds-sidebar">
                    <SidebarContent />
                </aside>

                {/* MAIN */}
                <main className="ds-main">

                    {/* MOBILE TOPBAR */}
                    <div className="ds-topbar">
                        <Link href="/" className="ds-topbar-brand">
                            <span className="ds-brand-logo ds-brand-logo-sm">T</span>
                            <span className="ds-brand-name ds-brand-name-dark">-Shop</span>
                        </Link>
                        <button className="ds-topbar-menu" onClick={() => setMenuOpen(true)}>
                            <FiMenu size={20} />
                        </button>
                    </div>

                    {/* MOBILE DRAWER */}
                    {menuOpen && (
                        <div className="ds-overlay" onClick={() => setMenuOpen(false)}>
                            <div className="ds-drawer" onClick={(e) => e.stopPropagation()}>
                                <button className="ds-drawer-close" onClick={() => setMenuOpen(false)}>
                                    <FiX size={18} />
                                </button>
                                <SidebarContent />
                            </div>
                        </div>
                    )}

                    {/* PAGE */}
                    <div className="ds-page-content">
                        {children}
                    </div>

                </main>
            </div>
        </DashboardProvider>
    );
}