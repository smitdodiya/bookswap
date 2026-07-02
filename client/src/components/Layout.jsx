import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import Avatar from "./Avatar";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import AddBookModal from "./AddBookModal";
import SwitchAccountModal from "./SwitchAccountModal";

const NAV = [
  { to: "/", label: "Home & Search", icon: "search", end: true },
  { to: "/communities", label: "Communities", icon: "users" },
  { to: "/chats", label: "Chats", icon: "chat", countKey: "chats" },
  { to: "/requests", label: "Requests", icon: "swap", countKey: "requests" },
  { to: "/profile", label: "My Profile", icon: "user" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAdd, setShowAdd] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);
  const [counts, setCounts] = useState({ requests: 0, chats: 0 });

  const refreshCounts = () => {
    api.get("/lending").then((d) => {
      setCounts((c) => ({ ...c, requests: d.incoming.length }));
    }).catch(() => {});
    api.get("/chats").then((d) => {
      const unread = d.conversations.reduce((n, c) => n + (c.unread || 0), 0);
      setCounts((c) => ({ ...c, chats: unread }));
    }).catch(() => {});
  };

  // Refresh on every navigation (so actions taken elsewhere reflect here) and
  // poll lightly so a new message / request shows up without navigating.
  useEffect(() => {
    refreshCounts();
    const t = setInterval(refreshCounts, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const Logo = (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
        <Icon name="book" className="h-5 w-5" />
      </div>
      <span className="font-display text-xl font-bold text-ink">BookSwap</span>
    </div>
  );

  return (
    <div className="min-h-full">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-cream px-4 py-6 md:flex">
        <div className="px-2">{Logo}</div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-white text-ink shadow-soft" : "text-ink/70 hover:bg-white/60"
                }`
              }
            >
              <Icon name={item.icon} className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {item.countKey && counts[item.countKey] > 0 && (
                <span className="badge bg-primary text-white !px-2 !py-0.5">
                  {counts[item.countKey]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setShowAdd(true)}
          className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3 text-sm font-semibold text-ink/80 transition hover:bg-white/60"
        >
          <Icon name="plus" className="h-4 w-4" /> Add a book
        </button>

        <div className="mt-auto space-y-2">
          <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
            <Avatar name={user?.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{user?.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted">
                <Icon name="pin" className="h-3 w-3" /> {user?.city}
              </p>
            </div>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              title="Log out"
              className="text-muted transition hover:text-primary"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowSwitch(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white/60 py-2 text-sm font-semibold text-ink/80 transition hover:bg-white"
          >
            <Icon name="swap" className="h-4 w-4" /> Switch account
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:pl-64">
        <div
          key={location.pathname}
          className="mx-auto max-w-5xl px-5 pb-28 pt-8 animate-fade-up md:px-10 md:pb-12"
        >
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-cream/95 px-2 py-2 backdrop-blur md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium ${
                isActive ? "text-primary" : "text-ink/60"
              }`
            }
          >
            <Icon name={item.icon} className="h-5 w-5" />
            {item.countKey && counts[item.countKey] > 0 && (
              <span className="absolute right-1 top-0 h-4 min-w-4 rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-white">
                {counts[item.countKey]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {showAdd && (
        <AddBookModal
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); navigate("/profile"); }}
        />
      )}

      {showSwitch && (
        <SwitchAccountModal
          onClose={() => setShowSwitch(false)}
          onSwitched={() => {
            setShowSwitch(false);
            refreshCounts();
            navigate("/");
          }}
        />
      )}
    </div>
  );
}
