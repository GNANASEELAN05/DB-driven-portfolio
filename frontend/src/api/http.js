// src/api/http.js
import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  "https://db-driven-portfolio-idt9.onrender.com/api";

// create instance
const http = axios.create({
  baseURL,
});

// 🔥 ALWAYS attach latest token dynamically
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // remove old header first
    if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }

    // attach fresh token only if token exists
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔥 AUTO LOGOUT IF TOKEN INVALID — ONLY on admin pages
http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      const isAdminPage = window.location.pathname.startsWith("/admin");
      if (isAdminPage) {
        localStorage.removeItem("token");
        sessionStorage.clear();
        window.location.href = "/admin-login";
      }
    }
    return Promise.reject(error);
  }
);

export default http;