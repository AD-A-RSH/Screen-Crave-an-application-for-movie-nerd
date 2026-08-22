"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function Stars({ value, onRate }: { value: number; onRate: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div className="md-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onRate(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className={`md-star${n <= shown ? " filled" : ""}`}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function CommunityRating({
  movieId,
  average,
  count,
  initialUserRating,
  isLoggedIn,
}: {
  movieId: number;
  average: number | null;
  count: number;
  initialUserRating: number | null;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [userRating, setUserRating] = useState(initialUserRating ?? 0);
  const [status, setStatus] = useState<string | null>(null);

  const rate = async (rating: number) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    const previous = userRating;
    setUserRating(rating);
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie_id: movieId, rating }),
    });
    if (res.ok) {
      setStatus("Rating saved.");
      router.refresh();
    } else {
      setUserRating(previous);
      setStatus("Failed to save rating.");
    }
  };

  return (
    <section className="md-section">
      <h2 className="section-title">Community Rating</h2>
      <div className="md-rating-card">
        <div>
          <p className="md-rating-average">
            {average !== null ? average.toFixed(1) : "—"} <small>/ 5</small>
          </p>
          <p className="md-rating-count">
            {count} rating{count === 1 ? "" : "s"}
          </p>
        </div>
        <div>
          <p className="md-rating-your">Your Rating</p>
          <Stars value={userRating} onRate={rate} />
          {status && <p className="md-rating-status">{status}</p>}
        </div>
      </div>
    </section>
  );
}
