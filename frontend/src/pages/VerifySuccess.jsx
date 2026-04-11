import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function VerifySuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Navigate based on user role
          const user = JSON.parse(
            localStorage.getItem("user") || "null"
          );

          if (user?.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/home");
          }

          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleProceed = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (user?.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/home");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card verification-card">
        <div className="verification-icon">
          <div className="icon-success">✓</div>
        </div>

        <h2>Email Verified Successfully!</h2>

        <p className="verification-message">
          Your email has been verified. You can now login and access your
          account.
        </p>

        <p className="countdown-text">
          Redirecting to your dashboard in {countdown} seconds...
        </p>

        <button onClick={handleProceed} className="btn-submit">
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
}