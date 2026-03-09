import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import Layout from "../components/Layout";
import "./profile.css";

export default function Profile() {
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
        <div>Loading...</div>
      </Layout>
    );

  if (!profile)
    return (
      <Layout>
        <div>Profile not found</div>
      </Layout>
    );

  return (
    <Layout showBackButton backLink="/home">
      <div className="profile-container">

        <div className="profile-header">
          <h1>Profile</h1>
        </div>

        <div className="profile-content">

          {/* Profile Image */}
          <div className="profile-card">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt="profile" />
            ) : (
              <p>No image</p>
            )}

            <input
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
            />

            <button onClick={uploadImage}>Upload</button>
          </div>

          {/* User Info */}
          <div className="profile-card">
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
          </div>

          {/* Download */}
          <div className="profile-card">
            <button onClick={downloadProfileJSON}>Download JSON</button>
            <button onClick={downloadProfileCSV}>Download CSV</button>
          </div>

          {/* Plan */}
          <div className="profile-card">
            <h3>Subscription</h3>

            {userPlan && (
              <>
                <p>Plan: {userPlan.plan}</p>
                <p>Status: {userPlan.status}</p>
                {userPlan.expiration && (
                  <p>
                    Expiry:{" "}
                    {new Date(userPlan.expiration).toLocaleString()}
                  </p>
                )}
              </>
            )}

            <button onClick={() => (window.location.href = "/payment")}>
              Manage Plan
            </button>
          </div>

          {/* Address */}
          <div className="profile-card">

            {!editingAddress ? (
              <>
                <p>{profile.address || "Not set"}</p>
                <button onClick={() => setEditingAddress(true)}>
                  Edit Address
                </button>
              </>
            ) : (
              <>
                <input
                  value={newAddress}
                  onChange={(e) => {
                    setNewAddress(e.target.value);
                    getAddressSuggestions(e.target.value);
                  }}
                />

                {suggestions.length > 0 && (
                  <ul>
                    {suggestions.map((s, i) => (
                      <li key={i} onClick={() => selectAddress(s)}>
                        {s.description}
                      </li>
                    ))}
                  </ul>
                )}

                <button onClick={updateAddress}>Save</button>
                <button
                  onClick={() => {
                    setEditingAddress(false);
                    setSuggestions([]);
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {/* Map */}
          {profile.address && (
            <div className="profile-card">
              <iframe
                title="map"
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
                  profile.address
                )}`}
              ></iframe>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}