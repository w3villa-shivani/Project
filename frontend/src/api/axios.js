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
  timeout: 30000, // 30 second timeout for requests
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
    // Handle 404 errors - could be serverless cold start or endpoint not found
    if (error.response?.status === 404) {
      console.error("Endpoint not found (404):", error.config?.url);
      
      // Check if this might be a serverless cold start issue
      // by checking if we have a valid token
      const token = localStorage.getItem("token");
      if (token) {
        // Retry the request once after a short delay (helps with cold start)
        return new Promise((resolve) => {
          setTimeout(() => {
            const retryConfig = { ...error.config };
            retryConfig.headers = { ...retryConfig.headers };
            API(retryConfig)
              .then(resolve)
              .catch(() => {
                // If retry also fails, redirect to login
                console.error("Retry failed, redirecting to login");
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/";
              });
          }, 1000); // Wait 1 second before retry (gives server time to wake up)
        });
      }
    }
    
    // Handle network errors
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      console.error("Network error - Backend may be unreachable:", error.message);
      
      // Check if we have a token - if so, try to re-establish connection
      const token = localStorage.getItem("token");
      if (token) {
        // Wait and retry once
        return new Promise((resolve) => {
          setTimeout(() => {
            const retryConfig = { ...error.config };
            retryConfig.headers = { ...retryConfig.headers };
            API(retryConfig)
              .then(resolve)
              .catch(() => {
                // If retry fails, clear auth and redirect
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/";
              });
          }, 2000);
        });
      }
    }
    
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.error("Unauthorized - clearing auth data");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if not already on login page
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;
