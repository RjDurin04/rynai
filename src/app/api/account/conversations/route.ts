import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAuth, isApiError } from "@/lib/api-utils"
import { UTApi } from "uploadthing/server"

const utapi = new UTApi()

/**
 * DELETE /api/account/conversations
 * Deletes all conversations and their UploadThing images for the authenticated user.
 */
export async function DELETE() {
    try {
        const session = await requireAuth()
        const userId = session.user.id

        // 1. Fetch all image keys for this user's conversations
        const imageAttachments = await prisma.imageAttachment.findMany({
            where: {
                message: {
                    conversation: {
                        userId,
                    },
                },
            },
            select: { key: true },
        })

        const keys = imageAttachments
            .map((img) => img.key)
            .filter((key): key is string => typeof key === "string" && key.length > 0)

        // 2. Delete from UploadThing
        if (keys.length > 0) {
            try {
                await utapi.deleteFiles(keys)
            } catch (error) {
                console.error("Failed to delete UploadThing images:", error instanceof Error ? error.message : "Unknown error")
                // Continue with DB deletion even if image deletion fails
            }
        }

        // 3. Delete all conversations (cascades to messages + image attachments)
        await prisma.conversation.deleteMany({
            where: { userId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        if (isApiError(error)) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode })
        }
        console.error("Failed to delete all conversations:", error instanceof Error ? error.message : "Unknown error")
        return NextResponse.json(
            { error: "Failed to delete chat history" },
            { status: 500 }
        )
    }
}
