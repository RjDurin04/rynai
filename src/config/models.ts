import type { ChatModel, ReasoningEffort, ReasoningFormat } from "@/types/chat"

/**
 * Centralized model configuration constants.
 * All model defaults and lists should be defined here for easy maintenance.
 */

/** Default model for new conversations */
export const DEFAULT_MODEL: ChatModel = "llama-3.3-70b-versatile"

/** Default reasoning effort for new conversations */
export const DEFAULT_REASONING_EFFORT: ReasoningEffort = "medium"

/** Default reasoning format for new conversations */
export const DEFAULT_REASONING_FORMAT: ReasoningFormat = "parsed"

/** Default model for chat (non-vision, non-search) */
export const MODEL_CHAT = "llama-3.3-70b-versatile"

/** Default model for vision (image) inputs */
export const MODEL_VISION = "meta-llama/llama-4-scout-17b-16e-instruct"

/** Default model for web search */
export const MODEL_SEARCH = "groq/compound-mini"

/** Models that support multi-modal (image) inputs */
export const VISION_MODELS: string[] = [
    MODEL_VISION,
    "llama-3.2-11b-vision-preview",
    "llama-3.2-90b-vision-preview",
    "meta-llama/llama-4-scout-17b-16e-instruct",
]

/** Maximum number of history messages sent to the API */
export const MAX_HISTORY_MESSAGES = 50
