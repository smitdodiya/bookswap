import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";
import GiveBookModal from "../components/GiveBookModal";
import ReturnBookModal from "../components/ReturnBookModal";
import { useDialog } from "../components/Dialog";
import { incomingCopy, outgoingCopy } from "../lib/requests";
import { timeAgo, formatDay } from "../lib/ui";

export default function Chats() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useDialog();
  const [conversations, setConversations] = useState([]);
  const [thread, setThread] = useState(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [showGive, setShowGive] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [returnable, setReturnable] = useState([]); // partner's books I currently hold
  const [pendingIn, setPendingIn] = useState([]);   // requests from partner awaiting MY action
  const [pendingOut, setPendingOut] = useState([]); // my requests awaiting partner's action
  const endRef = useRef(null);
  // Tracks the chat currently open, so stale async responses from a previous
  // partner can't overwrite state after a fast chat switch.
  const activeUserId = useRef(userId);
  // Message count last rendered, so we only auto-scroll when new ones arrive
  // (not on every 4s poll, which would keep yanking the view down).
  const prevCount = useRef(0);

  const loadInbox = () => api.get("/chats").then((d) => setConversations(d.conversations));

  // (Re)load the open thread. Guards against a stale fetch landing after a switch.
  const loadThread = (uid = userId) => {
    if (!uid) { setThread(null); return; }
    api.get(`/chats/${uid}`)
      .then((d) => { if (activeUserId.current === uid) setThread(d); })
      .catch(() => {});
  };

  // Which of the current chat partner's books am I holding and able to return?
  const loadReturnable = (uid = userId) => {
    if (!uid) { setReturnable([]); return; }
    api.get("/lending/holding")
      .then((d) => {
        if (activeUserId.current !== uid) return; // switched chats — ignore stale result
        setReturnable(d.books.filter((b) => b.owner.id === uid && b.status === "Lent out"));
      })
      .catch(() => { if (activeUserId.current === uid) setReturnable([]); });
  };

  // Pending lending requests between me and the current partner, so I can accept
  // or decline right here without going to the Requests page.
  const loadRequests = (uid = userId) => {
    if (!uid) { setPendingIn([]); setPendingOut([]); return; }
    api.get("/lending")
      .then((d) => {
        if (activeUserId.current !== uid) return; // switched chats — ignore stale result
        setPendingIn(d.incoming.filter((r) => r.from.id === uid));
        setPendingOut(d.outgoing.filter((r) => r.to.id === uid));
      })
      .catch(() => {
        if (activeUserId.current === uid) { setPendingIn([]); setPendingOut([]); }
      });
  };

  // Accept / decline / cancel an inline request, then refresh what the chat shows.
  const actOnRequest = async (r, action) => {
    try {
      await api.post(`/lending/${r.id}/${action}`, {});
      loadRequests();
      loadReturnable();
      loadInbox();
      const msg =
        action === "accept"
          ? (r.type === "return" ? "Return confirmed" : `You received “${r.book.title}”`)
          : action === "cancel"
            ? "Request withdrawn"
            : "Request declined";
      notify(msg);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  useEffect(() => { loadInbox(); }, []);

  // Prefill the composer when arriving from an "Ask in chat" action.
  useEffect(() => {
    if (location.state?.draft) {
      setText(location.state.draft);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    activeUserId.current = userId;
    prevCount.current = 0; // force a scroll-to-bottom when a thread opens
    if (userId) {
      const refresh = () => {
        loadThread(userId);
        loadReturnable(userId);
        loadRequests(userId);
      };
      refresh();
      // Poll so the partner's new messages + requests appear without navigating.
      const t = setInterval(refresh, 4000);
      return () => clearInterval(t);
    }
    setThread(null);
    setReturnable([]);
    setPendingIn([]);
    setPendingOut([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Scroll to newest only when the message count grows (new message), not on
  // every poll that returns the same thread.
  useEffect(() => {
    const n = thread?.messages?.length || 0;
    if (n !== prevCount.current) {
      endRef.current?.scrollIntoView({ behavior: prevCount.current === 0 ? "auto" : "smooth" });
      prevCount.current = n;
    }
  }, [thread]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    const body = text.trim();
    setText("");
    // Optimistic: show my message instantly, reconcile with the server after.
    const temp = {
      id: `temp-${Date.now()}`,
      body,
      senderId: thread?.meId,
      createdAt: new Date().toISOString(),
    };
    setThread((t) => (t ? { ...t, messages: [...t.messages, temp] } : t));
    try {
      await api.post(`/chats/${userId}`, { body });
      loadThread(userId);
      loadInbox();
    } catch (err) {
      // Roll back the optimistic bubble and give the text back.
      setThread((t) =>
        t ? { ...t, messages: t.messages.filter((m) => m.id !== temp.id) } : t
      );
      setText(body);
      notify(err.message, "error");
    }
  };

  // Handed a book over from within the chat — drop a note so they know to confirm.
  const handleGiven = async (book) => {
    setShowGive(false);
    await api.post(`/chats/${userId}`, {
      body: `📖 I'm handing you "${book.title}" — accept it in your Requests once you have it.`,
    });
    loadThread(userId);
    loadInbox();
    loadReturnable();
    loadRequests();
    notify(`Handing "${book.title}" to ${thread.user.name}`);
  };

  // Started returning one of the partner's books from within the chat.
  const handleReturned = async (book) => {
    setShowReturn(false);
    await api.post(`/chats/${userId}`, {
      body: `📚 I'm returning "${book.title}" to you — confirm in your Requests once you have it back.`,
    });
    loadThread(userId);
    loadInbox();
    loadReturnable();
    loadRequests();
    notify(`Returning "${book.title}" to ${thread.user.name}`);
  };

  const filtered = conversations.filter((c) =>
    c.user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="mb-6 font-display text-4xl font-bold text-ink">Messages</h1>

      <div className="card grid min-h-[70vh] grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr]">
        {/* Inbox */}
        <div className={`border-r border-line ${userId ? "hidden md:block" : ""}`}>
          <div className="p-4">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3">
              <Icon name="search" className="h-4 w-4 text-muted" />
              <input
                className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
                placeholder="Search conversations"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1 px-2 pb-2">
            {filtered.map((c) => (
              <button
                key={c.user.id}
                onClick={() => navigate(`/chats/${c.user.id}`)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                  userId === c.user.id ? "bg-white shadow-soft" : "hover:bg-white/60"
                }`}
              >
                <Avatar name={c.user.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-ink">{c.user.name}</p>
                    <span className="text-[11px] text-muted">{timeAgo(c.lastAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${c.unread > 0 ? "font-semibold text-ink" : "text-muted"}`}>
                      {c.lastMessage}
                    </p>
                    {c.unread > 0 && userId !== c.user.id && (
                      <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted">No conversations yet.</p>
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex flex-col">
          {!thread ? (
            <div className="flex flex-1 items-center justify-center p-10 text-center text-muted">
              Select a conversation to start messaging.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line p-4">
                <button
                  onClick={() => navigate("/chats")}
                  className="text-muted md:hidden"
                >
                  <Icon name="chevronLeft" className="h-5 w-5" />
                </button>
                <Avatar name={thread.user.name} size="md" userId={thread.user.id} />
                <div className="flex-1">
                  <button
                    onClick={() => navigate(`/u/${thread.user.id}`)}
                    className="font-semibold text-ink transition hover:text-primary"
                  >
                    {thread.user.name}
                  </button>
                  <p className="flex items-center gap-1 text-xs text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-badge-green" /> {thread.user.city}
                  </p>
                </div>
                {returnable.length > 0 && (
                  <button
                    onClick={() => setShowReturn(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/80 transition hover:bg-cream"
                  >
                    <Icon name="swap" className="h-4 w-4" /> Return book
                  </button>
                )}
                <button
                  onClick={() => setShowGive(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-primary transition hover:bg-cream"
                >
                  <Icon name="gift" className="h-4 w-4" /> Give a book
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {thread.messages.map((m, i) => {
                  const mine = m.senderId === thread.meId;
                  const prev = thread.messages[i - 1];
                  const showDay = !prev || formatDay(prev.createdAt) !== formatDay(m.createdAt);
                  return (
                    <div key={m.id}>
                      {showDay && (
                        <div className="my-3 flex justify-center">
                          <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-medium text-muted">
                            {formatDay(m.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            mine
                              ? "bg-primary text-white"
                              : "bg-white text-ink shadow-soft"
                          }`}
                        >
                          <p className="text-[15px] leading-relaxed">{m.body}</p>
                          <p className={`mt-1 text-[11px] ${mine ? "text-white/70" : "text-muted"}`}>
                            {timeAgo(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Actionable requests from this person — accept/decline in place */}
                {pendingIn.map((r) => {
                  const c = incomingCopy(r);
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-primary/30 bg-primary/5 p-4"
                    >
                      <div className="flex items-start gap-2">
                        <Icon name="swap" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-sm font-semibold text-ink">{c.text}</p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => actOnRequest(r, "decline")}
                          className="rounded-xl border border-line bg-white px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-cream"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => actOnRequest(r, "accept")}
                          className="rounded-xl bg-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
                        >
                          {c.accept}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* My requests to this person — waiting on them */}
                {pendingOut.map((r) => {
                  const c = outgoingCopy(r);
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-line bg-white/70 p-4"
                    >
                      <p className="text-sm font-medium text-ink">{c.text}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {c.meta}
                      </p>
                      <div className="mt-3">
                        <button
                          onClick={() => actOnRequest(r, "cancel")}
                          className="rounded-xl border border-line bg-white px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-cream"
                        >
                          {r.type === "return" ? "Cancel return" : "Withdraw"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div ref={endRef} />
              </div>

              <form onSubmit={send} className="flex items-center gap-3 border-t border-line p-4">
                <input
                  className="input flex-1"
                  placeholder="Write a message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button type="submit" className="btn-primary !px-3.5" title="Send">
                  <Icon name="send" className="h-5 w-5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {showGive && thread && (
        <GiveBookModal
          toUser={thread.user}
          onClose={() => setShowGive(false)}
          onGiven={handleGiven}
        />
      )}

      {showReturn && thread && (
        <ReturnBookModal
          fromUser={thread.user}
          onClose={() => setShowReturn(false)}
          onReturned={handleReturned}
        />
      )}
    </div>
  );
}
