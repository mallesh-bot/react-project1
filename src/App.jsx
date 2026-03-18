import { useState, useEffect } from "react";
import "./App.css";

// ─── persist helpers ───────────────────────────────────────────────
const STORAGE_KEY = "motivation_liked_quotes";
const loadLiked = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
};
const saveLiked = (arr) => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

// ─── custom hook: fetch a random quote ────────────────────────────
function useQuote() {
  const [quote,   setQuote]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("https://dummyjson.com/quotes/random");
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      setQuote({
        _id:     String(data.id),
        content: data.quote,
        author:  data.author,
        tags:    [],
      });
    } catch {
      setError("Couldn't reach the server. Try again!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuote(); }, []);

  return { quote, loading, error, fetchQuote };
}

// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const { quote, loading, error, fetchQuote } = useQuote();
  const [likedQuotes, setLikedQuotes] = useState(loadLiked);
  const [showLiked,   setShowLiked]   = useState(false);
  const [searchTerm,  setSearchTerm]  = useState("");
  const [animKey,     setAnimKey]     = useState(0);

  useEffect(() => { saveLiked(likedQuotes); }, [likedQuotes]);
  useEffect(() => { if (quote) setAnimKey((k) => k + 1); }, [quote]);

  const isLiked = quote ? likedQuotes.some((q) => q._id === quote._id) : false;

  const filteredLiked = likedQuotes.filter(
    (q) =>
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleLike = () => {
    if (!quote) return;
    setLikedQuotes((prev) =>
      isLiked ? prev.filter((q) => q._id !== quote._id) : [...prev, quote]
    );
  };

  const removeLiked = (id) =>
    setLikedQuotes((prev) => prev.filter((q) => q._id !== id));

  const now     = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const dayNum  = now.getDate();

  return (
    <div className="app-wrapper">

      {/* ── Page Header ── */}
      <header className="app-header">
        <p className="app-header__eyebrow">Daily Dose of</p>
        <h1 className="app-header__title">Motivation</h1>
        <div className="app-header__badge">
          <span>❤️</span>
          <span className="app-header__badge-count">{likedQuotes.length}</span>
          <span className="app-header__badge-label">quotes saved</span>
        </div>
      </header>

      {/* ── Quote Card ── */}
      <div key={animKey} className="quote-card">

        <div className="quote-card__header">
          <div className="quote-card__calendar">
            <div className="quote-card__calendar-day">{dayName}</div>
            <div className="quote-card__calendar-num">{dayNum}</div>
          </div>
          <span className="quote-card__title">Quotes for the day</span>
        </div>

        <div className="quote-card__body">

          {/* loading state ✅ */}
          {loading && (
            <div className="quote-card__loading">
              <div className="quote-card__dots">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="quote-card__dot" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <p className="quote-card__loading-text">Fetching wisdom…</p>
            </div>
          )}

          {/* error state */}
          {!loading && error && (
            <p className="quote-card__error">⚠️ {error}</p>
          )}

          {/* quote content */}
          {!loading && !error && quote && (
            <>
              <blockquote className="quote-card__quote">{quote.content}</blockquote>
              <p className="quote-card__author">— {quote.author}</p>
            </>
          )}

          {/* empty state ✅ */}
          {!loading && !error && !quote && (
            <p className="quote-card__empty">Press "New Quote" to get started!</p>
          )}

          {/* footer: dots + closing quote */}
          <div className="quote-card__footer">
            <div className="quote-card__indicator-row">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`quote-card__indicator ${i === 0 ? "quote-card__indicator--active" : "quote-card__indicator--inactive"}`} />
              ))}
            </div>
            <span className="quote-card__close-quote">"</span>
          </div>

        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="actions">
        <button className="btn-new" onClick={fetchQuote} disabled={loading}>
          {loading ? "Loading…" : "✦  New Quote"}
        </button>
        <button
          className={`btn-like ${isLiked ? "btn-like--active" : "btn-like--inactive"}`}
          onClick={toggleLike}
          disabled={loading || !quote}
        >
          {isLiked ? "❤️ Liked" : "🤍 Like"}
        </button>
      </div>

      {/* ── Toggle Liked Panel ✅ ── */}
      <button
        className={`btn-toggle ${showLiked ? "btn-toggle--open" : ""}`}
        onClick={() => setShowLiked((s) => !s)}
      >
        {showLiked ? "▲" : "▼"}&nbsp;&nbsp;
        {showLiked ? "Hide" : "Show"} saved quotes ({likedQuotes.length})
      </button>

      {/* ── Liked Quotes Panel ── */}
      {showLiked && (
        <div className="liked-panel">
          <input
            className="search-input"
            type="text"
            placeholder="Search saved quotes or authors…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {likedQuotes.length === 0 ? (
            <p className="liked-empty">No saved quotes yet — like some to see them here! 🌱</p>
          ) : filteredLiked.length === 0 ? (
            <p className="liked-empty">No quotes match "{searchTerm}"</p>
          ) : (
            <ul className="liked-list">
              {filteredLiked.map((q) => (
                <li key={q._id} className="liked-item">
                  <div className="liked-item__text">
                    <span className="liked-item__quote">"{q.content}"</span>
                    <span className="liked-item__author">— {q.author}</span>
                  </div>
                  <button className="remove-btn" onClick={() => removeLiked(q._id)} title="Remove">×</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

    </div>
  );
}
