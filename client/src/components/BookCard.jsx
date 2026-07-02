import BookCover from "./BookCover";
import Avatar from "./Avatar";

// A book tile: tall cover, then title / author / condition, and optionally owner.
export default function BookCard({ book, owner, onClick, footer }) {
  return (
    <div
      className={`group ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <BookCover book={book} className="h-52 transition group-hover:shadow-card" />
      <div className="mt-3">
        <h4 className="font-display text-base font-semibold leading-snug text-ink">
          {book.title}
        </h4>
        {book.author && <p className="text-sm text-muted">{book.author}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {book.status === "Lent out" && book.heldByName ? (
            <span className="badge bg-primary/10 text-primary">
              Lent out — with {book.heldByName}
            </span>
          ) : book.status && book.status !== "Available" ? (
            <span className="badge bg-black/5 text-ink/70">{book.status}</span>
          ) : (
            book.condition && (
              <span className="badge bg-black/5 text-ink/70">{book.condition}</span>
            )
          )}
        </div>

        {owner && (
          <div className="mt-2 flex items-center gap-2">
            <Avatar name={owner.name} size="sm" />
            <span className="text-sm text-muted">
              {owner.name}
              {owner.city ? ` · ${owner.city}` : ""}
            </span>
          </div>
        )}

        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </div>
  );
}
