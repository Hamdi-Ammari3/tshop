"use client";

import { usePathname } from "next/navigation";

import Navbar from "./Navbar";
import Footer from "./Footer";

export default function LayoutWrapper({ children }) {

  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard");
  const isStorePreview = pathname.startsWith("/store/");

  return (
    <>
      {!isDashboard && !isStorePreview && (
        <Navbar />
      )}

      {children}

      {!isDashboard && (
        <Footer />
      )}

    </>
  );
}