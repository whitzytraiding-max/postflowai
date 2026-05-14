import { useEffect, useState, useRef } from "react";
import { getQueue, approveVideo, deleteFromQueue, runPipeline, retryVideo } from "../lib/api";

const COLORS = {
  CARD: "#14142A",
  PRIMARY: "#00D4FF",
  SECONDARY: "#7C3AED",
  TEXT: "#E2E8F0",
  MUTED: "#64748B",
  SUCCESS: "#10B981",
  ERROR: "#EF4444",
  GOLD: "#FFB800",
  ORANGE: "#F97316",
  BLUE: "#3B82F6",
};

const STATUS_COLORS = {
  pending: COLORS.MUTED,
  downloading: COLORS.GOLD,
  ready: COLORS.BLUE,
  posting: COLORS.ORANGE,
  posted: COLORS.SUCCESS,
  failed: COLORS.ERROR,
};

const STATUS_LABELS = {
  pending: "Pending",
  downloading: "Downloading...",
  ready: "Ready",
  posting: "Posting...",
  posted: "Posted",
  failed: "Failed",
};

const PLATFORM_ICONS = {
  tiktok: "🎵",
  instagram: "📸",
  youtube: "▶️",
};

const TABS = ["all", "pending", "ready", "posted", "failed"];

// Statuses that need active polling
const ACTIVE_STATUSES = new Set(["downloading", "posting"]);

function formatViews(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
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
      }}
    >
      {msg}
    </div>
  );
}

