import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAuth, requireConversationOwnership, isApiError } from "@/lib/api-utils"
import { UTApi } from "uploadthing/server"
import { createMessageSchema, updateMessageSchema } from "@/lib/validators/conversations"

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const session = await requireAuth()
        const { id } = await params
        await requireConversationOwnership(id, session.user.id)

        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: "asc" },
            include: {
                imageAttachments: true,
            },
        })

        return NextResponse.json(messages)
    } catch (error) {
        if (isApiError(error)) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode })
        }
        console.error("[Messages API] Failed to fetch:", error instanceof Error ? error.message : "Unknown error")
        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        )
    }
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const session = await requireAuth()
        const { id } = await params
        await requireConversationOwnership(id, session.user.id)

        const rawBody = await request.json()
        const parsed = createMessageSchema.safeParse(rawBody)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request parameters", details: parsed.error.format() },
                { status: 400 }
            )
        }
        const { role, content, imageUrls } = parsed.data

        const message = await prisma.message.create({
            data: {
                conversationId: id,
                role,
                content: content ?? "",
                imageAttachments: imageUrls
                    ? {
                        create: imageUrls.map((img) => ({
                            url: img.url,
                            key: img.key,
                            fileName: img.fileName,
                            mimeType: img.mimeType,
                        })),
                    }
                    : undefined,
            },
            include: {
                imageAttachments: true,
            },
        })

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() },
        })

        return NextResponse.json(message, { status: 201 })
    } catch (error) {
        if (isApiError(error)) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode })
        }
        console.error("[Messages API] Failed to create:", error instanceof Error ? error.message : "Unknown error")
        return NextResponse.json(
            { error: "Failed to create message" },
            { status: 500 }
        )
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const session = await requireAuth()
        const { id: conversationId } = await params
        const rawBody = await request.json()
        const parsed = updateMessageSchema.safeParse(rawBody)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request parameters", details: parsed.error.format() },
                { status: 400 }
            )
        }
        const { messageId, content, imageUrls } = parsed.data

        // Verify message belongs to the conversation and user owns the conversation
        const message = await prisma.message.findFirst({
            where: {
                id: messageId,
                conversationId,
                conversation: {
                    userId: session.user.id
                }
            }
        })

        if (!message) {
            return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 })
        }

        // 1. Fetch existing attachments to clean up UploadThing if needed
        const existingMessage = await prisma.message.findUnique({
            where: { id: messageId },
            include: { imageAttachments: true }
        })

        if (!existingMessage) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 })
        }

        // 2. Identify orphaned images
        if (imageUrls) {
            const existingKeys = existingMessage.imageAttachments
                .map(img => img.key)
                .filter((key): key is string => typeof key === 'string' && key.length > 0)

            const newKeys = imageUrls.map(img => img.key).filter(Boolean)
            const keysToDelete = existingKeys.filter(key => !newKeys.includes(key))

            if (keysToDelete.length > 0) {
                try {
                    const utapi = new UTApi()
                    await utapi.deleteFiles(keysToDelete)
                } catch (error) {
                    console.error("[UploadThing] Failed to delete orphaned images:", error instanceof Error ? error.message : "Unknown error")
                }
            }
        }

        // 3. Update message and DB attachments
        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: {
                content: content ?? "",
                imageAttachments: imageUrls ? {
                    deleteMany: {},
                    create: imageUrls.map((img) => ({
                        url: img.url,
                        key: img.key,
                        fileName: img.fileName,
                        mimeType: img.mimeType,
                    })),
                } : undefined,
            },
            include: {
                imageAttachments: true,
            }
        })

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        })

        return NextResponse.json(updatedMessage)
    } catch (error) {
        if (isApiError(error)) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode })
        }
        console.error("[Messages API] Failed to update:", error instanceof Error ? error.message : "Unknown error")
        return NextResponse.json(
            { error: "Failed to update message" },
            { status: 500 }
        )
    }
}
