import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";
import BookCover from "../components/BookCover";
import CommunityChat from "../components/CommunityChat";
import InviteToCommunityModal from "../components/InviteToCommunityModal";
import ErrorState from "../components/ErrorState";

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [books, setBooks] = useState([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("library"); // "library" | "chat"
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState(false);

  const load = (query = "") => {
    setError(false);
    const params = query ? `?q=${encodeURIComponent(query)}` : "";
    api.get(`/communities/${id}${params}`).then((d) => {
      setCommunity(d.community);
      setBooks(d.books);
    }).catch(() => setError(true));
  };

  useEffect(() => { load(); }, [id]);

  // Debounced search within community
  useEffect(() => {
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const toggleJoin = async () => {
    if (community.joined) await api.post(`/communities/${id}/leave`);
    else await api.post(`/communities/${id}/join`);
    load(q);
  };

  if (error && !community) return <ErrorState onRetry={() => load(q)} />;
  if (!community) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <button
        onClick={() => navigate("/communities")}
        className="mb-5 flex items-center gap-1 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <Icon name="chevronLeft" className="h-4 w-4" /> All communities
      </button>

      {/* Header */}
      <div className="card flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-badge-green/25 text-badge-green">
          <Icon name="users" className="h-10 w-10" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-4xl font-bold text-ink">{community.name}</h1>
          <p className="mt-1 flex items-center gap-3 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Icon name="pin" className="h-4 w-4" /> {community.city}
            </span>
            <span className="text-line">•</span>
            <span>{community.memberCount} members</span>
            <span className="text-line">•</span>
            <span>{community.bookCount} books</span>
          </p>
        </div>
        {community.joined ? (
          <button
            onClick={toggleJoin}
            title="Leave this community"
            className="group rounded-xl border border-line bg-white px-5 py-2.5 font-semibold text-ink transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <span className="flex items-center gap-1.5 group-hover:hidden">
              <Icon name="check" className="h-4 w-4" /> Joined
            </span>
            <span className="hidden items-center gap-1.5 group-hover:flex">
              <Icon name="logout" className="h-4 w-4" /> Leave
            </span>
          </button>
        ) : (
          <button onClick={toggleJoin} className="btn-primary">
            Join community
          </button>
        )}
      </div>

      {/* Members */}
      <div className="mt-9 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-ink">Members</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{community.memberCount} readers</span>
          {community.joined && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-cream"
            >
              <Icon name="userPlus" className="h-4 w-4" /> Invite
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {community.members.map((m) => (
          <Avatar key={m.id} name={m.name} size="md" userId={m.id} />
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-10 flex gap-1 border-b border-line">
        {[
          { key: "library", label: "Combined library", icon: "book" },
          { key: "chat", label: "Community chat", icon: "chat" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === t.key
                ? "border-primary text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <Icon name={t.icon} className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "library" ? (
        <>
          <div className="mt-6 flex items-center justify-end">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 sm:w-72">
              <Icon name="search" className="h-4 w-4 text-muted" />
              <input
                className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
                placeholder="Search a title in this community"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {books.map((b) => (
              <div
                key={b.id}
                onClick={() => navigate(`/u/${b.owner.id}`)}
                className="cursor-pointer"
              >
                <BookCover book={b} className="h-52" />
                <div className="mt-3">
                  <h4 className="font-display text-base font-semibold text-ink">{b.title}</h4>
                  <p className="text-sm text-muted">{b.author}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="badge bg-black/5 text-ink/70">{b.condition}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <Avatar name={b.owner.name} size="sm" /> {b.owner.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {books.length === 0 && (
              <p className="col-span-full text-muted">No books match that title.</p>
            )}
          </div>
        </>
      ) : (
        <div className="mt-6">
          <CommunityChat community={community} onJoin={toggleJoin} />
        </div>
      )}

      {showInvite && (
        <InviteToCommunityModal
          communityId={id}
          communityName={community.name}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}
