import { type FormEvent, useEffect, useRef, useState } from "react";

import ConversationPanel from "../components/chat/ConversationPanel";
import UserDirectory from "../components/chat/UserDirectory";
import { ENV } from "../config/env";
import { getMessages, listUsers, withAuthorizedAccess } from "../services/api/client";
import type { ChatMessage, ChatSocketEvent, RelayUser, Session } from "../types/session";

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
        const availableUsers = await withAuthorizedAccess({
          session,
          onSessionChange,
          onLogout,
          request: listUsers,
        });

        if (!isActive) {
          return;
        }

        setUsers(availableUsers);
        setSelectedUserId((current) => current ?? availableUsers[0]?.id ?? null);
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
    const socket = new WebSocket(`${ENV.chatWsUrl}?token=${encodeURIComponent(session.accessToken)}`);
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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_26rem),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.15),_transparent_20rem)]" />
      <div className="relative mx-auto grid max-w-7xl gap-6 lg:grid-cols-[24rem_1fr]">
        <UserDirectory
          connectionStatus={connectionStatus}
          currentUser={session.user}
          isUsersLoading={isUsersLoading}
          onLogout={onLogout}
          onSelectUser={setSelectedUserId}
          selectedUserId={selectedUserId}
          users={users}
        />

        <ConversationPanel
          connectionStatus={connectionStatus}
          currentUserId={session.user.id}
          draft={draft}
          error={error}
          isMessagesLoading={isMessagesLoading}
          messages={messages}
          onDraftChange={setDraft}
          onSendMessage={handleSendMessage}
          selectedUser={selectedUser}
        />
      </div>
    </main>
  );
}
