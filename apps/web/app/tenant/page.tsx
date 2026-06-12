"use client";

import { useEffect, useState } from "react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  stellarPublicKey?: string;
}

interface Speaker {
  id: string;
  name: string;
  bio?: string;
}

interface Session {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  benefits?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  capacity: number;
  ticketTypes: TicketType[];
  speakers: Speaker[];
  sessions: Session[];
}

export default function OrganizerPortal() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);

  // Modals Visibility
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

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

  // Create Speaker State
  const [speakerName, setSpeakerName] = useState("");
  const [speakerBio, setSpeakerBio] = useState("");

  // Create Session State
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDesc, setSessionDesc] = useState("");
  const [sessionStart, setSessionStart] = useState("2026-09-12T10:00");
  const [sessionEnd, setSessionEnd] = useState("2026-09-12T11:00");

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
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantSlug) return;
    setSubmitting(true);
    setMessage("");

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
      setShowTenantModal(false);
      setMessage("Tenant space created successfully! Stellar derived wallets setup.");
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
      setShowTenantModal(false);
      setMessage("Simulation Tenant created locally!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !eventTitle) return;
    setSubmitting(true);
    setMessage("");

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
      setShowEventModal(false);
      setMessage("Event published successfully!");
    } catch (err) {
      console.warn("API offline, simulating Event creation locally.");
      const mockNewEvent: Event = {
        id: `mock-event-${Math.random().toString(36).substr(2, 9)}`,
        title: eventTitle,
        description: eventDesc,
        startDate: eventStart,
        endDate: eventEnd,
        capacity: Number(eventCap),
        ticketTypes: [],
        speakers: [],
        sessions: [],
      };
      const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]");
      localEvents.push({ ...mockNewEvent, tenantId: activeTenant.id });
      localStorage.setItem("mock_events", JSON.stringify(localEvents));
      
      loadTenantData(activeTenant.id);
      setEventTitle("");
      setEventDesc("");
      setShowEventModal(false);
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
      setShowTicketModal(false);
      setMessage("Stellar ticket asset created and limits locked on Testnet!");
    } catch (err) {
      console.warn("API offline, simulating Stellar trustlines & asset setup locally.");
      
      // Simulate adding ticket type to mock event in localStorage
      const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]");
      const eventIdx = localEvents.findIndex((e: any) => e.id === selectedEventId);
      if (eventIdx !== -1) {
        const mockTicket: TicketType = {
          id: `mock-tkt-${Math.random().toString(36).substr(2, 9)}`,
          name: ticketName,
          price: Number(ticketPrice),
          currency: "USDC",
          quantity: Number(ticketQty),
          sold: 0,
          benefits: JSON.stringify(["General Admission Access"]),
        };
        if (!localEvents[eventIdx].ticketTypes) localEvents[eventIdx].ticketTypes = [];
        localEvents[eventIdx].ticketTypes.push(mockTicket);
        localStorage.setItem("mock_events", JSON.stringify(localEvents));
      }

      setTimeout(() => {
        loadTenantData(activeTenant!.id);
        setShowTicketModal(false);
        setMessage("Simulation Ticket Asset deployed!");
        setSubmitting(false);
      }, 1000);
    } finally {
      if (!submitting) setSubmitting(false);
    }
  };

  const handleAddSpeaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !speakerName) return;
    setSubmitting(true);

    try {
      const response = await fetch(`http://localhost:3001/api/events/${selectedEventId}/speakers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: speakerName, bio: speakerBio }),
      });
      if (!response.ok) throw new Error("Failed to add speaker");

      loadTenantData(activeTenant!.id);
      setShowSpeakerModal(false);
      setSpeakerName("");
      setSpeakerBio("");
      setMessage("Speaker profile added!");
    } catch {
      // Offline fallback
      const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]");
      const idx = localEvents.findIndex((e: any) => e.id === selectedEventId);
      if (idx !== -1) {
        if (!localEvents[idx].speakers) localEvents[idx].speakers = [];
        localEvents[idx].speakers.push({
          id: `mock-spk-${Math.random().toString(36).substr(2, 9)}`,
          name: speakerName,
          bio: speakerBio,
        });
        localStorage.setItem("mock_events", JSON.stringify(localEvents));
      }
      loadTenantData(activeTenant!.id);
      setShowSpeakerModal(false);
      setSpeakerName("");
      setSpeakerBio("");
      setMessage("Speaker profile added!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !sessionTitle) return;
    setSubmitting(true);

    const payload = {
      title: sessionTitle,
      description: sessionDesc,
      startTime: new Date(sessionStart).toISOString(),
      endTime: new Date(sessionEnd).toISOString(),
    };

    try {
      const response = await fetch(`http://localhost:3001/api/events/${selectedEventId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to add session");

      loadTenantData(activeTenant!.id);
      setShowSessionModal(false);
      setSessionTitle("");
      setSessionDesc("");
      setMessage("Itinerary session scheduled!");
    } catch {
      // Offline fallback
      const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]");
      const idx = localEvents.findIndex((e: any) => e.id === selectedEventId);
      if (idx !== -1) {
        if (!localEvents[idx].sessions) localEvents[idx].sessions = [];
        localEvents[idx].sessions.push({
          id: `mock-sess-${Math.random().toString(36).substr(2, 9)}`,
          title: sessionTitle,
          startTime: sessionStart,
          endTime: sessionEnd,
        });
        localStorage.setItem("mock_events", JSON.stringify(localEvents));
      }
      loadTenantData(activeTenant!.id);
      setShowSessionModal(false);
      setSessionTitle("");
      setSessionDesc("");
      setMessage("Itinerary session scheduled!");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Action triggers from Listings Table
  const triggerCreateTicketModal = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowTicketModal(true);
  };

  const triggerAddSpeakerModal = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowSpeakerModal(true);
  };

  const triggerAddSessionModal = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowSessionModal(true);
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: "5rem" }}>
      {/* Header Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: "800", letterSpacing: "-0.03em" }}>Organizer Portal</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>Deploy on-chain assets, plan schedules, and track ticket registrations.</p>
        </div>

        {/* Tenant Switcher & Quick Onboard */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Active Space:</span>
            <select
              className="select"
              value={activeTenant?.id || ""}
              onChange={(e) => {
                const selected = tenants.find((t) => t.id === e.target.value);
                if (selected) setActiveTenant(selected);
              }}
              style={{ width: "180px", padding: "0.5rem" }}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setShowTenantModal(true)} className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            + New Space
          </button>
        </div>
      </div>

      {message && (
        <div className="animate-fade-in" style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "var(--success)", padding: "1rem", borderRadius: "10px", marginBottom: "2rem" }}>
          {message}
        </div>
      )}

      {/* Organizer Action Hub */}
      {activeTenant && (
        <div className="glass" style={{ padding: "1.5rem", borderRadius: "16px", marginBottom: "2.5rem", display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: "600", fontSize: "1rem" }}>Operations Dashboard:</span>
          <button onClick={() => setShowEventModal(true)} className="btn btn-primary" style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem" }}>
            Publish New Event
          </button>
          {events.length > 0 && events[0] && (
            <>
              <button onClick={() => { setSelectedEventId(events[0]!.id); setShowTicketModal(true); }} className="btn btn-secondary" style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem" }}>
                Deploy Ticket Tier
              </button>
              <button onClick={() => { setSelectedEventId(events[0]!.id); setShowSpeakerModal(true); }} className="btn btn-secondary" style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem" }}>
                Add Speaker Bio
              </button>
              <button onClick={() => { setSelectedEventId(events[0]!.id); setShowSessionModal(true); }} className="btn btn-secondary" style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem" }}>
                Schedule Session
              </button>
            </>
          )}
        </div>
      )}

      {/* Main Layout Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem", color: "var(--text-muted)" }}>Loading metrics...</div>
        ) : metrics ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            
            {/* Top row widgets (Wallets and Metrics) */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr", gap: "2rem", flexWrap: "wrap" }}>
              {/* Wallet info */}
              <div className="glass" style={{ padding: "2rem", borderRadius: "20px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span className="badge badge-info" style={{ marginBottom: "1rem", alignSelf: "flex-start" }}>Stellar Testnet Accounts</span>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", wordBreak: "break-all", marginBottom: "0.75rem" }}>
                  <strong>Distributor Public Key (Asset Vault):</strong> <br/>
                  <span style={{ color: "#ffffff", fontFamily: "monospace", fontSize: "0.8rem" }}>{metrics.stellarPublicKey}</span>
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
                  <strong>Issuer Public Key (Mint Authority):</strong> <br/>
                  <span style={{ color: "#ffffff", fontFamily: "monospace", fontSize: "0.8rem" }}>{metrics.stellarIssuerPublicKey}</span>
                </p>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
                <div className="card animate-fade-in" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: "800" }}>{metrics.eventsCount}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Events Published</span>
                </div>
                <div className="card animate-fade-in" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: "800" }}>{metrics.totalSold}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Tickets Sold</span>
                </div>
                <div className="card animate-fade-in" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: "800", color: "var(--success)" }}>{metrics.checkedInCount}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Attended at Gate</span>
                </div>
              </div>
            </div>

            {/* Event Listings Table with nested relationships */}
            <div className="glass" style={{ padding: "2.5rem", borderRadius: "24px" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "1.5rem", letterSpacing: "-0.025em" }}>
                Event Directories & On-Chain Assets
              </h2>

              {events.length === 0 ? (
                <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem 0" }}>
                  No active event listings found. Click "Publish New Event" to get started!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                  {events.map((evt) => {
                    const start = new Date(evt.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    
                    return (
                      <div key={evt.id} style={{
                        border: "1px solid var(--border)",
                        borderRadius: "16px",
                        padding: "2rem",
                        background: "rgba(255,255,255,0.01)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.5rem"
                      }}>
                        {/* Event Header Panel */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border)", paddingBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                          <div>
                            <h3 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#ffffff" }}>{evt.title}</h3>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                              📅 {start} | Limit capacity: <strong>{evt.capacity} attendees</strong>
                            </span>
                          </div>
                          
                          {/* Quick Action buttons */}
                          <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button onClick={() => triggerCreateTicketModal(evt.id)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", borderRadius: "8px" }}>
                              + Add Ticket Asset
                            </button>
                            <button onClick={() => triggerAddSpeakerModal(evt.id)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", borderRadius: "8px" }}>
                              + Add Speaker
                            </button>
                            <button onClick={() => triggerAddSessionModal(evt.id)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", borderRadius: "8px" }}>
                              + Schedule Session
                            </button>
                          </div>
                        </div>

                        {/* Nested Relationships Directories */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "2rem", flexWrap: "wrap" }}>
                          
                          {/* Ticket Assets list */}
                          <div style={{ borderRight: "1px solid var(--border)", paddingRight: "1.5rem" }}>
                            <h4 style={{ fontSize: "0.95rem", color: "var(--primary)", fontWeight: "600", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Ticket Tiers (On-Chain Tokens)
                            </h4>
                            {evt.ticketTypes && evt.ticketTypes.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {evt.ticketTypes.map((t) => {
                                  const pct = Math.min(100, (t.sold / t.quantity) * 100);
                                  return (
                                    <div key={t.id} style={{ fontSize: "0.85rem", padding: "0.75rem", borderRadius: "8px", background: "rgba(0,0,0,0.15)", border: "1px solid var(--border)" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", marginBottom: "0.25rem" }}>
                                        <span>{t.name}</span>
                                        <span style={{ color: "var(--text-muted)" }}>{t.price / 100} {t.currency}</span>
                                      </div>
                                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                        <span>Limit: {t.quantity} | Sold: {t.sold}</span>
                                      </div>
                                      
                                      {/* Capacity Bar */}
                                      <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", margin: "0.4rem 0" }}>
                                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--primary)", borderRadius: "2px" }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No ticket assets configured yet.</p>
                            )}
                          </div>

                          {/* Sessions list */}
                          <div style={{ borderRight: "1px solid var(--border)", paddingRight: "1.5rem" }}>
                            <h4 style={{ fontSize: "0.95rem", color: "var(--accent)", fontWeight: "600", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Scheduled Sessions
                            </h4>
                            {evt.sessions && evt.sessions.length > 0 ? (
                              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                {evt.sessions.map((s) => (
                                  <li key={s.id} style={{ fontSize: "0.85rem", padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                    <strong>{s.title}</strong>
                                    <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                      {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No sessions scheduled.</p>
                            )}
                          </div>

                          {/* Speakers list */}
                          <div>
                            <h4 style={{ fontSize: "0.95rem", color: "#10b981", fontWeight: "600", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Invited Speakers
                            </h4>
                            {evt.speakers && evt.speakers.length > 0 ? (
                              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                {evt.speakers.map((spk) => (
                                  <li key={spk.id} style={{ fontSize: "0.85rem", padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                    <strong>{spk.name}</strong>
                                    {spk.bio && <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{spk.bio}</span>}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No speakers registered.</p>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="glass" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
            Please onboard a Tenant space to begin operations.
          </div>
        )}
      </div>

      {/* --- MODAL LAYOUT OVERLAYS --- */}

      {/* Modal 1: Create Tenant Space */}
      {showTenantModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(8px)" }}>
          <div className="glass animate-fade-in" style={{ padding: "2.5rem", borderRadius: "20px", border: "1px solid var(--border)", width: "100%", maxWidth: "450px" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>Onboard New Space</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Configure wallet setups for a new tenant organization.</p>
            <form onSubmit={handleCreateTenant}>
              <div className="form-group">
                <label className="label">Organization Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Decentracom Inc."
                  value={newTenantName}
                  onChange={(e) => {
                    setNewTenantName(e.target.value);
                    setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                  }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="label">Subdomain Slug</label>
                <input type="text" className="input" placeholder="e.g. decentracom" value={newTenantSlug} onChange={(e) => setNewTenantSlug(e.target.value)} required />
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" onClick={() => setShowTenantModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Event */}
      {showEventModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(8px)" }}>
          <div className="glass animate-fade-in" style={{ padding: "2.5rem", borderRadius: "20px", border: "1px solid var(--border)", width: "100%", maxWidth: "500px" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>Publish New Event</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>List a new event under your active tenant space.</p>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label className="label">Event Title</label>
                <input type="text" className="input" placeholder="e.g. Stellar Hackathon" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea className="textarea" placeholder="Detailed event summary..." value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} style={{ minHeight: "80px" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div className="form-group">
                  <label className="label">Starts</label>
                  <input type="datetime-local" className="input" value={eventStart} onChange={(e) => setEventStart(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Capacity</label>
                  <input type="number" className="input" value={eventCap} onChange={(e) => setEventCap(Number(e.target.value))} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" onClick={() => setShowEventModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Deploy Ticket Tier */}
      {showTicketModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(8px)" }}>
          <div className="glass animate-fade-in" style={{ padding: "2.5rem", borderRadius: "20px", border: "1px solid var(--border)", width: "100%", maxWidth: "450px" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>Deploy Ticket Class</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Create a custom Stellar asset and lock supply limits.</p>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div className="form-group">
                  <label className="label">Price (USDC Cents)</label>
                  <input type="number" className="input" value={ticketPrice} onChange={(e) => setTicketPrice(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="label">Quantity</label>
                  <input type="number" className="input" value={ticketQty} onChange={(e) => setTicketQty(Number(e.target.value))} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" onClick={() => setShowTicketModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Deploying Asset..." : "Deploy Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Add Speaker */}
      {showSpeakerModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(8px)" }}>
          <div className="glass animate-fade-in" style={{ padding: "2.5rem", borderRadius: "20px", border: "1px solid var(--border)", width: "100%", maxWidth: "450px" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>Add Speaker Profile</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Create speaker directory entry for your event.</p>
            <form onSubmit={handleAddSpeaker}>
              <div className="form-group">
                <label className="label">Speaker Name</label>
                <input type="text" className="input" placeholder="e.g. Jed McCaleb" value={speakerName} onChange={(e) => setSpeakerName(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="label">Short Biography</label>
                <textarea className="textarea" placeholder="Short bio..." value={speakerBio} onChange={(e) => setSpeakerBio(e.target.value)} style={{ minHeight: "80px" }} />
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" onClick={() => setShowSpeakerModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Add Session */}
      {showSessionModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(8px)" }}>
          <div className="glass animate-fade-in" style={{ padding: "2.5rem", borderRadius: "20px", border: "1px solid var(--border)", width: "100%", maxWidth: "450px" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>Schedule Session</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Map session itineraries and tracks for attendees.</p>
            <form onSubmit={handleAddSession}>
              <div className="form-group">
                <label className="label">Session Title</label>
                <input type="text" className="input" placeholder="e.g. Smart Contracts Deploy" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <input type="text" className="input" placeholder="Short schedule description" value={sessionDesc} onChange={(e) => setSessionDesc(e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div className="form-group">
                  <label className="label">Start Time</label>
                  <input type="datetime-local" className="input" value={sessionStart} onChange={(e) => setSessionStart(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">End Time</label>
                  <input type="datetime-local" className="input" value={sessionEnd} onChange={(e) => setSessionEnd(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" onClick={() => setShowSessionModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
