import { LoaderCircle, LogOut, SearchSlash, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import type { RelayUser } from "../../types/session";
import { formatCompactId } from "../../utils/formatters";
import AnimatedRelayIcon from "../ui/AnimatedRelayIcon";

type UserDirectoryProps = {
  currentUser: RelayUser;
  users: RelayUser[];
  selectedUserId: string | null;
  connectionStatus: string;
  isUsersLoading: boolean;
  onSelectUser: (userId: string) => void;
  onLogout: () => void;
};

export default function UserDirectory({
  currentUser,
  users,
  selectedUserId,
  connectionStatus,
  isUsersLoading,
  onSelectUser,
  onLogout,
}: UserDirectoryProps) {
  return (
    <aside className="glass-panel flex min-h-[40rem] flex-col rounded-[2rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <AnimatedRelayIcon size="sm" />
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">RelayX</p>
            <h1 className="font-display text-3xl text-white">Chat Hub</h1>
          </motion.div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
          onClick={onLogout}
          type="button"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-3xl border border-white/10 bg-slate-950/40 p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Signed in</p>
        <p className="mt-2 text-lg font-semibold text-white">{currentUser.email}</p>
        <p className="mt-1 text-sm text-slate-400">
          Socket: <span className={connectionStatus === "connected" ? "text-emerald-400" : "text-amber-400"}>{connectionStatus}</span>
        </p>
      </motion.div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Users className="h-4 w-4 text-cyan-200" />
          Available users
        </div>
        <div className="text-xs uppercase tracking-[0.28em] text-slate-500">
          {isUsersLoading ? "Loading" : `${users.length} Ready`}
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {isUsersLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300"
            >
              <LoaderCircle className="h-4 w-4 animate-spin text-cyan-200" />
              Fetching user list
            </motion.div>
          ) : null}

          {!isUsersLoading && users.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-300"
            >
              <div className="mb-3 flex items-center gap-2 text-white">
                <SearchSlash className="h-4 w-4 text-amber-200" />
                No other users yet
              </div>
              Create another account in a separate tab to test live chat.
            </motion.div>
          ) : null}

          {users.map((user, index) => {
            const isActive = user.id === selectedUserId;
            return (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 5 }}
                className={`w-full rounded-3xl border p-4 text-left transition ${
                  isActive
                    ? "border-cyan-300/40 bg-cyan-300/12 shadow-lg shadow-cyan-900/20"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                }`}
                key={user.id}
                onClick={() => onSelectUser(user.id)}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{user.email}</p>
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                    />
                  )}
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{formatCompactId(user.id)}</p>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </aside>
  );
}
