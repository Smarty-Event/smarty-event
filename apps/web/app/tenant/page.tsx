"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { API_BASE_URL } from "../config";

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
  avatar?: string;
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
  banner?: string;
  category?: string;
  ticketTypes: TicketType[];
  speakers: Speaker[];
  sessions: Session[];
}

interface Metrics {
  name: string;
  slug: string;
  eventsCount: number;
  totalCapacity: number;
  totalSold: number;
  checkedInCount: number;
  stellarPublicKey: string;
  stellarIssuerPublicKey: string;
}

interface UserProfile {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  tenantName: string;
}

export default function OrganizerPortal() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Modals Visibility
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Create Tenant State
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantSlug, setNewTenantSlug] = useState("");

  // Create Event State
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventStart, setEventStart] = useState("2026-09-12T09:00");
  const [eventEnd, setEventEnd] = useState("2026-09-13T17:00");
  const [eventCap, setEventCap] = useState(200);
  const [eventBanner, setEventBanner] = useState("");
  const [eventCategory, setEventCategory] = useState("Technology");

  // Edit Event State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editEventDesc, setEditEventDesc] = useState("");
  const [editEventStart, setEditEventStart] = useState("2026-09-12T09:00");
  const [editEventEnd, setEditEventEnd] = useState("2026-09-13T17:00");
  const [editEventCap, setEditEventCap] = useState(200);
  const [editEventBanner, setEditEventBanner] = useState("");
  const [editEventCategory, setEditEventCategory] = useState("Technology");

  // Create Ticket Type State
  const [selectedEventId, setSelectedEventId] = useState("");
  const [ticketName, setTicketName] = useState("General Admission");
  const [ticketPrice, setTicketPrice] = useState(2000); // 20.00 USDC
  const [ticketQty, setTicketQty] = useState(100);

  // Create Speaker State
  const [speakerName, setSpeakerName] = useState("");
  const [speakerBio, setSpeakerBio] = useState("");
  const [speakerAvatar, setSpeakerAvatar] = useState("");
  const [uploadingSpeakerAvatar, setUploadingSpeakerAvatar] = useState(false);

  // Create Session State
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDesc, setSessionDesc] = useState("");
  const [sessionStart, setSessionStart] = useState("2026-09-12T10:00");
  const [sessionEnd, setSessionEnd] = useState("2026-09-12T11:00");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  const loadMockTenants = useCallback(() => {
    const mock = JSON.parse(localStorage.getItem("mock_tenants") || "[]");
    setTenants(mock);
    if (mock.length > 0 && !activeTenant) {
      setActiveTenant(mock[0]);
    }
  }, [activeTenant]);

  const loadTenants = useCallback(() => {
    fetch(`${API_BASE_URL}/api/tenants`)
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
  }, [activeTenant, loadMockTenants]);

  const setMockMetrics = useCallback((tenantId: string) => {
    const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]") as (Event & { tenantId: string })[];
    const tenantEvts = localEvents.filter((e) => e.tenantId === tenantId);
    
    const localTickets = JSON.parse(localStorage.getItem("mock_tickets") || "[]") as { status: string; ticketType: { event: { id: string } } }[];
    const tenantTkts = localTickets.filter((t) => t.ticketType.event.id && tenantEvts.some((e) => e.id === t.ticketType.event.id));

    const checkIns = tenantTkts.filter((t) => t.status === "CHECKED_IN").length;

    setMetrics({
      name: activeTenant?.name || "Mock Tenant",
      slug: activeTenant?.slug || "mock",
      eventsCount: tenantEvts.length,
      totalCapacity: tenantEvts.reduce((acc: number, e) => acc + e.capacity, 0),
      totalSold: tenantTkts.length,
      checkedInCount: checkIns,
      stellarPublicKey: activeTenant?.stellarPublicKey || "GDX7...MOCK_DISTRIBUTOR_KEY",
      stellarIssuerPublicKey: "GAY2...MOCK_ISSUER_KEY",
    });
  }, [activeTenant]);

  const setMockEvents = useCallback((tenantId: string) => {
    const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]") as (Event & { tenantId: string })[];
    const filtered = localEvents.filter((e) => e.tenantId === tenantId);
    setEvents(filtered);
  }, []);

  const loadTenantData = useCallback((tenantId: string) => {
    setLoading(true);
    // Fetch metrics
    fetch(`${API_BASE_URL}/api/tenants/${tenantId}/metrics`)
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
    fetch(`${API_BASE_URL}/api/events?tenantId=${tenantId}`)
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
  }, [setMockMetrics, setMockEvents]);

  useEffect(() => {
    setMounted(true);
    loadTenants();
    const storedUser = localStorage.getItem("smarty_user");
    if (storedUser) {
      try {
        setUserProfile(JSON.parse(storedUser));
      } catch {
        setUserProfile(null);
      }
    }
  }, [loadTenants]);

  useEffect(() => {
    if (activeTenant) {
      loadTenantData(activeTenant.id);
    }
  }, [activeTenant, loadTenantData]);

  useEffect(() => {
    const isAnyModalOpen = showTenantModal || showEventModal || showEditEventModal || showTicketModal || showSpeakerModal || showSessionModal || showDeleteConfirmModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showTenantModal, showEventModal, showEditEventModal, showTicketModal, showSpeakerModal, showSessionModal, showDeleteConfirmModal]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantSlug) return;
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/tenants`, {
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
    } catch {
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
      banner: eventBanner || undefined,
      category: eventCategory,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/events?tenantId=${activeTenant.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create event");

      loadTenantData(activeTenant.id);
      setEventTitle("");
      setEventDesc("");
      setEventBanner("");
      setEventCategory("Technology");
      setShowEventModal(false);
      setMessage("Event published successfully!");
    } catch {
      console.warn("API offline, simulating Event creation locally.");
      const mockNewEvent: Event = {
        id: `mock-event-${Math.random().toString(36).substr(2, 9)}`,
        title: eventTitle,
        description: eventDesc,
        startDate: eventStart,
        endDate: eventEnd,
        capacity: Number(eventCap),
        banner: eventBanner || undefined,
        category: eventCategory,
        ticketTypes: [],
        speakers: [],
        sessions: [],
      };
      const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]") as (Event & { tenantId: string })[];
      localEvents.push({ ...mockNewEvent, tenantId: activeTenant.id });
      localStorage.setItem("mock_events", JSON.stringify(localEvents));
      
      loadTenantData(activeTenant.id);
      setEventTitle("");
      setEventDesc("");
      setEventBanner("");
      setEventCategory("Technology");
      setShowEventModal(false);
      setMessage("Simulation Event created locally!");
    } finally {
      setSubmitting(false);
    }
  };

  const triggerEditEventModal = (event: Event) => {
    setEditingEventId(event.id);
    setEditEventTitle(event.title);
    setEditEventDesc(event.description || "");
    const formatDateTime = (dateStr: string) => {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    setEditEventStart(formatDateTime(event.startDate));
    setEditEventEnd(formatDateTime(event.endDate));
    setEditEventCap(event.capacity);
    setEditEventBanner(event.banner || "");
    setEditEventCategory(event.category || "Technology");
    setShowEditEventModal(true);
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventId || !editEventTitle) return;
    setSubmitting(true);
    setMessage("");

    const payload = {
      title: editEventTitle,
      description: editEventDesc,
      startDate: new Date(editEventStart).toISOString(),
      endDate: new Date(editEventEnd).toISOString(),
      capacity: Number(editEventCap),
      banner: editEventBanner || undefined,
      category: editEventCategory,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/events/${editingEventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update event");

      loadTenantData(activeTenant!.id);
      setShowEditEventModal(false);
      setEditingEventId(null);
      setMessage("Event updated successfully!");
    } catch {
      console.warn("API offline, simulating Event edit locally.");
      const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]") as (Event & { tenantId: string })[];
      const idx = localEvents.findIndex((e) => e.id === editingEventId);
      if (idx !== -1) {
        localEvents[idx] = {
          ...localEvents[idx]!,
          title: editEventTitle,
          description: editEventDesc,
          startDate: editEventStart,
          endDate: editEventEnd,
          capacity: Number(editEventCap),
          banner: editEventBanner || undefined,
          category: editEventCategory,
        };
        localStorage.setItem("mock_events", JSON.stringify(localEvents));
      }

      loadTenantData(activeTenant!.id);
      setShowEditEventModal(false);
      setEditingEventId(null);
      setMessage("Simulation Event updated locally!");
    } finally {
      setSubmitting(false);
    }
  };

  const triggerDeleteConfirmModal = (eventId: string) => {
    setDeletingEventId(eventId);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteEvent = async () => {
    if (!deletingEventId) return;
    const eventId = deletingEventId;
    setShowDeleteConfirmModal(false);
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete event");
      }

      loadTenantData(activeTenant!.id);
      setMessage("Event deleted successfully!");
    } catch {
      console.warn("API offline, simulating Event deletion locally.");
      const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]") as (Event & { tenantId: string })[];
      const filtered = localEvents.filter((e) => e.id !== eventId);
      localStorage.setItem("mock_events", JSON.stringify(filtered));

      loadTenantData(activeTenant!.id);
      setMessage("Simulation Event deleted locally!");
    } finally {
      setLoading(false);
      setDeletingEventId(null);
    }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingFile(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/events/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to upload image");
      }

      setEditEventBanner(data.url);
      setMessage("Image uploaded successfully!");
    } catch (err) {
      console.warn("Upload failed, simulating local asset path:", err);
      setEditEventBanner("https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80");
      setMessage("Simulation upload completed locally!");
    } finally {
      setUploadingFile(false);
    }
  };

  const [uploadingFile, setUploadingFile] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingFile(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/events/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to upload image");
      }

      setEventBanner(data.url);
      setMessage("Image uploaded successfully!");
    } catch (err) {
      console.warn("Upload failed, simulating local asset path:", err);
      setEventBanner("https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80");
      setMessage("Simulation upload completed locally!");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSpeakerAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingSpeakerAvatar(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/events/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to upload image");
      }

      setSpeakerAvatar(data.url);
      setMessage("Image uploaded successfully!");
    } catch (err) {
      console.warn("Upload failed, simulating local asset path:", err);
      setSpeakerAvatar("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80");
      setMessage("Simulation upload completed locally!");
    } finally {
      setUploadingSpeakerAvatar(false);
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
      const response = await fetch(`${API_BASE_URL}/api/events/${selectedEventId}/ticket-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create ticket class");

      loadTenantData(activeTenant!.id);
      setShowTicketModal(false);
      setMessage("Stellar ticket asset created and limits locked on Testnet!");
    } catch {
      console.warn("API offline, simulating Stellar trustlines & asset setup locally.");
      
      // Simulate adding ticket type to mock event in localStorage
      const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]") as (Event & { tenantId: string })[];
      const eventIdx = localEvents.findIndex((e) => e.id === selectedEventId);
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
        if (!localEvents[eventIdx]!.ticketTypes) localEvents[eventIdx]!.ticketTypes = [];
        localEvents[eventIdx]!.ticketTypes.push(mockTicket);
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
      const response = await fetch(`${API_BASE_URL}/api/events/${selectedEventId}/speakers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: speakerName, bio: speakerBio, avatar: speakerAvatar }),
      });
      if (!response.ok) throw new Error("Failed to add speaker");

      loadTenantData(activeTenant!.id);
      setShowSpeakerModal(false);
      setSpeakerName("");
      setSpeakerBio("");
      setSpeakerAvatar("");
      setMessage("Speaker profile added!");
    } catch {
      // Offline fallback
      const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]") as (Event & { tenantId: string })[];
      const idx = localEvents.findIndex((e) => e.id === selectedEventId);
      if (idx !== -1) {
        if (!localEvents[idx]!.speakers) localEvents[idx]!.speakers = [];
        localEvents[idx]!.speakers.push({
          id: `mock-spk-${Math.random().toString(36).substr(2, 9)}`,
          name: speakerName,
          bio: speakerBio,
          avatar: speakerAvatar,
        });
        localStorage.setItem("mock_events", JSON.stringify(localEvents));
      }
      loadTenantData(activeTenant!.id);
      setShowSpeakerModal(false);
      setSpeakerName("");
      setSpeakerBio("");
      setSpeakerAvatar("");
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
      const response = await fetch(`${API_BASE_URL}/api/events/${selectedEventId}/sessions`, {
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
      const localEvents = JSON.parse(localStorage.getItem("mock_events") || "[]") as (Event & { tenantId: string })[];
      const idx = localEvents.findIndex((e) => e.id === selectedEventId);
      if (idx !== -1) {
        if (!localEvents[idx]!.sessions) localEvents[idx]!.sessions = [];
        localEvents[idx]!.sessions.push({
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
            
            {/* Top row widgets (Profile, Wallets, and Metrics) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
              {/* Profile Card */}
              <div className="glass" style={{ padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: "1rem", alignSelf: "flex-start" }}>Organization Profile</span>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "0.5rem", color: "#ffffff" }}>
                    {activeTenant?.name || "Mock Tenant Space"}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    <strong>Slug:</strong> <span style={{ color: "#ffffff" }}>{activeTenant?.slug || "mock"}</span>
                  </p>
                  {userProfile && (
                    <>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                        <strong>Admin User:</strong> <span style={{ color: "#ffffff", wordBreak: "break-all" }}>{userProfile.email}</span>
                      </p>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                        <strong>Role:</strong> <span className="badge badge-info" style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)" }}>{userProfile.role || "OWNER"}</span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Wallet info */}
              <div className="glass" style={{ padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <span className="badge badge-info" style={{ marginBottom: "1rem", alignSelf: "flex-start" }}>Stellar Testnet Accounts</span>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", wordBreak: "break-all", marginBottom: "0.75rem" }}>
                    <strong>Distributor Public Key (Asset Vault):</strong> <br/>
                    <span style={{ color: "#ffffff", fontFamily: "monospace", fontSize: "0.75rem" }}>{metrics.stellarPublicKey}</span>
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
                    <strong>Issuer Public Key (Mint Authority):</strong> <br/>
                    <span style={{ color: "#ffffff", fontFamily: "monospace", fontSize: "0.75rem" }}>{metrics.stellarIssuerPublicKey}</span>
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateRows: "repeat(3, 1fr)", gap: "0.75rem" }}>
                <div className="card animate-fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.25rem", minHeight: "unset", flexDirection: "row" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Events Published</span>
                  <span style={{ fontSize: "1.5rem", fontWeight: "800" }}>{metrics.eventsCount}</span>
                </div>
                <div className="card animate-fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.25rem", minHeight: "unset", flexDirection: "row" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Tickets Sold</span>
                  <span style={{ fontSize: "1.5rem", fontWeight: "800" }}>{metrics.totalSold}</span>
                </div>
                <div className="card animate-fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.25rem", minHeight: "unset", flexDirection: "row" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Attended at Gate</span>
                  <span style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--success)" }}>{metrics.checkedInCount}</span>
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
                  No active event listings found. Click &quot;Publish New Event&quot; to get started!
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
                          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                            <button onClick={() => triggerCreateTicketModal(evt.id)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", borderRadius: "8px" }}>
                              + Add Ticket Asset
                            </button>
                            <button onClick={() => triggerAddSpeakerModal(evt.id)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", borderRadius: "8px" }}>
                              + Add Speaker
                            </button>
                            <button onClick={() => triggerAddSessionModal(evt.id)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", borderRadius: "8px" }}>
                              + Schedule Session
                            </button>
                            <button onClick={() => triggerEditEventModal(evt)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", borderRadius: "8px", background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", color: "var(--primary)" }}>
                              Edit
                            </button>
                            <button onClick={() => triggerDeleteConfirmModal(evt.id)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444" }}>
                              Delete
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
      {mounted && showTenantModal && createPortal(
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
        </div>,
        document.body
      )}

      {/* Drawer: Create Event */}
      {mounted && showEventModal && createPortal(
        <div 
          onClick={() => setShowEventModal(false)}
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: "rgba(0,0,0,0.6)", 
            zIndex: 1000, 
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass animate-slide-in-right" 
            style={{ 
              padding: "2.5rem", 
              borderLeft: "1px solid var(--border)", 
              borderTop: "none",
              borderBottom: "none",
              borderRight: "none",
              borderRadius: "0px",
              width: "100%", 
              maxWidth: "500px",
              height: "100vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "800" }}>Publish New Event</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>List a new event under your active tenant space.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowEventModal(false)} 
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  padding: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", flexGrow: 1 }}>
              <div className="form-group">
                <label className="label">Event Title</label>
                <input type="text" className="input" placeholder="e.g. Stellar Hackathon" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea className="textarea" placeholder="Detailed event summary..." value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} />
              </div>
              
              {/* Start & End Dates Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="label">Starts</label>
                  <input type="datetime-local" className="input" value={eventStart} onChange={(e) => setEventStart(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label">Ends</label>
                  <input type="datetime-local" className="input" value={eventEnd} onChange={(e) => setEventEnd(e.target.value)} required />
                </div>
              </div>

              {/* Capacity & Category Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="label">Capacity</label>
                  <input type="number" className="input" value={eventCap} onChange={(e) => setEventCap(Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="label">Category</label>
                  <select className="select" value={eventCategory} onChange={(e) => setEventCategory(e.target.value)}>
                    <option value="Technology">Technology</option>
                    <option value="Music">Music</option>
                    <option value="Conference">Conference</option>
                  </select>
                </div>
              </div>

              {/* Banner Upload Row */}
              <div className="form-group">
                <label className="label">Banner Image</label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="URL (e.g. https://...) or upload..." 
                    value={eventBanner} 
                    onChange={(e) => setEventBanner(e.target.value)} 
                    style={{ flex: 1 }}
                  />
                  <label className="btn btn-secondary" style={{ padding: "0.55rem 1rem", fontSize: "0.85rem", cursor: "pointer", display: "inline-block", margin: 0 }}>
                    {uploadingFile ? "Uploading..." : "Upload File"}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                
                {eventBanner && (
                  <div style={{ 
                    marginTop: "0.75rem", 
                    borderRadius: "10px", 
                    overflow: "hidden", 
                    border: "1px solid var(--border)",
                    position: "relative",
                    height: "140px"
                  }}>
                    <Image 
                      src={eventBanner} 
                      alt="Banner Preview" 
                      fill
                      unoptimized
                      style={{ objectFit: "cover" }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setEventBanner("")} 
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(0,0,0,0.6)",
                        border: "none",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "auto", paddingTop: "1.5rem" }}>
                <button type="button" onClick={() => setShowEventModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Publishing..." : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Drawer 2.5: Edit Event */}
      {mounted && showEditEventModal && createPortal(
        <div 
          onClick={() => { setShowEditEventModal(false); setEditingEventId(null); }}
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: "rgba(0,0,0,0.6)", 
            zIndex: 1000, 
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass animate-slide-in-right" 
            style={{ 
              padding: "2.5rem", 
              borderLeft: "1px solid var(--border)", 
              borderTop: "none",
              borderBottom: "none",
              borderRight: "none",
              borderRadius: "0px",
              width: "100%", 
              maxWidth: "500px",
              height: "100vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "800" }}>Edit Event</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>Modify details of your published event.</p>
              </div>
              <button 
                type="button"
                onClick={() => { setShowEditEventModal(false); setEditingEventId(null); }} 
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  padding: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditEvent} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", flexGrow: 1 }}>
              <div className="form-group">
                <label className="label">Event Title</label>
                <input type="text" className="input" placeholder="e.g. Stellar Hackathon" value={editEventTitle} onChange={(e) => setEditEventTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea className="textarea" placeholder="Detailed event summary..." value={editEventDesc} onChange={(e) => setEditEventDesc(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} />
              </div>
              
              {/* Start & End Dates Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="label">Starts</label>
                  <input type="datetime-local" className="input" value={editEventStart} onChange={(e) => setEditEventStart(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label">Ends</label>
                  <input type="datetime-local" className="input" value={editEventEnd} onChange={(e) => setEditEventEnd(e.target.value)} required />
                </div>
              </div>

              {/* Capacity & Category Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="label">Capacity</label>
                  <input type="number" className="input" value={editEventCap} onChange={(e) => setEditEventCap(Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="label">Category</label>
                  <select className="select" value={editEventCategory} onChange={(e) => setEditEventCategory(e.target.value)}>
                    <option value="Technology">Technology</option>
                    <option value="Music">Music</option>
                    <option value="Conference">Conference</option>
                  </select>
                </div>
              </div>

              {/* Banner Upload Row */}
              <div className="form-group">
                <label className="label">Banner Image</label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="URL (e.g. https://...) or upload..." 
                    value={editEventBanner} 
                    onChange={(e) => setEditEventBanner(e.target.value)} 
                    style={{ flex: 1 }}
                  />
                  <label className="btn btn-secondary" style={{ padding: "0.55rem 1rem", fontSize: "0.85rem", cursor: "pointer", display: "inline-block", margin: 0 }}>
                    {uploadingFile ? "Uploading..." : "Upload File"}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleEditImageUpload} 
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                {editEventBanner && (
                  <div style={{ 
                    marginTop: "0.75rem", 
                    borderRadius: "10px", 
                    overflow: "hidden", 
                    border: "1px solid var(--border)",
                    position: "relative",
                    height: "140px"
                  }}>
                    <Image 
                      src={editEventBanner} 
                      alt="Banner Preview" 
                      fill
                      unoptimized
                      style={{ objectFit: "cover" }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setEditEventBanner("")} 
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(0,0,0,0.6)",
                        border: "none",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "auto", paddingTop: "1.5rem" }}>
                <button type="button" onClick={() => { setShowEditEventModal(false); setEditingEventId(null); }} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 3: Deploy Ticket Tier */}
      {mounted && showTicketModal && createPortal(
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
        </div>,
        document.body
      )}

      {/* Modal 4: Add Speaker */}
      {mounted && showSpeakerModal && createPortal(
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(8px)" }}>
          <div className="glass animate-fade-in" style={{ padding: "2.5rem", borderRadius: "20px", border: "1px solid var(--border)", width: "100%", maxWidth: "450px" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>Add Speaker Profile</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Create speaker directory entry for your event.</p>
            <form onSubmit={handleAddSpeaker}>
              <div className="form-group">
                <label className="label">Speaker Name</label>
                <input type="text" className="input" placeholder="e.g. Jed McCaleb" value={speakerName} onChange={(e) => setSpeakerName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">Short Biography</label>
                <textarea className="textarea" placeholder="Short bio..." value={speakerBio} onChange={(e) => setSpeakerBio(e.target.value)} style={{ minHeight: "80px" }} />
              </div>
              {/* Speaker Avatar Upload Row */}
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="label">Avatar Image</label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="URL or upload file..." 
                    value={speakerAvatar} 
                    onChange={(e) => setSpeakerAvatar(e.target.value)} 
                    style={{ flex: 1 }}
                  />
                  <label className="btn btn-secondary" style={{ padding: "0.55rem 1rem", fontSize: "0.85rem", cursor: "pointer", display: "inline-block", margin: 0 }}>
                    {uploadingSpeakerAvatar ? "Uploading..." : "Upload File"}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleSpeakerAvatarUpload} 
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                
                {speakerAvatar && (
                  <div style={{ 
                    marginTop: "0.75rem", 
                    borderRadius: "10px", 
                    overflow: "hidden", 
                    border: "1px solid var(--border)",
                    position: "relative",
                    height: "100px"
                  }}>
                    <Image 
                      src={speakerAvatar} 
                      alt="Speaker Avatar Preview" 
                      fill
                      unoptimized
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setSpeakerAvatar("")} 
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(0,0,0,0.6)",
                        border: "none",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" onClick={() => setShowSpeakerModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 5: Add Session */}
      {mounted && showSessionModal && createPortal(
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
              <div className="form-group">
                <label className="label">Start Time</label>
                <input type="datetime-local" className="input" value={sessionStart} onChange={(e) => setSessionStart(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="label">End Time</label>
                <input type="datetime-local" className="input" value={sessionEnd} onChange={(e) => setSessionEnd(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" onClick={() => setShowSessionModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 6: Delete Event Confirmation */}
      {mounted && showDeleteConfirmModal && createPortal(
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(8px)" }}>
          <div className="card animate-fade-in" style={{ maxWidth: "450px", width: "90%", padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "700" }}>Delete Event</h3>
            </div>
            
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.5" }}>
              Are you sure you want to delete this event? This will also remove all associated tickets and check-in records. This action cannot be undone.
            </p>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button 
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setDeletingEventId(null);
                }} 
                className="btn btn-secondary" 
                style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteEvent} 
                className="btn" 
                style={{ background: "#ef4444", color: "#ffffff", padding: "0.6rem 1.2rem", fontSize: "0.9rem", display: "inline-flex", gap: "0.5rem" }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
