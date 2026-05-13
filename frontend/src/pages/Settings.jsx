import { useEffect, useState } from "react";
import {
  getSettings,
  saveKeys,
  getConnectedAccounts,
  connectInstagram,
  connectYouTube,
  disconnectAccount,
} from "../lib/api";

const COLORS = {
  BG: "#0B0B18",
  CARD: "#14142A",
  PRIMARY: "#00D4FF",
  SECONDARY: "#7C3AED",
  TEXT: "#E2E8F0",
  MUTED: "#64748B",
  SUCCESS: "#10B981",
  ERROR: "#EF4444",
  BORDER: "#1E1E35",
};

const PLATFORM_ICONS = {
  instagram: "📸",
  youtube: "▶️",
  tiktok: "🎵",
};

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: type === "error" ? COLORS.ERROR : COLORS.SUCCESS,
        color: "#fff",
        padding: "12px 20px",
        borderRadius: "8px",
        fontWeight: 600,
        fontSize: "14px",
        zIndex: 999,
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      {msg}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div
      style={{
        background: COLORS.CARD,
        borderRadius: "12px",
        padding: "24px",
        border: `1px solid ${COLORS.BORDER}`,
        marginBottom: "20px",
      }}
    >
      <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px", color: COLORS.TEXT }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder, helpText }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: COLORS.MUTED, marginBottom: "6px" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ""}
        style={{
          width: "100%",
          background: COLORS.BG,
          border: `1px solid ${COLORS.BORDER}`,
          borderRadius: "8px",
          padding: "10px 14px",
          color: COLORS.TEXT,
          fontSize: "14px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {helpText && (
        <p style={{ fontSize: "11px", color: COLORS.MUTED, marginTop: "5px", lineHeight: 1.5 }}>
          {helpText}
        </p>
      )}
    </div>
  );
}

function SaveButton({ onClick, loading, label = "Save" }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        background: loading ? COLORS.MUTED : COLORS.PRIMARY,
        color: loading ? "#fff" : COLORS.BG,
        border: "none",
        borderRadius: "8px",
        padding: "10px 24px",
        fontWeight: 700,
        fontSize: "14px",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "opacity 0.15s",
      }}
    >
      {loading ? "Saving..." : label}
    </button>
  );
}

function Badge({ label, color }) {
  return (
    <span
      style={{
        background: color + "22",
        color: color,
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 700,
        marginLeft: "8px",
      }}
    >
      {label}
    </span>
  );
}

