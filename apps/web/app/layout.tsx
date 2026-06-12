import type { Metadata } from "next";
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
        <script
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
        <script src="https://unpkg.com/@albedo-link/intent/lib/albedo.intent.js" defer />
        <script src="https://cdn.jsdelivr.net/npm/@stellar/freighter-api/build/index.min.js" defer />
      </head>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
