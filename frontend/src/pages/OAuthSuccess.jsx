//OAuthSucess.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

// Get API URL - mirrors the logic in api/axios.js
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD) {
    return "/api";
  }
  return "http://localhost:5000";
};

export default function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        console.error("No token found in OAuth success URL");
        navigate("/");
        return;
      }

      localStorage.setItem("token", token);

      // call backend to get user profile (role etc.)
      try {
        const res = await fetch(`${getApiUrl()}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const body = await res.json();

          // Add profile image to user object if available from OAuth
          const userData = {
            ...body.user,
            profileImage: body.user.profileImage || null,
          };

          localStorage.setItem("user", JSON.stringify(userData));

          if (body.user.role === "admin") {
            navigate("/admin");
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch user info", e);
      }
      navigate("/home");
    };
    handleToken();
  }, [navigate]);

  return (
    <Layout>
      <div className="oauth-loading">
        <h2>Logging you in...</h2>
      </div>
    </Layout>
  );
}
