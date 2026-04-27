// filepath: frontend/src/pages/Admin.jsx
import { useState, useEffect } from "react";
import axios from "../api/axios";
import Layout from "../components/Layout";
import "../styles/admin.css";

// Format remaining time as HH:MM:SS
const formatTime = (ms) => {
  if (!ms || ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [remainingTimes, setRemainingTimes] = useState({});
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Countdown timer effect for all users with active plans
  useEffect(() => {
    const hasAnyTimer = users.some(
      (u) => u.remainingTime > 0 && u.plan !== "free",
    );
    if (!hasAnyTimer) return;

    const timer = setInterval(() => {
      setRemainingTimes((prev) => {
        const newTimes = { ...prev };
        let hasUpdate = false;

        users.forEach((user) => {
          if (user.remainingTime > 0 && user.plan !== "free") {
            const newTime = Math.max(0, user.remainingTime - 1000);
            if (newTime !== prev[user._id]) {
              newTimes[user._id] = newTime;
              hasUpdate = true;
            }
          }
        });

        return hasUpdate ? newTimes : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/admin/users", {
        params: {
          search,
          plan: planFilter,
          status: statusFilter,
          role: roleFilter,
          page,
          limit,
        },
      });

      setUsers(response.data.users);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, planFilter, statusFilter, roleFilter, page]);

  // update both plan and role if provided
  const updateUser = async (userId, plan, planExpiration, role) => {
    try {
      await axios.put(`/admin/user/${userId}/plan`, { plan, planExpiration });
      if (role) {
        await axios.put(`/admin/user/${userId}/role`, { role });
      }
      fetchUsers(); // Refresh the list
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const getPlanColor = (plan, status) => {
    if (status === "expired") return "#dc2626";
    switch (plan) {
      case "free":
        return "#6b7280";
      case "silver":
        return "#d97706";
      case "gold":
        return "#d4af37";
      default:
        return "#6b7280";
    }
  };

  if (loading)
    return (
      <Layout>
        <div className="loading-state">Loading users...</div>
      </Layout>
    );

  return (
    <Layout showBackButton backLink="/home">
      <div className="admin-container">
        <h1>Admin Panel - User Management</h1>

        <div className="controls">
          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <p>
          Showing {users.length} of {total} users
        </p>

        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Expiration</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role || "user"}</td>
                    <td>
                      <span
                        style={{
                          color: getPlanColor(user.plan, user.planStatus),
                          fontWeight: "bold",
                        }}
                      >
                        {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${user.planStatus}`}>
                        {user.planStatus}
                      </span>
                    </td>
                    <td>
                      {user.planExpiration && user.plan !== "free" ? (
                        <div className="admin-timer-cell">
                          <span className="admin-expiration">
                            {new Date(user.planExpiration).toLocaleString()}
                          </span>
                          {remainingTimes[user._id] > 0 && (
                            <span className="admin-countdown">
                              {formatTime(
                                remainingTimes[user._id] || user.remainingTime,
                              )}
                            </span>
                          )}
                        </div>
                      ) : (
                        "Never"
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        {editingUser === user._id ? (
                          <UserEditor
                            user={user}
                            onSave={(plan, expiration, role) =>
                              updateUser(user._id, plan, expiration, role)
                            }
                            onCancel={() => setEditingUser(null)}
                          />
                        ) : (
                          <button
                            onClick={() => setEditingUser(user._id)}
                            className="edit-button"
                            title="Edit plan/role"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No users found for the current search/filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() =>
              setPage((currentPage) =>
                Math.min(currentPage + 1, totalPages),
              )
            }
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </Layout>
  );
}

function UserEditor({ user, onSave, onCancel }) {
  const [plan, setPlan] = useState(user.plan);
  const [expiration, setExpiration] = useState(
    user.planExpiration
      ? new Date(user.planExpiration).toISOString().slice(0, 16)
      : "",
  );
  const [role, setRole] = useState(user.role || "user");

  const handleSave = () => {
    const expDate =
      plan === "free" ? null : expiration ? new Date(expiration) : null;
    onSave(plan, expDate, role);
  };

  return (
    <div className="plan-editor">
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>

      <select value={plan} onChange={(e) => setPlan(e.target.value)}>
        <option value="free">Free</option>
        <option value="silver">Silver</option>
        <option value="gold">Gold</option>
      </select>
      {plan !== "free" && (
        <input
          type="datetime-local"
          value={expiration}
          onChange={(e) => setExpiration(e.target.value)}
        />
      )}
      <button onClick={handleSave} className="save-button">
        Save
      </button>
      <button onClick={onCancel} className="cancel-button">
        Cancel
      </button>
    </div>
  );
}
