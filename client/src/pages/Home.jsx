import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Icon from "../components/Icon";
import BookCard from "../components/BookCard";
import BookCover from "../components/BookCover";
import Avatar from "../components/Avatar";

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("All cities");
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [results, setResults] = useState(null); // null = not searched yet
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/books/cities").then((d) => setCities(["All cities", ...d.cities]));
    api.get("/books/stats").then(setStats);
    api.get("/books/recent").then((d) => setRecent(d.books));
  }, []);

  const runSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city !== "All cities") params.set("city", city);
    try {
      const d = await api.get(`/books/search?${params.toString()}`);
      setResults(d.books);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Live search: run automatically (debounced) once there's a query or a city
  // filter; with neither, fall back to the default hero + "recently added" view.
  useEffect(() => {
    const hasFilter = query.trim() || city !== "All cities";
    if (!hasFilter) { setResults(null); return; }
    const t = setTimeout(runSearch, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, city]);

  const clear = () => { setResults(null); setQuery(""); setCity("All cities"); };

  return (
    <div>
      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          A neighbourhood of readers
        </p>
        <h1 className="mt-4 font-display text-5xl font-bold leading-tight text-ink md:text-6xl">
          Find your next read,
          <br /> just down the road.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-lg text-muted">
          Borrow and swap books with readers near you. Browse a shelf, send a
          message, meet for chai.
        </p>
      </div>

      {/* Search bar */}
      <form
        onSubmit={runSearch}
        className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-2xl bg-card p-3 shadow-card sm:flex-row"
      >
        <div className="flex flex-1 items-center gap-3 px-3">
          <Icon name="search" className="h-5 w-5 text-muted" />
          <input
            className="w-full bg-transparent py-3 text-ink placeholder:text-muted focus:outline-none"
            placeholder="Search by title or author, e.g. Karma"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3">
          <Icon name="pin" className="h-4 w-4 text-primary" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-transparent py-3 pr-2 text-sm font-medium text-ink focus:outline-none"
          >
            {cities.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-primary px-8">Search</button>
      </form>

      {/* Stats */}
      {stats && results === null && (
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted">
          <span><b className="text-ink">{stats.books.toLocaleString()}</b> books shared</span>
          <span className="text-line">•</span>
          <span><b className="text-ink">{stats.readers}</b> readers</span>
          <span className="text-line">•</span>
          <span><b className="text-ink">{stats.cities}</b> cities</span>
        </div>
      )}

      {/* Search results */}
      {results !== null && (
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-ink">
              {loading ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"}`}
              {query && <span className="text-muted"> for “{query}”</span>}
            </h2>
            <button onClick={clear} className="text-sm font-semibold text-primary">Clear</button>
          </div>

          {results.length === 0 ? (
            <div className="card p-10 text-center text-muted">
              No books found. Try another title or city.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigate(`/u/${b.owner.id}`)}
                  className={`card lift flex cursor-pointer items-center gap-4 p-4 ${
                    b.status === "Lent out" ? "opacity-60" : ""
                  }`}
                >
                  <BookCover book={b} lift={false} className="h-20 w-16 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display text-lg font-semibold text-ink">{b.title}</h4>
                    <p className="text-sm text-muted">{b.author}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="badge bg-black/5 text-ink/70">{b.condition}</span>
                      {b.status === "Lent out" && (
                        <span className="badge bg-primary/10 text-primary">Lent out</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 pr-1">
                    <Avatar name={b.owner.name} size="md" />
                    <div className="text-right">
                      <p className="font-semibold text-ink">{b.owner.name}</p>
                      <p className="flex items-center justify-end gap-1 text-xs text-muted">
                        <Icon name="pin" className="h-3 w-3" /> {b.owner.city}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Recently added rail */}
      {results === null && recent.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-ink">Recently added near you</h2>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {recent.map((b) => (
              <BookCard
                key={b.id}
                book={b}
                owner={b.owner}
                onClick={() => navigate(`/u/${b.owner.id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
