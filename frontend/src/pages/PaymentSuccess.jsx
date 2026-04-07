import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Layout from "../components/Layout";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get("sessionId");
        const planId = searchParams.get("planId");

        if (!sessionId || !planId) {
          setStatus("error");
          setMessage("Invalid session parameters");
          return;
        }

        // Verify the checkout session
        const response = await axios.get(`/payment/checkout-session/${sessionId}`);

        if (response.data.paymentStatus === "paid") {
          setStatus("success");
          setMessage(
            `Payment successful! Your ${planId.toUpperCase()} plan is now active.`
          );

          // Redirect to payment page after 3 seconds
          setTimeout(() => {
            navigate("/payment");
          }, 3000);
        } else {
          setStatus("pending");
          setMessage("Payment is being processed. Please wait...");

          // Retry after 2 seconds
          setTimeout(verifyPayment, 2000);
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("error");
        setMessage(
          error.response?.data?.error || "Failed to verify payment"
        );
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <Layout showBackButton backLink="/payment">
      <div style={styles.container}>
        <div style={styles.card}>
          {status === "verifying" && (
            <>
              <div style={styles.spinner}></div>
              <h1 style={styles.title}>Verifying Payment...</h1>
              <p style={styles.message}>Please wait while we confirm your payment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div style={styles.successIcon}>✓</div>
              <h1 style={styles.title}>Payment Successful!</h1>
              <p style={styles.message}>{message}</p>
              <p style={styles.subtext}>Redirecting to payments page...</p>
            </>
          )}

          {status === "pending" && (
            <>
              <div style={styles.spinner}></div>
              <h1 style={styles.title}>Processing Payment...</h1>
              <p style={styles.message}>{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div style={styles.errorIcon}>✕</div>
              <h1 style={styles.title}>Payment Error</h1>
              <p style={styles.message}>{message}</p>
              <button
                onClick={() => navigate("/payment")}
                style={styles.button}
              >
                Back to Payments
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "60vh",
    padding: "20px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "40px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    maxWidth: "500px",
    width: "100%",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  title: {
    color: "#333",
    marginBottom: "15px",
    fontSize: "24px",
  },
  message: {
    color: "#666",
    fontSize: "16px",
    marginBottom: "10px",
  },
  subtext: {
    color: "#999",
    fontSize: "14px",
    marginTop: "15px",
  },
  successIcon: {
    width: "60px",
    height: "60px",
    backgroundColor: "#4caf50",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    margin: "0 auto 20px",
  },
  errorIcon: {
    width: "60px",
    height: "60px",
    backgroundColor: "#f44336",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    margin: "0 auto 20px",
  },
  button: {
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "20px",
  },
};

// Add CSS animation
const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
