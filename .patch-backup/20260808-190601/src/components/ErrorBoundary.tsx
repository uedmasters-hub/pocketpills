import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * A crashed React tree unmounts to an empty root — the classic "white screen".
 * This catches the error and prints it, so a failure is diagnosable in the page
 * itself rather than only in the devtools console.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; info: string }
> {
  state = { error: null as Error | null, info: "" };

  static getDerivedStateFromError(error: Error) {
    return { error, info: "" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info: info.componentStack ?? "" });
    console.error("[PocketPills] render error:", error, info);
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{ minHeight: "100vh", background: "#fff", padding: "40px 24px", fontFamily: "ui-monospace, monospace" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#b4541f", margin: 0 }}>
            Render error
          </p>
          <h1 style={{ fontSize: 22, margin: "8px 0 20px", color: "#2A2148" }}>{error.message}</h1>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.6, color: "#55507A", background: "#F5F4FA", padding: 16, borderRadius: 12, overflowX: "auto" }}>
            {error.stack}
          </pre>
          {info && (
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.6, color: "#8B87A8", marginTop: 16 }}>
              {info}
            </pre>
          )}
          <button
            onClick={() => location.reload()}
            style={{ marginTop: 20, padding: "10px 20px", borderRadius: 999, border: 0, background: "#4E2A84", color: "#fff", fontSize: 14, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
