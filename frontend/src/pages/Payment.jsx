import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../api/axios";
import Layout from "../components/Layout";
import "../styles/payment.css";

// Helper functions (defined at top level before use)
const getPlanIcon = (planId) => {
  const icons = {
    free: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    ),
    silver: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    ),
    gold: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    ),
  };
  return icons[planId];
};

const getPlanFeatures = (planId) => {
  const features = {
    free: ["Basic features", "Limited access"],
    silver: ["All basic features", "Priority support", "Advanced tools"],
    gold: ["All Silver features", "Premium tools", "24/7 support"],
  };
  return features[planId] || [];
};

const formatRemainingTime = (ms) => {
  if (!ms || ms <= 0) return "Expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m remaining`;
};

export default function Payment() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [plans, setPlans] = useState([]);

  // Initialize Stripe
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        // Fetch publishable key from backend
        const response = await axios.get("/payment/plans");
        if (response.data.publishableKey) {
          const stripePromise = await loadStripe(response.data.publishableKey);
          setStripe(stripePromise);
        } else {
          // Fallback to hardcoded key
          const stripePromise = await loadStripe(
            "pk_test_51TEoJoFjgzvkSgEBjY5h73z9s4a0ikNyIUatWR9IXnsh6SvOCv2NxM77B7uf9kf7zv3t5GzBc7g4ugKEk0HEaVaW00egfjf9JX"
          );
          setStripe(stripePromise);
        }
      } catch (error) {
        console.error("Error initializing Stripe:", error);
      }
    };
    initializeStripe();
  }, []);

  // Fetch available plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get("/payment/plans");
        if (response.data.success) {
          const plansWithIcons = response.data.plans.map((plan) => ({
            ...plan,
            icon: getPlanIcon(plan.id),
            features: getPlanFeatures(plan.id),
          }));
          setPlans(plansWithIcons);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
      }
    };
    fetchPlans();
  }, []);

  // Fetch user's current plan
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (userId) {
          const response = await axios.get(`/payment/plan-status/${userId}`);
          setUserPlan(response.data);
        }
      } catch (error) {
        console.error("Error fetching plan status:", error);
      }
    };

    fetchUserPlan();
    // Refresh plan status every 30 seconds
    const interval = setInterval(fetchUserPlan, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleActivatePlan = async (plan) => {
    if (loading) return;
    
    setLoading(true);
    setMessage(null);
    setSelectedPlan(plan);

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setMessage({
          type: "error",
          text: "Please log in first",
        });
        setLoading(false);
        return;
      }

      // Free plan doesn't require Stripe payment
      if (plan.id === "free") {
        const response = await axios.post("/payment/activate-free", {
          userId,
        });

        if (response.data.success) {
          setMessage({
            type: "success",
            text: "Free plan activated successfully!",
          });
          setUserPlan({
            plan: plan.id,
            status: "active",
            expiration: null,
            remainingTime: 0,
          });
        }
      } else {
        // Paid plans use Stripe checkout
        if (!stripe) {
          setMessage({
            type: "error",
            text: "Payment system not ready",
          });
          setLoading(false);
          return;
        }

        const response = await axios.post("/payment/create-checkout-session", {
          userId,
          planId: plan.id,
        });

        if (response.data.success) {
          const result = await stripe.redirectToCheckout({
            sessionId: response.data.sessionId,
          });

          if (result.error) {
            setMessage({
              type: "error",
              text: result.error.message,
            });
          }
        }
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to activate plan",
      });
    }

    setLoading(false);
  };

  return (
    <Layout showBackButton backLink="/home">
      <div className="payment-container">
        <h1>Pricing Plans</h1>

        {userPlan && (
          <div className="current-plan">
            <span className="current-plan-badge">
              Current Plan:{" "}
              {userPlan.plan.charAt(0).toUpperCase() + userPlan.plan.slice(1)}
            </span>
            <p>
              Status:{" "}
              <span className={`status-badge ${userPlan.status}`}>
                {userPlan.status}
              </span>
            </p>
            {userPlan.expiration && (
              <>
                <p>Expires: {new Date(userPlan.expiration).toLocaleString()}</p>
                <p className="remaining-time">{formatRemainingTime(userPlan.remainingTime)}</p>
              </>
            )}
          </div>
        )}

        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${selectedPlan?.id === plan.id ? "selected" : ""} ${
                userPlan?.plan === plan.id && userPlan?.status === "active"
                  ? "current"
                  : ""
              } ${plan.id}`}
            >
              <div className="plan-icon">{plan.icon}</div>
              <h2>{plan.name}</h2>
              <p className="price">{plan.displayPrice}</p>
              <p className="duration">{plan.duration}</p>
              <ul>
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleActivatePlan(plan)}
                className="plan-button"
                disabled={
                  loading ||
                  (userPlan?.plan === plan.id && userPlan?.status === "active")
                }
              >
                {userPlan?.plan === plan.id && userPlan?.status === "active"
                  ? "Current Plan"
                  : loading && selectedPlan?.id === plan.id
                    ? "Processing..."
                    : plan.id === "free"
                      ? "Activate"
                      : `Buy - ${plan.displayPrice}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
