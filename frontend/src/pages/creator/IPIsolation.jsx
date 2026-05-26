import { useState } from "react";

const C = "#7C3AED";
const DIM = "#64748B";

const PROVIDERS = [
  { name: "IPRoyal", url: "iproyal.com", price: "$3–5/mo", type: "Sticky Residential", flag: "🌍" },
  { name: "Smartproxy", url: "smartproxy.com", price: "$5–7/mo", type: "Residential Rotating", flag: "🌍" },
  { name: "Bright Data", url: "brightdata.com", price: "$6–10/mo", type: "Residential / ISP", flag: "🌍" },
];

const MOCK_PROXIES = [
  { id: 1, host: "us.iproyal.com", port: "12321", location: "🇺🇸 New York, US", type: "Residential", assignedTo: "@my_travel_page", status: "online" },
];

export default function IPIsolation() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ host: "", port: "", user: "", pass: "", location: "" });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#E2E8F0", margin: 0 }}>IP Isolation</h1>
          <p style={{ color: DIM, marginTop: "4px", fontSize: "14px" }}>
            One dedicated residential IP per account. Instagram and YouTube can't link them.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            padding: "8px 18px",
            background: C,
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Add Proxy
        </button>
      </div>

      {/* Why this matters */}
      <div
        style={{
          background: `${C}10`,
          border: `1px solid ${C}30`,
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          gap: "14px",
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: "24px" }}>🛡️</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#C4B5FD", marginBottom: "4px" }}>Why isolation matters</div>
          <div style={{ fontSize: "13px", color: DIM, lineHeight: 1.6 }}>
            Posting multiple accounts from the same IP lets platforms detect and ban them together. A dedicated residential proxy per account makes each one look like a unique person on their own device from a real home address. This is what Dolphin Anty does for browsers — PostFlow does it at the API level.
          </div>
        </div>
      </div>

      {/* Add proxy form */}
      {showAdd && (
        <div
          style={{
            background: "#14142A",
            border: `1px solid ${C}40`,
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#E2E8F0", marginBottom: "16px" }}>Add Proxy</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Host</label>
              <input placeholder="us.iproyal.com" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Port</label>
              <input placeholder="12321" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Username</label>
              <input placeholder="proxy_user" value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" placeholder="••••••••" value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Location label (optional)</label>
              <input placeholder="🇺🇸 New York, US" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              style={{ padding: "8px 20px", background: C, border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              Test & Save
            </button>
            <button
              onClick={() => setShowAdd(false)}
              style={{ padding: "8px 20px", background: "transparent", border: "1px solid #1E1E35", borderRadius: "8px", color: DIM, fontSize: "13px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Proxy list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
        {MOCK_PROXIES.map((proxy) => (
          <ProxyCard key={proxy.id} proxy={proxy} />
        ))}
      </div>

      {/* Recommended providers */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
          Recommended Providers
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {PROVIDERS.map((p) => (
            <div
              key={p.name}
              style={{
                background: "#14142A",
                border: "1px solid #1E1E35",
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#E2E8F0", marginBottom: "4px" }}>{p.name}</div>
              <div style={{ fontSize: "12px", color: DIM, marginBottom: "8px" }}>{p.type}</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#10B981" }}>{p.price}</div>
              <div style={{ fontSize: "11px", color: DIM, marginTop: "2px" }}>per sticky residential IP</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProxyCard({ proxy }) {
  return (
    <div
      style={{
        background: "#14142A",
        border: "1px solid #1E1E35",
        borderRadius: "12px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div style={{ fontSize: "28px" }}>🌐</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#E2E8F0" }}>{proxy.host}:{proxy.port}</div>
        <div style={{ fontSize: "12px", color: DIM, marginTop: "2px" }}>{proxy.location} · {proxy.type}</div>
      </div>
      <div style={{ fontSize: "13px", color: "#64748B" }}>
        Assigned to <span style={{ color: "#C4B5FD", fontWeight: 600 }}>{proxy.assignedTo}</span>
      </div>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "#10B981",
          background: "#10B98120",
          padding: "3px 8px",
          borderRadius: "5px",
        }}
      >
        ● {proxy.status}
      </span>
      <button
        style={{
          background: "transparent",
          border: "1px solid #1E1E35",
          borderRadius: "6px",
          color: DIM,
          fontSize: "12px",
          padding: "6px 12px",
          cursor: "pointer",
        }}
      >
        Test
      </button>
    </div>
  );
}

const labelStyle = { fontSize: "12px", color: DIM, display: "block", marginBottom: "6px" };
const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  background: "#0B0B18",
  border: "1px solid #1E1E35",
  borderRadius: "8px",
  color: "#E2E8F0",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "monospace",
};
