import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach stored token on every request
const token = localStorage.getItem("pf_token");
if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

// Sources
export const getSources = () => api.get("/sources").then((r) => r.data);
export const createSource = (data) => api.post("/sources", data).then((r) => r.data);
export const updateSource = (id, data) => api.patch(`/sources/${id}`, data).then((r) => r.data);
export const deleteSource = (id) => api.delete(`/sources/${id}`).then((r) => r.data);

// Queue
export const getQueue = (status) => {
  const params = status ? `?status=${status}` : "";
  return api.get(`/queue${params}`).then((r) => r.data);
};
export const approveVideo = (id) => api.post(`/queue/${id}/approve`).then((r) => r.data);
export const deleteFromQueue = (id) => api.delete(`/queue/${id}`).then((r) => r.data);
export const updateQueueItem = (id, data) => api.patch(`/queue/${id}`, data).then((r) => r.data);

// Discovery
export const runDiscovery = () => api.post("/discovery/run").then((r) => r.data);
export const getDiscoveryStatus = () => api.get("/discovery/status").then((r) => r.data);

// Accounts
export const getAccounts = () => api.get("/accounts").then((r) => r.data);
export const addAccount = (data) => api.post("/accounts", data).then((r) => r.data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`).then((r) => r.data);

// Pipeline
export const runPipeline = (videoId) => api.post(`/pipeline/${videoId}/run`).then((r) => r.data);
export const retryVideo = (videoId) => api.post(`/pipeline/${videoId}/retry`).then((r) => r.data);

// Settings
export const getSettings = () => api.get("/settings/keys").then((r) => r.data);
export const saveKeys = (data) => api.post("/settings/keys", data).then((r) => r.data);
export const getConnectedAccounts = () => api.get("/settings/accounts").then((r) => r.data);
export const connectInstagram = (data) => api.post("/settings/connect/instagram", data).then((r) => r.data);
export const connectYouTube = (data) => api.post("/settings/connect/youtube", data).then((r) => r.data);
export const disconnectAccount = (id) => api.delete(`/settings/accounts/${id}`).then((r) => r.data);

// Autopilot
export const getAutopilot = () => api.get("/autopilot").then((r) => r.data);
export const saveAutopilot = (data) => api.post("/autopilot", data).then((r) => r.data);

// History
export const getHistory = () => api.get("/post-history").then((r) => r.data);

// Auth
export const authLogin = (data) => api.post("/auth/login", data).then((r) => r.data);
export const authRegister = (data) => api.post("/auth/register", data).then((r) => r.data);
export const authMe = () => api.get("/auth/me").then((r) => r.data);

// Admin — proxy pool
export const getProxies = () => api.get("/admin/proxies").then((r) => r.data);
export const getProxyStats = () => api.get("/admin/proxies/stats").then((r) => r.data);
export const bulkAddProxies = (data) => api.post("/admin/proxies/bulk", data).then((r) => r.data);
export const deleteProxy = (id) => api.delete(`/admin/proxies/${id}`).then((r) => r.data);
export const releaseProxy = (id) => api.post(`/admin/proxies/${id}/release`).then((r) => r.data);

export default api;
