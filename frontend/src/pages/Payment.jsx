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
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      features: ["Basic features", "Limited access"],
    },
    {
      id: "silver",
      name: "Silver",
      price: 4.99,
      duration: "1 Hour",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      ),
      features: ["All basic features", "Priority support", "Advanced tools"],
    },
    {
      id: "gold",
      name: "Gold", 
      price: 9.99,
      duration: "6 Hours",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      ),
      features: ["All Silver features", "Premium tools", "24/7 support"],
    },
  ];

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const cancelled = urlParams.get("cancelled");

    if (success) {
      setMessage({ type: "success", text: "Payment successful! Refreshing plan status..." });
      // Poll for updated plan status
      const pollInterval = setInterval(async () => {
        try {
          const userId = localStorage.getItem("userId");
          if (userId) {
            const response = await axios.get(`/payment/plan-status/${userId}`);
            if (response.data.status === "active" && response.data.plan !== "free") {
              setUserPlan(response.data);
              clearInterval(pollInterval);
            }
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 2000);
      return () => clearInterval(pollInterval);
    } else if (cancelled) {
      setMessage({ type: "error", text: "Payment cancelled." });
    }

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
    if (plan.price === 0) {
      // Free plan - use old logic
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
          setMessage({ type: "success", text: `${plan.name} plan activated!` });
          setUserPlan({
            plan: plan.id,
            status: "active",
            expiration: response.data.user.planExpiration,
          });
        }
      } catch (error) {
        setMessage({ type: "error", text: error.response?.data?.error || "Activation failed" });
      }
      setLoading(false);
      return;
    }

    // Paid plan - create Stripe checkout
    setLoading(true);
    setMessage(null);
    setSelectedPlan(plan);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User not logged in");
      
      const token = localStorage.getItem("token");
      const response = await axios.post("/payment/create-checkout-session", 
        { planId: plan.id },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      window.location.href = response.data.url;
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || "Checkout failed" });
      setLoading(false);
    }
  };

  return (
    <Layout showBackButton backLink="/home">
      <div className="payment-container">
        <h1>Pricing Plans</h1>

        {userPlan && (
          <div className="current-plan">
            <span className="current-plan-badge">
              Current Plan: {userPlan.plan.charAt(0).toUpperCase() + userPlan.plan.slice(1)}
            </span>
            <p>Status: <span className={`status-badge ${userPlan.status}`}>{userPlan.status}</span></p>
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
              } ${plan.id}`}
            >
              <div className="plan-icon">
                {plan.icon}
              </div>
              <h2>{plan.name}</h2>
              <p className="price">${plan.price.toFixed(2)}</p>
              <p className="duration">{plan.duration}</p>
              <ul>
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {feature}
                  </li>
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
                  ? "Processing..."
                  : plan.price === 0 ? "Activate Free" : "Pay Now"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

