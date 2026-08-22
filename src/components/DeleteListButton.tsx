"use client";

import { useRouter } from "next/navigation";

export default function DeleteListButton({ listId, listName }: { listId: string; listName: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    const res = await fetch(`/api/lists/${listId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  return (
    <button className="btn-secondary btn-sm" onClick={handleDelete} aria-label={`Delete ${listName}`}>
      Delete
    </button>
  );
}
