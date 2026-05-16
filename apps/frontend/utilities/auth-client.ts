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

//update import backend asseblief
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
