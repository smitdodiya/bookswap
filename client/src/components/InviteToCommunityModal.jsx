import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import Avatar from "./Avatar";
import { api } from "../lib/api";

// Invite existing BookSwap members to a community. The invitee gets a pending
// invite they can accept or decline from their Communities page.
export default function InviteToCommunityModal({ communityId, communityName, onClose }) {
  const [users, setUsers] = useState(null); // null = loading
  const [q, setQ] = useState("");
  const [invited, setInvited] = useState({}); // userId -> "sending" | "sent"
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/communities/${communityId}/invitable`)
      .then((d) => setUsers(d.users))
      .catch((err) => {
        setError(err.message);
        setUsers([]);
      });
  }, [communityId]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!users) return [];
    if (!term) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(term) || u.city?.toLowerCase().includes(term)
    );
  }, [users, q]);

  const invite = async (user) => {
    setError("");
    setInvited((s) => ({ ...s, [user.id]: "sending" }));
    try {
      await api.post(`/communities/${communityId}/invite`, { userId: user.id });
      setInvited((s) => ({ ...s, [user.id]: "sent" }));
    } catch (err) {
      setError(err.message);
      setInvited((s) => {
        const next = { ...s };
        delete next[user.id];
        return next;
      });
    }
  };

  return (
    <Modal
      title="Invite to community"
      subtitle={`Invite members to ${communityName}. They'll get an invite to accept.`}
      onClose={onClose}
    >
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-white px-3">
        <Icon name="search" className="h-4 w-4 text-muted" />
        <input
          className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
          placeholder="Search people by name or city"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>

      {error && <p className="mb-3 text-sm text-primary">{error}</p>}

      <div className="max-h-80 space-y-1 overflow-y-auto">
        {users === null && <p className="py-6 text-center text-sm text-muted">Loading…</p>}

        {users !== null && filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">
            {q.trim()
              ? "No one matches that search."
              : "Everyone's already a member or invited."}
          </p>
        )}

        {filtered.map((u) => {
          const state = invited[u.id];
          return (
            <div
              key={u.id}
              className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition hover:bg-white"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={u.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{u.name}</p>
                  {u.city && <p className="truncate text-xs text-muted">{u.city}</p>}
                </div>
              </div>
              <button
                onClick={() => invite(u)}
                disabled={Boolean(state)}
                className={
                  state === "sent"
                    ? "flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold text-badge-green"
                    : "flex shrink-0 items-center gap-1.5 rounded-lg bg-badge-green px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                }
              >
                {state === "sent" ? (
                  <>
                    <Icon name="check" className="h-4 w-4" /> Invited
                  </>
                ) : state === "sending" ? (
                  "Inviting…"
                ) : (
                  <>
                    <Icon name="userPlus" className="h-4 w-4" /> Invite
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="pt-4">
        <button onClick={onClose} className="btn-primary w-full">
          Done
        </button>
      </div>
    </Modal>
  );
}
