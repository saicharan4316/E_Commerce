import "../styles/Errorpage.css";

export default function ErrorPage({ error, resetErrorBoundary }) {
  return (
    <div className="error-page">
      <h1 className="error-title">Oops!</h1>

      {error ? (
        <p className="error-message">
          {error.message || "Something went wrong."}
        </p>
      ) : (
        <p className="error-message">
          The page you’re looking for doesn’t exist.
        </p>
      )}

      <button
        onClick={resetErrorBoundary || (() => (window.location.href = "/"))}
        className="error-button"
      >
        Go Home
      </button>
    </div>
  );
}
