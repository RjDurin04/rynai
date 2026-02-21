/**
 * Client-side API service for conversation and message operations.
 * Thin wrappers around fetch calls — keeps error handling at the call site.
 */

import type { Message } from "@/types/chat"

// ─── Conversations ──────────────────────────────────────────────

export async function fetchConversations(): Promise<Response> {
    return fetch("/api/conversations")
}

export async function createConversation(data: {
    title: string
    model: string
}): Promise<Response> {
    return fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
}

export async function deleteConversation(id: string): Promise<Response> {
    return fetch(`/api/conversations/${id}`, { method: "DELETE" })
}

export async function updateConversation(
    id: string,
    data: Record<string, unknown>
): Promise<Response> {
    return fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
}

// ─── Messages ───────────────────────────────────────────────────

export async function fetchMessages(conversationId: string): Promise<Response> {
    return fetch(`/api/conversations/${conversationId}/messages`)
}

export async function createMessage(
    conversationId: string,
    data: {
        role: string
        content: string
        imageUrls?: Array<{ url: string; key: string; fileName: string; mimeType: string }>
    }
): Promise<Response> {
    return fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
}

export async function updateMessage(
    conversationId: string,
    data: {
        messageId: string
        content: string
        imageUrls?: Array<{ url: string; key: string; fileName: string; mimeType: string }>
    }
): Promise<Response> {
    return fetch(`/api/conversations/${conversationId}/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
}

/**
 * Helper to prepare image data from a Message for API submission.
 */
export function prepareImageUrls(message: Message) {
    const imageUrls = message.images
        ?.filter((img) => img.url && img.key)
        .map((img) => ({
            url: img.url!,
            key: img.key!,
            fileName: img.fileName,
            mimeType: img.mimeType,
        }))
    return imageUrls && imageUrls.length > 0 ? imageUrls : undefined
}
