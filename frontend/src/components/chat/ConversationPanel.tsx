import { type FormEvent, useEffect, useRef } from "react";
import { LoaderCircle, MessageSquareQuote, SendHorizonal, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import type { ChatMessage, RelayUser } from "../../types/session";
import { formatCompactId, formatMessageTimestamp } from "../../utils/formatters";

type ConversationPanelProps = {
  selectedUser: RelayUser | null;
  messages: ChatMessage[];
  draft: string;
  error: string;
  connectionStatus: string;
  isMessagesLoading: boolean;
  onDraftChange: (value: string) => void;
  onSendMessage: (event: FormEvent<HTMLFormElement>) => void;
  currentUserId: string;
};

export default function ConversationPanel({
  selectedUser,
  messages,
  draft,
  error,
  connectionStatus,
  isMessagesLoading,
  onDraftChange,
  onSendMessage,
  currentUserId,
}: ConversationPanelProps) {
  const isConnected = connectionStatus === "connected";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <section className="glass-panel flex min-h-[40rem] flex-col rounded-[2rem] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          key={selectedUser?.id ?? "empty"}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">Conversation</p>
          <h2 className="mt-2 font-display text-4xl text-white">{selectedUser?.email ?? "Choose a user"}</h2>
          <p className="mt-2 text-sm text-slate-400">
            {selectedUser ? formatCompactId(selectedUser.id) : "Select someone from the directory to load message history."}
          </p>
        </motion.div>

        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200">
          <motion.div
            animate={{ scale: isConnected ? [1, 1.2, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {isConnected ? <Wifi className="h-4 w-4 text-emerald-300" /> : <WifiOff className="h-4 w-4 text-amber-300" />}
          </motion.div>
          {connectionStatus}
        </div>
      </div>

      {error ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-3xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
        >
          {error}
        </motion.div>
      ) : null}

      <div className="mt-5 flex-1 space-y-4 overflow-y-auto pr-1">
        {isMessagesLoading ? (
          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <LoaderCircle className="h-4 w-4 animate-spin text-cyan-200" />
            Loading conversation history
          </div>
        ) : null}

        {!isMessagesLoading && messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm leading-7 text-slate-300"
          >
            <div className="mb-3 flex items-center gap-2 text-white">
              <MessageSquareQuote className="h-4 w-4 text-amber-200" />
              No messages yet
            </div>
            Start with a short hello. The message will be sent through the WebSocket connection and saved directly in PostgreSQL.
          </motion.div>
        ) : null}

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId;
              return (
                <motion.article
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  layout
                  className={`max-w-[85%] rounded-[1.75rem] border px-5 py-4 ${
                    isOwnMessage
                      ? "ml-auto border-cyan-300/25 bg-cyan-300/10 text-white"
                      : "mr-auto border-white/10 bg-white/5 text-slate-100"
                  }`}
                  key={message.id}
                >
                  <p className="text-base leading-7">{message.content}</p>
                  <p className={`mt-3 text-xs uppercase tracking-[0.24em] ${isOwnMessage ? "text-cyan-200/60" : "text-slate-400"}`}>
                    {formatMessageTimestamp(message.created_at)}
                  </p>
                </motion.article>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={onSendMessage}>
        <textarea
          className="min-h-32 w-full rounded-[1.75rem] border border-white/10 bg-slate-950/50 px-5 py-4 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-slate-950/70"
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder={selectedUser ? `Message ${selectedUser.email}` : "Select a user to begin"}
          rows={4}
          value={draft}
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-amber-300 px-8 py-4 text-sm font-bold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!selectedUser || !isConnected || draft.trim().length === 0}
          type="submit"
        >
          <SendHorizonal className="h-4 w-4" />
          Send message
        </motion.button>
      </form>
    </section>
  );
}
