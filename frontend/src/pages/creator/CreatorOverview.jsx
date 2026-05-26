const C = "#7C3AED";
const DIM = "#64748B";

const cards = [
  {
    icon: "📅",
    title: "Post Scheduler",
    desc: "Queue posts to specific accounts at exact times. Set it and forget it.",
    stat: "0 scheduled",
    to: "/creator/scheduler",
  },
  {
    icon: "👤",
    title: "Accounts",
    desc: "Manage creator accounts, each with its own dedicated proxy IP.",
    stat: "0 connected",
    to: "/creator/accounts",
  },
  {
    icon: "🌐",
    title: "IP Isolation",
    desc: "Assign a unique residential IP to each account. Platform can't link them.",
    stat: "0 proxies",
    to: "/creator/ip-pool",
  },
];

export default function CreatorOverview() {
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#E2E8F0", margin: 0 }}>
          Creator Builder
        </h1>
        <p style={{ color: DIM, marginTop: "6px", fontSize: "14px" }}>
          Grow authentic creator accounts with scheduled posts and full IP fingerprint isolation.
        </p>
      </div>

      {/* Feature cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {cards.map((card) => (
          <a
            key={card.title}
            href={card.to}
            style={{
              display: "block",
              background: "#14142A",
              border: `1px solid #1E1E35`,
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
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#E2E8F0", marginBottom: "6px" }}>
              {card.title}
            </div>
            <div style={{ fontSize: "13px", color: DIM, lineHeight: 1.5, marginBottom: "14px" }}>
              {card.desc}
            </div>
            <div style={{ fontSize: "12px", color: C, fontWeight: 600 }}>{card.stat}</div>
          </a>
        ))}
      </div>

      {/* How it works */}
      <div
        style={{
          background: "#14142A",
          border: "1px solid #1E1E35",
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 700, color: DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
          How It Works
        </div>
        <div style={{ display: "flex", gap: "0", alignItems: "flex-start" }}>
          {[
            { step: "1", title: "Add Account", desc: "Connect Instagram or YouTube with a session ID / OAuth creds." },
            { step: "2", title: "Assign IP", desc: "Attach a dedicated residential proxy — each account gets its own IP identity." },
            { step: "3", title: "Schedule Posts", desc: "Upload content and pick exact times. PostFlow posts automatically." },
            { step: "4", title: "Grow Safely", desc: "Platform sees independent devices from different locations. No account linking." },
          ].map((item, i, arr) => (
            <div key={item.step} style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: "0" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: `${C}20`,
                    border: `1px solid ${C}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: C,
                    flexShrink: 0,
                  }}
                >
                  {item.step}
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: "1px", flex: 1, background: "#1E1E35", margin: "6px 0" }} />
                )}
              </div>
              <div style={{ marginLeft: "12px", paddingRight: "16px", paddingBottom: i < arr.length - 1 ? "20px" : 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#E2E8F0", marginBottom: "4px" }}>{item.title}</div>
                <div style={{ fontSize: "13px", color: DIM, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
