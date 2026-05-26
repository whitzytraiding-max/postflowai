import { useState } from "react";

const C = "#7C3AED";
const DIM = "#64748B";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

const MOCK_SCHEDULED = [
  { id: 1, account: "@my_travel_page", platform: "instagram", time: "09:00", day: "Mon", caption: "Morning vibes ✨ #travel", status: "scheduled" },
  { id: 2, account: "@my_travel_page", platform: "instagram", time: "18:00", day: "Wed", caption: "Sunset in Bali 🌅 #bali", status: "scheduled" },
  { id: 3, account: "@creator_yt", platform: "youtube", time: "15:00", day: "Fri", caption: "Weekly vlog drop", status: "scheduled" },
];

export default function PostScheduler() {
  const [view, setView] = useState("list");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#E2E8F0", margin: 0 }}>Post Scheduler</h1>
          <p style={{ color: DIM, marginTop: "4px", fontSize: "14px" }}>Schedule posts to go live at exact times, per account.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ display: "flex", background: "#10101C", border: "1px solid #1E1E35", borderRadius: "8px", overflow: "hidden" }}>
            {["list", "week"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "8px 16px",
                  background: view === v ? `${C}20` : "transparent",
                  border: "none",
                  color: view === v ? C : DIM,
                  fontSize: "13px",
                  fontWeight: view === v ? 600 : 400,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {v === "list" ? "📋 List" : "📅 Week"}
              </button>
            ))}
          </div>
          <button
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
            + Schedule Post
          </button>
        </div>
      </div>

      {view === "list" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {MOCK_SCHEDULED.length === 0 ? (
            <EmptyState />
          ) : (
            MOCK_SCHEDULED.map((post) => (
              <div
                key={post.id}
                style={{
                  background: "#14142A",
                  border: "1px solid #1E1E35",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "#0B0B18",
                    border: "1px solid #1E1E35",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0,
                  }}
                >
                  {post.platform === "instagram" ? "📸" : "▶️"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#E2E8F0" }}>{post.caption}</div>
                  <div style={{ fontSize: "12px", color: DIM, marginTop: "3px" }}>{post.account}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#E2E8F0" }}>{post.day} {post.time}</div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#10B981",
                      background: "#10B98120",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      marginTop: "4px",
                      display: "inline-block",
                    }}
                  >
                    {post.status}
                  </div>
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
            ))
          )}
        </div>
      ) : (
        <WeekView />
      )}

      <ComingSoonBanner />
    </div>
  );
}

function WeekView() {
  return (
    <div
      style={{
        background: "#14142A",
        border: "1px solid #1E1E35",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: `80px repeat(7, 1fr)`, borderBottom: "1px solid #1E1E35" }}>
        <div style={{ padding: "12px", background: "#10101C" }} />
        {DAYS.map((d) => (
          <div key={d} style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: "#E2E8F0", background: "#10101C", borderLeft: "1px solid #1E1E35" }}>
            {d}
          </div>
        ))}
      </div>
      {["09:00", "12:00", "15:00", "18:00", "21:00"].map((hour) => (
        <div key={hour} style={{ display: "grid", gridTemplateColumns: `80px repeat(7, 1fr)`, borderBottom: "1px solid #1E1E3530" }}>
          <div style={{ padding: "10px 12px", fontSize: "12px", color: DIM }}>{hour}</div>
          {DAYS.map((day) => {
            const post = [
              { id: 1, day: "Mon", time: "09:00", icon: "📸" },
              { id: 2, day: "Wed", time: "18:00", icon: "📸" },
              { id: 3, day: "Fri", time: "15:00", icon: "▶️" },
            ].find((p) => p.day === day && p.time === hour);
            return (
              <div key={day} style={{ borderLeft: "1px solid #1E1E3530", minHeight: "40px", padding: "4px" }}>
                {post && (
                  <div
                    style={{
                      background: `${C}30`,
                      border: `1px solid ${C}50`,
                      borderRadius: "4px",
                      padding: "3px 6px",
                      fontSize: "12px",
                      color: "#C4B5FD",
                    }}
                  >
                    {post.icon} {post.time}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
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
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>📅</div>
      <div style={{ fontSize: "16px", fontWeight: 600, color: "#E2E8F0", marginBottom: "6px" }}>No posts scheduled</div>
      <div style={{ fontSize: "14px", color: DIM }}>Add accounts and schedule your first post above.</div>
    </div>
  );
}

function ComingSoonBanner() {
  return (
    <div
      style={{
        marginTop: "24px",
        background: `${C}10`,
        border: `1px solid ${C}30`,
        borderRadius: "10px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <span style={{ fontSize: "20px" }}>🔧</span>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#C4B5FD" }}>Backend wiring coming next</div>
        <div style={{ fontSize: "12px", color: DIM, marginTop: "2px" }}>
          Scheduler UI is ready. Backend endpoints for storing and executing scheduled posts are the next build step.
        </div>
      </div>
    </div>
  );
}
