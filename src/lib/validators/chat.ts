import { z } from "zod"
import { MODEL_CHAT, MODEL_VISION, MODEL_SEARCH, VISION_MODELS } from "@/config/models"

export const ALLOWED_MODELS = new Set([
    MODEL_CHAT,
    MODEL_VISION,
    MODEL_SEARCH,
    ...VISION_MODELS,
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-safeguard-20b",
    "qwen/qwen3-32b",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "moonshotai/kimi-k2-instruct",
    "allam-2-7b",
    "groq/compound",
    "groq/compound-mini",
    "canopylabs/orpheus-arabic-saudi",
    "canopylabs/orpheus-v1-english",
    "moonshotai/kimi-k2-instruct-0905"
])

export const chatRequestSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(100_000).optional().default(""),
        images: z.array(z.object({
            url: z.string().url().optional(),
            base64: z.string().optional(),
            mimeType: z.string(),
        })).max(4).optional(),
    })).min(1).max(100),
    webSearch: z.boolean().optional(),
    model: z.string().refine(m => ALLOWED_MODELS.has(m), "Invalid model").optional(),
})
