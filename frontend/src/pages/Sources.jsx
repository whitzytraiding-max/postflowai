import { useEffect, useState } from "react";
import { getSources, createSource, updateSource, deleteSource, getConnectedAccounts } from "../lib/api";

const COLORS = {
  BG: "#0B0B18",
  SURFACE: "#10101C",
  CARD: "#14142A",
  PRIMARY: "#00D4FF",
  SECONDARY: "#7C3AED",
  TEXT: "#E2E8F0",
  MUTED: "#64748B",
  ERROR: "#EF4444",
};

const PLATFORM_COLORS = {
  tiktok: { bg: "#FF006611", color: "#FF0066", label: "TikTok" },
  instagram: { bg: "#7C3AED22", color: "#A855F7", label: "Instagram" },
  youtube: { bg: "#EF444422", color: "#EF4444", label: "YouTube" },
};

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: type === "error" ? COLORS.ERROR : "#10B981",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: "8px",
        fontWeight: 600,
        fontSize: "14px",
        zIndex: 999,
      }}
    >
      {msg}
    </div>
  );
}

const inputStyle = {
  background: "#0B0B18",
  border: "1px solid #1E1E35",
  borderRadius: "8px",
  color: COLORS.TEXT,
  padding: "10px 12px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  color: COLORS.MUTED,
  marginBottom: "6px",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

export default function Sources() {
  const [sources, setSources] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    platform: "youtube",
    tag: "",
    min_views: 50000,
    max_age_days: 7,
    videos_per_day: 3,
    post_to_platform: "youtube",
    instagram_account_id: "",
    youtube_account_id: "",
    language: "any",
    auto_approve: false,
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [srcData, accData] = await Promise.all([
        getSources(),
        getConnectedAccounts().catch(() => []),
      ]);
      setSources(srcData);
      setAccounts(accData);
    } catch {
      showToast("Failed to load sources", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadSources() {
    try {
      const data = await getSources();
      setSources(data);
    } catch {
      showToast("Failed to load sources", "error");
    }
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.tag.trim()) return showToast("Tag is required", "error");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        instagram_account_id: form.instagram_account_id || null,
        youtube_account_id: form.youtube_account_id || null,
      };
      await createSource(payload);
      showToast("Source added!");
      setForm({ platform: "youtube", tag: "", min_views: 50000, max_age_days: 7, videos_per_day: 3, post_to_platform: "youtube", instagram_account_id: "", youtube_account_id: "", language: "any", auto_approve: false });
      await loadSources();
    } catch {
      showToast("Failed to create source", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(source) {
    try {
      const updated = await updateSource(source.id, { is_active: !source.is_active });
      setSources((prev) => prev.map((s) => (s.id === source.id ? updated : s)));
    } catch {
      showToast("Failed to update source", "error");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this source?")) return;
    try {
      await deleteSource(id);
      setSources((prev) => prev.filter((s) => s.id !== id));
      showToast("Source deleted");
    } catch {
      showToast("Failed to delete", "error");
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Sources</h1>
        <p style={{ color: COLORS.MUTED, marginTop: "4px", fontSize: "14px" }}>
          Define hashtags and keywords to monitor for viral content
        </p>
      </div>

      {/* Add New Source form */}
      <div
        style={{
          background: COLORS.CARD,
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid #1E1E35",
          marginBottom: "28px",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>
          Add New Source
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Platform</label>
              <select name="platform" value={form.platform} onChange={handleFormChange} style={inputStyle}>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tag / Keyword</label>
              <input
                name="tag"
                value={form.tag}
                onChange={handleFormChange}
                placeholder="#forex"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Post To</label>
              <select name="post_to_platform" value={form.post_to_platform} onChange={handleFormChange} style={inputStyle}>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          {/* Account selectors — shown based on post_to_platform */}
          {(form.post_to_platform === "instagram" || form.post_to_platform === "both") && (
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Post to Instagram Account</label>
              <select name="instagram_account_id" value={form.instagram_account_id} onChange={handleFormChange} style={inputStyle}>
                <option value="">— Any active Instagram account —</option>
                {accounts.filter((a) => a.platform === "instagram" && a.is_active).map((a) => (
                  <option key={a.id} value={a.id}>{a.account_name}</option>
                ))}
              </select>
            </div>
          )}
          {(form.post_to_platform === "youtube" || form.post_to_platform === "both") && (
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Post to YouTube Account</label>
              <select name="youtube_account_id" value={form.youtube_account_id} onChange={handleFormChange} style={inputStyle}>
                <option value="">— Any active YouTube account —</option>
                {accounts.filter((a) => a.platform === "youtube" && a.is_active).map((a) => (
                  <option key={a.id} value={a.id}>{a.account_name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={labelStyle}>Min Views</label>
              <input
                name="min_views"
                type="number"
                value={form.min_views}
                onChange={handleFormChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Max Age (days)</label>
              <input
                name="max_age_days"
                type="number"
                value={form.max_age_days}
                onChange={handleFormChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Videos Per Day</label>
              <input
                name="videos_per_day"
                type="number"
                value={form.videos_per_day}
                onChange={handleFormChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Language</label>
              <select name="language" value={form.language} onChange={handleFormChange} style={inputStyle}>
                <option value="any">Any Language</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="ar">Arabic</option>
                <option value="fr">French</option>
                <option value="hi">Hindi</option>
                <option value="pt">Portuguese</option>
                <option value="id">Indonesian</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="tr">Turkish</option>
                <option value="ru">Russian</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                name="auto_approve"
                checked={form.auto_approve}
                onChange={handleFormChange}
                style={{ width: "16px", height: "16px", accentColor: "#10B981", cursor: "pointer" }}
              />
              <span style={{ fontSize: "13px", color: COLORS.TEXT, fontWeight: 500 }}>
                Auto-approve videos
              </span>
              <span style={{ fontSize: "12px", color: COLORS.MUTED }}>
                — skip the queue, post immediately when scheduled
              </span>
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: submitting ? COLORS.MUTED : COLORS.PRIMARY,
              color: "#0B0B18",
              border: "none",
              borderRadius: "8px",
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Adding..." : "Add Source"}
          </button>
        </form>
      </div>

      {/* Sources list */}
      {loading ? (
        <div style={{ color: COLORS.MUTED, textAlign: "center", padding: "40px" }}>Loading sources...</div>
      ) : sources.length === 0 ? (
        <div
          style={{
            background: COLORS.CARD,
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            color: COLORS.MUTED,
            border: "1px solid #1E1E35",
          }}
        >
          No sources yet. Add your first source above.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sources.map((source) => {
            const pc = PLATFORM_COLORS[source.platform] || { bg: "#ffffff11", color: "#fff", label: source.platform };
            const viewsLabel =
              source.min_views >= 1_000_000
                ? `${source.min_views / 1_000_000}M+`
                : source.min_views >= 1_000
                ? `${source.min_views / 1_000}K+`
                : `${source.min_views}+`;
            const igAccount = source.instagram_account_id
              ? accounts.find((a) => a.id === source.instagram_account_id)
              : null;
            const ytAccount = source.youtube_account_id
              ? accounts.find((a) => a.id === source.youtube_account_id)
              : null;

            return (
              <div
                key={source.id}
                style={{
                  background: COLORS.CARD,
                  borderRadius: "12px",
                  padding: "18px 20px",
                  border: "1px solid #1E1E35",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  opacity: source.is_active ? 1 : 0.55,
                }}
              >
                {/* Platform badge */}
                <span
                  style={{
                    background: pc.bg,
                    color: pc.color,
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {pc.label}
                </span>

                {/* Tag */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: COLORS.TEXT }}>
                    {source.tag}
                  </div>
                  <div style={{ fontSize: "12px", color: COLORS.MUTED, marginTop: "2px" }}>
                    {viewsLabel} views · {source.max_age_days} days · {source.videos_per_day}/day →{" "}
                    <span style={{ textTransform: "capitalize" }}>{source.post_to_platform}</span>
                    {igAccount && (
                      <span style={{ marginLeft: "6px", background: "#7C3AED22", color: "#A855F7", padding: "1px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>
                        📸 {igAccount.account_name}
                      </span>
                    )}
                    {ytAccount && (
                      <span style={{ marginLeft: "6px", background: "#EF444422", color: "#EF4444", padding: "1px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>
                        ▶️ {ytAccount.account_name}
                      </span>
                    )}
                    {source.language && source.language !== "any" && (
                      <span style={{ marginLeft: "8px", background: "#7C3AED22", color: "#A78BFA", padding: "1px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>
                        {source.language.toUpperCase()}
                      </span>
                    )}
                    {source.auto_approve && (
                      <span style={{ marginLeft: "8px", background: "#10B98122", color: "#10B981", padding: "1px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>
                        AUTO-APPROVE
                      </span>
                    )}
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => handleToggle(source)}
                  style={{
                    background: source.is_active ? COLORS.PRIMARY + "22" : "#ffffff11",
                    color: source.is_active ? COLORS.PRIMARY : COLORS.MUTED,
                    border: `1px solid ${source.is_active ? COLORS.PRIMARY : "#1E1E35"}`,
                    borderRadius: "6px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {source.is_active ? "Active" : "Paused"}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(source.id)}
                  style={{
                    background: "transparent",
                    color: COLORS.MUTED,
                    border: "1px solid #1E1E35",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.ERROR; e.currentTarget.style.borderColor = COLORS.ERROR; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.MUTED; e.currentTarget.style.borderColor = "#1E1E35"; }}
                  title="Delete source"
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
