import { useState, useEffect } from "react";
import axios from "../api/axios";
import Layout from "../components/Layout";
import "../styles/payment.css";

export default function Payment() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      duration: "Unlimited",
      features: ["Basic features", "Limited access"],
    },
    {
      id: "silver",
      name: "Silver",
      price: 0,
      duration: "1 Hour",
      features: ["All basic features", "Priority support", "Advanced tools"],
    },
    {
      id: "gold",
      name: "Gold",
      price: 0,
      duration: "6 Hours",
      features: ["All Silver features", "Premium tools", "24/7 support"],
    },
  ];

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
  }, []);

  const handleActivatePlan = async (plan) => {
    setLoading(true);
    setMessage(null);
    setSelectedPlan(plan);

    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.post("/payment/activate-plan", {
        userId,
        planId: plan.id,
      });

      if (response.data.success) {
        setMessage({ type: "success", text: `${plan.name} plan activated successfully!` });
        setUserPlan({
          plan: plan.id,
          status: "active",
          expiration: response.data.user.planExpiration,
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || "Failed to activate plan" });
    }

    setLoading(false);
  };

  return (
    <Layout showBackButton backLink="/home">
      <div className="payment-container">
        <h1>Pricing Plans</h1>

        {userPlan && (
          <div className="current-plan">
            <h3>Current Plan: {userPlan.plan.charAt(0).toUpperCase() + userPlan.plan.slice(1)}</h3>
            <p>Status: {userPlan.status}</p>
            {userPlan.expiration && (
              <p>Expires: {new Date(userPlan.expiration).toLocaleString()}</p>
            )}
          </div>
        )}

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${selectedPlan?.id === plan.id ? "selected" : ""} ${
                userPlan?.plan === plan.id && userPlan?.status === "active" ? "current" : ""
              }`}
            >
              <h2>{plan.name}</h2>
              <p className="price">Free</p>
              <p className="duration">{plan.duration}</p>
              <ul>
                {plan.features.map((feature, idx) => (
                  <li key={idx}>✓ {feature}</li>
                ))}
              </ul>
              <button
                onClick={() => handleActivatePlan(plan)}
                className="plan-button"
                disabled={loading || (userPlan?.plan === plan.id && userPlan?.status === "active")}
              >
                {userPlan?.plan === plan.id && userPlan?.status === "active"
                  ? "Current Plan"
                  : loading && selectedPlan?.id === plan.id
                  ? "Activating..."
                  : "Activate"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

