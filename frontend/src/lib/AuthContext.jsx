import { createContext, useContext, useState, useEffect } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("pf_token");
    if (!token) { setLoading(false); return; }
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    api.get("/auth/me")
      .then((r) => setUser({ ...r.data, is_admin: r.data.is_admin || false }))
      .catch(() => { localStorage.removeItem("pf_token"); })
      .finally(() => setLoading(false));
  }, []);

  function login(data) {
    localStorage.setItem("pf_token", data.token);
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser({ user_id: data.user_id, email: data.email, api_key: data.api_key, is_admin: data.is_admin || false });
  }

  function logout() {
    localStorage.removeItem("pf_token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
