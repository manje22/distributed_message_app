import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "./App.css";
import AuthPage from "./AuthPage";
import DatabaseDashboard from "./DatabaseDashboard";

const API_URL = import.meta.env.VITE_API_URL;
const socket = io(API_URL);

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");

  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");

  const [otherUserId, setOtherUserId] = useState("");
  const [conversationId, setConversationId] = useState("");

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [status, setStatus] = useState("Disconnected");

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);

  const [currentPage, setCurrentPage] = useState("chat");

  function getUsernameById(id) {
    const user = users.find((u) => u.user_id === id);
    return user ? user.username : id;
  }

  function getConversationLabel(conversation) {
    return conversation.participant_ids
      .map((id) => getUsernameById(id))
      .join(" + ");
  }

  async function loadInitialData() {
    const usersResponse = await axios.get(`${API_URL}/users`);
    const conversationsResponse = await axios.get(`${API_URL}/conversations`);

    setUsers(usersResponse.data);
    setConversations(conversationsResponse.data);
  }

  useEffect(() => {
    const savedUserId = localStorage.getItem("userId");
    const savedUsername = localStorage.getItem("username");

    if (savedUserId && savedUsername) {
      setUserId(savedUserId);
      setUsername(savedUsername);
    }

    socket.on("connect", () => {
      setStatus(`Connected: ${socket.id}`);
    });

    socket.on("newMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("disconnect", () => {
      setStatus("Disconnected");
    });

    loadInitialData();

    return () => {
      socket.off("connect");
      socket.off("newMessage");
      socket.off("disconnect");
    };
  }, []);

  async function registerUser() {
    try {
      setAuthError("");

      const response = await axios.post(`${API_URL}/users`, {
        username,
        password,
      });

      setUserId(response.data.user_id);
      setUsername(response.data.username);

      localStorage.setItem("userId", response.data.user_id);
      localStorage.setItem("username", response.data.username);

      setPassword("");
      await loadInitialData();
    } catch (error) {
      setAuthError(error.response?.data?.error || error.message);
    }
  }

  async function loginUser() {
    try {
      setAuthError("");

      const response = await axios.post(`${API_URL}/login`, {
        username,
        password,
      });

      setUserId(response.data.user_id);
      setUsername(response.data.username);

      localStorage.setItem("userId", response.data.user_id);
      localStorage.setItem("username", response.data.username);

      setPassword("");
      await loadInitialData();
    } catch (error) {
      setAuthError(error.response?.data?.error || error.message);
    }
  }

  function logout() {
    setUserId("");
    setUsername("");
    setPassword("");
    setMessages([]);
    setConversationId("");

    localStorage.removeItem("userId");
    localStorage.removeItem("username");
  }

  async function createConversation() {
    if (!userId || !otherUserId) {
      alert("You must be logged in and provide another user ID.");
      return;
    }

    const response = await axios.post(`${API_URL}/conversations`, {
      participant_ids: [userId, otherUserId],
    });

    const newConversationId = response.data.conversation_id;

    setConversationId(newConversationId);
    await loadInitialData();
    await selectConversation(newConversationId);
  }

  async function joinConversation() {
    if (!conversationId) {
      alert("Enter or select a conversation first.");
      return;
    }

    socket.emit("joinConversation", conversationId);

    const response = await axios.get(
      `${API_URL}/conversations/${conversationId}/messages`,
    );

    setMessages(response.data);
  }

  async function selectConversation(id) {
    setConversationId(id);

    socket.emit("joinConversation", id);

    const response = await axios.get(`${API_URL}/conversations/${id}/messages`);

    setMessages(response.data);
  }

  async function sendMessage() {
    if (!messageText.trim()) return;

    if (!userId) {
      alert("Log in first.");
      return;
    }

    if (!conversationId) {
      alert("Select or join a conversation first.");
      return;
    }

    try {
      await axios.post(`${API_URL}/messages`, {
        conversation_id: conversationId,
        sender_id: userId,
        message_text: messageText,
      });

      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
      alert(error.response?.data?.error || error.message);
    }
  }

  if (!userId) {
    return (
      <AuthPage
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authError={authError}
        loginUser={loginUser}
        registerUser={registerUser}
      />
    );
  }

  if (currentPage === "dashboard") {
    return <DatabaseDashboard onBack={() => setCurrentPage("chat")} />;
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Conversations</h2>

        {conversations.map((conversation) => (
          <button
            key={conversation.conversation_id}
            className="conversation-button"
            onClick={() => selectConversation(conversation.conversation_id)}
          >
            {getConversationLabel(conversation)}
          </button>
        ))}
      </aside>

      <main className="main">
        <div className="app">
          <h1>Distributed Chat App</h1>

          <p className="status">{status}</p>

          <p>
            Logged in as <strong>{username}</strong>{" "}
            <button onClick={logout}>Logout</button>
          </p>

          <button onClick={() => setCurrentPage("dashboard")}>
            Database Dashboard
          </button>

          <section>
            <h2>Create Conversation</h2>
            <input
              placeholder="Other user ID"
              value={otherUserId}
              onChange={(e) => setOtherUserId(e.target.value)}
            />
            <button onClick={createConversation}>Create Conversation</button>
          </section>

          <section>
            <h2>Join Conversation</h2>
            <input
              placeholder="Conversation ID"
              value={conversationId}
              onChange={(e) => setConversationId(e.target.value)}
            />
            <button onClick={joinConversation}>Join</button>
          </section>

          <section>
            <h2>Messages</h2>

            <div className="messages">
              {messages.map((msg) => (
                <div key={msg.message_id} className="message">
                  <strong>{getUsernameById(msg.sender_id)}</strong>
                  <p>{msg.message_text}</p>
                  <small>{new Date(msg.message_time).toLocaleString()}</small>
                </div>
              ))}
            </div>

            <div className="send-box">
              <input
                placeholder="Type a message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
