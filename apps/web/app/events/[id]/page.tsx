"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { EventDetail, FALLBACK_EVENTS_DETAIL } from "../../fallbackData";
import { API_BASE_URL } from "../../config";

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/events/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.title) {
          // If the JSON response has benefits, parse it if it is a string
          setEvent(data);
        } else {
          setEvent(FALLBACK_EVENTS_DETAIL[id] || null);
        }
      })
      .catch(() => {
        setEvent(FALLBACK_EVENTS_DETAIL[id] || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="container" style={{ padding: "5rem", textAlign: "center" }}>Loading event details...</div>;
  }

  if (!event) {
    return (
      <div className="container" style={{ padding: "5rem", textAlign: "center" }}>
        <h2>Event Not Found</h2>
        <p style={{ margin: "1rem 0", color: "var(--text-muted)" }}>We couldn't locate the event with ID "{id}".</p>
        <Link href="/" className="btn btn-primary">Back to Discover</Link>
      </div>
    );
  }

  const startDate = new Date(event.startDate).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <main className="container animate-fade-in" style={{ paddingBottom: "5rem" }}>
      {/* Banner */}
      <div style={{
        width: "100%",
        height: "350px",
        borderRadius: "24px",
        overflow: "hidden",
        position: "relative",
        marginBottom: "3rem",
        border: "1px solid var(--border)"
      }}>
        <img 
          src={event.banner || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80"} 
          alt={event.title} 
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(to top, rgba(9, 11, 14, 0.95) 20%, transparent 100%)",
          padding: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div>
            <span className="badge badge-info" style={{ marginBottom: "0.5rem" }}>{event.category}</span>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "800", letterSpacing: "-0.03em" }}>{event.title}</h1>
            <p style={{ color: "var(--primary)", fontWeight: "500", marginTop: "0.5rem" }}>{startDate}</p>
          </div>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "3rem",
        alignItems: "start"
      }}>
        {/* Left Column (Info, Agenda, Speakers) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem" }}>About Event</h2>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.7", fontSize: "1.05rem" }}>{event.description}</p>
          </div>

          {/* Agenda/Sessions */}
          {event.sessions && event.sessions.length > 0 && (
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem" }}>Event Agenda</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {event.sessions.map((sess) => {
                  const sTime = new Date(sess.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                  const eTime = new Date(sess.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

                  return (
                    <div key={sess.id} className="glass" style={{ padding: "1.25rem", borderRadius: "12px", display: "flex", gap: "1.5rem" }}>
                      <div style={{ minWidth: "100px", color: "var(--primary)", fontWeight: "600", fontSize: "0.95rem" }}>
                        {sTime} - {eTime}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: "600", fontSize: "1.1rem", marginBottom: "0.25rem" }}>{sess.title}</h4>
                        {sess.description && <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.4" }}>{sess.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Speakers */}
          {event.speakers && event.speakers.length > 0 && (
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem" }}>Featured Speakers</h2>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "1.5rem"
              }}>
                {event.speakers.map((spk) => (
                  <div key={spk.id} className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <img 
                      src={spk.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                      alt={spk.name}
                      style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", marginBottom: "1rem", border: "2px solid var(--border)" }}
                    />
                    <h4 style={{ fontWeight: "600", fontSize: "1.1rem", marginBottom: "0.5rem" }}>{spk.name}</h4>
                    {spk.bio && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: "1.4" }}>{spk.bio}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Tickets Booking) */}
        <div>
          <div className="glass" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)", position: "sticky", top: "100px" }}>
            <h3 style={{ fontSize: "1.35rem", fontWeight: "700", marginBottom: "1.5rem" }}>Available Tickets</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {event.ticketTypes && event.ticketTypes.length > 0 ? (
                event.ticketTypes.map((tkt) => {
                  let parsedBenefits: string[] = [];
                  try {
                    parsedBenefits = typeof tkt.benefits === "string" ? JSON.parse(tkt.benefits) : (tkt.benefits || []);
                  } catch (e) {
                    parsedBenefits = [];
                  }

                  const isSoldOut = tkt.sold >= tkt.quantity;

                  return (
                    <div key={tkt.id} style={{
                      padding: "1.25rem",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h4 style={{ fontWeight: "600", fontSize: "1.05rem" }}>{tkt.name}</h4>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {tkt.quantity - tkt.sold} of {tkt.quantity} remaining
                          </span>
                        </div>
                        <span style={{ fontWeight: "700", fontSize: "1.15rem", color: "#ffffff" }}>
                          {tkt.price / 100} {tkt.currency}
                        </span>
                      </div>

                      {/* Benefits list */}
                      {parsedBenefits.length > 0 && (
                        <ul style={{ paddingLeft: "1.25rem", fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {parsedBenefits.map((b, idx) => (
                            <li key={idx}>{b}</li>
                          ))}
                        </ul>
                      )}

                      {/* Booking link */}
                      {isSoldOut ? (
                        <button className="btn" disabled style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", cursor: "not-allowed", width: "100%", padding: "0.5rem" }}>
                          Sold Out
                        </button>
                      ) : (
                        <Link 
                          href={`/events/${event.id}/checkout?ticketTypeId=${tkt.id}`}
                          className="btn btn-primary" 
                          style={{ width: "100%", padding: "0.6rem", fontSize: "0.9rem" }}
                        >
                          Book Now
                        </Link>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>
                  No tickets configured yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
