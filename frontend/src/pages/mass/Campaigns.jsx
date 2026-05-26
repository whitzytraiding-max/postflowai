import { useState } from "react";

const C = "#FFB800";
const DIM = "#64748B";

const MOCK_CAMPAIGNS = [
  {
    id: 1,
    name: "Travel Niche Blast",
    status: "active",
    accounts: 8,
    postsPerDay: 3,
    platform: "instagram",
    vaultFilter: "#travel",
    posted: 42,
    nextPost: "14:30",
  },
];

export default function Campaigns() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: "",
    platform: "instagram",
    postsPerDay: 2,
    startHour: "09",
    endHour: "21",
    vaultTags: "",
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#E2E8F0", margin: 0 }}>Campaigns</h1>
          <p style={{ color: DIM, marginTop: "4px", fontSize: "14px" }}>
            Define which accounts post, how often, and which vault content to use.
          </p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
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
          + New Campaign
        </button>
      </div>

      {/* New campaign form */}
      {showNew && (
        <div
          style={{
            background: "#14142A",
            border: `1px solid ${C}40`,
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#E2E8F0", marginBottom: "16px" }}>New Campaign</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Campaign Name</label>
              <input placeholder="Travel Niche Blast" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Platform</label>
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} style={inputStyle}>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube Shorts</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Posts per day (per account)</label>
              <input type="number" min={1} max={10} value={form.postsPerDay} onChange={(e) => setForm({ ...form, postsPerDay: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Content tags (from vault)</label>
              <input placeholder="#travel, #beach" value={form.vaultTags} onChange={(e) => setForm({ ...form, vaultTags: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Post window start</label>
              <input type="time" value={`${form.startHour}:00`} onChange={(e) => setForm({ ...form, startHour: e.target.value.split(":")[0] })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Post window end</label>
              <input type="time" value={`${form.endHour}:00`} onChange={(e) => setForm({ ...form, endHour: e.target.value.split(":")[0] })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <label style={labelStyle}>Assign Accounts</label>
            <div
              style={{
                background: "#0B0B18",
                border: "1px solid #1E1E35",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "13px",
                color: DIM,
                fontStyle: "italic",
              }}
            >
              No accounts in Mass Poster yet — add them in the Accounts tab first.
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              style={{ padding: "8px 20px", background: C, border: "none", borderRadius: "8px", color: "#0B0B18", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >
              Create Campaign
            </button>
            <button
              onClick={() => setShowNew(false)}
              style={{ padding: "8px 20px", background: "transparent", border: "1px solid #1E1E35", borderRadius: "8px", color: DIM, fontSize: "13px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {MOCK_CAMPAIGNS.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {MOCK_CAMPAIGNS.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign: c }) {
  return (
    <div
      style={{
        background: "#14142A",
        border: "1px solid #1E1E35",
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "22px" }}>{c.platform === "instagram" ? "📸" : "▶️"}</div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#E2E8F0" }}>{c.name}</div>
            <div style={{ fontSize: "12px", color: DIM, marginTop: "2px" }}>{c.platform} · {c.vaultFilter}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: c.status === "active" ? "#10B981" : DIM,
              background: c.status === "active" ? "#10B98120" : "#64748B20",
              padding: "4px 10px",
              borderRadius: "6px",
            }}
          >
            ● {c.status}
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
            Edit
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {[
          { label: "Accounts", value: c.accounts },
          { label: "Posts/day/account", value: c.postsPerDay },
          { label: "Total posted", value: c.posted },
          { label: "Next post", value: c.nextPost },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "#0B0B18", borderRadius: "8px", padding: "10px 12px" }}>
            <div style={{ fontSize: "11px", color: DIM, marginBottom: "4px" }}>{stat.label}</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: C }}>{stat.value}</div>
          </div>
        ))}
      </div>
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
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>📡</div>
      <div style={{ fontSize: "16px", fontWeight: 600, color: "#E2E8F0", marginBottom: "6px" }}>No campaigns yet</div>
      <div style={{ fontSize: "14px", color: DIM }}>Add vault content and accounts, then create your first campaign.</div>
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
