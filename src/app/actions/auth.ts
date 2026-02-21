"use server";

import { prisma } from "@/lib/db";

/**
 * Checks if a user exists with the given email and if their email is NOT yet verified.
 * This is used to decide whether to show the "Resend Verification" link in the SignUp form
 * without revealing whether a verified user already exists (enumeration protection).
 * 
 * @param email The email address to check
 * @returns true if the user exists and is NOT verified, false otherwise.
 */
export async function checkUnverifiedUser(email: string): Promise<boolean> {
    if (!email) return false;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { emailVerified: true },
        });

        // We only return true if the user exists AND their email is NOT verified.
        // If the user doesn't exist, OR they are already verified, we return false.
        // This prevents hackers from knowing if a verified account exists.
        return user !== null && !user.emailVerified;
    } catch (error) {
        console.error("Error checking unverified user:", error);
        return false;
    }
}
