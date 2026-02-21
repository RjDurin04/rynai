import { z } from "zod"

const imageUrlSchema = z.object({
    url: z.string().url(),
    key: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
})

export const createConversationSchema = z.object({
    title: z.string().optional(),
    model: z.string().optional(),
})

export const updateConversationSchema = z.object({
    title: z.string().optional(),
    model: z.string().optional(),
    reasoningEffort: z.enum(["low", "medium", "high"]).optional(),
    reasoningFormat: z.enum(["raw", "parsed", "hidden"]).optional(),
})

export const createMessageSchema = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().optional().default(""),
    imageUrls: z.array(imageUrlSchema).optional(),
})

export const updateMessageSchema = z.object({
    messageId: z.string().min(1),
    content: z.string().optional().default(""),
    imageUrls: z.array(imageUrlSchema).optional(),
})
