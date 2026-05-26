import { useState } from "react";

const C = "#7C3AED";
const DIM = "#64748B";

const MOCK_ACCOUNTS = [
  {
    id: 1,
    username: "@my_travel_page",
    platform: "instagram",
    proxy: "us.iproyal.com:12321:user1:pass1",
    proxyLocation: "🇺🇸 US Residential",
    fingerprint: "enabled",
    status: "active",
  },
];

export default function CreatorAccounts() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ platform: "instagram", username: "", sessionId: "", proxy: "" });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#E2E8F0", margin: 0 }}>Creator Accounts</h1>
          <p style={{ color: DIM, marginTop: "4px", fontSize: "14px" }}>
            Each account gets its own dedicated proxy IP — platform can't link them.
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
          + Add Account
        </button>
      </div>

      {/* Add form */}
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
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#E2E8F0", marginBottom: "16px" }}>New Creator Account</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", color: DIM, display: "block", marginBottom: "6px" }}>Platform</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                style={inputStyle}
              >
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", color: DIM, display: "block", marginBottom: "6px" }}>Username</label>
              <input
                placeholder="@username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: "12px", color: DIM, display: "block", marginBottom: "6px" }}>Session ID / OAuth Credentials</label>
              <input
                placeholder={form.platform === "instagram" ? "Instagram sessionid cookie value" : "Paste YouTube OAuth JSON"}
                value={form.sessionId}
                onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
                style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px" }}
              />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: "12px", color: DIM, display: "block", marginBottom: "4px" }}>
                Dedicated Proxy <span style={{ color: "#64748B" }}>(optional — host:port:user:pass)</span>
              </label>
              <input
                placeholder="us.iproyal.com:12321:username:password"
                value={form.proxy}
                onChange={(e) => setForm({ ...form, proxy: e.target.value })}
                style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px" }}
              />
              <div style={{ fontSize: "11px", color: DIM, marginTop: "4px" }}>
                Providers: IPRoyal · Smartproxy · Bright Data (~$3–7/mo per sticky residential IP)
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              style={{
                padding: "8px 20px",
                background: C,
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Connect Account
            </button>
            <button
              onClick={() => setShowAdd(false)}
              style={{
                padding: "8px 20px",
                background: "transparent",
                border: "1px solid #1E1E35",
                borderRadius: "8px",
                color: DIM,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Account list */}
      {MOCK_ACCOUNTS.length === 0 ? (
        <EmptyState onAdd={() => setShowAdd(true)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {MOCK_ACCOUNTS.map((acct) => (
            <AccountCard key={acct.id} acct={acct} />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountCard({ acct }) {
  return (
    <div
      style={{
        background: "#14142A",
        border: "1px solid #1E1E35",
        borderRadius: "12px",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "#0B0B18",
          border: "1px solid #1E1E35",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          flexShrink: 0,
        }}
      >
        {acct.platform === "instagram" ? "📸" : "▶️"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#E2E8F0" }}>{acct.username}</div>
        <div style={{ fontSize: "12px", color: DIM, marginTop: "3px" }}>{acct.platform}</div>
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <Tag color="#10B981" label={acct.proxyLocation} />
        <Tag color={C} label={`🛡️ Fingerprint ${acct.fingerprint}`} />
        <Tag color="#10B981" label="● active" />
      </div>
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
        Edit
      </button>
    </div>
  );
}

function Tag({ color, label }) {
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        padding: "3px 8px",
        borderRadius: "5px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div
      style={{
        background: "#14142A",
        border: "1px dashed #1E1E35",
        borderRadius: "12px",
        padding: "48px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>👤</div>
      <div style={{ fontSize: "16px", fontWeight: 600, color: "#E2E8F0", marginBottom: "6px" }}>No accounts yet</div>
      <div style={{ fontSize: "14px", color: DIM, marginBottom: "20px" }}>Add your first creator account with a dedicated proxy.</div>
      <button
        onClick={onAdd}
        style={{
          padding: "10px 24px",
          background: C,
          border: "none",
          borderRadius: "8px",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        + Add Account
      </button>
    </div>
  );
}

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
};
