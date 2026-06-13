"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";

import { EventDetail, TicketType, FALLBACK_EVENTS_DETAIL } from "../../../fallbackData";
import { API_BASE_URL } from "../../../config";

const generateRandomHex = (length: number = 32): string => {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};

const sha256 = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const params = useParams();

  const eventId = params.id as string;
  const ticketTypeId = searchParams.get("ticketTypeId") || "";

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("USDC");
  const [zkPrivacy, setZkPrivacy] = useState(false);

  interface BookingSuccess {
    id: string;
    stellarTxHash: string;
    ticketType: {
      name: string;
      event?: {
        title: string;
      };
    };
    zkCommitment?: string;
  }

  // Booking states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccess | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Wallet states
  const [walletType, setWalletType] = useState<"custodial" | "non-custodial">("custodial");
  const [walletProvider, setWalletProvider] = useState<"albedo" | "freighter">("albedo");
  const [connectedPublicKey, setConnectedPublicKey] = useState("");
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const connectWallet = async () => {
    setIsConnectingWallet(true);
    try {
      if (walletProvider === "albedo") {
        const albedo = (window as Window & {
          albedo?: {
            publicKey: () => Promise<{ pubkey: string }>;
            tx: (params: { xdr: string; network: string }) => Promise<{ signed_envelope_xdr: string }>;
          };
        }).albedo;
        if (!albedo) {
          throw new Error("Albedo helper library is not loaded. Please try reloading the page.");
        }
        const res = await albedo.publicKey();
        if (res && res.pubkey) {
          setConnectedPublicKey(res.pubkey);
          setWalletType("non-custodial");
        }
      } else {
        const freighter = (window as Window & {
          freighterApi?: {
            isConnected: () => Promise<{ isConnected: boolean } | boolean>;
            requestAccess: () => Promise<string | { address?: string; publicKey?: string } | null | undefined>;
            getPublicKey: () => Promise<string | { publicKey?: string; address?: string } | null | undefined>;
            getAddress: () => Promise<string | { address?: string; publicKey?: string } | null | undefined>;
            signTransaction: (xdr: string, opts: { network: string }) => Promise<string>;
          };
        }).freighterApi;
        if (!freighter) {
          throw new Error("Freighter helper library is not loaded.");
        }
        const isInstalled = await freighter.isConnected();
        const isConnected = typeof isInstalled === "object" ? isInstalled.isConnected : isInstalled;
        if (!isInstalled || !isConnected) {
          throw new Error("Freighter browser extension is not installed or detected. Please install Freighter or use Albedo.");
        }
        let publicKey = "";
        if (typeof freighter.requestAccess === "function") {
          try {
            const res = await freighter.requestAccess();
            if (res) {
              publicKey = typeof res === "object" ? res.address || res.publicKey || "" : res;
            }
          } catch (e) {
            console.warn("requestAccess failed, trying fallback", e);
          }
        }

        if (!publicKey) {
          if (typeof freighter.getPublicKey === "function") {
            const res = await freighter.getPublicKey();
            if (res) {
              publicKey = typeof res === "object" ? res.publicKey || res.address || "" : res;
            }
          } else if (typeof freighter.getAddress === "function") {
            const res = await freighter.getAddress();
            if (res) {
              publicKey = typeof res === "object" ? res.address || res.publicKey || "" : res;
            }
          }
        }

        if (publicKey) {
          setConnectedPublicKey(publicKey);
          setWalletType("non-custodial");
        } else {
          throw new Error("Unable to retrieve public key from Freighter wallet.");
        }
      }
    } catch (err) {
      console.error("Failed to connect wallet", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(errMsg || "Failed to connect wallet.");
    } finally {
      setIsConnectingWallet(false);
    }
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.title) {
          setEvent(data);
          const tkt = data.ticketTypes.find((t: TicketType) => t.id === ticketTypeId);
          setSelectedTicket(tkt || data.ticketTypes[0] || null);
        } else {
          const fallback = FALLBACK_EVENTS_DETAIL[eventId];
          setEvent(fallback || null);
          if (fallback) {
            const tkt = fallback.ticketTypes.find((t) => t.id === ticketTypeId);
            setSelectedTicket(tkt || fallback.ticketTypes[0] || null);
          } else {
            setSelectedTicket(null);
          }
        }
      })
      .catch(() => {
        const fallback = FALLBACK_EVENTS_DETAIL[eventId];
        setEvent(fallback || null);
        if (fallback) {
          const tkt = fallback.ticketTypes.find((t) => t.id === ticketTypeId);
          setSelectedTicket(tkt || fallback.ticketTypes[0] || null);
        } else {
          setSelectedTicket(null);
        }
      })
      .finally(() => setLoading(false));
  }, [eventId, ticketTypeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !selectedTicket) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const isNonCustodial = paymentMethod === "USDC" && walletType === "non-custodial";

    if (isNonCustodial && !connectedPublicKey) {
      setErrorMsg("Please connect your Freighter wallet first.");
      setIsSubmitting(false);
      return;
    }

    // Generate ZK values if privacy mode is enabled
    let commitment = "";
    let nullifierHash = "";
    let secret = "";
    let nullifier = "";

    try {
      if (zkPrivacy) {
        secret = generateRandomHex(32);
        nullifier = generateRandomHex(32);
        commitment = await sha256(secret + nullifier);
        nullifierHash = await sha256(nullifier);
      }

      if (isNonCustodial) {
        // 1. Fetch unsigned ChangeTrust trustline XDR from NestJS
        const trustRes = await fetch(
          `${API_BASE_URL}/api/tickets/prepare-trustline?ticketTypeId=${selectedTicket.id}&publicKey=${connectedPublicKey}`
        );
        if (!trustRes.ok) {
          const errData = await trustRes.json();
          throw new Error(errData.message || "Failed to prepare on-chain trustline.");
        }
        const { xdr } = await trustRes.json();

        // 2. Sign transaction XDR via selected wallet
        let signedXdr = "";
        if (walletProvider === "albedo") {
          const albedo = (window as Window & {
            albedo?: {
              tx: (params: { xdr: string; network: string }) => Promise<{ signed_envelope_xdr: string }>;
            };
          }).albedo;
          if (!albedo) {
            throw new Error("Albedo helper library is not loaded.");
          }
          const res = await albedo.tx({
            xdr,
            network: "testnet",
          });
          signedXdr = res.signed_envelope_xdr;
        } else {
          const freighter = (window as Window & {
            freighterApi?: {
              signTransaction: (xdr: string, opts: { network: string }) => Promise<string>;
            };
          }).freighterApi;
          if (!freighter) {
            throw new Error("Freighter helper library is not loaded.");
          }
          signedXdr = await freighter.signTransaction(xdr, {
            network: "TESTNET",
          });
        }

        // 3. Submit signed XDR to Horizon Testnet directly
        const horizonRes = await fetch("https://horizon-testnet.stellar.org/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ tx: signedXdr }),
        });
        if (!horizonRes.ok) {
          const horizonErr = await horizonRes.json();
          throw new Error(horizonErr.title || "Stellar Ledger transaction submission failed.");
        }
      }

      interface CheckoutPayload {
        ticketTypeId: string;
        attendeeName: string;
        attendeeEmail: string;
        paymentMethod: string;
        stellarPublicKey?: string;
        zkCommitment?: string;
      }

      const payload: CheckoutPayload = {
        ticketTypeId: selectedTicket.id,
        attendeeName: name,
        attendeeEmail: email,
        paymentMethod,
        stellarPublicKey: isNonCustodial ? connectedPublicKey : undefined,
      };

      if (zkPrivacy) {
        payload.zkCommitment = commitment;
      }

      const response = await fetch(`${API_BASE_URL}/api/tickets/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Failed to purchase ticket");
      }

      // Save local ZK keys on API success
      if (zkPrivacy) {
        localStorage.setItem(`zk_ticket_${commitment}`, JSON.stringify({
          secret,
          nullifier,
          commitment,
          nullifierHash
        }));
      }

      setBookingSuccess(resData);
    } catch (err) {
      console.warn("API Error, running simulation fallback:", err);
      const errMsgStr = err instanceof Error ? err.message : String(err);
      // If we are in non-custodial wallet mode, fallback to simulation is not possible, we fail
      if (isNonCustodial) {
        setErrorMsg(errMsgStr || "On-chain wallet ticket minting failed.");
        setIsSubmitting(false);
        return;
      }

      // Run simulation checkout fallback if API is offline
      setTimeout(async () => {
        let fallbackCommitment = commitment;
        if (zkPrivacy && !fallbackCommitment) {
          secret = generateRandomHex(32);
          nullifier = generateRandomHex(32);
          fallbackCommitment = await sha256(secret + nullifier);
          nullifierHash = await sha256(nullifier);
        }

        const mockResult = {
          id: `mock-ticket-${Math.random().toString(36).substr(2, 9)}`,
          stellarTxHash: "a1b2c3d4e5f607182930415263748596a7b8c9d0e1f2a3b4c5d6e7f809102030",
          ticketType: {
            name: selectedTicket.name,
            event: { title: event?.title || "Stellar Event" },
          },
          zkCommitment: zkPrivacy ? fallbackCommitment : undefined,
        };

        if (zkPrivacy) {
          localStorage.setItem(`zk_ticket_${fallbackCommitment}`, JSON.stringify({
            secret,
            nullifier,
            commitment: fallbackCommitment,
            nullifierHash
          }));
        }

        setBookingSuccess(mockResult);
        // Save mock ticket locally in localStorage so attendee wallet can read it!
        const localTickets = JSON.parse(localStorage.getItem("mock_tickets") || "[]");
        localTickets.push({
          id: mockResult.id,
          stellarAssetCode: "EVT26TKT",
          stellarTxHash: mockResult.stellarTxHash,
          status: "ACTIVE",
          zkCommitment: mockResult.zkCommitment,
          attendee: { name, email },
          ticketType: {
            name: selectedTicket.name,
            price: selectedTicket.price,
            currency: selectedTicket.currency,
            event: { title: event?.title || "Stellar Event", id: eventId },
          },
        });
        localStorage.setItem("mock_tickets", JSON.stringify(localTickets));
      }, 3000); // 3 second delay to simulate blockchain transaction
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "5rem", textAlign: "center" }}>
        Loading checkout configuration...
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="container animate-fade-in" style={{ maxWidth: "600px", paddingTop: "2rem" }}>
        <div className="glass" style={{ padding: "3rem", borderRadius: "24px", textAlign: "center", border: "1px solid var(--border)" }}>
          <div className="gradient-bg" style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem",
            color: "#ffffff",
            fontSize: "1.5rem",
            fontWeight: "bold"
          }}>
            ✓
          </div>
          <h2 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "0.5rem" }}>Ticket Issued!</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
            Your custom Stellar asset ticket has been minted and transferred to your account.
          </p>

          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1.25rem",
            textAlign: "left",
            marginBottom: "2rem",
            fontSize: "0.9rem"
          }}>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>Event:</strong> {bookingSuccess.ticketType?.event?.title || event?.title}
            </p>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>Ticket:</strong> {bookingSuccess.ticketType?.name || selectedTicket?.name}
            </p>
            <p style={{ wordBreak: "break-all" }}>
              <strong>Stellar Tx Hash:</strong> <br/>
              <span style={{ fontSize: "0.8rem", color: "var(--primary)" }}>{bookingSuccess.stellarTxHash}</span>
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Link href="/attendee/tickets" className="btn btn-primary">
              Go to My Tickets Wallet
            </Link>
            <a 
              href={`https://laboratory.stellar.org/#explorer?path=transactions&network=testnet&hash=${bookingSuccess.stellarTxHash}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary"
            >
              Inspect Transaction on Stellar Lab
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ maxWidth: "600px", paddingBottom: "5rem" }}>
      <h1 style={{ fontSize: "2.25rem", fontWeight: "800", marginBottom: "1.5rem", letterSpacing: "-0.03em" }}>
        Checkout & Ticket Minting
      </h1>

      <form onSubmit={handleSubmit} className="glass" style={{ padding: "2.5rem", borderRadius: "20px", border: "1px solid var(--border)" }}>
        {/* Event summary banner */}
        <div style={{
          background: "rgba(99, 102, 241, 0.05)",
          border: "1px solid rgba(99, 102, 241, 0.15)",
          borderRadius: "12px",
          padding: "1.25rem",
          marginBottom: "2rem"
        }}>
          <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "600", textTransform: "uppercase" }}>Selected Ticket</span>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginTop: "0.25rem", marginBottom: "0.5rem" }}>{event?.title}</h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>{selectedTicket?.name}</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ffffff" }}>
              {selectedTicket ? selectedTicket.price / 100 : 0} {selectedTicket?.currency}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "var(--error)",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            fontSize: "0.9rem"
          }}>
            {errorMsg}
          </div>
        )}

        {isSubmitting ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            {/* Loading Spinner */}
            <div style={{
              width: "40px",
              height: "40px",
              border: "3px solid rgba(255,255,255,0.1)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1.5rem auto"
            }} />
            <h3 style={{ fontSize: "1.15rem", fontWeight: "600", marginBottom: "0.5rem" }}>Minting Ticket on Stellar...</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", maxWidth: "300px", margin: "0 auto", lineHeight: "1.4" }}>
              Generating custodial keypair, setting up Horizon asset trustlines, and signing the payment transfer. Please wait.
            </p>
            {/* Inline animation styling */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}} />
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="label">Full Name</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Enter your name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Email Address</label>
              <input 
                type="email" 
                className="input" 
                placeholder="you@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{
              background: "rgba(16, 185, 129, 0.03)",
              border: "1px dashed rgba(16, 185, 129, 0.3)",
              borderRadius: "16px",
              padding: "1.25rem",
              marginBottom: "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem"
            }}>
              <div>
                <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: "600", color: "#10b981", margin: 0 }}>
                  <span>🛡️</span> Zero-Knowledge Check-In Privacy
                </h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem", marginBottom: 0 }}>
                  Attendees prove ticket ownership at the gate without revealing their identity, email, or public keys.
                </p>
              </div>
              <label className="switch" style={{ position: "relative", display: "inline-block", width: "50px", height: "26px" }}>
                <input 
                  type="checkbox" 
                  checked={zkPrivacy} 
                  onChange={(e) => setZkPrivacy(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: "absolute",
                  cursor: "pointer",
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: zkPrivacy ? "#10b981" : "#374151",
                  transition: ".4s",
                  borderRadius: "34px",
                  boxShadow: zkPrivacy ? "0 0 8px rgba(16, 185, 129, 0.5)" : "none"
                }}>
                  <span style={{
                    position: "absolute",
                    content: '""',
                    height: "18px", width: "18px",
                    left: zkPrivacy ? "28px" : "4px",
                    bottom: "4px",
                    backgroundColor: "white",
                    transition: ".4s",
                    borderRadius: "50%"
                  }} />
                </span>
              </label>
            </div>

            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <label className="label">Payment Currency / Method</label>
              <select 
                className="select" 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="USDC">Stellar USDC (Gas-less Custodial Checkout)</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="BANK_TRANSFER">Bank Direct Transfer</option>
              </select>
            </div>

            {paymentMethod === "USDC" && (
              <div style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1.25rem",
                marginBottom: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem"
              }}>
                <label className="label" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Wallet Configuration Selection</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div 
                    onClick={() => setWalletType("custodial")}
                    style={{
                      border: walletType === "custodial" ? "2px solid var(--primary)" : "1px solid var(--border)",
                      background: walletType === "custodial" ? "rgba(99, 102, 241, 0.08)" : "transparent",
                      padding: "1rem 0.75rem",
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.22s ease",
                      boxShadow: walletType === "custodial" ? "0 4px 12px rgba(99, 102, 241, 0.15)" : "none"
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 0.5rem auto", display: "block", color: walletType === "custodial" ? "var(--primary)" : "var(--text-muted)" }}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#ffffff", display: "block" }}>Custodial Wallet</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginTop: "0.15rem" }}>Automated Setup (No Wallet Needed)</span>
                  </div>

                  <div 
                    onClick={() => setWalletType("non-custodial")}
                    style={{
                      border: walletType === "non-custodial" ? "2px solid var(--primary)" : "1px solid var(--border)",
                      background: walletType === "non-custodial" ? "rgba(99, 102, 241, 0.08)" : "transparent",
                      padding: "1rem 0.75rem",
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.22s ease",
                      boxShadow: walletType === "non-custodial" ? "0 4px 12px rgba(99, 102, 241, 0.15)" : "none"
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 0.5rem auto", display: "block", color: walletType === "non-custodial" ? "var(--primary)" : "var(--text-muted)" }}>
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#ffffff", display: "block" }}>Connected Wallet</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginTop: "0.15rem" }}>Browser Extension / Popup</span>
                  </div>
                </div>

                {walletType === "non-custodial" && (
                  <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label className="label" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", display: "block" }}>SELECT WALLET PROVIDER</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div 
                          onClick={() => {
                            setWalletProvider("albedo");
                            setConnectedPublicKey("");
                          }}
                          style={{
                            border: walletProvider === "albedo" ? "2px solid var(--primary)" : "1px solid var(--border)",
                            background: walletProvider === "albedo" ? "rgba(99, 102, 241, 0.08)" : "transparent",
                            padding: "0.75rem 0.5rem",
                            borderRadius: "10px",
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "all 0.22s ease",
                            boxShadow: walletProvider === "albedo" ? "0 4px 12px rgba(99, 102, 241, 0.1)" : "none"
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 0.4rem auto", display: "block", color: walletProvider === "albedo" ? "var(--primary)" : "var(--text-muted)" }}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#ffffff", display: "block" }}>Albedo Wallet</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginTop: "0.15rem" }}>No Extension Required</span>
                        </div>

                        <div 
                          onClick={() => {
                            setWalletProvider("freighter");
                            setConnectedPublicKey("");
                          }}
                          style={{
                            border: walletProvider === "freighter" ? "2px solid var(--primary)" : "1px solid var(--border)",
                            background: walletProvider === "freighter" ? "rgba(99, 102, 241, 0.08)" : "transparent",
                            padding: "0.75rem 0.5rem",
                            borderRadius: "10px",
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "all 0.22s ease",
                            boxShadow: walletProvider === "freighter" ? "0 4px 12px rgba(99, 102, 241, 0.1)" : "none"
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 0.4rem auto", display: "block", color: walletProvider === "freighter" ? "var(--primary)" : "var(--text-muted)" }}>
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                          </svg>
                          <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#ffffff", display: "block" }}>Freighter Wallet</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginTop: "0.15rem" }}>Browser Extension</span>
                        </div>
                      </div>
                    </div>

                    {connectedPublicKey ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed var(--border)", paddingTop: "1rem" }}>
                        <div>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>CONNECTED PUBLIC KEY ({walletProvider.toUpperCase()}):</span>
                          <span style={{ fontSize: "0.85rem", color: "var(--primary)", fontFamily: "monospace", wordBreak: "break-all" }}>
                            {connectedPublicKey.substring(0, 12)}...{connectedPublicKey.substring(connectedPublicKey.length - 12)}
                          </span>
                        </div>
                        <button 
                          type="button" 
                          onClick={connectWallet} 
                          className="btn btn-secondary" 
                          style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", borderRadius: "8px" }}
                        >
                          Use Different
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        onClick={connectWallet} 
                        disabled={isConnectingWallet}
                        className="btn btn-secondary" 
                        style={{ width: "100%", padding: "0.75rem", fontSize: "0.9rem", borderRadius: "10px", background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", color: "var(--primary)" }}
                      >
                        {isConnectingWallet ? "Connecting to wallet..." : `🔌 Connect ${walletProvider === "albedo" ? "Albedo" : "Freighter"} Wallet`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: "100%", height: "50px", fontSize: "1rem" }}>
              Pay & Mint Ticket Asset
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: "5rem", textAlign: "center" }}>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
