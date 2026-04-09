import { FormEvent, useEffect, useRef, useState } from "react";

import { CHAT_WS_URL, type ChatMessage, type ChatSocketEvent, getMessages, listUsers, withAuthorizedAccess } from "../api/client";
import type { RelayUser, Session } from "../auth";

type ChatPageProps = {
  session: Session;
  onLogout: () => void;
  onSessionChange: (session: Session | null) => void;
};

export default function ChatPage({ session, onLogout, onSessionChange }: ChatPageProps) {
  const [users, setUsers] = useState<RelayUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const websocketRef = useRef<WebSocket | null>(null);
  const selectedUserIdRef = useRef<string | null>(selectedUserId);
  const currentUserIdRef = useRef<string>(session.user.id);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    currentUserIdRef.current = session.user.id;
  }, [session.user.id]);

  useEffect(() => {
    let isActive = true;

    async function loadUsers() {
      setIsUsersLoading(true);
      setError("");

      try {
        const nextUsers = await withAuthorizedAccess({
          session,
          onSessionChange,
          onLogout,
          request: listUsers,
        });

        if (!isActive) {
          return;
        }

        setUsers(nextUsers);
        setSelectedUserId((current) => current ?? nextUsers[0]?.id ?? null);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load users");
      } finally {
        if (isActive) {
          setIsUsersLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      isActive = false;
    };
  }, [session, onLogout, onSessionChange]);

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }

    let isActive = true;

    async function loadConversation() {
      setIsMessagesLoading(true);
      setError("");
      const peerId = selectedUserId as string;

      try {
        const conversation = await withAuthorizedAccess({
          session,
          onSessionChange,
          onLogout,
          request: (accessToken) => getMessages(peerId, accessToken),
        });

        if (!isActive) {
          return;
        }

        setMessages(conversation);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load messages");
      } finally {
        if (isActive) {
          setIsMessagesLoading(false);
        }
      }
    }

    void loadConversation();

    return () => {
      isActive = false;
    };
  }, [selectedUserId, session, onLogout, onSessionChange]);

  useEffect(() => {
    setConnectionStatus("connecting");
    const socket = new WebSocket(`${CHAT_WS_URL}?token=${encodeURIComponent(session.accessToken)}`);
    websocketRef.current = socket;

    socket.onopen = () => {
      setConnectionStatus("connected");
      setError("");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ChatSocketEvent;
        if (payload.type === "error") {
          setError(payload.error ?? "WebSocket error");
          return;
        }

        if (!payload.message) {
          return;
        }

        const message = payload.message;

        const currentSelectedUserId = selectedUserIdRef.current;
        const currentUserId = currentUserIdRef.current;

        setMessages((current) => {
          const alreadyExists = current.some((existingMessage) => existingMessage.id === message.id);
          if (alreadyExists || !currentSelectedUserId) {
            return current;
          }

          const isRelevantConversation =
            (message.sender_id === currentSelectedUserId && message.receiver_id === currentUserId) ||
            (message.receiver_id === currentSelectedUserId && message.sender_id === currentUserId);

          if (!isRelevantConversation) {
            return current;
          }

          return [...current, message].sort((left, right) => left.created_at.localeCompare(right.created_at));
        });
      } catch {
        setError("Could not parse WebSocket payload");
      }
    };
    socket.onerror = () => setError("WebSocket connection error");
    socket.onclose = () => setConnectionStatus("disconnected");

    return () => {
      socket.close();
      websocketRef.current = null;
    };
  }, [session.accessToken]);

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const websocket = websocketRef.current;
    const content = draft.trim();

    if (!selectedUserId || !content) {
      return;
    }

    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      setError("WebSocket is not connected");
      return;
    }

    websocket.send(
      JSON.stringify({
        receiver_id: selectedUserId,
        content,
      }),
    );
    setDraft("");
  }

  return (
    <main className="chat-shell">
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <div>
            <p className="eyebrow">RelayX</p>
            <h1>Phase 1 Chat</h1>
          </div>
          <button className="ghost-button" onClick={onLogout} type="button">
            Logout
          </button>
        </div>

        <section className="current-user">
          <strong>{session.user.email}</strong>
          <span>Socket: {connectionStatus}</span>
        </section>

        <section className="user-list">
          <div className="section-heading">
            <span>Available users</span>
            {isUsersLoading ? <small>Loading...</small> : <small>{users.length} found</small>}
          </div>

          {users.length === 0 && !isUsersLoading ? (
            <p className="empty-state">Create a second account in another tab or browser to start chatting.</p>
          ) : null}

          {users.map((user) => (
            <button
              className={user.id === selectedUserId ? "user-card user-card-active" : "user-card"}
              key={user.id}
              onClick={() => setSelectedUserId(user.id)}
              type="button"
            >
              <strong>{user.email}</strong>
              <span>{user.id}</span>
            </button>
          ))}
        </section>
      </aside>

      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Conversation</p>
            <h2>{selectedUser?.email ?? "Choose a user"}</h2>
          </div>
          {selectedUser ? <span className="conversation-pill">{selectedUser.id}</span> : null}
        </header>

        {error ? <p className="form-error chat-error">{error}</p> : null}

        <div className="messages-panel">
          {isMessagesLoading ? <p className="empty-state">Loading conversation...</p> : null}

          {!isMessagesLoading && messages.length === 0 ? (
            <p className="empty-state">No messages yet. Start with a quick hello.</p>
          ) : null}

          {messages.map((message) => {
            const isOwnMessage = message.sender_id === session.user.id;

            return (
              <article className={isOwnMessage ? "message-bubble message-bubble-own" : "message-bubble"} key={message.id}>
                <span>{message.content}</span>
                <small>{new Date(message.created_at).toLocaleString()}</small>
              </article>
            );
          })}
        </div>

        <form className="composer" onSubmit={handleSendMessage}>
          <textarea
            onChange={(event) => setDraft(event.target.value)}
            placeholder={selectedUser ? `Message ${selectedUser.email}` : "Select a user to start chatting"}
            rows={3}
            value={draft}
          />
          <button
            className="primary-button"
            disabled={!selectedUserId || connectionStatus !== "connected" || draft.trim().length === 0}
            type="submit"
          >
            Send message
          </button>
        </form>
      </section>
    </main>
  );
}
