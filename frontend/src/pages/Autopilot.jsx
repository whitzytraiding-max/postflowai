import { useEffect, useState } from "react";
import api from "../lib/api";

const C = {
  BG: "#0B0B18", SURFACE: "#10101C", CARD: "#14142A",
  PRIMARY: "#00D4FF", SECONDARY: "#7C3AED",
  TEXT: "#E2E8F0", MUTED: "#64748B",
  SUCCESS: "#10B981", ERROR: "#EF4444", GOLD: "#FFB800",
};

const label = {
  display: "block", fontSize: "12px", color: C.MUTED,
  marginBottom: "6px", fontWeight: 500,
  textTransform: "uppercase", letterSpacing: "0.04em",
};

const input = {
  background: C.BG, border: "1px solid #1E1E35",
  borderRadius: "8px", color: C.TEXT,
  padding: "10px 12px", fontSize: "14px", width: "100%", outline: "none",
};

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px",
      background: type === "error" ? C.ERROR : C.SUCCESS,
      color: "#fff", padding: "12px 20px", borderRadius: "8px",
      fontWeight: 600, fontSize: "14px", zIndex: 999,
    }}>{msg}</div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: C.CARD, borderRadius: "12px", padding: "20px",
      border: "1px solid #1E1E35", flex: 1,
    }}>
      <div style={{ fontSize: "12px", color: C.MUTED, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "32px", fontWeight: 800, color: color || C.PRIMARY }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: C.MUTED, marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { value: i, label: `${h}:00 ${ampm}` };
});

