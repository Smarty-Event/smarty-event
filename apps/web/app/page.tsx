"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { Event, FALLBACK_EVENTS } from "./fallbackData";
import { API_BASE_URL } from "./config";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/events`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
        } else {
          setEvents(FALLBACK_EVENTS);
        }
      })
      .catch(() => {
        // Fallback to demo events if API is offline
        setEvents(FALLBACK_EVENTS);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", "Technology", "Music", "Conference"];

  const filteredEvents = events.filter((evt) => {
    const categoryMatch = activeTab === "All" || evt.category === activeTab;
    const query = searchQuery.toLowerCase().trim();
    const searchMatch = !query ||
      evt.title.toLowerCase().includes(query) ||
      evt.description.toLowerCase().includes(query);

    return categoryMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

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
          Fraud-Proof Tickets, <br />
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
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem" }}>
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
          marginBottom: "2.5rem",
          flexWrap: "wrap",
          gap: "1.5rem"
        }}>
          <div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700" }}>Upcoming Events</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Browse and secure on-chain tickets
            </p>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap"
          }}>
            {/* Search Input */}
            <div style={{ position: "relative", width: "260px" }}>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "0.55rem 1rem 0.55rem 2.3rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "rgba(255, 255, 255, 0.02)",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  outline: "none",
                  transition: "all 0.2s ease"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--primary)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <svg
                style={{
                  position: "absolute",
                  left: "0.8rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "0.95rem",
                  height: "0.95rem",
                  color: "var(--text-muted)",
                  pointerEvents: "none"
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Tabs */}
            <div className="glass" style={{ display: "flex", gap: "0.25rem", padding: "0.25rem", borderRadius: "10px" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveTab(cat);
                    setCurrentPage(1);
                  }}
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
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            Loading events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--text-muted)" }}>
            No events found. Try a different search term or category.
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: "2rem"
            }}>
              {paginatedEvents.map((evt) => {
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
                      <Image
                        src={evt.banner || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80"}
                        alt={evt.title}
                        fill
                        unoptimized
                        style={{ objectFit: "cover" }}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "3rem"
              }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn"
                  style={{
                    padding: "0.5rem 1rem",
                    background: currentPage === 1 ? "rgba(255, 255, 255, 0.01)" : "rgba(255, 255, 255, 0.04)",
                    color: currentPage === 1 ? "var(--text-muted)" : "#ffffff",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    transition: "all 0.2s"
                  }}
                >
                  &larr; Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: currentPage === page ? "var(--primary)" : "transparent",
                      color: currentPage === page ? "#ffffff" : "var(--text-muted)",
                      border: currentPage === page ? "none" : "1px solid var(--border)",
                      borderRadius: "8px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn"
                  style={{
                    padding: "0.5rem 1rem",
                    background: currentPage === totalPages ? "rgba(255, 255, 255, 0.01)" : "rgba(255, 255, 255, 0.04)",
                    color: currentPage === totalPages ? "var(--text-muted)" : "#ffffff",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    transition: "all 0.2s"
                  }}
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
