// Shared display helpers

export const COVER_BG = {
  sage: "bg-sage",
  lavender: "bg-lavender",
  beige: "bg-beige",
  terracotta: "bg-terracotta",
  slate: "bg-slate",
};

// Deterministic cover colour from a string (fallback when none set)
const PALETTE = ["sage", "lavender", "beige", "terracotta", "slate"];
export function coverFor(book) {
  if (book?.cover && COVER_BG[book.cover]) return book.cover;
  const key = (book?.title || "") + (book?.author || "");
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 997;
  return PALETTE[h % PALETTE.length];
}

// Avatar tint from a name
const AVATAR_BG = ["bg-sage", "bg-lavender", "bg-terracotta", "bg-slate", "bg-beige"];
export function avatarClass(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 17 + name.charCodeAt(i)) % 997;
  return AVATAR_BG[h % AVATAR_BG.length];
}

export function initials(name = "") {
  return name.trim().charAt(0).toUpperCase() || "?";
}

// Short relative time for message/list timestamps: "Just now", "5m", "3h",
// "2d", then falls back to a date. Keeps context that a bare clock time loses.
export function timeAgo(iso) {
  const d = new Date(iso);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 45) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d`;
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

// Day label for chat separators: "Today", "Yesterday", or a full date.
export function formatDay(iso) {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}
