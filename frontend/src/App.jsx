import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sources from "./pages/Sources";
import Queue from "./pages/Queue";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Autopilot from "./pages/Autopilot";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0B18", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: "14px" }}>
        Loading...
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/sources" element={<Layout><Sources /></Layout>} />
        <Route path="/queue" element={<Layout><Queue /></Layout>} />
        <Route path="/autopilot" element={<Layout><Autopilot /></Layout>} />
        <Route path="/history" element={<Layout><History /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
