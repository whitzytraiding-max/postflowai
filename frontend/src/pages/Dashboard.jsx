import { useEffect, useState } from "react";
import { getSources, getQueue, runDiscovery } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

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

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sources, setSources] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([getSources(), getQueue()])
      .then(([s, q]) => {
        setSources(s);
        setQueue(q);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleRunDiscovery() {
    setDiscovering(true);
    try {
      const result = await runDiscovery();
      showToast(`Discovery complete! Found ${result.discovered} new video(s).`);
      const q = await getQueue();
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

  function downloadAgent() {
    const apiKey = user?.api_key || "";
    const script = `"""
PostFlow AI — Windows Download Agent
Run this on your Windows PC (residential IP) to handle YouTube downloads.

Install deps:  pip install yt-dlp requests
Run:           python windows_agent.py
"""

import os
import glob
import time
import tempfile
import requests
import yt_dlp

# ── Config ───────────────────────────────────────────────────────────────────
RENDER_URL = "https://postflow-ai-backend.onrender.com"
API_KEY    = "${apiKey}"
HEADERS    = {"X-API-Key": API_KEY}
POLL_EVERY = 60   # seconds between polls

# Browser to read YouTube cookies from (fixes 467 bot-detection errors).
# Change to "firefox" or "edge" if you don't use Chrome.
BROWSER = "chrome"
# ─────────────────────────────────────────────────────────────────────────────


def fetch_pending():
    try:
        r = requests.get(f"{RENDER_URL}/pipeline/pending-downloads",
                         headers=HEADERS, timeout=15)
        return r.json() if r.ok else []
    except Exception as e:
        print(f"[Agent] Poll error: {e}")
        return []


def download_video(url, video_id, tmpdir):
    out_path = os.path.join(tmpdir, f"{video_id}.%(ext)s")
    base_opts = {
        "outtmpl": out_path,
        "format": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "merge_output_format": "mp4",
        "quiet": False,
        "no_warnings": True,
    }
    attempts = [
        {**base_opts, "cookiesfrombrowser": (BROWSER,)},
        base_opts,
    ]
    for i, opts in enumerate(attempts):
        for f in glob.glob(os.path.join(tmpdir, f"{video_id}.*")):
            os.remove(f)
        label = f"{BROWSER} cookies" if i == 0 else "no cookies"
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.extract_info(url, download=True)
            matches = glob.glob(os.path.join(tmpdir, f"{video_id}.*"))
            if matches and os.path.getsize(matches[0]) > 0:
                print(f"[Agent] Downloaded OK ({label}): {matches[0]}")
                return matches[0]
        except Exception as e:
            print(f"[Agent] Download failed ({label}): {e}")
            continue
    print(f"[Agent] All download attempts failed for {video_id}")
    return None


def deliver(video_id, local_path):
    filename = os.path.basename(local_path)
    size_mb = os.path.getsize(local_path) / 1024 / 1024
    print(f"[Agent] Uploading {filename} ({size_mb:.1f} MB) to Render...")
    try:
        with open(local_path, "rb") as f:
            r = requests.post(
                f"{RENDER_URL}/pipeline/{video_id}/deliver",
                headers=HEADERS,
                files={"file": (filename, f, "video/mp4")},
                timeout=600,
            )
        if r.ok:
            print(f"[Agent] Delivered {video_id}: {r.json()}")
            return True
        else:
            print(f"[Agent] Deliver failed {r.status_code}: {r.text}")
            return False
    except Exception as e:
        print(f"[Agent] Upload error: {e}")
        return False


def main():
    print(f"[Agent] PostFlow Windows agent started. Polling every {POLL_EVERY}s...")
    print(f"[Agent] Using {BROWSER} cookies for YouTube downloads.")
    while True:
        videos = fetch_pending()
        if videos:
            print(f"[Agent] {len(videos)} video(s) to download")
            for v in videos:
                print(f"[Agent] Downloading: {v['title']} ({v['id']})")
                with tempfile.TemporaryDirectory() as tmpdir:
                    path = download_video(v["original_url"], v["id"], tmpdir)
                    if path:
                        deliver(v["id"], path)
        else:
            print(f"[Agent] Nothing pending. Next check in {POLL_EVERY}s...")
        time.sleep(POLL_EVERY)


if __name__ == "__main__":
    main()
`;
    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "windows_agent.py";
    a.click();
    URL.revokeObjectURL(url);
  }

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
      <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: COLORS.TEXT }}>Dashboard</h1>
          <p style={{ color: COLORS.MUTED, marginTop: "4px", fontSize: "14px" }}>
            {user?.email} — PostFlow AI
          </p>
        </div>
        <button onClick={logout} style={{ background: "transparent", border: `1px solid ${COLORS.MUTED}`, color: COLORS.MUTED, borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" }}>
          Sign Out
        </button>
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

      {/* Windows Agent download */}
      <div
        style={{
          background: COLORS.CARD,
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #1E1E35",
          marginTop: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: COLORS.TEXT, fontSize: "15px", marginBottom: "4px" }}>
            Windows Download Agent
          </div>
          <div style={{ color: COLORS.MUTED, fontSize: "13px" }}>
            Run on your Windows PC to handle YouTube downloads from a residential IP.
            Install: <code style={{ color: COLORS.PRIMARY }}>pip install yt-dlp requests</code>
          </div>
        </div>
        <button
          onClick={downloadAgent}
          style={{
            background: COLORS.SECONDARY,
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Download windows_agent.py
        </button>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
