import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";

// Theme Page
import Dashboard from "./pages/Dashboard";
import Sources from "./pages/Sources";
import Queue from "./pages/Queue";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Autopilot from "./pages/Autopilot";
import Admin from "./pages/Admin";

// Creator
import CreatorOverview from "./pages/creator/CreatorOverview";
import PostScheduler from "./pages/creator/PostScheduler";
import CreatorAccounts from "./pages/creator/CreatorAccounts";
import IPIsolation from "./pages/creator/IPIsolation";

// Mass Poster
import MassOverview from "./pages/mass/MassOverview";
import ContentVault from "./pages/mass/ContentVault";
import Campaigns from "./pages/mass/Campaigns";
import MassAccounts from "./pages/mass/MassAccounts";

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
        {/* Theme Page section */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/sources" element={<Layout><Sources /></Layout>} />
        <Route path="/queue" element={<Layout><Queue /></Layout>} />
        <Route path="/autopilot" element={<Layout><Autopilot /></Layout>} />
        <Route path="/history" element={<Layout><History /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        {user?.is_admin && (
          <Route path="/admin" element={<Layout><Admin /></Layout>} />
        )}

        {/* Creator section */}
        <Route path="/creator" element={<Layout><CreatorOverview /></Layout>} />
        <Route path="/creator/scheduler" element={<Layout><PostScheduler /></Layout>} />
        <Route path="/creator/accounts" element={<Layout><CreatorAccounts /></Layout>} />
        <Route path="/creator/ip-pool" element={<Layout><IPIsolation /></Layout>} />

        {/* Mass Poster section */}
        <Route path="/mass" element={<Layout><MassOverview /></Layout>} />
        <Route path="/mass/vault" element={<Layout><ContentVault /></Layout>} />
        <Route path="/mass/campaigns" element={<Layout><Campaigns /></Layout>} />
        <Route path="/mass/accounts" element={<Layout><MassAccounts /></Layout>} />
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
