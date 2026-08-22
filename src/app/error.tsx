"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  // Error boundaries need client interactivity because reset() is a button action.
  // Next.js automatically renders this file when a route segment throws.
  return (
    <div className="page">
      <div className="error-message">
        <p>Something went wrong.</p>
        <p>{error.message}</p>
        <button className="btn-primary" type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
