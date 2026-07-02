import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import Icon from "./Icon";
import Avatar from "./Avatar";
import { useDialog } from "./Dialog";
import { timeAgo, formatDay } from "../lib/ui";

// Group chat for a community. Members can read + post. Polls lightly so messages
// from other members appear (handy when testing by switching accounts).
export default function CommunityChat({ community, onJoin }) {
  const { notify } = useDialog();
  const [messages, setMessages] = useState([]);
  const [meId, setMeId] = useState(null);
  const [text, setText] = useState("");
  const endRef = useRef(null);
  const prevCount = useRef(0);
  // Guards against a poll for a previous community resolving after a switch.
  const activeId = useRef(community.id);

  const load = () => {
    if (!community.joined) return;
    const cid = community.id;
    api.get(`/communities/${cid}/messages`)
      .then((d) => {
        if (activeId.current !== cid) return; // switched communities — ignore stale result
        setMessages(d.messages);
        setMeId(d.meId);
      })
      .catch(() => {});
  };

  // Load on open + poll every 4s while mounted.
  useEffect(() => {
    activeId.current = community.id;
    if (!community.joined) return;
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [community.id, community.joined]);

  // Scroll to the newest message only when the count grows.
  useEffect(() => {
    if (messages.length !== prevCount.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      prevCount.current = messages.length;
    }
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text.trim();
    setText("");
    try {
      await api.post(`/communities/${community.id}/messages`, { body });
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  if (!community.joined) {
    return (
      <div className="card flex flex-col items-center gap-4 p-10 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-badge-green/20 text-badge-green">
          <Icon name="chat" className="h-7 w-7" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-ink">Join to open the chat</h3>
          <p className="mt-1 text-sm text-muted">
            The community chat is for members. Join {community.name} to read and post.
          </p>
        </div>
        <button onClick={onJoin} className="btn-primary">Join community</button>
      </div>
    );
  }

  return (
    <div className="card flex h-[62vh] flex-col overflow-hidden">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            No messages yet — say hello to your reading circle.
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.senderId === meId;
          const prev = messages[i - 1];
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
            <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && <Avatar name={m.sender.name} size="sm" userId={m.sender.id} />}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${mine ? "bg-primary text-white" : "bg-white text-ink shadow-soft"}`}>
                {!mine && (
                  <p className="mb-0.5 text-xs font-semibold text-primary">{m.sender.name}</p>
                )}
                <p className="text-[15px] leading-relaxed">{m.body}</p>
                <p className={`mt-1 text-[11px] ${mine ? "text-white/70" : "text-muted"}`}>
                  {timeAgo(m.createdAt)}
                </p>
              </div>
            </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-3 border-t border-line p-4">
        <input
          className="input flex-1"
          placeholder={`Message ${community.name}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary !px-3.5" title="Send">
          <Icon name="send" className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
