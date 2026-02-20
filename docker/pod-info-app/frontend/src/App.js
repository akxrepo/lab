import React, { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "/api").replace(/\/$/, "");

function App() {
  const [namespace, setNamespace] = useState("");
  const [pods, setPods] = useState([]);
  const [form, setForm] = useState({ pod_name: "", pod_ip: "", namespace: "" });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Collect pod info and save to DB
  const collectPodInfo = async () => {
    try {
      setLoading(true);
      setStatus("");
      const response = await fetch(`${API_BASE}/collect`, { method: "POST" });
      if (response.ok) {
        setStatus("Pod info collected successfully.");
        getPods();
      } else {
        const err = await response.json().catch(() => ({}));
        setStatus(err.message || "Failed to collect pod info.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error connecting to backend.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch pods from DB
  const getPods = useCallback(async () => {
    try {
      setLoading(true);
      setStatus("");
      const url = namespace ? `${API_BASE}/pods?namespace=${namespace}` : `${API_BASE}/pods`;
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch pods.");
      }
      const data = await response.json();
      setPods(data);
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Error fetching pods.");
    } finally {
      setLoading(false);
    }
  }, [namespace]);

  useEffect(() => {
    getPods();
  }, [getPods]);

  const addPod = async (e) => {
    e.preventDefault();
    if (!form.pod_name || !form.pod_ip || !form.namespace) {
      setStatus("Pod name, IP, and namespace are required.");
      return;
    }

    try {
      setLoading(true);
      setStatus("");
      const response = await fetch(`${API_BASE}/pods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setStatus("Pod info added.");
        setForm({ pod_name: "", pod_ip: "", namespace: "" });
        getPods();
      } else {
        const err = await response.json().catch(() => ({}));
        setStatus(err.message || "Failed to add pod info.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error connecting to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>🚀 Pod Info App</h1>
      <p className="subtitle">Collect, add, and view pod data stored in PostgreSQL.</p>

      <div className="grid">
        <div className="card pod">
          <h2>📦 Collect Pod Info</h2>
          <p>Auto-collect pod info from the backend and store it in the database.</p>
          <button onClick={collectPodInfo} disabled={loading}>
            {loading ? "Working..." : "Collect Pod Info"}
          </button>
        </div>

        <div className="card configmap">
          <h2>➕ Add Pod Info</h2>
          <form onSubmit={addPod} className="form">
            <input
              type="text"
              placeholder="Pod name"
              value={form.pod_name}
              onChange={(e) => setForm({ ...form, pod_name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Pod IP"
              value={form.pod_ip}
              onChange={(e) => setForm({ ...form, pod_ip: e.target.value })}
            />
            <input
              type="text"
              placeholder="Namespace"
              value={form.namespace}
              onChange={(e) => setForm({ ...form, namespace: e.target.value })}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add Pod"}
            </button>
          </form>
        </div>

        <div className="card secret">
          <h2>📋 View Pods</h2>
          <div className="inline">
            <input
              type="text"
              placeholder="Namespace (optional)"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
            />
            <button onClick={getPods} disabled={loading}>
              {loading ? "Loading..." : "Get Pods"}
            </button>
          </div>
        </div>
      </div>

      {status && <div className="status">{status}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pod Name</th>
              <th>IP</th>
              <th>Namespace</th>
              <th>Collected At</th>
            </tr>
          </thead>
          <tbody>
            {pods.map((pod, index) => (
              <tr key={index}>
                <td>{pod.pod_name}</td>
                <td>{pod.pod_ip}</td>
                <td>{pod.namespace}</td>
                <td>{new Date(pod.collected_at).toLocaleString()}</td>
              </tr>
            ))}
            {pods.length === 0 && (
              <tr>
                <td colSpan="4" className="empty">
                  No pods found. Try collecting or adding one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
