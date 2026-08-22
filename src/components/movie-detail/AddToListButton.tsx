"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ListSummary = { id: string; name: string };

export default function AddToListButton({
  movieId,
  lists,
  isLoggedIn,
}: {
  movieId: number;
  lists: ListSummary[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const openPanel = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setOpen((prev) => !prev);
  };

  const addToList = async (listId: string) => {
    const res = await fetch(`/api/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie_id: movieId }),
    });
    setStatus(res.ok ? "Added." : "Failed to add.");
  };

  const createAndAdd = async () => {
    if (!newListName.trim()) return;
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newListName.trim() }),
    });
    if (!res.ok) {
      setStatus("Failed to create list.");
      return;
    }
    const { data: list } = await res.json();
    await addToList(list.id);
    setNewListName("");
    router.refresh();
  };

  return (
    <div className="md-add-to-list">
      <button type="button" onClick={openPanel} className="btn-secondary">
        + Add to List
      </button>

      {open && (
        <div className="md-add-to-list-panel">
          {lists.length === 0 && (
            <p className="md-add-to-list-empty">You don&apos;t have any lists yet.</p>
          )}
          <ul className="md-add-to-list-items">
            {lists.map((list) => (
              <li key={list.id}>
                <button
                  type="button"
                  onClick={() => addToList(list.id)}
                  className="md-add-to-list-item"
                >
                  {list.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="md-add-to-list-form">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New list name"
            />
            <button type="button" onClick={createAndAdd} className="btn-primary btn-sm">
              Create
            </button>
          </div>
          {status && <p className="md-add-to-list-status">{status}</p>}
        </div>
      )}
    </div>
  );
}
