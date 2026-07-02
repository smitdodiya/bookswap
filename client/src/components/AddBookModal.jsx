import { useState } from "react";
import Modal from "./Modal";
import { api } from "../lib/api";

const CONDITIONS = ["New", "Good", "Worn"];
const GENRES = [
  "Non-fiction", "Fiction", "Self-help", "Finance", "Biography",
  "History", "Philosophy", "Spirituality", "Business", "Productivity",
  "Psychology", "Memoir", "Thriller",
];

export default function AddBookModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ title: "", author: "", condition: "New", genre: "Non-fiction" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      setError("Title and author are required.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/books", form);
      onAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add a book to your shelf"
      subtitle="Lend it out when a neighbour asks."
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Title</label>
          <input
            className="input"
            placeholder="e.g. The Psychology of Money"
            value={form.title}
            onChange={set("title")}
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Author</label>
          <input
            className="input"
            placeholder="e.g. Morgan Housel"
            value={form.author}
            onChange={set("author")}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Condition</label>
            <select className="input" value={form.condition} onChange={set("condition")}>
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Genre</label>
            <select className="input" value={form.genre} onChange={set("genre")}>
              {GENRES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-primary">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "Adding…" : "Add to shelf"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
