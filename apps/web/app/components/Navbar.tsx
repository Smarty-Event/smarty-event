"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Discover Events", path: "/" },
    { name: "Organizer Portal", path: "/tenant" },
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
        <div style={{ display: "flex", gap: "1.5rem" }}>
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
        </div>
      </div>
    </nav>
  );
}
