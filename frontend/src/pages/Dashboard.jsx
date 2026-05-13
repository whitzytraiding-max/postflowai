import { useEffect, useState } from "react";
import { getSources, getQueue, runDiscovery } from "../lib/api";

const COLORS = {
  BG: "#0B0B18",
  SURFACE: "#10101C",
  CARD: "#14142A",
  PRIMARY: "#00D4FF",
  SECONDARY: "#7C3AED",
  GOLD: "#FFB800",
  TEXT: "#E2E8F0",
  MUTED: "#64748B",
  SUCCESS: "#10B981",
  ERROR: "#EF4444",
};

const STATUS_COLORS = {
  pending: "#FFB800",
  downloading: "#7C3AED",
  ready: "#00D4FF",
  posting: "#7C3AED",
  posted: "#10B981",
  failed: "#EF4444",
};

function formatViews(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        background: COLORS.CARD,
        borderRadius: "12px",
        borderTop: `3px solid ${color || COLORS.PRIMARY}`,
        padding: "20px 24px",
        flex: 1,
        minWidth: "150px",
      }}
    >
      <div style={{ fontSize: "32px", fontWeight: 700, color: color || COLORS.PRIMARY }}>
        {value}
      </div>
      <div style={{ fontSize: "13px", color: COLORS.MUTED, marginTop: "4px" }}>{label}</div>
    </div>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: type === "error" ? COLORS.ERROR : COLORS.SUCCESS,
        color: "#fff",
        padding: "12px 20px",
        borderRadius: "8px",
        fontWeight: 600,
        fontSize: "14px",
        zIndex: 999,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      {msg}
    </div>
  );
}

export default function Dashboard({ userId }) {
  const [sources, setSources] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([getSources(userId), getQueue(userId)])
      .then(([s, q]) => {
        setSources(s);
        setQueue(q);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleRunDiscovery() {
    setDiscovering(true);
    try {
      const result = await runDiscovery(userId);
      showToast(`Discovery complete! Found ${result.discovered} new video(s).`);
      const q = await getQueue(userId);
      setQueue(q);
    } catch (e) {
      showToast("Discovery failed. Is the backend running?", "error");
    } finally {
      setDiscovering(false);
    }
  }

  const activeSources = sources.filter((s) => s.is_active).length;
  const postedVideos = queue.filter((v) => v.status === "posted");
  const thisWeek = postedVideos.filter((v) => {
    if (!v.posted_at) return false;
    const d = new Date(v.posted_at);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return d > weekAgo;
  }).length;

  const successRate =
    postedVideos.length === 0
      ? "—"
      : Math.round(
          (postedVideos.filter((v) => v.status !== "failed").length / postedVideos.length) * 100
        ) + "%";

  const recentQueue = [...queue]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  if (loading) {
    return (
      <div style={{ color: COLORS.MUTED, paddingTop: "60px", textAlign: "center" }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: COLORS.TEXT }}>Dashboard</h1>
        <p style={{ color: COLORS.MUTED, marginTop: "4px", fontSize: "14px" }}>
          Your PostFlow AI overview
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
        <StatCard label="Active Sources" value={activeSources} color={COLORS.PRIMARY} />
        <StatCard label="Queued Videos" value={queue.filter((v) => v.status !== "posted").length} color={COLORS.SECONDARY} />
        <StatCard label="Posted This Week" value={thisWeek} color={COLORS.SUCCESS} />
        <StatCard label="Success Rate" value={successRate} color={COLORS.GOLD} />
      </div>

      {/* Quick action */}
      <div style={{ marginBottom: "28px" }}>
        <button
          onClick={handleRunDiscovery}
          disabled={discovering}
          style={{
            background: discovering ? COLORS.MUTED : COLORS.PRIMARY,
            color: "#0B0B18",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: discovering ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {discovering ? "Running Discovery..." : "⚡ Run Discovery Now"}
        </button>
      </div>

      {/* Recent queue */}
      <div
        style={{
          background: COLORS.CARD,
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #1E1E35",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: COLORS.TEXT }}>
          Recent Queue
        </h2>
        {recentQueue.length === 0 ? (
          <div style={{ color: COLORS.MUTED, fontSize: "14px", textAlign: "center", padding: "24px 0" }}>
            No videos yet. Run discovery to populate the queue.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ color: COLORS.MUTED }}>
                {["Title", "Platform", "Views", "Status", "Scheduled"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentQueue.map((v) => (
                <tr
                  key={v.id}
                  style={{ borderTop: "1px solid #1E1E35", color: COLORS.TEXT }}
                >
                  <td style={{ padding: "10px", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {v.title || "—"}
                  </td>
                  <td style={{ padding: "10px", textTransform: "capitalize", color: COLORS.MUTED }}>
                    {v.platform}
                  </td>
                  <td style={{ padding: "10px", color: COLORS.MUTED }}>
                    {formatViews(v.view_count)}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span
                      style={{
                        background: (STATUS_COLORS[v.status] || COLORS.MUTED) + "22",
                        color: STATUS_COLORS[v.status] || COLORS.MUTED,
                        padding: "3px 9px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px", color: COLORS.MUTED, fontSize: "12px" }}>
                    {v.scheduled_at
                      ? new Date(v.scheduled_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
