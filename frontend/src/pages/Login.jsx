import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";

const COLORS = {
  BG: "#0B0B18", CARD: "#14142A", PRIMARY: "#00D4FF",
  SECONDARY: "#7C3AED", TEXT: "#E2E8F0", MUTED: "#64748B",
  ERROR: "#EF4444", BORDER: "#1E1E35",
};

export default function Login() {
  const { login } = useAuth();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/auth/login" : "/auth/register";
      const { data } = await api.post(endpoint, { email, password });
      login(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.BG, display: "flex",
      alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "32px", fontWeight: 800, color: COLORS.PRIMARY, letterSpacing: "-1px" }}>
            PostFlow AI
          </div>
          <div style={{ color: COLORS.MUTED, marginTop: "6px", fontSize: "14px" }}>
            Autonomous social media posting
          </div>
        </div>

        <div style={{ background: COLORS.CARD, borderRadius: "16px", padding: "32px", border: `1px solid ${COLORS.BORDER}` }}>
          {/* Tabs */}
          <div style={{ display: "flex", marginBottom: "28px", background: COLORS.BG, borderRadius: "8px", padding: "4px" }}>
            {["login", "register"].map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                style={{
                  flex: 1, padding: "8px", border: "none", borderRadius: "6px", cursor: "pointer",
                  fontWeight: 600, fontSize: "13px", textTransform: "capitalize",
                  background: tab === t ? COLORS.PRIMARY : "transparent",
                  color: tab === t ? COLORS.BG : COLORS.MUTED,
                  transition: "all 0.15s",
                }}>
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", color: COLORS.MUTED, marginBottom: "6px" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                style={{
                  width: "100%", background: COLORS.BG, border: `1px solid ${COLORS.BORDER}`,
                  borderRadius: "8px", padding: "11px 14px", color: COLORS.TEXT, fontSize: "14px",
                  outline: "none", boxSizing: "border-box",
                }} />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", color: COLORS.MUTED, marginBottom: "6px" }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder={tab === "register" ? "At least 8 characters" : "••••••••"}
                style={{
                  width: "100%", background: COLORS.BG, border: `1px solid ${COLORS.BORDER}`,
                  borderRadius: "8px", padding: "11px 14px", color: COLORS.TEXT, fontSize: "14px",
                  outline: "none", boxSizing: "border-box",
                }} />
            </div>

            {error && (
              <div style={{ background: COLORS.ERROR + "22", color: COLORS.ERROR, borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: "100%", background: loading ? COLORS.MUTED : COLORS.PRIMARY,
                color: COLORS.BG, border: "none", borderRadius: "8px", padding: "12px",
                fontWeight: 700, fontSize: "15px", cursor: loading ? "not-allowed" : "pointer",
              }}>
              {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
