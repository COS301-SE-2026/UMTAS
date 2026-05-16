"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "../../lib/auth-client";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get("token");
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. Missing token.");
        return;
      }

      try {
        const { error } = await authClient.verifyEmail({
          query: { token },
        });

        if (error) {
          throw new Error(error.message || "Verification failed");
        }

        setStatus("success");
        setMessage("Email verified successfully! Redirecting to login...");
        setTimeout(() => router.push("/"), 3000);
      } catch (err: unknown) {
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Email Verification</h1>
      <p
        style={{
          color:
            status === "error"
              ? "red"
              : status === "success"
                ? "green"
                : "black",
          marginTop: "1rem",
        }}
      >
        {message}
      </p>
      {status === "success" && <p>You will be redirected shortly...</p>}
      {status === "error" && (
        <button
          onClick={() => router.push("/")}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            background: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Go to Home
        </button>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
