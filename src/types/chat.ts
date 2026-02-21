export type MessageRole = "user" | "assistant" | "system"

export type ImageAttachment = {
    url?: string
    key?: string
    base64?: string
    mimeType: string
    fileName: string
    file?: File
}

export type SearchResult = {
    title: string
    url: string
    snippet: string
}

export type Message = {
    id: string
    role: MessageRole
    content: string
    images?: ImageAttachment[]
    isStreaming?: boolean
    error?: string
    searchResults?: SearchResult[]
    createdAt: number
}

export type ChatModel =
    | "llama-3.3-70b-versatile"
    | "llama-3.1-8b-instant"
    | "openai/gpt-oss-120b"
    | "openai/gpt-oss-20b"
    | "openai/gpt-oss-safeguard-20b"
    | "qwen/qwen3-32b"
    | "meta-llama/llama-4-maverick-17b-128e-instruct"
    | "meta-llama/llama-4-scout-17b-16e-instruct"
    | "moonshotai/kimi-k2-instruct"
    | "allam-2-7b"
    | "groq/compound"
    | "groq/compound-mini"
    | "canopylabs/orpheus-arabic-saudi"
    | "canopylabs/orpheus-v1-english"
    | "moonshotai/kimi-k2-instruct-0905"

export type Conversation = {
    id: string
    title: string
    model: ChatModel
    messages: Message[]
    messageCount?: number
    isPersisted?: boolean
    isLoadingMessages?: boolean
    createdAt: number
    updatedAt: number
}
