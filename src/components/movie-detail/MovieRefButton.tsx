"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Kind = "favorites" | "watchlist";

const LABELS: Record<Kind, { active: string; inactive: string }> = {
  favorites: { active: "★ Favorited", inactive: "☆ Favorite" },
  watchlist: { active: "✓ In Watchlist", inactive: "+ Watchlist" },
};

export default function MovieRefButton({
  kind,
  movieId,
  initialActive,
  isLoggedIn,
}: {
  kind: Kind;
  movieId: number;
  initialActive: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (pending) return;
    setPending(true);
    const wasActive = active;
    setActive(!wasActive); // optimistic

    try {
      const res = wasActive
        ? await fetch(`/api/${kind}/${movieId}`, { method: "DELETE" })
        : await fetch(`/api/${kind}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ movie_id: movieId }),
          });
      if (!res.ok) setActive(wasActive); // revert on failure
    } catch {
      setActive(wasActive);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`btn-secondary${active ? " is-active" : ""}`}
    >
      {active ? LABELS[kind].active : LABELS[kind].inactive}
    </button>
  );
}
