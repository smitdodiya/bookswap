import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { CITIES } from "../lib/cities";
import Icon from "../components/Icon";

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "", email: "", password: "", city: "", bio: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
                <select
                  className={`input ${form.city ? "" : "text-muted"}`}
                  value={form.city}
                  onChange={set("city")}
                  required
                >
                  <option value="" disabled>Select your city</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c} className="text-ink">{c}</option>
                  ))}
                </select>
              </>
            )}
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={set("email")} />
            <input className="input" type="password" placeholder="Password" value={form.password} onChange={set("password")} />

            {error && <p className="text-sm text-primary">{error}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted">
            {mode === "login" ? (
              <>New here?{" "}
                <button type="button" onClick={() => setMode("signup")} className="font-semibold text-primary">
                  Create an account
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button type="button" onClick={() => setMode("login")} className="font-semibold text-primary">
                  Log in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
