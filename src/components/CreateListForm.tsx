"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function CreateListForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || creating) return;

    setCreating(true);
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setCreating(false);
    if (res.ok) {
      setName("");
      router.refresh();
    }
  };

  return (
    <form className="pill-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="New list name (e.g. Rainy Day Movies)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button className="btn-primary" type="submit" disabled={creating}>
        {creating ? "Creating..." : "Create List"}
      </button>
    </form>
  );
}