export default function Autopilot({ userId }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    enabled: false,
    posts_per_day: 5,
    start_hour: 8,
    end_hour: 22,
    duration_type: "days",
    days: 30,
    end_date: "",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/autopilot?user_id=${userId}`);
      const data = res.data;
      setSettings(data);
      setForm(f => ({
        ...f,
        enabled: data.enabled,
        posts_per_day: data.posts_per_day,
        start_hour: data.start_hour,
        end_hour: data.end_hour,
      }));
    } catch (e) {
      showToast("Failed to load autopilot settings", "error");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : (type === "number" ? Number(value) : value) }));
  }

  async function handleSave(enabledOverride) {
    setSaving(true);
    const payload = {
      user_id: userId,
      enabled: enabledOverride !== undefined ? enabledOverride : form.enabled,
      posts_per_day: form.posts_per_day,
      start_hour: form.start_hour,
      end_hour: form.end_hour,
    };
    if (form.duration_type === "days") payload.days = form.days;
    else if (form.end_date) payload.end_date = form.end_date;

    try {
      await api.post("/autopilot", payload);
      showToast(payload.enabled ? "Autopilot enabled!" : "Autopilot paused");
      await load();
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAutopilot() {
    const newEnabled = !form.enabled;
    setForm(f => ({ ...f, enabled: newEnabled }));
    await handleSave(newEnabled);
  }

  function formatHour(h) {
    const ampm = h < 12 ? "AM" : "PM";
    const hour = h % 12 || 12;
    return `${hour}:00 ${ampm}`;
  }

  function formatNextPost(isoStr) {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (loading) return <div style={{ color: C.MUTED, padding: "40px", textAlign: "center" }}>Loading...</div>;

  const isOn = form.enabled;

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Autopilot</h1>
        <p style={{ color: C.MUTED, marginTop: "4px", fontSize: "14px" }}>
          Set it and forget it — PostFlow finds and posts videos automatically every day.
        </p>
      </div>

      {/* Big toggle card */}
      <div style={{
        background: C.CARD, borderRadius: "16px", padding: "28px",
        border: `1px solid ${isOn ? C.PRIMARY + "44" : "#1E1E35"}`,
        marginBottom: "24px",
        boxShadow: isOn ? `0 0 24px ${C.PRIMARY}18` : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: isOn ? C.PRIMARY : C.TEXT }}>
              {isOn ? "🟢 Autopilot is ON" : "⚪ Autopilot is OFF"}
            </div>
            <div style={{ fontSize: "13px", color: C.MUTED, marginTop: "4px" }}>
              {isOn
                ? `Posting ${form.posts_per_day} videos/day between ${formatHour(form.start_hour)} – ${formatHour(form.end_hour)}`
                : "Enable to start automatically posting videos every day"}
            </div>
          </div>
          <button
            onClick={toggleAutopilot}
            disabled={saving}
            style={{
              background: isOn ? "#EF444422" : C.PRIMARY,
              color: isOn ? C.ERROR : "#0B0B18",
              border: isOn ? `1px solid ${C.ERROR}` : "none",
              borderRadius: "10px", padding: "12px 28px",
              fontWeight: 700, fontSize: "15px", cursor: "pointer",
              minWidth: "120px",
            }}
          >
            {saving ? "..." : isOn ? "Pause" : "Enable"}
          </button>
        </div>
      </div>

      {/* Today's status */}
      {settings && (
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
          <StatCard
            label="Posted Today"
            value={settings.posted_today ?? 0}
            sub={`of ${form.posts_per_day} scheduled`}
            color={C.SUCCESS}
          />
          <StatCard
            label="Scheduled Today"
            value={settings.scheduled_today ?? 0}
            sub="videos queued up"
            color={C.PRIMARY}
          />
          <StatCard
            label="Next Post"
            value={settings.next_post_at ? formatNextPost(settings.next_post_at) : "—"}
            sub={settings.next_post_at ? "UTC time" : "no posts scheduled"}
            color={C.GOLD}
          />
          <StatCard
            label="In Queue"
            value={settings.pending_in_queue ?? 0}
            sub="pending videos ready"
            color={C.SECONDARY}
          />
        </div>
      )}

      {/* Settings */}
      <div style={{ background: C.CARD, borderRadius: "12px", padding: "24px", border: "1px solid #1E1E35" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>Schedule Settings</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          <div>
            <label style={label}>Posts Per Day</label>
            <input name="posts_per_day" type="number" min="1" max="20" value={form.posts_per_day} onChange={handleChange} style={input} />
            <div style={{ fontSize: "11px", color: C.MUTED, marginTop: "4px" }}>Max 20 per day</div>
          </div>
          <div>
            <label style={label}>Start Posting From</label>
            <select name="start_hour" value={form.start_hour} onChange={handleChange} style={input}>
              {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Stop Posting At</label>
            <select name="end_hour" value={form.end_hour} onChange={handleChange} style={input}>
              {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={label}>Run For</label>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <select name="duration_type" value={form.duration_type} onChange={handleChange} style={{ ...input, width: "160px" }}>
              <option value="days">Number of days</option>
              <option value="date">Until a date</option>
              <option value="forever">Run forever</option>
            </select>
            {form.duration_type === "days" && (
              <input name="days" type="number" min="1" max="365" value={form.days} onChange={handleChange}
                placeholder="30" style={{ ...input, width: "120px" }} />
            )}
            {form.duration_type === "date" && (
              <input name="end_date" type="date" value={form.end_date} onChange={handleChange}
                style={{ ...input, width: "180px" }} />
            )}
            {form.duration_type === "forever" && (
              <span style={{ color: C.MUTED, fontSize: "13px" }}>Runs until you pause it</span>
            )}
          </div>
        </div>

        <div style={{ padding: "14px 16px", background: "#7C3AED11", borderRadius: "8px", border: "1px solid #7C3AED33", marginBottom: "20px", fontSize: "13px", color: C.MUTED }}>
          💡 PostFlow runs discovery every 6 hours to keep your queue full. Videos are never double-posted — each URL is only ever used once.
        </div>

        <button
          onClick={() => handleSave()}
          disabled={saving}
          style={{
            background: C.PRIMARY, color: "#0B0B18", border: "none",
            borderRadius: "8px", padding: "10px 28px",
            fontWeight: 700, fontSize: "14px", cursor: "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
