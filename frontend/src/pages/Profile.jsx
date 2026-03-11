import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Layout from "../components/Layout";
import "./profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [, setMapCoords] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [, setApiKeySet] = useState(false);
  const autocompleteService = useRef(null);
  const geocoder = useRef(null);
  const [userPlan, setUserPlan] = useState(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === "your_first_api_key_here") {
      console.warn("Google Maps API key missing");
      setApiKeySet(false);
      return;
    }

    setApiKeySet(true);

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        if (window.google.maps.places) {
          autocompleteService.current =
            new window.google.maps.places.AutocompleteService();
        }

        if (window.google.maps.Geocoder) {
          geocoder.current = new window.google.maps.Geocoder();
        }

        setMapsLoaded(true);
      }
    };

    document.head.appendChild(script);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/profile");
      setProfile(res.data);
      setNewAddress(res.data.address || "");

      if (res.data.address) {
        geocodeAddress(res.data.address);
      }

      const userId = localStorage.getItem("userId");
      if (userId) {
        const planRes = await API.get(`/payment/plan-status/${userId}`);
        setUserPlan(planRes.data);
      }
    } catch (err) {
      console.error("Profile fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const uploadImage = async () => {
    if (!image) return;

    try {
      const formData = new FormData();
      formData.append("image", image);

      await API.post("/profile/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchProfile();
      setImage(null);
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const getAddressSuggestions = async (input) => {
    if (!input || !mapsLoaded || !autocompleteService.current) {
      setSuggestions([]);
      return;
    }

    try {
      const result = await autocompleteService.current.getPlacePredictions({
        input,
        types: ["geocode"],
      });

      setSuggestions(result.predictions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const geocodeAddress = async (address) => {
    if (!geocoder.current) return;

    try {
      const result = await geocoder.current.geocode({ address });

      if (result.results.length > 0) {
        const location = result.results[0].geometry.location;

        setMapCoords({
          lat: location.lat(),
          lng: location.lng(),
        });
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const selectAddress = (suggestion) => {
    setNewAddress(suggestion.description);
    setSuggestions([]);
    geocodeAddress(suggestion.description);
  };

  const updateAddress = async () => {
    try {
      const res = await API.put("/profile/address", { address: newAddress });
      setProfile(res.data);
      setEditingAddress(false);
    } catch (err) {
      console.error("Address update failed", err);
    }
  };

  const downloadProfileJSON = () => {
    const data = {
      name: profile.name,
      email: profile.email,
      address: profile.address || "Not set",
      downloadedAt: new Date().toLocaleString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `profile_${Date.now()}.json`;
    link.click();
  };

  const downloadProfileCSV = () => {
    const rows = [
      ["Name", profile.name],
      ["Email", profile.email],
      ["Address", profile.address || "Not set"],
    ];

    const csv =
      "Field,Value\n" +
      rows.map((r) => `${r[0]},${r[1]}`).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `profile_${Date.now()}.csv`;
    link.click();
  };

  if (loading)
    return (
      <Layout>
        <div className="profile-container">
          <p>Loading...</p>
        </div>
      </Layout>
    );

  if (!profile)
    return (
      <Layout>
        <div className="profile-container">
          <p>Profile not found</p>
        </div>
      </Layout>
    );

  return (
    <Layout showBackButton backLink="/home">
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Manage your account information</p>
        </div>

        <div className="profile-content">
          {/* Profile Image Section */}
          <div className="profile-image-section">
            <div className="profile-card">
              <div className="profile-image-container">
                {profile.profileImage ? (
                  <img 
                    src={profile.profileImage} 
                    alt="profile" 
                    className="profile-image"
                  />
                ) : (
                  <div className="no-image">
                    <span>No Image</span>
                  </div>
                )}
              </div>
              
              <div className="upload-section">
                <label className="upload-label">Upload New Photo</label>
                <input
                  type="file"
                  className="upload-input"
                  onChange={(e) => setImage(e.target.files[0])}
                  accept="image/*"
                />
                <button 
                  className="upload-button" 
                  onClick={uploadImage}
                  disabled={!image}
                >
                  Upload Image
                </button>
              </div>
            </div>
          </div>

          {/* User Details Section */}
          <div className="user-details-section">
            <div className="profile-card">
              <div className="section-header">
                <h3>Account Details</h3>
              </div>
              
              <div className="detail-group">
                <span className="detail-label">Name</span>
                <span className="detail-value">{profile.name}</span>
              </div>
              
              <div className="detail-group">
                <span className="detail-label">Email</span>
                <span className="detail-value">{profile.email}</span>
              </div>
              
              {profile.phone && (
                <div className="detail-group">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{profile.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Download Section */}
          <div className="download-section">
            <div className="profile-card">
              <div className="section-header">
                <h3>Download Your Data</h3>
              </div>
              
              <p className="download-description">
                Export your profile data in your preferred format
              </p>
              
              <div className="download-buttons">
                <button 
                  className="download-button json"
                  onClick={downloadProfileJSON}
                >
                  Download JSON
                </button>
                <button 
                  className="download-button csv"
                  onClick={downloadProfileCSV}
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>

          {/* Plan Section */}
          <div className="plan-section">
            <div className="profile-card plan-card-enhanced">
              <div className="section-header">
                <h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                  </svg>
                  Subscription Plan
                </h3>
              </div>
              
              {userPlan && (
                <>
                  <div className="plan-info">
                    <div className="plan-badge-container">
                      <span className={`plan-badge ${userPlan.plan === 'free' ? 'active' : ''} ${userPlan.plan}`}>
                        {userPlan.plan === 'free' && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                          </svg>
                        )}
                        {userPlan.plan === 'silver' && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        )}
                        {userPlan.plan === 'gold' && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        )}
                        {userPlan.plan?.toUpperCase()}
                      </span>
                      {userPlan.status === 'active' && (
                        <span className="plan-status active-status">Active</span>
                      )}
                    </div>
                    {userPlan.expiration && (
                      <div className="plan-expiration">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        Expires: <strong>{new Date(userPlan.expiration).toLocaleString()}</strong>
                      </div>
                    )}
                  </div>
                  
                  <div className="plan-actions">
                    <button 
                      className="upgrade-button"
                      onClick={() => navigate("/payment")}
                    >
                      {userPlan.plan === 'free' ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                          Upgrade Plan
                        </>
                      ) : 'Change Plan'}
                    </button>
                  </div>
                </>
              )}
              
              {!userPlan && (
                <div className="plan-actions">
                  <span className="plan-badge active free">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    FREE
                  </span>
                  <button 
                    className="upgrade-button"
                    onClick={() => navigate("/payment")}
                  >
                    View Plans
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Address Section */}
          <div className="address-section">
            <div className="profile-card">
              <div className="section-header">
                <h3>Address</h3>
              </div>
              
              {!editingAddress ? (
                <div className="address-display">
                  <div className="address-value">
                    <p className={profile.address ? "" : "detail-value muted"}>
                      {profile.address || "No address set"}
                    </p>
                  </div>
                  <button 
                    className="edit-address-button"
                    onClick={() => setEditingAddress(true)}
                  >
                    Edit Address
                  </button>
                </div>
              ) : (
                <div className="address-edit-form">
                  <div className="address-alert info">
                    <p>Start typing your address and select from the suggestions</p>
                  </div>
                  
                  <input
                    type="text"
                    className="address-input"
                    value={newAddress}
                    onChange={(e) => {
                      setNewAddress(e.target.value);
                      getAddressSuggestions(e.target.value);
                    }}
                    placeholder="Enter your address"
                  />
                  
                  {suggestions.length > 0 && (
                    <ul className="suggestions-list">
                      {suggestions.map((s, i) => (
                        <li 
                          key={i} 
                          className="suggestion-item"
                          onClick={() => selectAddress(s)}
                        >
                          {s.description}
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <div className="address-buttons">
                    <button 
                      className="save-address-button"
                      onClick={updateAddress}
                    >
                      Save Address
                    </button>
                    <button 
                      className="cancel-address-button"
                      onClick={() => {
                        setEditingAddress(false);
                        setSuggestions([]);
                        setNewAddress(profile.address || "");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map Section */}
          {profile.address && (
            <div className="map-section">
              <div className="profile-card">
                <div className="map-header">
                  <h3>Location</h3>
                  <p className="map-address">
                    <strong>{profile.address}</strong>
                  </p>
                </div>
                
                <div className="map-container">
                  <iframe
                    title="map"
                    loading="lazy"
                    src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
                      profile.address
                    )}`}
                  ></iframe>
                </div>
                
                <div className="map-footer">
                  <small>
                    Powered by <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">Google Maps</a>
                  </small>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

