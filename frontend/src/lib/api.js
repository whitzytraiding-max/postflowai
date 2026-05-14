import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Sources
export const getSources = (userId) =>
  api.get(`/sources?user_id=${userId}`).then((r) => r.data);

export const createSource = (data) =>
  api.post("/sources", data).then((r) => r.data);

export const updateSource = (id, data) =>
  api.patch(`/sources/${id}`, data).then((r) => r.data);

export const deleteSource = (id) =>
  api.delete(`/sources/${id}`).then((r) => r.data);

// Queue
export const getQueue = (userId, status) => {
  const params = new URLSearchParams({ user_id: userId });
  if (status) params.append("status", status);
  return api.get(`/queue?${params}`).then((r) => r.data);
};

export const approveVideo = (id) =>
  api.post(`/queue/${id}/approve`).then((r) => r.data);

export const deleteFromQueue = (id) =>
  api.delete(`/queue/${id}`).then((r) => r.data);

export const updateQueueItem = (id, data) =>
  api.patch(`/queue/${id}`, data).then((r) => r.data);

// Discovery
export const runDiscovery = (userId) =>
  api.post(`/discovery/run?user_id=${userId}`).then((r) => r.data);

export const getDiscoveryStatus = () =>
  api.get("/discovery/status").then((r) => r.data);

// Accounts
export const getAccounts = (userId) =>
  api.get(`/accounts?user_id=${userId}`).then((r) => r.data);

export const addAccount = (data) =>
  api.post("/accounts", data).then((r) => r.data);

export const deleteAccount = (id) =>
  api.delete(`/accounts/${id}`).then((r) => r.data);

// Pipeline
export const runPipeline = (videoId, userId) =>
  api.post(`/pipeline/${videoId}/run?user_id=${userId}`).then((r) => r.data);

export const retryVideo = (videoId, userId) =>
  api.post(`/pipeline/${videoId}/retry?user_id=${userId}`).then((r) => r.data);

// Settings
export const getSettings = (userId) =>
  api.get(`/settings/keys?user_id=${userId}`).then((r) => r.data);

export const saveKeys = (data) =>
  api.post("/settings/keys", data).then((r) => r.data);

export const getConnectedAccounts = (userId) =>
  api.get(`/settings/accounts?user_id=${userId}`).then((r) => r.data);

export const connectInstagram = (data) =>
  api.post("/settings/connect/instagram", data).then((r) => r.data);

export const connectYouTube = (data) =>
  api.post("/settings/connect/youtube", data).then((r) => r.data);

export const disconnectAccount = (id) =>
  api.delete(`/settings/accounts/${id}`).then((r) => r.data);

// History
export const getHistory = (userId) =>
  api.get(`/post-history?user_id=${userId}`).then((r) => r.data);

export default api;
