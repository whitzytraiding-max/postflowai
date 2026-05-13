import { useEffect, useState } from "react";
import { getHistory } from "../lib/api";

const COLORS = {
  CARD: "#14142A",
  PRIMARY: "#00D4FF",
  TEXT: "#E2E8F0",
  MUTED: "#64748B",
  SUCCESS: "#10B981",
  ERROR: "#EF4444",
};

const PLATFORM_ICONS = {
  instagram: "📸",
  youtube: "▶️",
  tiktok: "🎵",
};

export default function History({ userId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory(userId)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>History</h1>
        <p style={{ color: COLORS.MUTED, marginTop: "4px", fontSize: "14px" }}>
          All posts that have been sent
        </p>
      </div>

      <div
        style={{
          background: COLORS.CARD,
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #1E1E35",
        }}
      >
        {loading ? (
          <div style={{ color: COLORS.MUTED, textAlign: "center", padding: "40px" }}>Loading history...</div>
        ) : history.length === 0 ? (
          <div style={{ color: COLORS.MUTED, textAlign: "center", padding: "40px" }}>
            No posts yet. Once videos are posted, they'll appear here.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ color: COLORS.MUTED }}>
                {["Date", "Platform", "Caption", "Status", "Link"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const statusColor = item.status === "success" ? COLORS.SUCCESS : COLORS.ERROR;
                const caption = item.caption
                  ? item.caption.length > 80
                    ? item.caption.slice(0, 77) + "..."
                    : item.caption
                  : "—";

                return (
                  <tr key={item.id} style={{ borderTop: "1px solid #1E1E35", color: COLORS.TEXT }}>
                    <td style={{ padding: "12px", fontSize: "12px", color: COLORS.MUTED, whiteSpace: "nowrap" }}>
                      {item.posted_at ? new Date(item.posted_at).toLocaleString() : "—"}
                    </td>
                    <td style={{ padding: "12px", color: COLORS.MUTED }}>
                      <span style={{ textTransform: "capitalize" }}>
                        {PLATFORM_ICONS[item.platform] || "🔗"} {item.platform}
                      </span>
                    </td>
                    <td style={{ padding: "12px", maxWidth: "280px" }}>
                      {caption}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          background: statusColor + "22",
                          color: statusColor,
                          padding: "3px 9px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "capitalize",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {item.post_url ? (
                        <a
                          href={item.post_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: COLORS.PRIMARY, fontSize: "16px", textDecoration: "none" }}
                          title="View post"
                        >
                          🔗
                        </a>
                      ) : (
                        <span style={{ color: COLORS.MUTED }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
