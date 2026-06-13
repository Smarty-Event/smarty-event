"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  email: string;
  tenantName: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem("smarty_theme") as "dark" | "light" | null;
      const initialTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
      setTheme(initialTheme);
      document.documentElement.setAttribute("data-theme", initialTheme);
    };

    syncTheme();

    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("smarty_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  useEffect(() => {
    // Read user on load
    const checkAuth = () => {
      const storedUser = localStorage.getItem("smarty_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkAuth();

    // Listen for storage events (e.g. login updates storage)
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("smarty_auth_token");
    localStorage.removeItem("smarty_user");
    setUser(null);
    // Dispatch event to sync other tabs
    window.dispatchEvent(new Event("storage"));
    router.push("/");
  };

  const navItems = [
    { name: "Discover Events", path: "/" },
    ...(user ? [{ name: "Organizer Portal", path: "/tenant" }] : []),
    { name: "My Tickets", path: "/attendee/tickets" },
  ];

  return (
    <nav className="glass" style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      backgroundColor: "var(--navbar-bg)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
      marginBottom: "2rem"
    }}>
      <div className="container" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: "70px"
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="gradient-bg" style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            color: "#ffffff"
          }}>
            S
          </div>
          <span style={{ fontWeight: "700", fontSize: "1.25rem", letterSpacing: "-0.025em" }}>
            Smarty<span className="gradient-text">Events</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden-on-mobile" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  color: isActive ? "var(--primary)" : "var(--text-muted)",
                  position: "relative",
                  padding: "0.5rem 0",
                  transition: "color 0.2s ease",
                  whiteSpace: "nowrap"
                }}
              >
                {item.name}
                {isActive && (
                  <div className="gradient-bg" style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    borderRadius: "2px"
                  }} />
                )}
              </Link>
            );
          })}

          <span style={{ borderLeft: "1px solid var(--border)", height: "20px" }} />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            style={{
              width: "36px",
              height: "36px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {theme === "light" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>

          {/* User Section / Auth buttons */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div 
                title={`Logged in as ${user.tenantName} (${user.email})`}
                className="gradient-bg" 
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  color: "#ffffff",
                  boxShadow: "0 0 10px rgba(99, 102, 241, 0.3)",
                  border: "2px solid var(--border)",
                  cursor: "pointer",
                  transition: "transform 0.2s ease"
                }}
              >
                {user.tenantName ? user.tenantName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : "U")}
              </div>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", borderRadius: "8px" }}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "1rem" }}>
              <Link href="/login" className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", borderRadius: "8px" }}>
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", borderRadius: "8px" }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="visible-on-mobile" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="btn btn-secondary"
            style={{ padding: "0.5rem", borderRadius: "8px" }}
          >
            {isMobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="visible-on-mobile glass" style={{
          flexDirection: "column",
          padding: "1rem",
          gap: "1rem",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: "0.75rem 1rem",
                fontSize: "1rem",
                fontWeight: "500",
                color: (pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path))) ? "var(--primary)" : "var(--text-muted)",
                borderRadius: "8px",
                backgroundColor: (pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path))) ? "var(--primary-glow)" : "transparent"
              }}
            >
              {item.name}
            </Link>
          ))}
          
          <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "0.5rem 0" }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 1rem" }}>
            <span style={{ fontSize: "0.95rem", color: "var(--text-muted)", fontWeight: 500 }}>Theme</span>
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ padding: "0.5rem", borderRadius: "8px" }}
            >
              {theme === "light" ? "Switch to Dark" : "Switch to Light"}
            </button>
          </div>

          <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "0.5rem 0" }} />

          {user ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 1rem" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{user.tenantName || user.email}</span>
              <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", borderRadius: "8px" }}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0 0.5rem" }}>
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                Sign In
              </Link>
              <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
