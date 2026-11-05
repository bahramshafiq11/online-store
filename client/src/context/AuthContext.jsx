import { createContext, useContext, useState } from "react";
import api from "../api";

// Read the expiry date stored inside the token
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      if (!stored || isTokenExpired(stored.token)) {
        localStorage.removeItem("user");
        return null;
      }
      return stored;
    } catch {
      return null;
    }
  });

  const saveUser = (data) => {
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  };

  const login = async (email, password) => {
    const res = await api.post("/users/login", { email, password });
    saveUser(res.data);
  };

  const register = async (name, email, password) => {
    const res = await api.post("/users/register", { name, email, password });
    saveUser(res.data);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}