import Groq from "groq-sdk"
import { isConnectionError } from "@/lib/errors"
import { requireAuth, isApiError } from "@/lib/api-utils"
import { audioRatelimit } from "@/lib/rate-limit"
import { speechRequestSchema } from "@/lib/validators/audio"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
    try {
        const session = await requireAuth()

        const { success } = await audioRatelimit.limit(session.session.userId)
        if (!success) {
            return Response.json(
                { error: "Rate limit exceeded. Please wait a moment and try again." },
                { status: 429 }
            )
        }

        const rawBody = await request.json()
        const parsed = speechRequestSchema.safeParse(rawBody)
        if (!parsed.success) {
            return Response.json(
                { error: "Invalid request parameters", details: parsed.error.format() },
                { status: 400 }
            )
        }
        const { text, voice = "en-US-JennyNeural" } = parsed.data // 'voice' will be mapped to Orpheus model/voice later

        // Mapping specific Groq voice IDs for canopylabs/orpheus-v1-english
        // Valid voices: [autumn diana hannah austin daniel troy]
        const VOICE_MAP: Record<string, string> = {
            "en-US-JennyNeural": "autumn",
            "en-US-TroyNeural": "troy",
        }
        const groqVoice = VOICE_MAP[voice] ?? "troy"

        const response = await groq.audio.speech.create({
            model: "canopylabs/orpheus-v1-english",
            voice: groqVoice,
            input: text,
            response_format: "wav",
        })

        // Groq SDK returns a response that can be converted to an ArrayBuffer
        const buffer = await response.arrayBuffer()

        return new Response(buffer, {
            headers: {
                "Content-Type": "audio/wav",
                "Content-Length": buffer.byteLength.toString(),
            },
        })

    } catch (err) {
        if (isApiError(err)) {
            return Response.json({ error: err.message }, { status: err.statusCode })
        }
        const connectionErr = isConnectionError(err)
        if (connectionErr) {
            console.error("Speech API error: Connection error (internet likely down)")
        } else {
            console.error("Speech API error:", err instanceof Error ? err.message : "Unknown error")
        }
        return Response.json(
            { error: connectionErr ? "Connection lost. Please check your internet." : "Failed to generate speech" },
            { status: connectionErr ? 503 : 500 }
        )
    }
}
