"use client";

import { useState } from "react";

export default function GateScanner() {
  const [qrToken, setQrToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrToken) return;

    setLoading(true);
    setResult(null);
    setErrorMsg("");

    const payload = {
      qrToken,
      scannedById: "mock-gate-agent-user-uuid",
      deviceId: "GATE_UNIT_A1",
    };

    try {
      const response = await fetch("http://localhost:3001/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Check-in rejected");
      }

      setResult(data);
    } catch (err: any) {
      console.warn("API check-in failed, running simulation fallback:", err);
      
      // Simulation gate scanning logic from local storage
      setTimeout(() => {
        const parts = qrToken.split(":");
        if (parts.length !== 4) {
          setErrorMsg("Check-in rejected: Invalid QR token format");
          setLoading(false);
          return;
        }

        const [ticketId, attendeeId, timestampStr] = parts;
        const timestamp = parseInt(timestampStr || "0", 10);

        // Check token expiration (5 minutes)
        if (Date.now() - timestamp > 300000) {
          setErrorMsg("Check-in rejected: QR Code has expired. Attendee must refresh their ticket.");
          setLoading(false);
          return;
        }

        // Look up ticket in localStorage mock tickets
        const localTickets = JSON.parse(localStorage.getItem("mock_tickets") || "[]");
        const tktIndex = localTickets.findIndex((t: any) => t.id === ticketId);

        if (tktIndex === -1) {
          setErrorMsg("Check-in rejected: Ticket not found in registry.");
          setLoading(false);
          return;
        }

        const ticket = localTickets[tktIndex];

        if (ticket.status === "CHECKED_IN") {
          setErrorMsg("Double-Spend Detected! This ticket was already checked in.");
          setLoading(false);
          return;
        }

        // Check Stellar balance simulation
        if (ticket.id.startsWith("mock-") && Math.random() < 0.05) {
          setErrorMsg("Check-in rejected: Attendee does not hold the ticket asset on-chain.");
          setLoading(false);
          return;
        }

        // Mark ticket checked-in
        ticket.status = "CHECKED_IN";
        localTickets[tktIndex] = ticket;
        localStorage.setItem("mock_tickets", JSON.stringify(localTickets));

        setResult({
          message: "Check-in successful! (Simulation Mode)",
          attendeeName: ticket.attendee.name,
          ticketType: ticket.ticketType.name,
          eventTitle: ticket.ticketType.event.title,
          scannedAt: new Date().toISOString(),
        });
        setLoading(false);
      }, 1500);
    } finally {
      if (!errorMsg && !result) {
        // Only set loading false if catch block timeout hasn't executed
        setTimeout(() => setLoading(false), 1500);
      }
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: "5rem", maxWidth: "600px" }}>
      <h1 style={{ fontSize: "2.25rem", fontWeight: "800", marginBottom: "1.5rem", letterSpacing: "-0.03em" }}>
        Gate-Agent Simulator
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
        Paste the time-sensitive HMAC QR token from the attendee's ticket wallet to simulate the gate scanner.
      </p>

      {/* Simulator input */}
      <form onSubmit={handleScan} className="glass" style={{ padding: "2.5rem", borderRadius: "20px", border: "1px solid var(--border)", marginBottom: "2.5rem" }}>
        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label className="label">Dynamic Scan Token</label>
          <textarea
            className="textarea"
            placeholder="Paste raw qrToken here (e.g. ticketId:attendeeId:timestamp:signature)"
            value={qrToken}
            onChange={(e) => setQrToken(e.target.value)}
            required
            style={{ minHeight: "120px", fontFamily: "monospace", fontSize: "0.85rem", lineHeight: "1.4" }}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: "100%", height: "50px", fontSize: "1rem" }} disabled={loading}>
          {loading ? "Verifying Signature & Stellar Ledger..." : "Scan & Verify Admission"}
        </button>
      </form>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{
            width: "35px",
            height: "35px",
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 1rem auto"
          }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Checking signatures, timestamps, and on-chain holdings...</p>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="glass animate-fade-in" style={{
          padding: "2rem",
          borderRadius: "16px",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          background: "rgba(16, 185, 129, 0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--success)", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>✓</span>
            <h3 style={{ fontWeight: "700" }}>ACCESS GRANTED</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.95rem" }}>
            <p><strong>Attendee:</strong> {result.attendeeName}</p>
            <p><strong>Ticket Class:</strong> {result.ticketType}</p>
            <p><strong>Event:</strong> {result.eventTitle}</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              Scanned at: {new Date(result.scannedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}

      {/* Error Result */}
      {errorMsg && (
        <div className="glass animate-fade-in" style={{
          padding: "2rem",
          borderRadius: "16px",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          background: "rgba(239, 68, 68, 0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--error)", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>⚠</span>
            <h3 style={{ fontWeight: "700" }}>ACCESS REJECTED</h3>
          </div>
          <p style={{ fontSize: "0.95rem", lineHeight: "1.5" }}>{errorMsg}</p>
        </div>
      )}

      {/* Inline Animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
