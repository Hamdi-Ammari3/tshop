"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-text">
          <Link href="/">© 2026 TuniShop — Made in Tunisia.</Link>
        </div>

        <div className="footer-links">
          <Link href="/">Privacy</Link>
          <Link href="/">Terms</Link>
          <Link href="/">Contact</Link>
        </div>

      </div>
    </footer>
  );
}