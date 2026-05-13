import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0B0B18" }}>
      <Sidebar />
      <main
        style={{
          marginLeft: "220px",
          flex: 1,
          padding: "32px",
          minHeight: "100vh",
          background: "#0B0B18",
          color: "#E2E8F0",
        }}
      >
        {children}
      </main>
    </div>
  );
}
