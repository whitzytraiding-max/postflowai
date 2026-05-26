const C = "#FFB800";
const DIM = "#64748B";

const cards = [
  {
    icon: "🗄️",
    title: "Content Vault",
    desc: "Upload all your videos. PostFlow randomly picks and scrambles metadata on each post.",
    stat: "0 videos",
    to: "/mass/vault",
  },
  {
    icon: "📡",
    title: "Campaigns",
    desc: "Define which accounts post which content, how many times per day, and on what schedule.",
    stat: "0 active",
    to: "/mass/campaigns",
  },
  {
    icon: "👥",
    title: "Accounts",
    desc: "Manage 10–100 accounts. Each gets isolated posting so bans stay contained.",
    stat: "0 accounts",
    to: "/mass/accounts",
  },
];

export default function MassOverview() {
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#E2E8F0", margin: 0 }}>
          Mass Poster
        </h1>
        <p style={{ color: DIM, marginTop: "6px", fontSize: "14px" }}>
          Post to 10–100 accounts from a single content vault. Randomised metadata, isolated per account.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {cards.map((card) => (
          <a
            key={card.title}
            href={card.to}
            style={{
              display: "block",
              background: "#14142A",
              border: "1px solid #1E1E35",
              borderRadius: "12px",
              padding: "20px",
              textDecoration: "none",
              transition: "border-color 0.15s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${C}60`)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1E1E35")}
          >
            <div style={{ fontSize: "28px", marginBottom: "10px" }}>{card.icon}</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#E2E8F0", marginBottom: "6px" }}>{card.title}</div>
            <div style={{ fontSize: "13px", color: DIM, lineHeight: 1.5, marginBottom: "14px" }}>{card.desc}</div>
            <div style={{ fontSize: "12px", color: C, fontWeight: 600 }}>{card.stat}</div>
          </a>
        ))}
      </div>

      {/* How metadata scrambling works */}
      <div
        style={{
          background: "#14142A",
          border: "1px solid #1E1E35",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "16px",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 700, color: DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
          Metadata Scrambling — How It Works
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            { icon: "🎲", title: "Random video pick", desc: "Each post pulls a different video from your vault so accounts don't all post the same content." },
            { icon: "✏️", title: "Caption variations", desc: "AI rewrites captions with slight variations. Same message, different phrasing each time." },
            { icon: "🏷️", title: "Hashtag rotation", desc: "Rotates through your hashtag sets to avoid pattern detection." },
            { icon: "⏱️", title: "Staggered timing", desc: "Posts are spread across accounts over a time window, not all at the same second." },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "#0B0B18",
                borderRadius: "8px",
                padding: "14px 16px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#E2E8F0", marginBottom: "3px" }}>{item.title}</div>
                <div style={{ fontSize: "12px", color: DIM, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scale warning */}
      <div
        style={{
          background: `${C}10`,
          border: `1px solid ${C}30`,
          borderRadius: "10px",
          padding: "16px 20px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: "20px" }}>⚠️</span>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#FFD466", marginBottom: "3px" }}>Scale responsibly</div>
          <div style={{ fontSize: "12px", color: DIM, lineHeight: 1.6 }}>
            At 10–100 accounts, platform detection is a real risk. Use the IP Isolation in Creator section, stagger posting times, and keep content varied. Start with 5–10 accounts to test before scaling up.
          </div>
        </div>
      </div>
    </div>
  );
}
