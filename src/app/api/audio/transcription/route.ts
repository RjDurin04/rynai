import Groq from "groq-sdk"
import { isConnectionError } from "@/lib/errors"
import { requireAuth, isApiError } from "@/lib/api-utils"
import { audioRatelimit } from "@/lib/rate-limit"

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

        if (!process.env.GROQ_API_KEY) {
            return Response.json(
                { error: "Server configuration error: missing API key" },
                { status: 500 }
            )
        }

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return Response.json(
                { error: "No file provided" },
                { status: 400 }
            )
        }

        // Validate file type
        const validTypes = ["audio/flac", "audio/m4a", "audio/mp3", "audio/mp4", "audio/mpeg", "audio/mpga", "audio/oga", "audio/ogg", "audio/wav", "audio/webm"]
        if (!validTypes.includes(file.type)) {
            return Response.json(
                { error: "Unsupported audio format. Supported: flac, m4a, mp3, mp4, ogg, wav, webm" },
                { status: 400 }
            )
        }

        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: "whisper-large-v3-turbo",
            response_format: "json",
            language: "en", // Optional: auto-detect if omitted, but 'en' improves extensive English performance
            temperature: 0,
        })

        return Response.json({ text: transcription.text })

    } catch (error) {
        if (isApiError(error)) {
            return Response.json({ error: error.message }, { status: error.statusCode })
        }
        const connectionError = isConnectionError(error)

        if (connectionError) {
            console.error("Transcription API error: Connection error (internet likely down)")
        } else {
            console.error("[Transcription API] Request failed:", error instanceof Error ? error.message : "Unknown error")
        }

        return Response.json(
            { error: connectionError ? "Connection lost. Please check your internet and try again." : "Failed to transcribe audio" },
            { status: connectionError ? 503 : 500 }
        )
    }
}
