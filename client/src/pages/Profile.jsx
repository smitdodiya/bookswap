import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";
import BookCover from "../components/BookCover";
import AddBookModal from "../components/AddBookModal";
import GivePersonModal from "../components/GivePersonModal";
import ErrorState from "../components/ErrorState";
import { useDialog } from "../components/Dialog";

export default function Profile() {
  const { user } = useAuth();
  const { confirm, notify } = useDialog();
  const [profile, setProfile] = useState(null);
  const [holding, setHolding] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [giveBook, setGiveBook] = useState(null);
  const [error, setError] = useState(false);

  const load = () => {
    if (!user) return;
    setError(false);
    api.get(`/users/${user.id}`).then((d) => setProfile(d.user)).catch(() => setError(true));
    api.get("/lending/holding").then((d) => setHolding(d.books)).catch(() => {});
  };
  useEffect(load, [user]);

  const removeBook = async (book) => {
    const ok = await confirm({
      title: "Remove this book?",
      message: `“${book.title}” will be taken off your shelf.`,
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    await api.del(`/books/${book.id}`);
    notify(`Removed “${book.title}” from your shelf`);
    load();
  };

  // Holder starts a return; the owner then confirms once it's back in their hands.
  const startReturn = async (book) => {
    try {
      await api.post("/lending/return", { bookId: book.id });
      notify(`Return requested — ${book.owner.name} will confirm once they have it back`);
      load();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  if (error && !profile) return <ErrorState onRetry={load} />;
  if (!profile) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      {/* Header card */}
      <div className="card flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar name={profile.name} size="xl" />
        <div className="flex-1">
          <h1 className="font-display text-4xl font-bold text-ink">{profile.name}</h1>
          <p className="mt-1 flex items-center gap-3 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Icon name="pin" className="h-4 w-4" /> {profile.city}
            </span>
            <span className="text-line">•</span>
            <span>{profile.books.length} books on shelf</span>
          </p>
          <p className="mt-3 max-w-xl text-ink/80">{profile.bio}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Icon name="plus" className="h-4 w-4" /> Add a book
        </button>
      </div>

      {/* Shelf */}
      <h2 className="mb-5 mt-10 font-display text-2xl font-bold text-ink">Your shelf</h2>
      {profile.books.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="book" className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Your shelf is empty</h3>
            <p className="mt-1 text-sm text-muted">
              Add your first book so neighbours can discover and borrow it.
            </p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Icon name="plus" className="h-4 w-4" /> Add a book
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {profile.books.map((b) => (
          <div key={b.id} className="group">
            <div className="relative">
              <BookCover book={b} className="h-56" />
              {b.status === "Available" && (
                <button
                  onClick={() => removeBook(b)}
                  title="Remove"
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-muted opacity-0 shadow-soft transition hover:text-primary group-hover:opacity-100"
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-3">
              <h4 className="font-display text-base font-semibold text-ink">{b.title}</h4>
              <p className="text-sm text-muted">{b.author}</p>

              <div className="mt-2">
                {b.status === "Lent out" ? (
                  <span className="badge bg-primary/10 text-primary">
                    Lent out — with {b.heldByName}
                  </span>
                ) : b.status === "Pending" ? (
                  <span className="badge bg-black/5 text-ink/70">Awaiting {b.heldByName}</span>
                ) : b.status === "Returning" ? (
                  <span className="badge bg-black/5 text-ink/70">Return pending</span>
                ) : (
                  <span className="badge bg-black/5 text-ink/70">{b.condition}</span>
                )}
              </div>

              {/* Hand over — only for available books */}
              {b.status === "Available" && (
                <button
                  onClick={() => setGiveBook(b)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary-dark"
                >
                  <Icon name="gift" className="h-4 w-4" /> Give to someone
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Books you're borrowing (held from other people) */}
      {holding.length > 0 && (
        <>
          <h2 className="mb-2 mt-12 font-display text-2xl font-bold text-ink">
            Books you're borrowing
          </h2>
          <p className="mb-5 text-sm text-muted">
            When you meet to return one, tap “Mark as returned” — the owner confirms once it's back in hand.
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {holding.map((b) => (
              <div key={b.id}>
                <BookCover book={b} className="h-56" />
                <div className="mt-3">
                  <h4 className="font-display text-base font-semibold text-ink">{b.title}</h4>
                  <p className="text-sm text-muted">{b.author}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                    <Avatar name={b.owner.name} size="sm" userId={b.owner.id} /> from {b.owner.name}
                  </div>
                  {b.status === "Returning" ? (
                    <span className="badge mt-3 bg-black/5 text-ink/70">
                      Waiting for {b.owner.name} to confirm
                    </span>
                  ) : (
                    <button
                      onClick={() => startReturn(b)}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary-dark"
                    >
                      <Icon name="swap" className="h-4 w-4" /> Mark as returned
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showAdd && (
        <AddBookModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load(); }} />
      )}
      {giveBook && (
        <GivePersonModal
          book={giveBook}
          onClose={() => setGiveBook(null)}
          onGiven={() => { setGiveBook(null); load(); }}
        />
      )}
    </div>
  );
}
