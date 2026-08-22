"use client";

import { useRouter } from "next/navigation";

export default function RemoveFromListButton({ listId, movieId }: { listId: string; movieId: number }) {
  const router = useRouter();

  const handleRemove = async () => {
    const res = await fetch(`/api/lists/${listId}/items/${movieId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  return (
    <button className="btn-secondary" onClick={handleRemove}>
      Remove from list
    </button>
  );
}
