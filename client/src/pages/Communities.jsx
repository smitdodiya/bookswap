import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";

function CommunityCard({ c, onJoinToggle, onOpen }) {
  return (
    <div className="card lift p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-badge-green/20 text-badge-green">
            <Icon name="users" className="h-6 w-6" />
          </div>
          <div className="cursor-pointer" onClick={onOpen}>
            <h3 className="font-display text-lg font-bold text-ink">{c.name}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              <Icon name="pin" className="h-3.5 w-3.5" /> {c.city}
              <span className="text-line">•</span> {c.memberCount} members
            </p>
          </div>
        </div>
        <button
          onClick={onJoinToggle}
          className={c.joined
            ? "rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cream"
            : "rounded-xl bg-badge-green px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"}
        >
          {c.joined ? "Joined" : "Join"}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {c.members.slice(0, 4).map((m) => (
            <div key={m.id} className="ring-2 ring-card rounded-full">
              <Avatar name={m.name} size="sm" />
            </div>
          ))}
        </div>
        <span className="text-sm text-muted">{c.bookCount} books shared</span>
      </div>
    </div>
  );
}

export default function Communities() {
  const navigate = useNavigate();
  const [data, setData] = useState({ mine: [], discover: [] });

  const load = () => api.get("/communities").then(setData);
  useEffect(() => { load(); }, []);

  const toggle = async (c) => {
    if (c.joined) await api.post(`/communities/${c.id}/leave`);
    else await api.post(`/communities/${c.id}/join`);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-4xl font-bold text-ink">Communities</h1>
      <p className="mt-2 text-muted">
        Reading circles near you. Join one to share shelves and discover books together.
      </p>

      {data.mine.length > 0 && (
        <>
          <h2 className="mb-4 mt-9 font-display text-xl font-bold text-ink">My communities</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {data.mine.map((c) => (
              <CommunityCard
                key={c.id}
                c={c}
                onOpen={() => navigate(`/communities/${c.id}`)}
                onJoinToggle={() => toggle(c)}
              />
            ))}
          </div>
        </>
      )}

      <h2 className="mb-4 mt-9 font-display text-xl font-bold text-ink">Discover</h2>
      <div className="grid gap-5 md:grid-cols-2">
        {data.discover.map((c) => (
          <CommunityCard
            key={c.id}
            c={c}
            onOpen={() => navigate(`/communities/${c.id}`)}
            onJoinToggle={() => toggle(c)}
          />
        ))}
        {data.discover.length === 0 && (
          <p className="text-muted">You've joined every community. Nice.</p>
        )}
      </div>
    </div>
  );
}