export default function Settings({ userId }) {
  const [toast, setToast] = useState(null);

  // AI Keys state
  const [geminiKey, setGeminiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [geminiSet, setGeminiSet] = useState(false);
  const [groqSet, setGroqSet] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);

  // Instagram state
  const [igSessionId, setIgSessionId] = useState("");
  const [igAccountName, setIgAccountName] = useState("");
  const [connectingIg, setConnectingIg] = useState(false);

  // YouTube state
  const [ytClientId, setYtClientId] = useState("");
  const [ytClientSecret, setYtClientSecret] = useState("");
  const [ytRefreshToken, setYtRefreshToken] = useState("");
  const [ytAccountName, setYtAccountName] = useState("");
  const [connectingYt, setConnectingYt] = useState(false);

  // Connected accounts
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    loadAll();
  }, [userId]);

  async function loadAll() {
    setLoadingAccounts(true);
    try {
      const [keys, accs] = await Promise.all([
        getSettings(userId).catch(() => ({})),
        getConnectedAccounts(userId).catch(() => []),
      ]);
      setGeminiSet(keys.gemini_set || false);
      setGroqSet(keys.groq_set || false);
      setAccounts(accs);
    } catch {
      // ignore
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function handleSaveKeys() {
    setSavingKeys(true);
    try {
      await saveKeys({
        user_id: userId,
        gemini_api_key: geminiKey || undefined,
        groq_api_key: groqKey || undefined,
      });
      showToast("API keys saved");
      setGeminiKey("");
      setGroqKey("");
      // Refresh set status
      const keys = await getSettings(userId).catch(() => ({}));
      setGeminiSet(keys.gemini_set || false);
      setGroqSet(keys.groq_set || false);
    } catch {
      showToast("Failed to save keys", "error");
    } finally {
      setSavingKeys(false);
    }
  }

  async function handleConnectInstagram() {
    if (!igSessionId.trim() || !igAccountName.trim()) {
      showToast("Session ID and account name are required", "error");
      return;
    }
    setConnectingIg(true);
    try {
      await connectInstagram({
        user_id: userId,
        session_id: igSessionId,
        account_name: igAccountName,
      });
      showToast("Instagram connected");
      setIgSessionId("");
      setIgAccountName("");
      await loadAll();
    } catch {
      showToast("Failed to connect Instagram", "error");
    } finally {
      setConnectingIg(false);
    }
  }

  async function handleConnectYouTube() {
    if (!ytClientId.trim() || !ytClientSecret.trim() || !ytRefreshToken.trim() || !ytAccountName.trim()) {
      showToast("All YouTube fields are required", "error");
      return;
    }
    setConnectingYt(true);
    try {
      await connectYouTube({
        user_id: userId,
        account_name: ytAccountName,
        client_id: ytClientId,
        client_secret: ytClientSecret,
        refresh_token: ytRefreshToken,
        access_token: "",
      });
      showToast("YouTube connected");
      setYtClientId("");
      setYtClientSecret("");
      setYtRefreshToken("");
      setYtAccountName("");
      await loadAll();
    } catch {
      showToast("Failed to connect YouTube", "error");
    } finally {
      setConnectingYt(false);
    }
  }

  async function handleDisconnect(accountId) {
    if (!confirm("Disconnect this account?")) return;
    try {
      await disconnectAccount(accountId);
      showToast("Account disconnected");
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch {
      showToast("Failed to disconnect", "error");
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Settings</h1>
        <p style={{ color: COLORS.MUTED, marginTop: "4px", fontSize: "14px" }}>
          Configure API keys, connected accounts, and posting destinations
        </p>
      </div>

      {/* Section 1: AI Keys */}
      <SectionCard title="AI Caption Keys">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: COLORS.MUTED }}>
                Gemini API Key
              </label>
              {geminiSet && <Badge label="Set ✓" color={COLORS.SUCCESS} />}
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder={geminiSet ? "••••••••••••••• (already set)" : "AIza..."}
              style={{
                width: "100%",
                background: COLORS.BG,
                border: `1px solid ${COLORS.BORDER}`,
                borderRadius: "8px",
                padding: "10px 14px",
                color: COLORS.TEXT,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: COLORS.MUTED }}>
                Groq API Key
              </label>
              {groqSet && <Badge label="Set ✓" color={COLORS.SUCCESS} />}
            </div>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder={groqSet ? "••••••••••••••• (already set)" : "gsk_..."}
              style={{
                width: "100%",
                background: COLORS.BG,
                border: `1px solid ${COLORS.BORDER}`,
                borderRadius: "8px",
                padding: "10px 14px",
                color: COLORS.TEXT,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
        <p style={{ fontSize: "11px", color: COLORS.MUTED, margin: "8px 0 16px" }}>
          Gemini is used first for captions. Groq is the fallback. Both optional — if neither is set, a basic template caption is used.
        </p>
        <SaveButton onClick={handleSaveKeys} loading={savingKeys} label="Save Keys" />
      </SectionCard>

      {/* Section 2: Connect Instagram */}
      <SectionCard title="Connect Instagram">
        <InputField
          label="Session ID"
          value={igSessionId}
          onChange={setIgSessionId}
          type="password"
          placeholder="Your Instagram sessionid cookie value"
          helpText="Get this from your browser: go to instagram.com → F12 → Application → Cookies → find 'sessionid' and copy the value."
        />
        <InputField
          label="Account Name"
          value={igAccountName}
          onChange={setIgAccountName}
          placeholder="e.g. @myaccount"
        />
        <SaveButton onClick={handleConnectInstagram} loading={connectingIg} label="Connect Instagram" />
      </SectionCard>

      {/* Section 3: Connect YouTube */}
      <SectionCard title="Connect YouTube">
        <p style={{ fontSize: "12px", color: COLORS.MUTED, marginBottom: "16px", lineHeight: 1.6 }}>
          Get these from{" "}
          <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noreferrer"
            style={{ color: COLORS.PRIMARY }}
          >
            Google Cloud Console
          </a>{" "}
          → YouTube Data API v3 → OAuth 2.0 credentials. Use{" "}
          <a
            href="https://developers.google.com/oauthplayground"
            target="_blank"
            rel="noreferrer"
            style={{ color: COLORS.PRIMARY }}
          >
            OAuth Playground
          </a>{" "}
          to get the refresh token (scope: youtube.upload).
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <InputField
            label="Client ID"
            value={ytClientId}
            onChange={setYtClientId}
            type="password"
            placeholder="123456789.apps.googleusercontent.com"
          />
          <InputField
            label="Client Secret"
            value={ytClientSecret}
            onChange={setYtClientSecret}
            type="password"
            placeholder="GOCSPX-..."
          />
        </div>
        <InputField
          label="Refresh Token"
          value={ytRefreshToken}
          onChange={setYtRefreshToken}
          type="password"
          placeholder="1//0g..."
        />
        <InputField
          label="Account Name"
          value={ytAccountName}
          onChange={setYtAccountName}
          placeholder="e.g. My YouTube Channel"
        />
        <SaveButton onClick={handleConnectYouTube} loading={connectingYt} label="Connect YouTube" />
      </SectionCard>

      {/* Section 4: Connected Accounts */}
      <SectionCard title="Connected Accounts">
        {loadingAccounts ? (
          <div style={{ color: COLORS.MUTED, padding: "20px 0" }}>Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div
            style={{
              color: COLORS.MUTED,
              fontSize: "14px",
              textAlign: "center",
              padding: "32px",
              background: COLORS.BG,
              borderRadius: "8px",
              border: `1px dashed ${COLORS.BORDER}`,
            }}
          >
            No accounts connected yet.
            <br />
            <span style={{ fontSize: "12px" }}>
              Use the forms above to connect Instagram or YouTube.
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {accounts.map((acc) => (
              <div
                key={acc.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 16px",
                  background: COLORS.BG,
                  borderRadius: "8px",
                  border: `1px solid ${COLORS.BORDER}`,
                }}
              >
                <span style={{ fontSize: "22px" }}>{PLATFORM_ICONS[acc.platform] || "🔗"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: COLORS.TEXT }}>
                    {acc.account_name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: COLORS.MUTED,
                      textTransform: "capitalize",
                      marginTop: "2px",
                    }}
                  >
                    {acc.platform}
                  </div>
                </div>
                <span
                  style={{
                    background: acc.is_active ? COLORS.SUCCESS + "22" : "#ffffff11",
                    color: acc.is_active ? COLORS.SUCCESS : COLORS.MUTED,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {acc.is_active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => handleDisconnect(acc.id)}
                  style={{
                    background: COLORS.ERROR + "22",
                    color: COLORS.ERROR,
                    border: `1px solid ${COLORS.ERROR}`,
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
