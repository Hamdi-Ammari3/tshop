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

  /* STORE PREVIEW DEV */
  const isStorePreview =
    pathname.startsWith(
      "/store/"
    );

  /* CURRENT HOST */
  const hostname =
    typeof window !==
      "undefined"
      ? window.location.hostname
      : "";

  /* STORE SUBDOMAIN */
  const isStoreSubdomain =
    hostname.endsWith(
      ".tunyshop.com"
    ) &&
    hostname !==
      "tunyshop.com" &&
    hostname !==
      "www.tunyshop.com";

  /* HIDE NAVBAR + FOOTER */
  const hideLayout =
    isDashboard ||
    isStorePreview ||
    isStoreSubdomain;

  return (
    <>

      {!hideLayout && (
        <Navbar />
      )}

      {children}

      {!hideLayout && (
        <Footer />
      )}

    </>
  );
}