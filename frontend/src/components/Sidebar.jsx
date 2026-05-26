import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

const SECTIONS = {
  theme: {
    key: "theme",
    label: "Theme Page",
    icon: "🎨",
    color: "#00D4FF",
    paths: ["/", "/sources", "/queue", "/autopilot", "/history"],
    nav: [
      { to: "/", icon: "📊", label: "Dashboard" },
      { to: "/sources", icon: "🎯", label: "Sources" },
      { to: "/queue", icon: "📋", label: "Queue" },
      { to: "/autopilot", icon: "🤖", label: "Autopilot" },
      { to: "/history", icon: "📈", label: "History" },
    ],
  },
  creator: {
    key: "creator",
    label: "Creator",
    icon: "⚡",
    color: "#7C3AED",
    paths: ["/creator", "/creator/scheduler", "/creator/accounts", "/creator/ip-pool"],
    nav: [
      { to: "/creator", icon: "📊", label: "Overview" },
      { to: "/creator/scheduler", icon: "📅", label: "Post Scheduler" },
      { to: "/creator/accounts", icon: "👤", label: "Accounts" },
      { to: "/creator/ip-pool", icon: "🌐", label: "IP Isolation" },
    ],
  },
  mass: {
    key: "mass",
    label: "Mass Poster",
    icon: "🚀",
    color: "#FFB800",
    paths: ["/mass", "/mass/vault", "/mass/campaigns", "/mass/accounts"],
    nav: [
      { to: "/mass", icon: "📊", label: "Overview" },
      { to: "/mass/vault", icon: "🗄️", label: "Content Vault" },
      { to: "/mass/campaigns", icon: "📡", label: "Campaigns" },
      { to: "/mass/accounts", icon: "👥", label: "Accounts" },
    ],
  },
};

function getActiveSection(pathname) {
  if (pathname.startsWith("/creator")) return "creator";
  if (pathname.startsWith("/mass")) return "mass";
  return "theme";
}

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const activeSectionKey = getActiveSection(location.pathname);
  const activeSection = SECTIONS[activeSectionKey];
  const accentColor = activeSection.color;

  const navItems = [
    ...activeSection.nav,
    ...(activeSectionKey === "theme" && user?.is_admin
      ? [{ to: "/admin", icon: "🔧", label: "Proxy Pool" }]
      : []),
    { to: "/settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <aside
      style={{
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
      }}
    >
      {/* Logo */}
      <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid #1E1E35" }}>
        <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px" }}>
          <span style={{ color: "#00D4FF" }}>PostFlow</span>
          <span style={{ color: "#7C3AED" }}> AI</span>
        </div>
        <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
          Social Media Autopilot
        </div>
      </div>

      {/* Section Tabs */}
      <div
        style={{
          padding: "10px 10px 8px",
          borderBottom: "1px solid #1E1E35",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {Object.values(SECTIONS).map((section) => {
          const isActive = section.key === activeSectionKey;
          const firstRoute = section.nav[0].to;
          return (
            <NavLink
              key={section.key}
              to={firstRoute}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 10px",
                borderRadius: "7px",
                textDecoration: "none",
                background: isActive ? `${section.color}18` : "transparent",
                border: isActive ? `1px solid ${section.color}40` : "1px solid transparent",
                color: isActive ? section.color : "#64748B",
                fontSize: "12px",
                fontWeight: isActive ? 700 : 400,
                transition: "all 0.15s ease",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "14px" }}>{section.icon}</span>
              {section.label}
            </NavLink>
          );
        })}
      </div>

      {/* Section Nav */}
      <nav style={{ flex: 1, padding: "10px 0" }}>
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/" || to === "/creator" || to === "/mass"}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 20px",
              textDecoration: "none",
              color: isActive ? accentColor : "#64748B",
              background: isActive ? "#14142A" : "transparent",
              borderLeft: isActive ? `3px solid ${accentColor}` : "3px solid transparent",
              fontSize: "14px",
              fontWeight: isActive ? 600 : 400,
              transition: "all 0.15s ease",
            })}
          >
            <span style={{ fontSize: "15px" }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: "14px 20px", borderTop: "1px solid #1E1E35" }}>
        <div style={{ fontSize: "11px", color: "#64748B" }}>v1.1.0</div>
      </div>
    </aside>
  );
}
