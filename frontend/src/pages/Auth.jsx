import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    adminSecret: "",
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      const res = await API.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } else {
      try {
        const signupData = {
          name: form.name,
          email: form.email,
          password: form.password,
        };

        if (form.adminSecret) {
          signupData.adminSecret = form.adminSecret;
        }

        const res = await API.post("/auth/signup", signupData);

        alert(res.data.message);
        setIsLogin(true);
      } catch (err) {
        if (err.response?.status === 409) {
          alert(
            "An account with this email already exists. Please login instead."
          );
          setIsLogin(true);
        } else {
          alert(err.response?.data?.message || "Signup failed. Please try again.");
        }
      }
    }
  };

  // Get API URL
  const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || "http://localhost:5000";
  };

  const socialLogin = (provider) => {
    const apiUrl = getApiUrl();
    window.location.href = `${apiUrl}/auth/${provider}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
          <p>{isLogin ? "Sign in to continue" : "Join us today"}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>

          {!isLogin && (
            <>
              <div
                className="admin-secret-toggle"
                onClick={() => setShowAdminSecret(!showAdminSecret)}
              >
                {showAdminSecret ? "▼ Hide Admin Key" : "► Have an Admin Key?"}
              </div>

              {showAdminSecret && (
                <input
                  type="password"
                  placeholder="Admin Secret Key (optional)"
                  value={form.adminSecret}
                  onChange={(e) =>
                    setForm({ ...form, adminSecret: e.target.value })
                  }
                />
              )}
            </>
          )}

          <button type="submit" className="btn-submit">
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="social-buttons">
          <button onClick={() => socialLogin("google")} className="btn-social">
            Continue with Google
          </button>
        </div>

        <p className="auth-toggle">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}