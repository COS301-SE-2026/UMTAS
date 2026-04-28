"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

interface HelloResponse {
  success: boolean;
  message: string;
  id: string;
  createdAt: string;
}

export default function HelloButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  async function handleClick() {
    setStatus("loading");
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(`${apiUrl}/health/hello`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`API responded with status ${res.status}`);
      }

      const data: HelloResponse = await res.json();
      setResponse(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setStatus("error");
    }
  }

  return (
    <div className="hello-button-container">
      <button
        id="hello-world-btn"
        onClick={handleClick}
        disabled={status === "loading"}
        className="hello-button"
      >
        {status === "loading" ? (
          <span className="hello-button-spinner" />
        ) : (
          "🚀 Hello World"
        )}
      </button>

      {status === "success" && response && (
        <div id="hello-success" className="hello-result hello-result--success">
          <div className="hello-result-icon">✅</div>
          <div className="hello-result-body">
            <p className="hello-result-title">Full Stack Connected!</p>
            <p className="hello-result-detail">
              <strong>Message:</strong> {response.message}
            </p>
            <p className="hello-result-detail">
              <strong>DB Record ID:</strong> <code>{response.id}</code>
            </p>
            <p className="hello-result-detail">
              <strong>Created:</strong>{" "}
              {new Date(response.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div id="hello-error" className="hello-result hello-result--error">
          <div className="hello-result-icon">❌</div>
          <div className="hello-result-body">
            <p className="hello-result-title">Connection Failed</p>
            <p className="hello-result-detail">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
