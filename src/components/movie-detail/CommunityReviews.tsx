"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Review = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  profiles: { username: string | null; avatar_url: string | null } | null;
};

function formatDate(iso: string) {
  // Locale pinned explicitly (not `undefined`) so server and client render
  // identical text -- `undefined` resolves to the runtime's own default
  // locale, which differs between Node's server environment and the
  // browser, causing a hydration mismatch ("26 Jul 2026" vs "Jul 26, 2026").
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function CommunityReviews({
  movieId,
  initialReviews,
  currentUserId,
  isLoggedIn,
}: {
  movieId: number;
  initialReviews: Review[];
  currentUserId: string | null;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const ownReview = currentUserId ? reviews.find((r) => r.user_id === currentUserId) ?? null : null;

  const [draft, setDraft] = useState(ownReview?.body ?? "");
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (!draft.trim()) return;

    const res = ownReview
      ? await fetch(`/api/reviews/${ownReview.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: draft.trim() }),
        })
      : await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movie_id: movieId, body: draft.trim() }),
        });

    if (!res.ok) {
      setStatus("Failed to save review.");
      return;
    }
    setStatus(null);
    setEditing(false);
    router.refresh();
  };

  const remove = async () => {
    if (!ownReview) return;
    const res = await fetch(`/api/reviews/${ownReview.id}`, { method: "DELETE" });
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== ownReview.id));
      setDraft("");
      router.refresh();
    }
  };

  return (
    <section className="md-section">
      <h2 className="section-title">Community Reviews</h2>

      {isLoggedIn && (!ownReview || editing) && (
        <div className="md-review-form">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share your thoughts on this movie..."
            rows={4}
            className="md-review-textarea"
          />
          <div className="md-review-form-actions">
            <button
              type="button"
              onClick={submit}
              disabled={!draft.trim()}
              className="btn-primary"
            >
              {ownReview ? "Update Review" : "Post Review"}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(false)} className="md-review-cancel">
                Cancel
              </button>
            )}
            {status && <span className="md-rating-status">{status}</span>}
          </div>
        </div>
      )}

      {!isLoggedIn && (
        <p className="md-review-login-prompt">
          <a href="/login">Log in</a> to write a review.
        </p>
      )}

      {reviews.length === 0 && (
        <p className="md-review-empty">No reviews yet — be the first to share your thoughts.</p>
      )}

      <ul className="md-review-list">
        {reviews.map((review) => {
          const isOwn = review.user_id === currentUserId;
          return (
            <li key={review.id} className="md-review-card">
              <div className="md-review-header">
                <span className="md-review-author">{review.profiles?.username ?? "ScreenCrave user"}</span>
                <span className="md-review-date">{formatDate(review.updated_at)}</span>
              </div>
              <p className="md-review-body">{review.body}</p>
              {isOwn && !editing && (
                <div className="md-review-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(review.body);
                      setEditing(true);
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" onClick={remove}>
                    Delete
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
