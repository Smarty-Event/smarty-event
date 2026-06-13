import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "SmartyEvents | Blockchain-Backed Ticket Management",
  description: "Secure, multi-tenant event management and ticketing platform powered by the Stellar blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('smarty_theme');
                  var theme = savedTheme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Stellar Wallets CDN Scripts */}
        <Script src="https://unpkg.com/@albedo-link/intent/lib/albedo.intent.js" strategy="afterInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@stellar/freighter-api/build/index.min.js" strategy="afterInteractive" />
      </head>
      <body>
        <Navbar />
        {children}
        <a 
          href="/checkin" 
          title="Gate Scanner Simulator"
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "var(--primary)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 9999,
            cursor: "pointer",
            transition: "transform 0.2s ease"
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
            <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
            <line x1="7" y1="12" x2="17" y2="12"></line>
          </svg>
        </a>
      </body>
    </html>
  );
}
