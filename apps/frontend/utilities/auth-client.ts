import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "/api/auth",
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
