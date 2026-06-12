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
    { name: "Gate Check-In", path: "/checkin" },
  ];

  return (
    <nav className="glass" style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
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

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
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
                  transition: "color 0.2s ease"
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

          {/* User Section / Auth buttons */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Logged in: <strong style={{ color: "#ffffff" }}>{user.tenantName}</strong>
              </span>
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
      </div>
    </nav>
  );
}
