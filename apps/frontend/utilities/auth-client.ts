/**
 * UMTAS BetterAuth client
 *
 * This file initialises the BetterAuth client instance used throughout the
 * frontend. It must be imported wherever auth actions (signIn, signUp,
 * signOut, useSession) are needed.
 *
 * Backend integration points:
 *   POST /api/auth/sign-up/email
 *   POST /api/auth/sign-in/email
 *   GET  /api/auth/session
 *   POST /api/auth/sign-out
 *   GET  /api/auth/callback/google          (OAuth redirect handled by BetterAuth)
 *   POST /api/auth/forget-password
 *   POST /api/auth/reset-password
 */

//update as need, I am just using stubs for now
// import { createAuthClient } from "better-auth/react";

// export const authClient = createAuthClient({
//   baseURL: process.env.NEXT_PUBLIC_APP_URL,
// });

// export const { signIn, signUp, signOut, useSession, getSession } = authClient;
type AuthResult = { error: { message: string } | null };

export const signIn = {
  email: async (_opts: unknown): Promise<AuthResult> => ({ error: null }),
  social: async (_opts: unknown): Promise<AuthResult> => ({ error: null }),
};

export const signUp = {
  email: async (_opts: unknown): Promise<AuthResult> => ({ error: null }),
};

export const signOut = async (_opts?: unknown) => {};

export const useSession = () => ({ data: null, isPending: false });

export const getSession = async () => null;
