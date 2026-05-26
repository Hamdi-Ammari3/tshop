"use client";

import Image from "next/image";
import { useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { DashboardProvider } from "../../context/DashboardContext";
import { logoutUser } from "../../lib/auth";
import {FiLoader,FiGrid,FiBox,FiPlusSquare,FiShoppingBag,FiSettings,FiExternalLink,FiMenu,FiX,FiShoppingCart,FiLogOut} from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import logo from "../../public/website-logo.png"
import "./dashboard.css";

const navItems = [
  {
    href: "/dashboard",
    label: "Ma Boutique",
    icon: FiGrid,
  },
  {
    href: "/dashboard/products",
    label: "Produits",
    icon: FiBox,
  },
  {
    href: "/dashboard/orders",
    label: "Commandes",
    icon: FiShoppingCart,
  },
  {
    href: "/dashboard/settings",
    label: "Paramètres",
    icon: FiSettings,
  },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, loading: authLoading } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  //Check user auth
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/");
    }

  }, [user, authLoading, router]);

  //Handle logout
  async function handleLogout() {
    try {
      setLogoutLoading(true);
      await logoutUser();
      router.push("/");

    } catch (error) {
      console.log(error);

    } finally {
      setLogoutLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="dashboard-loading">
        <FiLoader className="spin-icon" />
      </div>
    );
  }

  const Sidebar = () => (
    <>
      {/* Logo */}
      <Link href="/" className="dashboard-logo">
        <Image
          src={logo}
          alt="T-Shop"
          priority
          className="dashboard-logo-image"
        />
      </Link>

      {/* Nav */}
      <nav className="dashboard-nav">

        {navItems.map((item) => {

          const Icon = item.icon;

          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`dashboard-link ${active ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >

              <Icon />

              <span>{item.label}</span>

            </Link>
          );
        })}
      </nav>

      <button
        className="dashboard-logout-btn"
        onClick={handleLogout}
        disabled={logoutLoading}
      >
        <FiLogOut />
        <span>{logoutLoading? "Déconnexion...": "Déconnexion"}</span>
      </button>

    </>
  );

  return (
    <DashboardProvider>
      <div className="dashboard-layout">

        {/* DESKTOP SIDEBAR */}
        <aside className="dashboard-sidebar desktop-sidebar">
          <Sidebar />
        </aside>

        {/* MAIN */}
        <main className="dashboard-main">

          {/* MOBILE TOPBAR */}
          <div className="dashboard-mobile-topbar">

            <button
              className="mobile-menu-btn"
              onClick={() => setMenuOpen(true)}
            >
              <FiMenu color="#000"/>
            </button>

            <Link href="/" className="dashboard-logo">
              <Image
                src={logo}
                alt="T-Shop"
                priority
                className="dashboard-logo-image"
              />
            </Link>

          </div>

          {/* MOBILE SIDEBAR */}
          {menuOpen && (
            <div
              className="mobile-sidebar-overlay"
              onClick={() => setMenuOpen(false)}
            >
              <div
                className="mobile-sidebar"
                onClick={(e) => e.stopPropagation()}
              >

                <button
                  className="close-sidebar"
                  onClick={() => setMenuOpen(false)}
                >
                  <FiX />
                </button>

                <Sidebar />
              </div>
            </div>
          )}

          {/* PAGE CONTENT */}
          <div className="dashboard-content">
            {children}
          </div>
        </main>
      </div>
    </DashboardProvider>
  );
}