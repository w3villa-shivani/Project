import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showAdminSecret, setShowAdminSecret] = useState(false);
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

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

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

          <button onClick={() => socialLogin("facebook")} className="btn-social">
            Continue with Facebook
          </button>

          <button onClick={() => socialLogin("microsoft")} className="btn-social">
            Continue with Microsoft
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