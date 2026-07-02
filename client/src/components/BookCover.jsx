import { COVER_BG, coverFor } from "../lib/ui";

// The tall coloured book cover with the title printed on the spine side.
// `lift` (default true) adds the gentle hover raise; pass false for tiny thumbnails.
export default function BookCover({ book, className = "", lift = true }) {
  const cover = coverFor(book);
  return (
    <div
      className={`group/cover relative overflow-hidden rounded-xl ${COVER_BG[cover]} ${
        lift ? "lift" : ""
      } ${className}`}
    >
      {/* spine accent */}
      <div className="absolute inset-y-0 left-0 w-1.5 bg-black/5" />
      {/* soft sheen that sweeps in on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/0 opacity-0 transition-opacity duration-300 ease-soft group-hover/cover:via-white/10 group-hover/cover:opacity-100" />
      <div className="p-4">
        <h3 className="line-clamp-5 font-display text-lg font-semibold leading-tight text-ink/85 transition-transform duration-300 ease-soft group-hover/cover:-translate-y-0.5">
          {book.title}
        </h3>
      </div>
    </div>
  );
}
