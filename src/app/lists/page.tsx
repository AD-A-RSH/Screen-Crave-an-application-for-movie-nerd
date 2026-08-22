import Link from "next/link";
import CreateListForm from "../../components/CreateListForm";
import DeleteListButton from "../../components/DeleteListButton";
import { createClient } from "../../lib/supabase/server";
import { listLists } from "../../lib/lists";

export default async function ListsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>Log in to see your lists</h2>
          <p>
            <Link href="/login">Log in</Link> or{" "}
            <Link href="/signup">sign up</Link> to start creating lists.
          </p>
        </div>
      </div>
    );
  }

  const lists = await listLists(user.id);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Your Lists</h1>
        <p className="page-subtitle">Organize movies into your own custom collections.</p>
      </div>

      <CreateListForm />

      {lists.length === 0 ? (
        <p className="empty-inline">You haven&apos;t created any lists yet.</p>
      ) : (
        <div className="lists-grid">
          {lists.map((list) => (
            <div className="list-card" key={list.id}>
              <Link href={`/lists/${list.id}`}>{list.name}</Link>
              <DeleteListButton listId={list.id} listName={list.name} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
