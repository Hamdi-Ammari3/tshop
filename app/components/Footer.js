import Link from "next/link";
import "./footer.css";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">

                {/* BRAND */}
                <Link href="/" className="footer-brand">
                    <span className="footer-brand-logo">T</span>
                    <span className="footer-brand-name">-Shop</span>
                </Link>

                {/* COPYRIGHT */}
                <p className="footer-copy">
                    © {new Date().getFullYear()} TuniShop — Made in Tunisia.
                </p>

                {/* LINKS */}
                <div className="footer-links">
                    <Link href="/privacy">Privacy</Link>
                    <Link href="/terms">Terms</Link>
                    <Link href="/contact">Contact</Link>
                </div>

            </div>
        </footer>
    );
}