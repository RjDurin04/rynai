import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL, // Ensure this env var starts with http://localhost:3000 locally
});

export const { useSession, signIn, signUp, signOut, requestPasswordReset, sendVerificationEmail, updateUser, deleteUser } = authClient;
