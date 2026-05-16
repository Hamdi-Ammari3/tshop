"use client";

import { usePathname } from "next/navigation";

import Navbar from "./Navbar";
import Footer from "./Footer";

export default function LayoutWrapper({
  children,
}) {

  const pathname =
    usePathname();

  /* DASHBOARD */
  const isDashboard =
    pathname.startsWith(
      "/dashboard"
    );

  /* DEV STORE PREVIEW */
  const isStorePreview =
    pathname.startsWith(
      "/store/"
    );

  /* PROD STORE SUBDOMAIN */
  const isSubdomainStore =
    typeof window !==
      "undefined" &&
    window.location.hostname !==
      "localhost" &&
    window.location.hostname
      .split(".").length > 2;

  /* STORE WEBSITE */
  const isStoreWebsite =
    isStorePreview ||
    isSubdomainStore;

  /* NAVBAR */
  const showNavbar =
    !isDashboard &&
    !isStoreWebsite;

  /* FOOTER */
  const showFooter =
    !isDashboard;

  return (
    <>

      {showNavbar && (
        <Navbar />
      )}

      {children}

      {showFooter && (
        <Footer />
      )}

    </>
  );
}