import type { Metadata } from "next";
import { Manrope, Noto_Sans, Poppins } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import { AuthProvider } from "@/context/AuthContext";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const noto_sans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Saabri",
  description: "Saabri Group",
  keywords: [
    "Saabri",
    "Saabri Group",
    "Dubai real estate",
    "Dubai properties",
    "real estate investment",
    "luxury properties Dubai",
    "Dubai apartments",
    "Dubai villas",
    "property investment Dubai"
  ],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    images: "/logoFooter.webp",
  },
  twitter: {
    images: "/logoFooter.webp",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} antialiased`}
      >
        <AuthProvider>
          <Loader />
          <Header />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
