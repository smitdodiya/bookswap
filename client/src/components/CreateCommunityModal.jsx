import { useState } from "react";
import Modal from "./Modal";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { CITIES } from "../lib/cities";

// Create a new reading community. The creator becomes its first member.
export default function CreateCommunityModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const defaultCity = CITIES.includes(user?.city) ? user.city : "";
  const [form, setForm] = useState({ name: "", city: defaultCity });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city) {
      setError("Name and city are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { community } = await api.post("/communities", {
        name: form.name.trim(),
        city: form.city,
      });
      onCreated?.(community);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create a community"
      subtitle="Start a reading circle for your city — you'll be its first member."
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Name</label>
          <input
            className="input"
            placeholder="e.g. Rajkot Book Lovers"
            value={form.name}
            onChange={set("name")}
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">City</label>
          <select
            className={`input ${form.city ? "" : "text-muted"}`}
            value={form.city}
            onChange={set("city")}
            required
          >
            <option value="" disabled>Select a city</option>
            {CITIES.map((c) => (
              <option key={c} value={c} className="text-ink">{c}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-primary">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "Creating…" : "Create community"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
