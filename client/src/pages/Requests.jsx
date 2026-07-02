import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Avatar from "../components/Avatar";
import { incomingCopy, outgoingCopy } from "../lib/requests";

export default function Requests() {
  const [data, setData] = useState({ incoming: [], outgoing: [], lentOut: [] });

  const load = () => api.get("/lending").then(setData);
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    await api.post(`/lending/${id}/${action}`);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-4xl font-bold text-ink">Requests</h1>
      <p className="mt-2 text-muted">Keep track of books coming in and going out.</p>

      {/* Incoming */}
      <div className="mt-9 flex items-center gap-3">
        <h2 className="font-display text-xl font-bold text-ink">Incoming</h2>
        {data.incoming.length > 0 && (
          <span className="badge bg-primary/15 text-primary">{data.incoming.length}</span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {data.incoming.map((r) => {
          const c = incomingCopy(r);
          return (
            <div key={r.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <Avatar name={r.from.name} size="lg" userId={r.from.id} />
              <div className="flex-1">
                <p className="font-semibold text-ink">{c.text}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                  {c.meta}
                  <span className="badge bg-black/5 text-ink/70">{c.badge}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => act(r.id, "decline")} className="btn-ghost">Decline</button>
                <button onClick={() => act(r.id, "accept")} className="btn-primary">{c.accept}</button>
              </div>
            </div>
          );
        })}
        {data.incoming.length === 0 && (
          <p className="card p-6 text-muted">Nothing incoming right now.</p>
        )}
      </div>

      {/* Outgoing */}
      <h2 className="mb-4 mt-10 font-display text-xl font-bold text-ink">Outgoing</h2>
      <div className="space-y-4">
        {data.outgoing.map((r) => {
          const c = outgoingCopy(r);
          return (
            <div key={r.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-4">
              <Avatar name={r.to.name} size="lg" userId={r.to.id} />
              <div className="flex-1">
                <p className="font-semibold text-ink">{c.text}</p>
                <p className="mt-1 text-sm text-muted">{c.meta}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge bg-amber-500/15 text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending
                </span>
                <button onClick={() => act(r.id, "cancel")} className="btn-ghost">
                  {r.type === "return" ? "Cancel return" : "Withdraw"}
                </button>
              </div>
            </div>
          );
        })}

        {/* Books currently lent out (read-only) */}
        {data.lentOut.map((b) => (
          <div key={b.id} className="card flex items-center gap-4 p-5">
            <Avatar name={b.heldByName} size="lg" />
            <div className="flex-1">
              <p className="font-semibold text-ink">
                You lent “{b.title}” to {b.heldByName}.
              </p>
              <p className="mt-1 text-sm text-muted">Currently on loan</p>
            </div>
            <span className="badge bg-badge-green/20 text-badge-green">
              <span className="h-1.5 w-1.5 rounded-full bg-badge-green" /> Lent out
            </span>
          </div>
        ))}

        {data.outgoing.length === 0 && data.lentOut.length === 0 && (
          <p className="card p-6 text-muted">No outgoing requests.</p>
        )}
      </div>
    </div>
  );
}
