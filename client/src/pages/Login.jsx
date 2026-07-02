import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import Icon from "../components/Icon";
import SwitchAccountModal from "../components/SwitchAccountModal";

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [showAccounts, setShowAccounts] = useState(false);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({
    name: "", email: "raj@bookswap.in", password: "raj123", city: "Rajkot", bio: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Suggest existing cities on signup so people join an established one rather
  // than inventing a near-duplicate that filters would treat as separate.
  useEffect(() => {
    api.get("/auth/cities").then((d) => setCities(d.cities)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await signup(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-white">
            <Icon name="book" className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink">BookSwap</h1>
          <p className="mt-1 text-muted">A neighbourhood of readers.</p>
        </div>

        <div className="card p-7">
          <div className="mb-6 flex rounded-xl bg-black/5 p-1">
            {["login", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition ${
                  mode === m ? "bg-white text-ink shadow-soft" : "text-muted"
                }`}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <>
                <input className="input" placeholder="Full name" value={form.name} onChange={set("name")} />
                <input
                  className="input"
                  placeholder="City"
                  list="cities"
                  value={form.city}
                  onChange={set("city")}
                />
                <datalist id="cities">
                  {cities.map((c) => <option key={c} value={c} />)}
                </datalist>
              </>
            )}
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={set("email")} />
            <input className="input" type="password" placeholder="Password" value={form.password} onChange={set("password")} />

            {error && <p className="text-sm text-primary">{error}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          {mode === "login" && (
            <>
              <p className="mt-4 text-center text-xs text-muted">
                Demo user is pre-filled — just tap <span className="font-semibold text-ink">Log in</span>.
              </p>
              <div className="my-5 flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
              </div>
              <button
                type="button"
                onClick={() => setShowAccounts(true)}
                className="btn-ghost w-full"
              >
                <Icon name="users" className="h-4 w-4" /> Pick a demo account
              </button>
              <p className="mt-3 text-center text-[11px] text-muted">
                Sign in as any neighbour to play both sides of a swap.
              </p>
            </>
          )}
        </div>
      </div>

      {showAccounts && (
        <SwitchAccountModal
          onClose={() => setShowAccounts(false)}
          onSwitched={() => navigate("/")}
        />
      )}
    </div>
  );
}
