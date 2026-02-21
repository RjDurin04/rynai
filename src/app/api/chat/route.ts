import Groq from "groq-sdk"
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions"
import { checkSafety } from "@/lib/safety"
import { isConnectionError } from "@/lib/errors"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { chatRatelimit } from "@/lib/rate-limit"
import { chatRequestSchema } from "@/lib/validators/chat"
import { SYSTEM_PROMPTS } from "@/config/prompts"
import { MODEL_CHAT, MODEL_VISION, MODEL_SEARCH, VISION_MODELS, MAX_HISTORY_MESSAGES } from "@/config/models"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
})

type RequestMessage = {
    role: "user" | "assistant"
    content: string
    images?: Array<{ base64?: string; url?: string; mimeType: string }>
}



function buildGroqMessages(
    messages: RequestMessage[],
    model: string
): ChatCompletionMessageParam[] {
    const groqMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPTS.chat },
    ]

    const trimmed = messages.slice(-MAX_HISTORY_MESSAGES)
    const isVisionModel = VISION_MODELS.includes(model)

    const contentMessages: ChatCompletionMessageParam[] = []

    // We only allow a maximum of 5 images total across the entire history
    let totalImagesIncluded = 0;
    const MAX_HISTORY_IMAGES = 5;

    for (let i = trimmed.length - 1; i >= 0; i--) {
        const msg = trimmed[i]

        let imagesToInclude = msg.images || [];
        if (msg.role === "user" && imagesToInclude.length > 0) {
            const remainingSlots = MAX_HISTORY_IMAGES - totalImagesIncluded;
            if (remainingSlots > 0) {
                imagesToInclude = imagesToInclude.slice(-remainingSlots);
                totalImagesIncluded += imagesToInclude.length;
            } else {
                imagesToInclude = [];
            }
        } else {
            imagesToInclude = [];
        }

        const shouldIncludeImage = imagesToInclude.length > 0;

        if (shouldIncludeImage) {
            if (isVisionModel) {
                // Multi-modal format for vision models
                const content: Array<
                    | { type: "text"; text: string }
                    | { type: "image_url"; image_url: { url: string } }
                > = [{ type: "text", text: msg.content }]

                for (const img of imagesToInclude) {
                    // Try to use URL if present, otherwise fallback to base64
                    const finalUrl = (img.url && img.url.startsWith("http")) ? img.url : img.base64
                    if (finalUrl) {
                        content.push({
                            type: "image_url",
                            image_url: { url: finalUrl },
                        })
                    }
                }

                contentMessages.unshift({
                    role: "user",
                    content: content as ChatCompletionMessageParam["content"],
                } as ChatCompletionMessageParam)
            } else {
                // Non-vision models expect content to be a string
                contentMessages.unshift({
                    role: "user",
                    content: msg.content || "Uploaded an image",
                })
            }
        } else {
            contentMessages.unshift({
                role: msg.role as "user" | "assistant",
                content: msg.content || (msg.images?.length ? "Uploaded an image" : ""),
            })
        }
    }

    groqMessages.push(...contentMessages)
    return groqMessages
}

