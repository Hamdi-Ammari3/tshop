import './style.css'
import { Noto_Sans_Arabic } from "next/font/google"
import LayoutWrapper from "./components/LayoutWrapper"
import {AuthProvider} from '../context/AuthContext'
import {StoreProvider} from '../context/StoreContext';

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata = {
  title: "T-Shop",
  description: "Tunisia E-commerce Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar">
      <body id="app-container" className={notoArabic.variable}>
        <AuthProvider>
          <StoreProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}