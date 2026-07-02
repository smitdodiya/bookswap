import { createContext, useContext, useCallback, useEffect, useState } from "react";
import Icon from "./Icon";

const DialogCtx = createContext(null);

let toastSeq = 0;

// App-wide replacement for window.confirm / window.alert with on-brand UI.
// confirm(opts) -> Promise<boolean>;  notify(message, type) -> void
export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { title, message, confirmLabel, cancelLabel, tone, resolve }
  const [toasts, setToasts] = useState([]);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setDialog({
          title: "Are you sure?",
          message: "",
          confirmLabel: "Confirm",
          cancelLabel: "Cancel",
          tone: "primary", // "primary" | "danger"
          ...opts,
          resolve,
        });
      }),
    []
  );

  const settle = (result) => {
    setDialog((d) => {
      d?.resolve(result);
      return null;
    });
  };

  // Escape cancels an open confirm dialog.
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => e.key === "Escape" && settle(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dialog]);

  const notify = useCallback((message, type = "success") => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const toastStyle = {
    success: { icon: "check", ring: "text-badge-green", chip: "bg-badge-green/15" },
    error: { icon: "close", ring: "text-primary", chip: "bg-primary/15" },
    info: { icon: "book", ring: "text-ink/70", chip: "bg-black/5" },
  };

  return (
    <DialogCtx.Provider value={{ confirm, notify }}>
      {children}

      {/* Confirm dialog */}
      {dialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 animate-fade-in"
          onClick={() => settle(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={dialog.title}
            className="w-full max-w-sm rounded-2xl bg-cream p-6 shadow-card animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl font-bold text-ink">{dialog.title}</h2>
            {dialog.message && <p className="mt-2 text-sm text-muted">{dialog.message}</p>}
            <div className="mt-6 flex gap-3">
              <button onClick={() => settle(false)} className="btn-ghost flex-1">
                {dialog.cancelLabel}
              </button>
              <button
                onClick={() => settle(true)}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white transition ${
                  dialog.tone === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary hover:bg-primary-dark"
                }`}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast stack */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const s = toastStyle[t.type] || toastStyle.info;
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 shadow-card animate-fade-up"
            >
              <span className={`grid h-6 w-6 place-items-center rounded-full ${s.chip} ${s.ring}`}>
                <Icon name={s.icon} className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-ink">{t.message}</span>
            </div>
          );
        })}
      </div>
    </DialogCtx.Provider>
  );
}

export const useDialog = () => useContext(DialogCtx);
