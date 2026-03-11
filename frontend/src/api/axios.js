//api/axios.js

import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

console.log("API Base URL:", import.meta.env.VITE_API_URL || "http://localhost:5000");

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

// Add response interceptor for better error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_NETWORK") {
      console.error("Network error - Backend may be unreachable:", error.message);
    } else if (error.response?.status === 404) {
      console.error("Endpoint not found:", error.config?.url);
    }
    return Promise.reject(error);
  }
);

export default API;
