"use client";

import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  stellarAssetCode: string;
  stellarTxHash: string;
  status: string;
  qrToken?: string;
  attendee: {
    name: string;
    email: string;
  };
  ticketType: {
    name: string;
    price: number;
    currency: string;
    event: {
      id: string;
      title: string;
    };
  };
}

export default function AttendeeWallet() {
  const [email, setEmail] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Poll intervals to refresh QR tokens
  useEffect(() => {
    if (tickets.length === 0) return;

    const interval = setInterval(() => {
      // Refresh tokens for active (not checked-in) tickets
      tickets.forEach((tkt) => {
        if (tkt.status !== "ACTIVE") return;

        // Skip fallback/mock tickets
        if (tkt.id.startsWith("mock-")) {
          setTickets((prev) =>
            prev.map((t) => {
              if (t.id === tkt.id) {
                // Generate a fresh mock token with current timestamp
                const freshMockToken = `${t.id}:mock-user:${Date.now()}:mock-signature-hash`;
                return { ...t, qrToken: freshMockToken };
              }
              return t;
            })
          );
          return;
        }

        fetch(`http://localhost:3001/api/tickets/${tkt.id}/qr-token`)
          .then((res) => res.json())
          .then((updatedTicket) => {
            if (updatedTicket && updatedTicket.qrToken) {
              setTickets((prev) =>
                prev.map((t) => (t.id === tkt.id ? { ...t, qrToken: updatedTicket.qrToken } : t))
              );
            }
          })
          .catch((err) => console.warn("Failed to fetch fresh QR token", err));
      });
    }, 20000); // refresh every 20 seconds

    return () => clearInterval(interval);
  }, [tickets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setSearched(true);

    fetch(`http://localhost:3001/api/tickets/attendee/${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Merge with any matching mock tickets from localStorage
          const localTickets = JSON.parse(localStorage.getItem("mock_tickets") || "[]");
          const filteredLocal = localTickets.filter(
            (t: any) => t.attendee.email.toLowerCase() === email.toLowerCase()
          );

          // Build local tokens
          const localWithTokens = filteredLocal.map((t: any) => ({
            ...t,
            qrToken: `${t.id}:mock-user:${Date.now()}:mock-signature-hash`,
          }));

          setTickets([...data, ...localWithTokens]);
        } else {
          loadMockTicketsOnly();
        }
      })
      .catch(() => {
        loadMockTicketsOnly();
      })
      .finally(() => setLoading(false));
  };

  const loadMockTicketsOnly = () => {
    const localTickets = JSON.parse(localStorage.getItem("mock_tickets") || "[]");
    const filteredLocal = localTickets.filter(
      (t: any) => t.attendee.email.toLowerCase() === email.toLowerCase()
    );

    const localWithTokens = filteredLocal.map((t: any) => ({
      ...t,
      qrToken: `${t.id}:mock-user:${Date.now()}:mock-signature-hash`,
    }));

    setTickets(localWithTokens);
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: "5rem", maxWidth: "800px" }}>
      <h1 style={{ fontSize: "2.25rem", fontWeight: "800", marginBottom: "1.5rem", letterSpacing: "-0.03em" }}>
        Attendee Ticket Wallet
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
        Access your tickets, view dynamic check-in QR codes, and trace your assets on the Stellar network.
      </p>

      {/* Lookup Form */}
      <form onSubmit={handleSearch} className="glass" style={{ padding: "1.5rem", borderRadius: "16px", display: "flex", gap: "1rem", marginBottom: "3rem" }}>
        <input
          type="email"
          className="input"
          placeholder="Enter the email address used during purchase"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ flexGrow: 1 }}
        />
        <button type="submit" className="btn btn-primary">
          Access Tickets
        </button>
      </form>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          Loading your tickets...
        </div>
      ) : searched && tickets.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }} className="glass">
          <h3>No tickets found</h3>
          <p style={{ marginTop: "0.5rem" }}>
            We couldn't find any ticket assets associated with <strong>{email}</strong>.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {tickets.map((tkt) => {
            const qrCodeUrl = tkt.qrToken
              ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tkt.qrToken)}`
              : null;

            return (
              <div key={tkt.id} className="card" style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.2fr",
                gap: "2rem",
                alignItems: "center",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                padding: "2rem",
                position: "relative",
                overflow: "hidden"
              }}>
                {/* Visual Accent Decoration */}
                <div className="gradient-bg" style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "6px"
                }} />

                {/* Ticket Details */}
                <div>
                  <span className="badge badge-info" style={{ marginBottom: "0.75rem" }}>
                    {tkt.stellarAssetCode}
                  </span>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>
                    {tkt.ticketType?.event?.title}
                  </h3>
                  <p style={{ fontWeight: "600", fontSize: "1.1rem", color: "#ffffff", marginBottom: "1.25rem" }}>
                    {tkt.ticketType?.name}
                  </p>

                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <p><strong>Owner:</strong> {tkt.attendee?.name} ({tkt.attendee?.email})</p>
                    <p><strong>Status:</strong>{" "}
                      <span className={tkt.status === "CHECKED_IN" ? "badge badge-success" : "badge badge-warning"} style={{ display: "inline-flex", padding: "0.15rem 0.5rem", fontSize: "0.75rem" }}>
                        {tkt.status === "CHECKED_IN" ? "Checked In" : "Active"}
                      </span>
                    </p>
                    {tkt.stellarTxHash && (
                      <p style={{ wordBreak: "break-all" }}>
                        <strong>Stellar Tx:</strong>{" "}
                        <a
                          href={`https://laboratory.stellar.org/#explorer?path=transactions&network=testnet&hash=${tkt.stellarTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--primary)", textDecoration: "underline" }}
                        >
                          {tkt.stellarTxHash.substring(0, 16)}...
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* QR Code Presentation */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderLeft: "1px dashed var(--border)",
                  paddingLeft: "2rem"
                }}>
                  {tkt.status === "CHECKED_IN" ? (
                    <div style={{
                      width: "150px",
                      height: "150px",
                      background: "rgba(16, 185, 129, 0.05)",
                      border: "2px solid rgba(16, 185, 129, 0.2)",
                      borderRadius: "12px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--success)"
                    }}>
                      <span style={{ fontSize: "2rem", fontWeight: "bold" }}>✓</span>
                      <span style={{ fontSize: "0.85rem", fontWeight: "600", marginTop: "0.5rem" }}>Checked In</span>
                    </div>
                  ) : qrCodeUrl ? (
                    <div style={{ textAlign: "center" }}>
                      <div style={{
                        background: "#ffffff",
                        padding: "8px",
                        borderRadius: "12px",
                        display: "inline-block",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                      }}>
                        <img src={qrCodeUrl} alt="Ticket QR code token" style={{ display: "block" }} />
                      </div>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
                        🔒 Cryptographic Dynamic Token <br/>
                        (Auto-refreshing)
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      QR token generation failed.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
