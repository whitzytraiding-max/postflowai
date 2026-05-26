import { useState } from "react";

const C = "#FFB800";
const DIM = "#64748B";

const MOCK_VIDEOS = [
  { id: 1, name: "sunset_beach_01.mp4", size: "12.4 MB", duration: "0:28", tags: ["travel", "beach"], usedCount: 7 },
  { id: 2, name: "city_timelapse_03.mp4", size: "8.1 MB", duration: "0:15", tags: ["urban", "timelapse"], usedCount: 3 },
  { id: 3, name: "food_reel_curry.mp4", size: "15.2 MB", duration: "0:32", tags: ["food", "cooking"], usedCount: 0 },
];

export default function ContentVault() {
  const [dragOver, setDragOver] = useState(false);
  const [filter, setFilter] = useState("all");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#E2E8F0", margin: 0 }}>Content Vault</h1>
          <p style={{ color: DIM, marginTop: "4px", fontSize: "14px" }}>
            Upload your videos. PostFlow randomly picks from here for each campaign post.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ fontSize: "13px", color: DIM }}>
            <span style={{ color: C, fontWeight: 700 }}>{MOCK_VIDEOS.length}</span> videos · <span style={{ color: C, fontWeight: 700 }}>35.7 MB</span>
          </div>
          <button
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
            + Upload Videos
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
        style={{
          background: dragOver ? `${C}15` : "#14142A",
          border: `2px dashed ${dragOver ? C : "#1E1E35"}`,
          borderRadius: "12px",
          padding: "32px",
          textAlign: "center",
          marginBottom: "20px",
          transition: "all 0.15s ease",
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: "36px", marginBottom: "8px" }}>📁</div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#E2E8F0", marginBottom: "4px" }}>
          Drag & drop videos here
        </div>
        <div style={{ fontSize: "13px", color: DIM }}>
          MP4, MOV supported · Max 500 MB per file · Bulk upload OK
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["all", "unused", "used"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              background: filter === f ? `${C}20` : "transparent",
              border: `1px solid ${filter === f ? `${C}60` : "#1E1E35"}`,
              borderRadius: "6px",
              color: filter === f ? C : DIM,
              fontSize: "12px",
              fontWeight: filter === f ? 600 : 400,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
        {MOCK_VIDEOS.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}

        {/* Placeholder cards */}
        {[1, 2].map((i) => (
          <div
            key={`ph-${i}`}
            style={{
              background: "#14142A",
              border: "1px dashed #1E1E3560",
              borderRadius: "10px",
              aspectRatio: "9/16",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1E1E35",
              fontSize: "28px",
              cursor: "pointer",
            }}
          >
            +
          </div>
        ))}
      </div>

      {/* Scrambler settings preview */}
      <div
        style={{
          marginTop: "24px",
          background: "#14142A",
          border: "1px solid #1E1E35",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 700, color: DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>
          Metadata Scrambler Settings
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          {[
            { label: "Caption style", value: "AI rewrite", icon: "✏️" },
            { label: "Hashtag sets", value: "2 sets configured", icon: "🏷️" },
            { label: "Post timing spread", value: "±30 min", icon: "⏱️" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#0B0B18",
                borderRadius: "8px",
                padding: "12px 14px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "18px" }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: "11px", color: DIM }}>{item.label}</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#E2E8F0", marginTop: "2px" }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoCard({ video }) {
  return (
    <div
      style={{
        background: "#14142A",
        border: "1px solid #1E1E35",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      {/* Thumbnail placeholder */}
      <div
        style={{
          background: "#0B0B18",
          aspectRatio: "9/16",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "36px",
          position: "relative",
        }}
      >
        🎬
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            right: "8px",
            background: "#0B0B1890",
            borderRadius: "4px",
            padding: "2px 6px",
            fontSize: "11px",
            color: "#E2E8F0",
          }}
        >
          {video.duration}
        </div>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#E2E8F0", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {video.name}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "11px", color: DIM }}>{video.size}</div>
          <div style={{ fontSize: "11px", color: video.usedCount > 0 ? "#10B981" : DIM }}>
            {video.usedCount > 0 ? `Used ${video.usedCount}×` : "Unused"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px", marginTop: "8px", flexWrap: "wrap" }}>
          {video.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "10px",
                color: C,
                background: `${C}15`,
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
