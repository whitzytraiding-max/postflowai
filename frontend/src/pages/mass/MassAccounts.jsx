import { useState } from "react";

const C = "#FFB800";
const DIM = "#64748B";

const MOCK_ACCOUNTS = [];

export default function MassAccounts() {
  const [showAdd, setShowAdd] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [form, setForm] = useState({ platform: "instagram", username: "", sessionId: "", proxy: "" });
  const [bulkText, setBulkText] = useState("");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#E2E8F0", margin: 0 }}>Mass Accounts</h1>
          <p style={{ color: DIM, marginTop: "4px", fontSize: "14px" }}>
            Manage 10–100 posting accounts. Import in bulk or add individually.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => { setBulkMode(true); setShowAdd(true); }}
            style={{
              padding: "8px 18px",
              background: "transparent",
              border: `1px solid ${C}50`,
              borderRadius: "8px",
              color: C,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📋 Bulk Import
          </button>
          <button
            onClick={() => { setBulkMode(false); setShowAdd(true); }}
            style={{
              padding: "8px 18px",
              background: C,
              border: "none",
              borderRadius: "8px",
              color: "#0B0B18",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Add Account
          </button>
        </div>
      </div>

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
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#E2E8F0", marginBottom: "16px" }}>
            {bulkMode ? "Bulk Import Accounts" : "Add Account"}
          </div>

          {bulkMode ? (
            <div>
              <label style={labelStyle}>
                One account per line: <code style={{ color: C, background: "#0B0B18", padding: "1px 6px", borderRadius: "4px", fontSize: "11px" }}>platform|username|sessionid|proxy</code>
              </label>
              <textarea
                rows={8}
                placeholder={"instagram|@account1|sessionid_value|us.iproyal.com:12321:user:pass\ninstagram|@account2|sessionid_value2|us.iproyal.com:12322:user2:pass2"}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  lineHeight: 1.6,
                }}
              />
              <div style={{ fontSize: "11px", color: DIM, marginTop: "6px" }}>
                proxy field is optional — leave blank to share IP (not recommended at scale)
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Platform</label>
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} style={inputStyle}>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Username</label>
                <input placeholder="@username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Session ID</label>
                <input placeholder="sessionid cookie value" value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value })} style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px" }} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Proxy <span style={{ color: DIM }}>(host:port:user:pass)</span></label>
                <input placeholder="us.iproyal.com:12321:user:pass" value={form.proxy} onChange={(e) => setForm({ ...form, proxy: e.target.value })} style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px" }} />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              style={{ padding: "8px 20px", background: C, border: "none", borderRadius: "8px", color: "#0B0B18", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >
              {bulkMode ? "Import All" : "Add Account"}
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

      {MOCK_ACCOUNTS.length === 0 ? (
        <div
          style={{
            background: "#14142A",
            border: "1px dashed #1E1E35",
            borderRadius: "12px",
            padding: "48px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>👥</div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "#E2E8F0", marginBottom: "6px" }}>No accounts yet</div>
          <div style={{ fontSize: "14px", color: DIM, marginBottom: "20px" }}>
            Add accounts individually or use bulk import for 10+ at once.
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              onClick={() => { setBulkMode(false); setShowAdd(true); }}
              style={{ padding: "10px 24px", background: C, border: "none", borderRadius: "8px", color: "#0B0B18", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
            >
              + Add Account
            </button>
            <button
              onClick={() => { setBulkMode(true); setShowAdd(true); }}
              style={{ padding: "10px 24px", background: "transparent", border: `1px solid ${C}50`, borderRadius: "8px", color: C, fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
            >
              📋 Bulk Import
            </button>
          </div>
        </div>
      ) : null}
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
};