export default function Queue({ userId }) {
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [postingIds, setPostingIds] = useState(new Set());
  const pollRef = useRef(null);

  useEffect(() => {
    loadQueue();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Start/stop polling based on whether any video is in an active state
  useEffect(() => {
    const hasActive = videos.some((v) => ACTIVE_STATUSES.has(v.status));
    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(loadQueue, 5000);
    } else if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [videos]);

  async function loadQueue() {
    try {
      const data = await getQueue(userId);
      setVideos(data);
    } catch {
      // Silently fail on poll, show error only on first load
      if (loading) showToast("Failed to load queue", "error");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleApprove(id) {
    try {
      const updated = await approveVideo(id);
      setVideos((prev) => prev.map((v) => (v.id === id ? updated : v)));
      showToast("Video approved and set to ready");
    } catch {
      showToast("Failed to approve", "error");
    }
  }

  async function handlePostNow(id) {
    setPostingIds((prev) => new Set([...prev, id]));
    // Optimistically mark as downloading in UI
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "downloading" } : v))
    );
    try {
      await runPipeline(id, userId);
      showToast("Pipeline started — video is downloading");
    } catch {
      showToast("Failed to start pipeline", "error");
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "pending" } : v))
      );
    } finally {
      setPostingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleRetry(id) {
    setPostingIds((prev) => new Set([...prev, id]));
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "downloading", error_msg: null } : v))
    );
    try {
      await retryVideo(id, userId);
      showToast("Retrying — video is downloading");
    } catch {
      showToast("Retry failed", "error");
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "failed" } : v))
      );
    } finally {
      setPostingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this video from the queue?")) return;
    try {
      await deleteFromQueue(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      showToast("Removed from queue");
    } catch {
      showToast("Failed to delete", "error");
    }
  }

  const filtered =
    activeTab === "all" ? videos : videos.filter((v) => v.status === activeTab);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Queue</h1>
        <p style={{ color: COLORS.MUTED, marginTop: "4px", fontSize: "14px" }}>
          Manage discovered videos before they go live
        </p>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "20px",
          background: COLORS.CARD,
          borderRadius: "10px",
          padding: "4px",
          width: "fit-content",
          border: "1px solid #1E1E35",
        }}
      >
        {TABS.map((tab) => {
          const count =
            tab === "all" ? videos.length : videos.filter((v) => v.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? COLORS.PRIMARY : "transparent",
                color: activeTab === tab ? "#0B0B18" : COLORS.MUTED,
                border: "none",
                borderRadius: "7px",
                padding: "7px 16px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.15s",
              }}
            >
              {tab} {count > 0 && <span style={{ opacity: 0.75 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Videos list */}
      {loading ? (
        <div style={{ color: COLORS.MUTED, textAlign: "center", padding: "60px" }}>
          Loading queue...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: COLORS.CARD,
            borderRadius: "12px",
            padding: "60px",
            textAlign: "center",
            color: COLORS.MUTED,
            border: "1px solid #1E1E35",
          }}
        >
          {activeTab === "all"
            ? "No videos in queue. Run discovery to find videos."
            : `No ${activeTab} videos.`}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((v) => {
            const statusColor = STATUS_COLORS[v.status] || COLORS.MUTED;
            const title =
              v.title ? (v.title.length > 60 ? v.title.slice(0, 57) + "..." : v.title) : "Untitled";
            const isPosting = postingIds.has(v.id);
            const canPostNow = v.status === "pending" || v.status === "ready";
            const isActive = ACTIVE_STATUSES.has(v.status);

            return (
              <div
                key={v.id}
                style={{
                  background: COLORS.CARD,
                  borderRadius: "10px",
                  padding: "14px 16px",
                  border: `1px solid ${isActive ? statusColor + "44" : "#1E1E35"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  transition: "border-color 0.3s",
                }}
              >
                {/* Thumbnail or platform icon */}
                <div
                  style={{
                    width: "56px",
                    height: "40px",
                    borderRadius: "6px",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "#0B0B18",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  {v.thumbnail_url ? (
                    <img
                      src={v.thumbnail_url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    PLATFORM_ICONS[v.platform] || "🎬"
                  )}
                </div>

                {/* Title & meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: COLORS.TEXT,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {title}
                  </div>
                  <div style={{ fontSize: "12px", color: COLORS.MUTED, marginTop: "2px" }}>
                    {PLATFORM_ICONS[v.platform]} {v.platform} · {formatViews(v.view_count)} views ·{" "}
                    {v.post_to_platform && (
                      <span style={{ textTransform: "capitalize" }}>
                        → {v.post_to_platform}
                      </span>
                    )}
                  </div>
                  {v.error_msg && (
                    <div style={{ fontSize: "11px", color: COLORS.ERROR, marginTop: "3px" }}>
                      {v.error_msg.length > 80 ? v.error_msg.slice(0, 77) + "..." : v.error_msg}
                    </div>
                  )}
                </div>

                {/* Status badge */}
                <span
                  style={{
                    background: statusColor + "22",
                    color: statusColor,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {STATUS_LABELS[v.status] || v.status}
                </span>

                {/* Scheduled time */}
                <div
                  style={{
                    fontSize: "12px",
                    color: COLORS.MUTED,
                    whiteSpace: "nowrap",
                    minWidth: "100px",
                    textAlign: "right",
                  }}
                >
                  {v.scheduled_at ? new Date(v.scheduled_at).toLocaleDateString() : "—"}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  {/* Approve button — pending only */}
                  {v.status === "pending" && (
                    <button
                      onClick={() => handleApprove(v.id)}
                      title="Approve — set to ready"
                      style={{
                        background: COLORS.SUCCESS + "22",
                        color: COLORS.SUCCESS,
                        border: `1px solid ${COLORS.SUCCESS}`,
                        borderRadius: "6px",
                        padding: "5px 10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Approve
                    </button>
                  )}

                  {/* Post Now button — pending or ready */}
                  {canPostNow && (
                    <button
                      onClick={() => handlePostNow(v.id)}
                      disabled={isPosting}
                      title="Download and post now"
                      style={{
                        background: isPosting ? COLORS.MUTED : COLORS.PRIMARY,
                        color: isPosting ? "#fff" : "#0B0B18",
                        border: "none",
                        borderRadius: "6px",
                        padding: "5px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: isPosting ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s",
                      }}
                    >
                      {isPosting ? "Starting..." : "Post Now"}
                    </button>
                  )}

                  {/* Retry button — failed only */}
                  {v.status === "failed" && (
                    <button
                      onClick={() => handleRetry(v.id)}
                      disabled={postingIds.has(v.id)}
                      title="Retry download and post"
                      style={{
                        background: COLORS.ORANGE + "22",
                        color: COLORS.ORANGE,
                        border: `1px solid ${COLORS.ORANGE}`,
                        borderRadius: "6px",
                        padding: "5px 10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: postingIds.has(v.id) ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Retry
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(v.id)}
                    title="Remove from queue"
                    style={{
                      background: "transparent",
                      color: COLORS.MUTED,
                      border: "1px solid #1E1E35",
                      borderRadius: "6px",
                      padding: "5px 10px",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = COLORS.ERROR;
                      e.currentTarget.style.borderColor = COLORS.ERROR;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = COLORS.MUTED;
                      e.currentTarget.style.borderColor = "#1E1E35";
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
