"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          display: "flex",
          minHeight: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          background: "#09090b",
          color: "#fafafa",
        }}
      >
        <div style={{ textAlign: "center", padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 500 }}>
            cadence hit an unexpected error
          </h2>
          {error.digest ? (
            <p style={{ fontFamily: "monospace", fontSize: 12, opacity: 0.6 }}>
              {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #3f3f46",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            reload
          </button>
        </div>
      </body>
    </html>
  );
}
