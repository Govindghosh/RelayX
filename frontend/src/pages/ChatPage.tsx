import { type FormEvent, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ConversationPanel from "../components/chat/ConversationPanel";
import UserDirectory from "../components/chat/UserDirectory";
import axiosInstance from "../api/axiosInstance";
import SummaryApi from "../api/SummaryApi";
import type { ChatMessage, ChatSocketEvent, RelayUser, Session } from "../types/session";

type ChatPageProps = {
  session: Session;
  onLogout: () => void;
  onSessionChange: (session: Session | null) => void;
};

export default function ChatPage({ session, onLogout, onSessionChange }: ChatPageProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const websocketRef = useRef<WebSocket | null>(null);
  const selectedUserIdRef = useRef<string | null>(selectedUserId);
  const currentUserIdRef = useRef<string>(session.user.id);

  // Sync refs
  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    currentUserIdRef.current = session.user.id;
  }, [session.user.id]);

  // Fetch users with React Query
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await axiosInstance(SummaryApi.auth.listUsers);
      const data = response.data as RelayUser[];
      if (!selectedUserId && data.length > 0) {
        setSelectedUserId(data[0].id);
      }
      return data;
    },
  });

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  // Fetch messages with React Query
  const { isLoading: isMessagesLoading } = useQuery({
    queryKey: ["messages", selectedUserId],
    enabled: !!selectedUserId,
    queryFn: async () => {
      const response = await axiosInstance({
        ...SummaryApi.chat.getMessages,
        params: { peer_id: selectedUserId },
      });
      const data = response.data as ChatMessage[];
      setMessages(data);
      return data;
    },
  });

  // WebSocket alignment
  useEffect(() => {
    setConnectionStatus("connecting");
    const wsUrl = `${SummaryApi.ws.chat}?token=${encodeURIComponent(session.accessToken)}`;
    const socket = new WebSocket(wsUrl);
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

        if (!payload.message) return;

        const message = payload.message;
        const currentSelectedUserId = selectedUserIdRef.current;
        const currentUserId = currentUserIdRef.current;

        setMessages((current) => {
          const alreadyExists = current.some((m) => m.id === message.id);
          if (alreadyExists || !currentSelectedUserId) return current;

          const isRelevant =
            (message.sender_id === currentSelectedUserId && message.receiver_id === currentUserId) ||
            (message.receiver_id === currentSelectedUserId && message.sender_id === currentUserId);

          if (!isRelevant) return current;

          return [...current, message].sort((a, b) => a.created_at.localeCompare(b.created_at));
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

    if (!selectedUserId || !content || !websocket || websocket.readyState !== WebSocket.OPEN) {
      if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        setError("WebSocket is not connected");
      }
      return;
    }

    websocket.send(JSON.stringify({ receiver_id: selectedUserId, content }));
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
