import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function DatabaseDashboard({ onBack }) {
  const [clusterNodes, setClusterNodes] = useState([]);
  const [consistency, setConsistency] = useState("one");

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userMessages, setUserMessages] = useState([]);

  async function loadUsers() {
    const response = await axios.get(`${API_URL}/users`);
    setUsers(response.data);
  }

  async function loadMessagesByUser() {
    if (!selectedUserId) return;

    const response = await axios.get(
      `${API_URL}/users/${selectedUserId}/messages`,
    );

    setUserMessages(response.data);
  }
  async function loadConsistency() {
    const response = await axios.get(`${API_URL}/settings/consistency`);
    setConsistency(response.data.consistency);
  }

  async function updateConsistency(value) {
    const response = await axios.post(`${API_URL}/settings/consistency`, {
      consistency: value,
    });

    setConsistency(response.data.consistency);
  }

  async function loadClusterStatus() {
    try {
      const response = await axios.get(`${API_URL}/cluster/status`);

      setClusterNodes(response.data.nodes);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadClusterStatus();
    loadConsistency();
    loadUsers();

    const interval = setInterval(loadClusterStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Database Dashboard</h1>
        <button onClick={onBack}>Back to Chat</button>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <h2>Cluster Status</h2>
          <p>Shows Cassandra nodes and whether they are UP or DOWN.</p>

          <div className="node-list">
            {clusterNodes.map((node) => (
              <div key={node.address} className="node-item">
                {node.status === "UN" ? "🟢" : "🔴"} {node.address} (
                {node.status})
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-card">
          <h2>Consistency Level</h2>
          <p>Switch between ONE and QUORUM for database operations.</p>

          <div className="consistency-options">
            <button
              className={consistency === "one" ? "active" : ""}
              onClick={() => updateConsistency("one")}
            >
              ONE
            </button>

            <button
              className={consistency === "quorum" ? "active" : ""}
              onClick={() => updateConsistency("quorum")}
            >
              QUORUM
            </button>
          </div>

          <p>
            Current consistency: <strong>{consistency.toUpperCase()}</strong>
          </p>
        </section>

        <section className="dashboard-card">
          <h2>Messages By User</h2>
          <p>Shows denormalized message storage by sender.</p>

          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Select user</option>

            {users.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.username}
              </option>
            ))}
          </select>

          <button onClick={loadMessagesByUser}>Load Messages</button>

          <p>
            Total messages: <strong>{userMessages.length}</strong>
          </p>

          <div className="user-message-list">
            {userMessages.map((message) => (
              <div key={message.message_id} className="user-message-item">
                <p>{message.message_text}</p>
                <small>
                  Conversation: {message.conversation_id}
                  <br />
                  {new Date(message.message_time).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-card">
          <h2>Database Statistics</h2>
          <p>Users, conversations, and message counts.</p>

          <div className="stats">
            <div>Users: —</div>
            <div>Conversations: —</div>
            <div>Messages: —</div>
          </div>
        </section>

        <section className="dashboard-card">
          <h2>Message Distribution</h2>
          <p>Shows which Cassandra coordinator handled writes.</p>

          <p className="placeholder">Coming soon</p>
        </section>

        <section className="dashboard-card">
          <h2>Event Log</h2>
          <p>Shows recent backend/database events.</p>

          <p className="placeholder">Coming soon</p>
        </section>
      </div>
    </div>
  );
}

export default DatabaseDashboard;
