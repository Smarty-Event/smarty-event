"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "../config";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !tenantName || !tenantSlug) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, tenantName, tenantSlug }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      localStorage.setItem("smarty_auth_token", data.access_token);
      localStorage.setItem("smarty_user", JSON.stringify(data.user));

      window.dispatchEvent(new Event("storage"));
      router.push("/tenant");
    } catch (err: unknown) {
      console.error("Register failed:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred during registration.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: "500px", paddingTop: "2rem", paddingBottom: "5rem" }}>
      <div className="glass" style={{ padding: "2.5rem", borderRadius: "20px", border: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: "800", marginBottom: "0.5rem", letterSpacing: "-0.03em", textAlign: "center" }}>
          Create Organizer Account
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", marginBottom: "2rem" }}>
          Onboard your organization and create derived Stellar ticket wallets.
        </p>

        {errorMsg && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "var(--error)",
            padding: "0.75rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            fontSize: "0.85rem"
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="label">Full Name</label>
            <input
              type="text"
              className="input"
              placeholder="Alice Johnson"
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
              placeholder="alice@stellar.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "1.5rem 0" }} />

          <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>Organization Information</h4>

          <div className="form-group">
            <label className="label">Organization / Tenant Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Decentracom Inc."
              value={tenantName}
              onChange={(e) => {
                setTenantName(e.target.value);
                setTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
              }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <label className="label">Subdomain Slug</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. decentracom"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", height: "45px" }} disabled={loading}>
            {loading ? "Registering & Creating Wallets..." : "Sign Up & Register Space"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "2rem" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--primary)", fontWeight: "500", textDecoration: "underline" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
