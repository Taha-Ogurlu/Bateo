import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: unknown;
}

function describe(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}\n\n${err.stack ?? ""}`;
  try {
    return JSON.stringify(err, Object.getOwnPropertyNames(err as object), 2);
  } catch {
    return String(err);
  }
}

/** Beklenmeyen hataları yakalayıp okunabilir şekilde gösterir */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("BATEO_ERROR", describe(error), info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: 24,
            background: "#0d0f16",
            color: "#eceff8",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Bir şeyler ters gitti 😕</h1>
          <p style={{ color: "#9aa1b5", fontSize: 13, marginBottom: 16 }}>
            Aşağıdaki hata kaydedildi. Uygulamayı yeniden başlatmayı dene.
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: 12,
              lineHeight: 1.6,
              background: "#161922",
              border: "1px solid #262b3a",
              borderRadius: 12,
              padding: 16,
              overflow: "auto",
              maxHeight: "60vh",
            }}
          >
            {describe(error)}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 16,
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              background: "#8ea0ff",
              color: "#0d0f16",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tekrar dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
