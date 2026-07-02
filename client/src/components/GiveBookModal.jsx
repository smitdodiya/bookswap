import { useEffect, useState } from "react";
import Modal from "./Modal";
import BookCover from "./BookCover";
import Icon from "./Icon";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useDialog } from "./Dialog";

// Given a fixed recipient (e.g. the person you're chatting with), pick one of
// YOUR available books to hand over. Creates a handover request they confirm.
export default function GiveBookModal({ toUser, onClose, onGiven }) {
  const { user } = useAuth();
  const { notify } = useDialog();
  const [books, setBooks] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/users/${user.id}`).then((d) => {
      setBooks(d.user.books.filter((b) => b.status === "Available"));
    });
  }, [user.id]);

  const give = async (book) => {
    if (busy) return;
    setBusy(true);
    try {
      await api.post("/lending/give", { bookId: book.id, toUserId: toUser.id });
      onGiven?.(book);
    } catch (e) {
      notify(e.message, "error");
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Give a book to ${toUser.name}`}
      subtitle="Pick one of your available books. They'll confirm once it's in their hands."
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      {books === null ? (
        <p className="py-6 text-center text-sm text-muted">Loading your shelf…</p>
      ) : books.length === 0 ? (
        <div className="rounded-xl bg-white/60 p-8 text-center text-sm text-muted">
          You have no available books to give right now.
        </div>
      ) : (
        <div className="grid max-h-[60vh] grid-cols-3 gap-4 overflow-y-auto pr-1 sm:grid-cols-4">
          {books.map((b) => (
            <button
              key={b.id}
              disabled={busy}
              onClick={() => give(b)}
              className="group text-left disabled:opacity-50"
            >
              <div className="relative">
                <BookCover book={b} className="h-36 transition group-hover:shadow-card" />
                <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-primary/0 opacity-0 transition group-hover:bg-primary/10 group-hover:opacity-100">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-soft">
                    <Icon name="gift" className="mr-1 inline h-3.5 w-3.5" /> Give
                  </span>
                </span>
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-ink">{b.title}</p>
              <p className="truncate text-xs text-muted">{b.author}</p>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
