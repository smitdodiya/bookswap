import { useEffect, useState } from "react";
import Modal from "./Modal";
import Avatar from "./Avatar";
import { api } from "../lib/api";
import { useDialog } from "./Dialog";

// Picks a person to hand a book to, then creates a handover request.
export default function GivePersonModal({ book, onClose, onGiven }) {
  const { notify } = useDialog();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/users").then((d) => setUsers(d.users)).catch(() => {});
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase())
  );

  const give = async (userId) => {
    setBusy(true);
    try {
      await api.post("/lending/give", { bookId: book.id, toUserId: userId });
      onGiven?.();
    } catch (e) {
      notify(e.message, "error");
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Give "${book.title}"`}
      subtitle="Choose who you're handing it to. They'll confirm once received."
      onClose={onClose}
    >
      <input
        className="input mb-4"
        placeholder="Search people…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {filtered.map((u) => (
          <button
            key={u.id}
            disabled={busy}
            onClick={() => give(u.id)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white disabled:opacity-50"
          >
            <Avatar name={u.name} size="md" />
            <div>
              <p className="font-semibold text-ink">{u.name}</p>
              <p className="text-xs text-muted">{u.city}</p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">No one found.</p>
        )}
      </div>
    </Modal>
  );
}
