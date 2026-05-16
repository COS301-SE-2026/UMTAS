"use client";

import { useState } from "react";
import { authClient } from "../lib/auth-client";

export default function AuthSection() {
  const [email, setEmail] = useState("student@example.com");
  const [password, setPassword] = useState("password123");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const { data: session } = authClient.useSession();

  const handleLogin = async () => {
    setStatus("loading");
    setError(null);
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });
      if (error) {
        throw new Error(error.message || "Login failed");
      }
      setStatus("success");
    } catch (err: unknown) {
      const error = err as Record<string, unknown>;
      setError((error.message as string) || "An error occurred");
      setStatus("error");
    }
  };

  const handleRegister = async () => {
    setStatus("loading");
    setError(null);
    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name: "Test Student",
      });
      if (error) {
        throw new Error(error.message || "Registration failed");
      }
      setStatus("success");
    } catch (err: unknown) {
      const error = err as Record<string, unknown>;
      setError((error.message as string) || "An error occurred");
      setStatus("error");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const { error } = await authClient.forgetPassword({
        email,
      });
      if (error) {
        throw new Error(error.message || "Request failed");
      }
      setStatus("idle");
      alert("Password reset email sent! Please check your inbox.");
    } catch (err: unknown) {
      const error = err as Record<string, unknown>;
      setError((error.message as string) || "An error occurred");
      setStatus("error");
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
  };

  if (session) {
    return (
      <div
        className="auth-section"
        style={{
          marginBottom: "1rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <p>
          Logged in as: <strong>{session.user.email}</strong>
        </p>
        <p>
          Role:{" "}
          <strong>
            {(session.user as { role?: string }).role || "student"}
          </strong>
        </p>
        <button
          onClick={handleLogout}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 1rem",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div
      className="auth-section"
      style={{
        marginBottom: "1rem",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h3>Student Login Required</h3>
      <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
        You must be logged in as a student to test the Hello World endpoint.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxWidth: "300px",
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button
            onClick={handleLogin}
            disabled={status === "loading"}
            style={{
              flex: 1,
              padding: "0.5rem",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Login
          </button>
          <button
            onClick={handleRegister}
            disabled={status === "loading"}
            style={{
              flex: 1,
              padding: "0.5rem",
              background: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Register
          </button>
        </div>
        <button
          onClick={handleForgotPassword}
          disabled={status === "loading"}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem",
            background: "transparent",
            color: "#2196F3",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.875rem",
            textDecoration: "underline",
          }}
        >
          Forgot Password?
        </button>
      </div>

      {error && (
        <p style={{ color: "red", marginTop: "0.5rem", fontSize: "0.875rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
