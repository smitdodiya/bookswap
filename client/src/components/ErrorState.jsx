import Icon from "./Icon";

// Shown when a page's data fails to load, so the user gets feedback + a way out
// instead of a spinner that never resolves.
export default function ErrorState({
  message = "We couldn't load this. Check your connection and try again.",
  onRetry,
}) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon name="close" className="h-7 w-7" />
      </div>
      <div>
        <h3 className="font-display text-lg font-bold text-ink">Something went wrong</h3>
        <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          <Icon name="swap" className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}
