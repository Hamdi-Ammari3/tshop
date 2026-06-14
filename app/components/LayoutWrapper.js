"use client";

import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function LayoutWrapper({children}) {

  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [hideLayout,setHideLayout] = useState(false);

  useEffect(() => {

    const hostname = window.location.hostname;

    /* DASHBOARD */
    const isDashboard = pathname.startsWith("/dashboard");

    /* DEV STORE */
    const isStorePreview = pathname.startsWith("/store/");

    /* PROD STORE SUBDOMAIN */
    const isStoreSubdomain = hostname.endsWith(".tunyshop.com") && hostname !== "tunyshop.com" && hostname !== "www.tunyshop.com";

    setHideLayout(isDashboard || isStorePreview || isStoreSubdomain);

    setMounted(true);

  }, [pathname]);

  /* PREVENT HYDRATION MISMATCH */
  if (!mounted) {
    return children;
  }

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