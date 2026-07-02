import { useEffect, useState } from "react";
import Modal from "./Modal";
import BookCover from "./BookCover";
import Icon from "./Icon";
import { api } from "../lib/api";
import { useDialog } from "./Dialog";

// Given the book's owner (e.g. the person you're chatting with), pick which of
// THEIR books you're currently holding to return. Creates a return request.
export default function ReturnBookModal({ fromUser, onClose, onReturned }) {
  const { notify } = useDialog();
  const [books, setBooks] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/lending/holding").then((d) => {
      // Only books owned by this person that aren't already mid-return.
      setBooks(d.books.filter((b) => b.owner.id === fromUser.id && b.status === "Lent out"));
    });
  }, [fromUser.id]);

  const doReturn = async (book) => {
    if (busy) return;
    setBusy(true);
    try {
      await api.post("/lending/return", { bookId: book.id });
      onReturned?.(book);
    } catch (e) {
      notify(e.message, "error");
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Return a book to ${fromUser.name}`}
      subtitle="Pick the book you're handing back. They confirm once it's in their hands."
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      {books === null ? (
        <p className="py-6 text-center text-sm text-muted">Loading…</p>
      ) : books.length === 0 ? (
        <div className="rounded-xl bg-white/60 p-8 text-center text-sm text-muted">
          You're not holding any of {fromUser.name}'s books right now.
        </div>
      ) : (
        <div className="grid max-h-[60vh] grid-cols-3 gap-4 overflow-y-auto pr-1 sm:grid-cols-4">
          {books.map((b) => (
            <button
              key={b.id}
              disabled={busy}
              onClick={() => doReturn(b)}
              className="group text-left disabled:opacity-50"
            >
              <div className="relative">
                <BookCover book={b} className="h-36 transition group-hover:shadow-card" />
                <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-primary/0 opacity-0 transition group-hover:bg-primary/10 group-hover:opacity-100">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-soft">
                    <Icon name="swap" className="mr-1 inline h-3.5 w-3.5" /> Return
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
