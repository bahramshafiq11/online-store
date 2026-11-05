import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the login token to every request
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// If the token is expired or invalid, log out and go to the login page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/users/login");
    const hadUser = localStorage.getItem("user");

    if (error.response?.status === 401 && hadUser && !isLoginRequest) {
      localStorage.removeItem("user");
      window.location.href = "/login?expired=1";
    }

    return Promise.reject(error);
  }
);

export default api;