import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAuth, requireConversationOwnership, isApiError } from "@/lib/api-utils"
import { updateConversationSchema } from "@/lib/validators/conversations"

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const session = await requireAuth()
        const { id } = await params
        await requireConversationOwnership(id, session.user.id)

        const rawBody = await request.json()
        const parsed = updateConversationSchema.safeParse(rawBody)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request parameters", details: parsed.error.format() },
                { status: 400 }
            )
        }
        const { title, model, reasoningEffort, reasoningFormat } = parsed.data

        const conversation = await prisma.conversation.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(model !== undefined && { model }),
                ...(reasoningEffort !== undefined && { reasoningEffort }),
                ...(reasoningFormat !== undefined && { reasoningFormat }),
            },
        })

        return NextResponse.json(conversation)
    } catch (error) {
        if (isApiError(error)) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode })
        }
        console.error("Failed to update conversation:", error)
        return NextResponse.json(
            { error: "Failed to update conversation" },
            { status: 500 }
        )
    }
}

import { UTApi } from "uploadthing/server"

const utapi = new UTApi()

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const session = await requireAuth()
        const { id } = await params
        await requireConversationOwnership(id, session.user.id)

        // Fetch all image keys for this conversation
        const imageAttachments = await prisma.imageAttachment.findMany({
            where: {
                message: {
                    conversationId: id
                }
            },
            select: {
                key: true
            }
        }) as unknown as Array<{ key: string | null }>

        const keys = imageAttachments
            .map(img => img.key)
            .filter((key): key is string => typeof key === 'string' && key.length > 0)

        // Delete from UploadThing
        if (keys.length > 0) {
            try {
                await utapi.deleteFiles(keys)
            } catch (error) {
                console.error("Failed to delete files from UploadThing:", error)
                // Continue with DB deletion even if image deletion fails
            }
        }

        await prisma.conversation.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        if (isApiError(error)) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode })
        }
        console.error("Failed to delete conversation:", error)
        return NextResponse.json(
            { error: "Failed to delete conversation" },
            { status: 500 }
        )
    }
}
