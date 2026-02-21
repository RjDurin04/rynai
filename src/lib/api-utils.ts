import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"

/**
 * Custom API error class that carries an HTTP status code.
 * Thrown by auth/ownership guards and caught by route-level try/catch blocks.
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number
    ) {
        super(message)
        this.name = "ApiError"
    }
}

/**
 * Requires an authenticated session. Throws ApiError(401) if not authenticated.
 * Use inside route handlers wrapped in try/catch.
 */
export async function requireAuth() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new ApiError("Unauthorized", 401)
    }

    return session
}

/**
 * Checks that the given user owns the conversation. Throws ApiError(404) if
 * the conversation doesn't exist, or ApiError(403) if the user doesn't own it.
 */
export async function requireConversationOwnership(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { userId: true },
    })

    if (!conversation) {
        throw new ApiError("Conversation not found", 404)
    }

    if (conversation.userId !== userId) {
        throw new ApiError("Forbidden", 403)
    }
}

/**
 * Checks if an error is an ApiError. Used in catch blocks to return proper
 * HTTP responses.
 */
export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError
}
