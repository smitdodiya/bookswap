import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";
import BookCover from "../components/BookCover";
import ErrorState from "../components/ErrorState";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isMe, setIsMe] = useState(false);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    api.get(`/users/${id}`).then((d) => {
      setProfile(d.user);
      setIsMe(d.isMe);
    }).catch(() => setError(true));
  };
  useEffect(load, [id]);

  // Asking happens in chat — open a conversation pre-filled about this book.
  // The owner then hands it over in person via their shelf.
  const askInChat = (book) => {
    navigate(`/chats/${profile.id}`, {
      state: { draft: `Hi ${profile.name}, could I borrow “${book.title}”? When could we meet?` },
    });
  };

  if (error && !profile) return <ErrorState onRetry={load} />;
  if (!profile) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-5 flex items-center gap-1 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <Icon name="chevronLeft" className="h-4 w-4" /> Back
      </button>

      {/* Header */}
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
        {!isMe && (
          <button onClick={() => navigate(`/chats/${profile.id}`)} className="btn-primary">
            <Icon name="chat" className="h-4 w-4" /> Message
          </button>
        )}
      </div>

      {/* Shelf */}
      <h2 className="mb-5 mt-10 font-display text-2xl font-bold text-ink">
        {profile.name}'s shelf
      </h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {profile.books.map((b) => (
          <div key={b.id}>
            <BookCover book={b} className="h-56" />
            <div className="mt-3">
              <h4 className="font-display text-base font-semibold text-ink">{b.title}</h4>
              <p className="text-sm text-muted">{b.author}</p>
              <div className="mt-2">
                {b.status === "Lent out" ? (
                  <span className="badge bg-primary/10 text-primary">
                    Lent out — with {b.heldByName}
                  </span>
                ) : (
                  <span className="badge bg-black/5 text-ink/70">{b.condition}</span>
                )}
              </div>
              {!isMe && b.status === "Available" && (
                <button
                  onClick={() => askInChat(b)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary-dark"
                >
                  <Icon name="chat" className="h-4 w-4" /> Ask in chat
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
