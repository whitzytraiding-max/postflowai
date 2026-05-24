import { useEffect, useState } from "react";
import { getProxies, getProxyStats, bulkAddProxies, deleteProxy, releaseProxy } from "../lib/api";

const C = {
  BG: "#0B0B18", CARD: "#14142A", SURFACE: "#10101C",
  PRIMARY: "#00D4FF", SECONDARY: "#7C3AED", GOLD: "#FFB800",
  TEXT: "#E2E8F0", MUTED: "#64748B",
  SUCCESS: "#10B981", ERROR: "#EF4444", BORDER: "#1E1E35",
};

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 999,
      background: type === "error" ? C.ERROR : C.SUCCESS,
      color: "#fff", padding: "12px 20px", borderRadius: "8px",
      fontWeight: 600, fontSize: "14px", boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    }}>
      {msg}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: C.CARD, border: `1px solid ${C.BORDER}`, borderRadius: "12px",
      padding: "20px 24px", flex: 1, textAlign: "center",
    }}>
      <div style={{ fontSize: "32px", fontWeight: 800, color: color || C.TEXT }}>{value}</div>
      <div style={{ fontSize: "13px", color: C.MUTED, marginTop: "4px" }}>{label}</div>
    </div>
  );
}

function maskProxy(url) {
  try {
    const u = new URL(url);
    const pass = u.password ? "••••••" : "";
    return `${u.protocol}//${u.username ? u.username + ":" + pass + "@" : ""}${u.hostname}:${u.port}`;
  } catch {
    return url.slice(0, 30) + "...";
  }
}

export default function Admin() {
  const [stats, setStats] = useState({ total: 0, assigned: 0, available: 0, banned: 0 });
  const [proxies, setProxies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkText, setBulkText] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([getProxyStats(), getProxies()]);
      setStats(s);
      setProxies(p);
    } catch {
      showToast("Failed to load proxies", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleAdd() {
    if (!bulkText.trim()) return;
    setAdding(true);
    try {
      const res = await bulkAddProxies({ proxy_urls: bulkText, label: label || undefined });
      showToast(`Added ${res.added} proxies${res.skipped ? `, ${res.skipped} duplicates skipped` : ""}`);
      setBulkText("");
      setLabel("");
      await loadAll();
    } catch {
      showToast("Failed to add proxies", "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this proxy? If assigned, the account will lose its proxy.")) return;
    try {
      await deleteProxy(id);
      showToast("Proxy deleted");
      await loadAll();
    } catch {
      showToast("Failed to delete", "error");
    }
  }

  async function handleRelease(id) {
    try {
      await releaseProxy(id);
      showToast("Proxy released back to pool");
      await loadAll();
    } catch {
      showToast("Failed to release", "error");
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Proxy Pool</h1>
        <p style={{ color: C.MUTED, marginTop: "4px", fontSize: "14px" }}>
          Manage residential proxies — auto-assigned to accounts on connect
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
        <StatCard label="Total Proxies" value={stats.total} color={C.TEXT} />
        <StatCard label="Assigned" value={stats.assigned} color={C.SECONDARY} />
        <StatCard label="Available" value={stats.available} color={C.SUCCESS} />
        <StatCard label="Banned IPs" value={stats.banned} color={C.ERROR} />
      </div>

      {/* Add proxies */}
      <div style={{ background: C.CARD, border: `1px solid ${C.BORDER}`, borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: C.TEXT }}>
          Add Proxies
        </h2>
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "13px", color: C.MUTED, marginBottom: "6px" }}>
            Proxy URLs — one per line
          </label>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"http://user:pass@host:port\nhttp://user:pass@host:port\n..."}
            rows={6}
            style={{
              width: "100%", background: C.BG, border: `1px solid ${C.BORDER}`,
              borderRadius: "8px", padding: "10px 14px", color: C.TEXT,
              fontSize: "13px", fontFamily: "monospace", resize: "vertical",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "13px", color: C.MUTED, marginBottom: "6px" }}>
              Label (optional)
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. IPRoyal batch 1"
              style={{
                width: "100%", background: C.BG, border: `1px solid ${C.BORDER}`,
                borderRadius: "8px", padding: "10px 14px", color: C.TEXT,
                fontSize: "14px", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !bulkText.trim()}
            style={{
              background: adding || !bulkText.trim() ? C.MUTED : C.PRIMARY,
              color: C.BG, border: "none", borderRadius: "8px",
              padding: "10px 28px", fontWeight: 700, fontSize: "14px",
              cursor: adding || !bulkText.trim() ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {adding ? "Adding..." : "Add Proxies"}
          </button>
        </div>
        <p style={{ fontSize: "11px", color: C.MUTED, marginTop: "10px" }}>
          Proxies are auto-assigned to the next account that connects — clients never see the URL.
          Format: <code style={{ color: C.PRIMARY }}>http://user:pass@host:port</code>
        </p>
      </div>

      {/* Proxy list */}
      <div style={{ background: C.CARD, border: `1px solid ${C.BORDER}`, borderRadius: "12px", padding: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: C.TEXT }}>
          All Proxies ({proxies.length})
        </h2>
        {loading ? (
          <div style={{ color: C.MUTED, padding: "24px 0", textAlign: "center" }}>Loading...</div>
        ) : proxies.length === 0 ? (
          <div style={{
            color: C.MUTED, fontSize: "14px", textAlign: "center", padding: "40px",
            background: C.BG, borderRadius: "8px", border: `1px dashed ${C.BORDER}`,
          }}>
            No proxies yet. Paste proxy URLs above to get started.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr auto",
              gap: "12px", padding: "8px 12px",
              fontSize: "11px", fontWeight: 700, color: C.MUTED, textTransform: "uppercase",
            }}>
              <span>Proxy</span>
              <span>Assigned To</span>
              <span>Label</span>
              <span>Actions</span>
            </div>
            {proxies.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr auto",
                  gap: "12px", alignItems: "center",
                  padding: "12px", background: C.BG,
                  borderRadius: "8px",
                  border: `1px solid ${!p.is_active ? C.ERROR : C.BORDER}`,
                  opacity: p.is_active ? 1 : 0.7,
                }}
              >
                <span style={{ fontSize: "12px", fontFamily: "monospace", color: p.is_active ? C.TEXT : C.MUTED }}>
                  {maskProxy(p.proxy_url)}
                  {!p.is_active && (
                    <span style={{
                      marginLeft: "8px", background: C.ERROR + "22", color: C.ERROR,
                      padding: "2px 7px", borderRadius: "20px", fontSize: "10px", fontWeight: 700,
                    }}>
                      BANNED IP
                    </span>
                  )}
                </span>
                <span style={{ fontSize: "13px" }}>
                  {!p.is_active ? (
                    <span style={{ color: C.ERROR, fontWeight: 600 }}>Blacklisted</span>
                  ) : p.assigned_account_name ? (
                    <span style={{ color: C.SECONDARY, fontWeight: 600 }}>{p.assigned_account_name}</span>
                  ) : (
                    <span style={{ color: C.SUCCESS }}>Available</span>
                  )}
                </span>
                <span style={{ fontSize: "12px", color: C.MUTED }}>{p.label || "—"}</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {p.is_active && p.assigned_account_id && (
                    <button
                      onClick={() => handleRelease(p.id)}
                      style={{
                        background: C.GOLD + "22", color: C.GOLD,
                        border: `1px solid ${C.GOLD}`, borderRadius: "6px",
                        padding: "5px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Release
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{
                      background: C.ERROR + "22", color: C.ERROR,
                      border: `1px solid ${C.ERROR}`, borderRadius: "6px",
                      padding: "5px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