export async function POST(request: Request) {
    try {
        if (!process.env.GROQ_API_KEY) {
            return Response.json(
                { error: "Server configuration error: missing API key" },
                { status: 500 }
            )
        }

        const session = await auth.api.getSession({ headers: await headers() })
        if (!session) {
            return Response.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { success } = await chatRatelimit.limit(session.session.userId)
        if (!success) {
            return Response.json(
                { error: "Rate limit exceeded. Please wait a moment and try again." },
                { status: 429 }
            )
        }

        let body
        try {
            const rawBody = await request.json()
            const parsed = chatRequestSchema.safeParse(rawBody)
            if (!parsed.success) {
                return Response.json(
                    { error: "Invalid request parameters", details: parsed.error.format() },
                    { status: 400 }
                )
            }
            body = parsed.data
        } catch (e) {
            console.error("[Chat API] Malformed JSON or aborted request:", e instanceof Error ? e.message : "Unknown error")
            return Response.json(
                { error: "Invalid request body or request aborted" },
                { status: 400 }
            )
        }

        const hasImages = body.messages.some(
            (m) => m.images && m.images.length > 0
        )
        const useWebSearch = body.webSearch === true

        // Safety check on the last user message
        const lastUserMessage = [...body.messages].reverse().find(m => m.role === "user")
        if (lastUserMessage) {
            const safety = await checkSafety(lastUserMessage.content)
            if (!safety.isSafe) {
                return Response.json(
                    { error: `Content Filter: This message was flagged as unsafe. Reason: ${safety.reason}` },
                    { status: 400 }
                )
            }
        }

        // Determine model strictly based on payload constraints
        let model: string = body.model || MODEL_CHAT

        if (useWebSearch) {
            // If it's a web search but model is not compound, strictly enforce search model
            if (!model.startsWith("groq/compound")) {
                model = MODEL_SEARCH
            }
        } else if (hasImages) {
            // If it has images but model is not a vision model, strictly enforce vision model
            if (!VISION_MODELS.includes(model)) {
                model = MODEL_VISION
            }
        }

        const isSearchModel = model.startsWith("groq/compound")

        // Stricter history trimming for search models (Alpha/Beta)
        // These models often have very limited context windows or specific history requirements
        const maxHistory = isSearchModel ? 10 : MAX_HISTORY_MESSAGES
        const groqMessages = buildGroqMessages(body.messages.slice(-maxHistory), model)

        // Diagnostic Logging (Removed for production-like quietness)
        /*
        const payloadString = JSON.stringify(groqMessages)
        console.log(`[Chat API] Model: ${model}, WebSearch: ${useWebSearch}`)
        ...
        */

        // Compound models (web search) do not support streaming
        if (isSearchModel) {
            const completion = await groq.chat.completions.create({
                model,
                messages: groqMessages,
                temperature: 0.7,
                max_tokens: 4096, // Use max_tokens for Groq standard
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any) // Type cast to allow max_tokens if SDK type is strictly OpenAI-like

            const message = completion.choices[0]?.message
            const content = message?.content ?? ""

            // Extract search results from executed_tools if available
            type ExecutedTool = {
                search_results?: Array<{
                    title?: string
                    url?: string
                    snippet?: string
                }>
            }

            const executedTools = (
                message as typeof message & { executed_tools?: ExecutedTool[] }
            )?.executed_tools

            let searchResults: Array<{ title: string; url: string; snippet: string }> = []

            if (executedTools && executedTools.length > 0) {
                const rawResults = executedTools[0]?.search_results
                if (rawResults && Array.isArray(rawResults)) {
                    searchResults = rawResults.map((r) => ({
                        title: r.title ?? "",
                        url: r.url ?? "",
                        snippet: r.snippet ?? "",
                    }))
                }
            }

            return Response.json({ content, searchResults })
        }

        // Streaming response for regular chat and vision
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stream: any = await groq.chat.completions.create({
            model,
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 4096,
            top_p: 1,
            stream: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)

        const encoder = new TextEncoder()

        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content
                        if (content) {
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                            )
                        }
                    }
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                    controller.close()
                } catch (err) {
                    const errorMessage =
                        err instanceof Error ? err.message : "Stream error"
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ error: errorMessage })}\n\n`
                        )
                    )
                    controller.close()
                }
            },
        })

        return new Response(readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        })
    } catch (err: unknown) {
        const connectionError = isConnectionError(err)

        if (connectionError) {
            console.error("[Chat API] Connection error (internet likely down)")
        } else {
            console.error("[Chat API] Request failed:", err instanceof Error ? err.message : "Unknown error")
        }

        if (
            err &&
            typeof err === "object" &&
            "status" in err &&
            (err as { status: number }).status === 429
        ) {
            return Response.json(
                { error: "Rate limit exceeded. Please wait a moment and try again." },
                { status: 429 }
            )
        }

        if (
            err &&
            typeof err === "object" &&
            "status" in err &&
            (err as { status: number }).status === 413
        ) {
            return Response.json(
                { error: "The request is too large. Please try a shorter message or fewer images. 📦" },
                { status: 413 }
            )
        }

        return Response.json(
            { error: connectionError ? "Connection lost. Please check your internet and try again." : (err instanceof Error ? err.message : "Something went wrong") },
            { status: connectionError ? 503 : 500 }
        )
    }
}
