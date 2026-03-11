//OAuthSucess.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

// Get API URL - uses VITE_API_URL if set, otherwise defaults to localhost
const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || "http://localhost:5000";
};

export default function OAuthSuccess() {
  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (token) {
        localStorage.setItem("token", token);
        
        // call backend to get user profile (role etc.)
        try {
          const apiUrl = getApiUrl();
          const res = await fetch(`${apiUrl}/auth/me`, {
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
          console.error("failed to fetch user info", e);
        }
        navigate("/home");
      }
    };
    handleToken();
  }, []);

  return (
    <Layout>
      <div className="oauth-loading">
        <h2>Logging you in...</h2>
      </div>
    </Layout>
  );
}
