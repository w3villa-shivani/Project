import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <Layout showBackButton backLink="/payment">
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>✕</div>
          <h1 style={styles.title}>Payment Cancelled</h1>
          <p style={styles.message}>
            Your payment was cancelled. You can try again whenever you're ready.
          </p>
          
          <div style={styles.buttonGroup}>
            <button
              onClick={() => navigate("/payment")}
              style={{ ...styles.button, backgroundColor: "#3498db" }}
            >
              Back to Pricing
            </button>
            <button
              onClick={() => navigate("/home")}
              style={{ ...styles.button, backgroundColor: "#95a5a6" }}
            >
              Go Home
            </button>
          </div>
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
  title: {
    color: "#333",
    marginBottom: "15px",
    fontSize: "24px",
  },
  message: {
    color: "#666",
    fontSize: "16px",
    marginBottom: "30px",
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
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    margin: "0 10px",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
};
