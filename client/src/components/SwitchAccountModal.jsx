import { useEffect, useState } from "react";
import Modal from "./Modal";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useDialog } from "./Dialog";

// Lists every demo account grouped by city; tap one to instantly log in as them.
// This is what lets you play both sides of a swap (hand over as Raj, accept as Meera).
export default function SwitchAccountModal({ onClose, onSwitched }) {
  const { user, demoLogin } = useAuth();
  const { notify } = useDialog();
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/auth/demo-users").then((d) => setUsers(d.users)).catch(() => {});
  }, []);

  const byCity = users.reduce((acc, u) => {
    (acc[u.city] ||= []).push(u);
    return acc;
  }, {});

  const pick = async (u) => {
    if (busy) return;
    setBusy(true);
    try {
      await demoLogin(u.id);
      onSwitched?.(u);
    } catch (e) {
      notify(e.message, "error");
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Switch account"
      subtitle="Demo mode — tap anyone to sign in as them and test the swap flow."
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
        {Object.entries(byCity).map(([city, list]) => (
          <div key={city}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              <Icon name="pin" className="h-3.5 w-3.5" /> {city}
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {list.map((u) => {
                const active = u.id === user?.id;
                return (
                  <button
                    key={u.id}
                    disabled={busy}
                    onClick={() => pick(u)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-50 ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-line bg-white hover:bg-cream"
                    }`}
                  >
                    <Avatar name={u.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{u.name}</p>
                      <p className="truncate text-xs text-muted">{u.email}</p>
                    </div>
                    {active && <Icon name="check" className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">Loading accounts…</p>
        )}
      </div>
    </Modal>
  );
}
