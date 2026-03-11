//api/axios.js

import axios from "axios";

// Get API URL from environment variable, fallback to localhost for development
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Default to localhost for local development
  return "http://localhost:5000";
};

const API = axios.create({
  baseURL: getBaseURL(),
});

// Log the base URL for debugging
console.log("API Base URL:", getBaseURL());

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
