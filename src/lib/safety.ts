import Groq from "groq-sdk"
import { isConnectionError } from "@/lib/errors"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
})

export type SafetyResult = {
    isSafe: boolean
    reason?: string
}

/**
 * Checks if a message is safe using Llama Guard models.
 * @param message The text content to check.
 * @returns {Promise<SafetyResult>} Analysis result.
 */
export async function checkSafety(message: string): Promise<SafetyResult> {
    try {
        const response = await groq.chat.completions.create({
            model: "meta-llama/llama-guard-4-12b",
            messages: [
                {
                    role: "user",
                    content: message,
                },
            ],
        })

        const content = response.choices[0]?.message?.content?.trim().toLowerCase()

        if (content === "safe") {
            return { isSafe: true }
        }

        // Unsafe content usually returns "unsafe" followed by category codes (e.g., "unsafe\nS1")
        return {
            isSafe: false,
            reason: content?.replace("unsafe", "").trim() || "Unsafe content detected"
        }
    } catch (error) {
        if (isConnectionError(error)) {
            console.error("Safety check failed: Connection error (internet likely down)")
        } else {
            console.error("Safety check failed:", error)
        }

        // Fail-closed: block content if safety check is unavailable
        return { isSafe: false, reason: "Safety check unavailable" }
    }
}
