import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", icon: "📊", label: "Dashboard" },
  { to: "/sources", icon: "🎯", label: "Sources" },
  { to: "/queue", icon: "📋", label: "Queue" },
  { to: "/autopilot", icon: "🤖", label: "Autopilot" },
  { to: "/history", icon: "📈", label: "History" },
  { to: "/settings", icon: "⚙️", label: "Settings" },
];

const styles = {
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "220px",
    height: "100vh",
    background: "#10101C",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #1E1E35",
    zIndex: 100,
  },
  logo: {
    padding: "24px 20px 20px",
    borderBottom: "1px solid #1E1E35",
  },
  logoText: {
    fontSize: "22px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
  },
  nav: {
    flex: 1,
    padding: "12px 0",
  },
};

export default function Sidebar() {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoText}>
          <span style={{ color: "#00D4FF" }}>PostFlow</span>
          <span style={{ color: "#7C3AED" }}> AI</span>
        </span>
        <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
          Social Media Autopilot
        </div>
      </div>
      <nav style={styles.nav}>
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 20px",
              textDecoration: "none",
              color: isActive ? "#00D4FF" : "#64748B",
              background: isActive ? "#14142A" : "transparent",
              borderLeft: isActive ? "3px solid #00D4FF" : "3px solid transparent",
              fontSize: "14px",
              fontWeight: isActive ? 600 : 400,
              transition: "all 0.15s ease",
              cursor: "pointer",
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains("active")) {
                e.currentTarget.style.color = "#E2E8F0";
                e.currentTarget.style.background = "#12121F";
              }
            }}
            onMouseLeave={(e) => {
              // NavLink handles active state via style prop, just reset non-active hover
            }}
          >
            <span style={{ fontSize: "16px" }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: "16px 20px", borderTop: "1px solid #1E1E35" }}>
        <div style={{ fontSize: "11px", color: "#64748B" }}>v1.0.0 · dev mode</div>
      </div>
    </aside>
  );
}
