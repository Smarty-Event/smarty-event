"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  banner: string;
  category: string;
  capacity: number;
  ticketTypes: Array<{
    price: number;
    currency: string;
  }>;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  const fallbackEvents: Event[] = [
    {
      id: "demo-stellar-summit",
      title: "Stellar Global Summit 2026",
      description: "Join developers, node operators, and blockchain enthusiasts from across the globe to discuss the future of the Stellar network, Smart Contracts (Soroban), and cross-border payment rails.",
      startDate: "2026-09-12T09:00:00.000Z",
      banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
      category: "Technology",
      capacity: 500,
      ticketTypes: [{ price: 4500, currency: "USDC" }],
    },
    {
      id: "demo-web3-music",
      title: "Decentralized Beats Music Fest",
      description: "An open-air music festival where entry tickets are custom non-fungible Stellar assets. Featuring top indie artists and electronic music sets.",
      startDate: "2026-10-24T18:00:00.000Z",
      banner: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
      category: "Music",
      capacity: 1500,
      ticketTypes: [{ price: 1500, currency: "USDC" }],
    },
  ];

  useEffect(() => {
    fetch("http://localhost:3001/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
        } else {
          setEvents(fallbackEvents);
        }
      })
      .catch(() => {
        // Fallback to demo events if API is offline
        setEvents(fallbackEvents);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", "Technology", "Music", "Conference"];

  const filteredEvents = events.filter((evt) => {
    if (activeTab === "All") return true;
    return evt.category === activeTab;
  });

  return (
    <main className="container animate-fade-in" style={{ paddingBottom: "5rem" }}>
      {/* Hero Section */}
      <section style={{
        textAlign: "center",
        padding: "3rem 1.5rem",
        borderRadius: "24px",
        background: "radial-gradient(circle at top, rgba(99, 102, 241, 0.15) 0%, transparent 60%)",
        marginBottom: "3rem",
        border: "1px solid var(--border)"
      }}>
        <span className="badge badge-info" style={{ marginBottom: "1rem" }}>
          Next-Gen Blockchain Ticketing
        </span>
        <h1 style={{
          fontSize: "3.5rem",
          fontWeight: "800",
          letterSpacing: "-0.03em",
          marginBottom: "1rem",
          lineHeight: "1.1"
        }}>
          Fraud-Proof Tickets, <br/>
          Backed by <span className="gradient-text">Stellar</span>
        </h1>
        <p style={{
          color: "var(--text-muted)",
          fontSize: "1.15rem",
          maxWidth: "600px",
          margin: "0 auto 2rem auto",
          lineHeight: "1.6"
        }}>
          Buy, trade, and verify event tickets securely. Utilizing Stellar horizon testnet trustlines and dynamic cryptographically-signed HMAC QR codes.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <Link href="/tenant" className="btn btn-primary">
            Host an Event
          </Link>
          <a href="#events" className="btn btn-secondary">
            Browse Tickets
          </a>
        </div>
      </section>

      {/* Discovery Section */}
      <section id="events">
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "700" }}>Upcoming Events</h2>

          {/* Category Tabs */}
          <div className="glass" style={{ display: "flex", gap: "0.25rem", padding: "0.25rem", borderRadius: "10px" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  background: activeTab === cat ? "var(--primary)" : "transparent",
                  color: activeTab === cat ? "#ffffff" : "var(--text-muted)",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  transition: "all 0.2s ease"
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            Loading events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--text-muted)" }}>
            No events found in this category.
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "2rem"
          }}>
            {filteredEvents.map((evt) => {
              const date = new Date(evt.startDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
              });
              const price = evt.ticketTypes?.[0] 
                ? `${evt.ticketTypes[0].price / 100} ${evt.ticketTypes[0].currency}` 
                : "Free";

              return (
                <div key={evt.id} className="card animate-fade-in" style={{ display: "flex", flexDirection: "column" }}>
                  {/* Banner image */}
                  <div style={{
                    width: "100%",
                    height: "180px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    marginBottom: "1.25rem",
                    position: "relative"
                  }}>
                    <img 
                      src={evt.banner || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80"} 
                      alt={evt.title} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <span className="badge badge-info" style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(4px)"
                    }}>
                      {evt.category}
                    </span>
                  </div>

                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--primary)", marginBottom: "0.5rem" }}>
                    {date}
                  </span>
                  
                  <h3 style={{ fontSize: "1.35rem", fontWeight: "700", marginBottom: "0.75rem", lineHeight: "1.2" }}>
                    {evt.title}
                  </h3>

                  <p style={{
                    color: "var(--text-muted)",
                    fontSize: "0.95rem",
                    lineHeight: "1.5",
                    marginBottom: "1.5rem",
                    flexGrow: 1,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}>
                    {evt.description}
                  </p>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "1rem"
                  }}>
                    <div>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)" }}>Price From</span>
                      <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ffffff" }}>{price}</span>
                    </div>
                    <Link href={`/events/${evt.id}`} className="btn btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}>
                      Get Tickets
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
