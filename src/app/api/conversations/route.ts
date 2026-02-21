import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAuth, isApiError } from "@/lib/api-utils"
import { DEFAULT_MODEL } from "@/config/models"
import { createConversationSchema } from "@/lib/validators/conversations"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await requireAuth()

        const conversations = await prisma.conversation.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" },
            include: {
                _count: {
                    select: { messages: true },
                },
            },
        })

        return NextResponse.json(conversations)
    } catch (error) {
        if (isApiError(error)) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode })
        }
        console.error("[Conversations API] Failed to fetch:", error instanceof Error ? error.message : "Unknown error")
        return NextResponse.json(
            { error: "Failed to fetch conversations" },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const session = await requireAuth()

        const rawBody = await request.json()
        const parsed = createConversationSchema.safeParse(rawBody)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request parameters", details: parsed.error.format() },
                { status: 400 }
            )
        }
        const { title, model } = parsed.data

        const conversation = await prisma.conversation.create({
            data: {
                userId: session.user.id,
                title: title ?? "New Chat",
                model: model ?? DEFAULT_MODEL,
            },
        })

        return NextResponse.json(conversation, { status: 201 })
    } catch (error) {
        if (isApiError(error)) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode })
        }
        console.error("[Conversations API] Failed to create:", error instanceof Error ? error.message : "Unknown error")
        return NextResponse.json(
            { error: "Failed to create conversation" },
            { status: 500 }
        )
    }
}
