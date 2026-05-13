import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Sources from "./pages/Sources";
import Queue from "./pages/Queue";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Autopilot from "./pages/Autopilot";

// Hardcoded dev user — wire Supabase auth here later
const USER_ID = "dev-user-123";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Dashboard userId={USER_ID} />
            </Layout>
          }
        />
        <Route
          path="/sources"
          element={
            <Layout>
              <Sources userId={USER_ID} />
            </Layout>
          }
        />
        <Route
          path="/queue"
          element={
            <Layout>
              <Queue userId={USER_ID} />
            </Layout>
          }
        />
        <Route
          path="/autopilot"
          element={
            <Layout>
              <Autopilot userId={USER_ID} />
            </Layout>
          }
        />
        <Route
          path="/history"
          element={
            <Layout>
              <History userId={USER_ID} />
            </Layout>
          }
        />
        <Route
          path="/settings"
          element={
            <Layout>
              <Settings userId={USER_ID} />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
