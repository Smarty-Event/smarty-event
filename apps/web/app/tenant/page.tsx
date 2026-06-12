"use client";

import { useEffect, useState } from "react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  stellarPublicKey?: string;
}

interface Event {
  id: string;
  title: string;
  startDate: string;
  capacity: number;
}

export default function OrganizerPortal() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);

  // Create Tenant State
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantSlug, setNewTenantSlug] = useState("");

  // Create Event State
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventStart, setEventStart] = useState("2026-09-12T09:00");
  const [eventEnd, setEventEnd] = useState("2026-09-13T17:00");
  const [eventCap, setEventCap] = useState(200);

  // Create Ticket Type State
  const [selectedEventId, setSelectedEventId] = useState("");
  const [ticketName, setTicketName] = useState("General Admission");
  const [ticketPrice, setTicketPrice] = useState(2000); // 20.00 USDC
  const [ticketQty, setTicketQty] = useState(100);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (activeTenant) {
      loadTenantData(activeTenant.id);
    }
  }, [activeTenant]);

  const loadTenants = () => {
    fetch("http://localhost:3001/api/tenants")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTenants(data);
          if (data.length > 0 && !activeTenant) {
            setActiveTenant(data[0]);
          }
        } else {
          loadMockTenants();
        }
      })
      .catch(() => {
        loadMockTenants();
      });
  };

  const loadMockTenants = () => {
    const mock = JSON.parse(localStorage.getItem("mock_tenants") || "[]");
    setTenants(mock);
    if (mock.length > 0 && !activeTenant) {
      setActiveTenant(mock[0]);
    }
  };

  const loadTenantData = (tenantId: string) => {
    setLoading(true);
    // Fetch metrics
    fetch(`http://localhost:3001/api/tenants/${tenantId}/metrics`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.name) {
          setMetrics(data);
        } else {
          setMockMetrics(tenantId);
        }
      })
      .catch(() => {
        setMockMetrics(tenantId);
      });

    // Fetch events
    fetch(`http://localhost:3001/api/events?tenantId=${tenantId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEvents(data);
          if (data.length > 0) setSelectedEventId(data[0].id);
        } else {
          setMockEvents(tenantId);
        }
      })
      .catch(() => {
        setMockEvents(tenantId);
      })
      .finally(() => setLoading(false));
  };

  const setMockMetrics = (tenantId: string) => {
    const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]");
    const tenantEvts = localEvents.filter((e: any) => e.tenantId === tenantId);
    
    const localTickets = JSON.parse(localStorage.getItem("mock_tickets") || "[]");
    const tenantTkts = localTickets.filter((t: any) => t.ticketType.event.id && tenantEvts.some((e: any) => e.id === t.ticketType.event.id));

    const checkIns = tenantTkts.filter((t: any) => t.status === "CHECKED_IN").length;

    setMetrics({
      name: activeTenant?.name || "Mock Tenant",
      slug: activeTenant?.slug || "mock",
      eventsCount: tenantEvts.length,
      totalCapacity: tenantEvts.reduce((acc: number, e: any) => acc + e.capacity, 0),
      totalSold: tenantTkts.length,
      checkedInCount: checkIns,
      stellarPublicKey: activeTenant?.stellarPublicKey || "GDX7...MOCK_DISTRIBUTOR_KEY",
      stellarIssuerPublicKey: "GAY2...MOCK_ISSUER_KEY",
    });
  };

  const setMockEvents = (tenantId: string) => {
    const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]");
    const filtered = localEvents.filter((e: any) => e.tenantId === tenantId);
    setEvents(filtered);
    if (filtered.length > 0) setSelectedEventId(filtered[0].id);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantSlug) return;
    setSubmitting(true);
    setMessage("");
    setErrorMsg("");

    try {
      const response = await fetch("http://localhost:3001/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTenantName, slug: newTenantSlug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create tenant");

      setTenants((prev) => [data, ...prev]);
      setActiveTenant(data);
      setNewTenantName("");
      setNewTenantSlug("");
      setMessage("Tenant space created successfully! Derived Stellar wallets generated on-chain.");
    } catch (err) {
      console.warn("API offline, simulating Tenant creation locally.");
      const mockNew: Tenant = {
        id: `mock-tenant-${Math.random().toString(36).substr(2, 9)}`,
        name: newTenantName,
        slug: newTenantSlug,
        stellarPublicKey: "GDX7MOCKDISTRIBUTOR" + Math.random().toString(36).substr(2, 4).toUpperCase(),
      };
      const allMock = [mockNew, ...tenants];
      localStorage.setItem("mock_tenants", JSON.stringify(allMock));
      setTenants(allMock);
      setActiveTenant(mockNew);
      setNewTenantName("");
      setNewTenantSlug("");
      setMessage("Simulation Tenant created locally! Mock wallets simulated.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !eventTitle) return;
    setSubmitting(true);
    setMessage("");
    setErrorMsg("");

    const payload = {
      title: eventTitle,
      description: eventDesc,
      startDate: new Date(eventStart).toISOString(),
      endDate: new Date(eventEnd).toISOString(),
      capacity: Number(eventCap),
    };

    try {
      const response = await fetch(`http://localhost:3001/api/events?tenantId=${activeTenant.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create event");

      loadTenantData(activeTenant.id);
      setEventTitle("");
      setEventDesc("");
      setMessage("Event published successfully!");
    } catch (err) {
      console.warn("API offline, simulating Event creation locally.");
      const mockNewEvent = {
        id: `mock-event-${Math.random().toString(36).substr(2, 9)}`,
        tenantId: activeTenant.id,
        title: eventTitle,
        description: eventDesc,
        startDate: eventStart,
        endDate: eventEnd,
        capacity: Number(eventCap),
      };
      const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]");
      localEvents.push(mockNewEvent);
      localStorage.setItem("mock_events", JSON.stringify(localEvents));
      
      loadTenantData(activeTenant.id);
      setEventTitle("");
      setEventDesc("");
      setMessage("Simulation Event created locally!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTicketType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !ticketName) return;
    setSubmitting(true);
    setMessage("");
    setErrorMsg("");

    const payload = {
      name: ticketName,
      price: Number(ticketPrice),
      currency: "USDC",
      quantity: Number(ticketQty),
      benefits: ["General Admission Access"],
    };

    try {
      const response = await fetch(`http://localhost:3001/api/events/${selectedEventId}/ticket-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create ticket class");

      loadTenantData(activeTenant!.id);
      setMessage("Stellar ticket asset created and limits locked on Testnet!");
    } catch (err) {
      console.warn("API offline, simulating Stellar trustlines & asset setup locally.");
      setTimeout(() => {
        setMessage("Simulation Stellar ticket asset created! Limits set to " + ticketQty);
        setSubmitting(false);
      }, 1500);
    } finally {
      if (!submitting) setSubmitting(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: "5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: "800", letterSpacing: "-0.03em" }}>Organizer Portal</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>Configure tenant wallets, create events, and deploy ticket assets on Stellar.</p>
        </div>

        {/* Tenant Switcher */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Active Space:</span>
          <select
            className="select"
            value={activeTenant?.id || ""}
            onChange={(e) => {
              const selected = tenants.find((t) => t.id === e.target.value);
              if (selected) setActiveTenant(selected);
            }}
            style={{ width: "200px" }}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "var(--success)", padding: "1rem", borderRadius: "10px", marginBottom: "2rem" }}>
          {message}
        </div>
      )}

      {/* Grid Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2.5rem" }}>
        
        {/* Left Column (Create Tenant & Operations Forms) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Create Tenant */}
          <div className="glass" style={{ padding: "1.5rem", borderRadius: "16px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "1rem" }}>Create Tenant Space</h3>
            <form onSubmit={handleCreateTenant}>
              <div className="form-group">
                <label className="label">Organization Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Stellar Foundation"
                  value={newTenantName}
                  onChange={(e) => {
                    setNewTenantName(e.target.value);
                    setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Subdomain Slug</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. stellar-fdn"
                  value={newTenantSlug}
                  onChange={(e) => setNewTenantSlug(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.5rem" }} disabled={submitting}>
                Onboard Space
              </button>
            </form>
          </div>

          {/* Create Event Form */}
          {activeTenant && (
            <div className="glass" style={{ padding: "1.5rem", borderRadius: "16px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "1rem" }}>Create Event</h3>
              <form onSubmit={handleCreateEvent}>
                <div className="form-group">
                  <label className="label">Event Title</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Stellar Hackathon"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Description</label>
                  <textarea
                    className="textarea"
                    placeholder="Details about your event..."
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    style={{ minHeight: "80px", resize: "vertical" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="label">Starts</label>
                    <input type="datetime-local" className="input" value={eventStart} onChange={(e) => setEventStart(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Capacity</label>
                    <input type="number" className="input" value={eventCap} onChange={(e) => setEventCap(Number(e.target.value))} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.5rem" }} disabled={submitting}>
                  Publish Event
                </button>
              </form>
            </div>
          )}

          {/* Create Ticket Type Form */}
          {events.length > 0 && (
            <div className="glass" style={{ padding: "1.5rem", borderRadius: "16px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "1rem" }}>Create Ticket Tier (Stellar Asset)</h3>
              <form onSubmit={handleCreateTicketType}>
                <div className="form-group">
                  <label className="label">Select Event</label>
                  <select className="select" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Tier Name</label>
                  <input type="text" className="input" value={ticketName} onChange={(e) => setTicketName(e.target.value)} required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="label">Price (USDC Cents)</label>
                    <input type="number" className="input" value={ticketPrice} onChange={(e) => setTicketPrice(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="label">Quantity</label>
                    <input type="number" className="input" value={ticketQty} onChange={(e) => setTicketQty(Number(e.target.value))} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.5rem" }} disabled={submitting}>
                  Deploy On-Chain Asset
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Right Column (Metrics & Active Listings) */}
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "5rem", color: "var(--text-muted)" }}>Loading metrics...</div>
          ) : metrics ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              
              {/* Wallet info */}
              <div className="glass" style={{ padding: "1.5rem", borderRadius: "16px" }}>
                <span className="badge badge-info" style={{ marginBottom: "0.5rem" }}>Blockchain Wallets</span>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", wordBreak: "break-all", marginBottom: "0.5rem" }}>
                  <strong>Distributor PK (Main):</strong> <br/>
                  <span style={{ color: "#ffffff", fontFamily: "monospace" }}>{metrics.stellarPublicKey}</span>
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
                  <strong>Issuer PK (Minting):</strong> <br/>
                  <span style={{ color: "#ffffff", fontFamily: "monospace" }}>{metrics.stellarIssuerPublicKey}</span>
                </p>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
                <div className="card" style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "2rem", fontWeight: "700" }}>{metrics.eventsCount}</span>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Events Hosted</span>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "2rem", fontWeight: "700" }}>{metrics.totalSold}</span>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Tickets Issued</span>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "2rem", fontWeight: "700" }}>{metrics.checkedInCount}</span>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Checked In</span>
                </div>
              </div>

              {/* Event Listings Table */}
              <div className="glass" style={{ padding: "1.5rem", borderRadius: "16px" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1rem" }}>Current Event Listings</h3>
                {events.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>No events found for this tenant. Create one to get started!</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                        <th style={{ padding: "0.5rem 0", color: "var(--text-muted)" }}>Title</th>
                        <th style={{ padding: "0.5rem 0", color: "var(--text-muted)" }}>Start Date</th>
                        <th style={{ padding: "0.5rem 0", color: "var(--text-muted)", textAlign: "right" }}>Limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((evt) => (
                        <tr key={evt.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                          <td style={{ padding: "0.75rem 0", fontWeight: "600" }}>{evt.title}</td>
                          <td style={{ padding: "0.75rem 0", color: "var(--text-muted)" }}>{new Date(evt.startDate).toLocaleDateString()}</td>
                          <td style={{ padding: "0.75rem 0", textAlign: "right", fontWeight: "600" }}>{evt.capacity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          ) : (
            <div className="glass" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Onboard a Tenant space to view options.</div>
          )}
        </div>

      </div>
    </div>
  );
}
