"use client"

import * as React from "react"
import { useChatStore, generateId } from "@/lib/store/chat-store"
import type { ImageAttachment, Message, SearchResult } from "@/types/chat"
import { toast } from "sonner"

interface SendMessageOptions {
    images?: ImageAttachment[]
    webSearch?: boolean
    retryAssistantId?: string
    editingMessageId?: string
}

interface UseSendMessageReturn {
    handleSendMessage: (content: string, options?: SendMessageOptions) => Promise<void>
    isLoading: boolean
    abortRef: React.MutableRefObject<AbortController | null>
    onConversationChange: (newId: string | null) => void
}

export function useSendMessage(): UseSendMessageReturn {
    const [isLoading, setIsLoading] = React.useState(false)
    const abortRef = React.useRef<AbortController | null>(null)
    const isActualizingRef = React.useRef(false)
    const prevActiveIdRef = React.useRef<string | null>(null)

    const onConversationChange = React.useCallback((newId: string | null) => {
        if (
            prevActiveIdRef.current !== null &&
            prevActiveIdRef.current !== newId &&
            !isActualizingRef.current
        ) {
            abortRef.current?.abort()
        }
        isActualizingRef.current = false
        prevActiveIdRef.current = newId
    }, [])

    const handleSendMessage = React.useCallback(async (
        content: string,
        {
            images,
            webSearch,
            retryAssistantId,
            editingMessageId,
        }: SendMessageOptions = {}
    ) => {
        const state = useChatStore.getState()
        const { addMessage, updateMessage, persistMessage } = state
        const activeConversation = state.getActiveConversation()

        let currentId = state.activeConversationId
        let assistantId = retryAssistantId

        if (editingMessageId) {
            updateMessage(currentId, editingMessageId, { content, images })
            const currentMessages = useChatStore.getState().getActiveConversation()?.messages ?? []
            const userIdx = currentMessages.findIndex(m => m.id === editingMessageId)
            const nextMsg = currentMessages[userIdx + 1]

            if (nextMsg && nextMsg.role === "assistant") {
                assistantId = nextMsg.id
                updateMessage(currentId, assistantId, {
                    content: "",
                    isStreaming: true,
                    searchResults: undefined,
                    error: undefined,
                })
            } else {
                assistantId = generateId()
                const assistantMsg: Message = {
                    id: assistantId,
                    role: "assistant",
                    content: "",
                    isStreaming: true,
                    createdAt: Date.now(),
                }
                addMessage(currentId, assistantMsg)
                if (!currentId) currentId = useChatStore.getState().activeConversationId
            }
        } else if (!assistantId) {
            const userMessage: Message = {
                id: generateId(),
                role: "user",
                content,
                images,
                createdAt: Date.now(),
            }
            addMessage(currentId, userMessage)

            if (!currentId) {
                currentId = useChatStore.getState().activeConversationId
            }

            assistantId = generateId()
            const assistantMessage: Message = {
                id: assistantId,
                role: "assistant",
                content: "",
                isStreaming: true,
                createdAt: Date.now(),
            }
            addMessage(currentId, assistantMessage)
        } else {
            if (!assistantId) return
            updateMessage(currentId, assistantId, {
                content: "",
                isStreaming: true,
                searchResults: undefined,
                error: undefined,
            })
        }

        setIsLoading(true)
        abortRef.current = new AbortController()

        let accumulated = ""

        try {
            // Build messages for API (pull fresh state to avoid stale closure)
            const freshConversation = useChatStore.getState().getActiveConversation()
            const currentMessages = freshConversation?.messages ?? []

            const assistantIdx = currentMessages.findIndex(m => m.id === assistantId)
            const messageHistory = assistantIdx !== -1
                ? currentMessages.slice(0, assistantIdx)
                : currentMessages

            const apiMessages = messageHistory.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
                ...(m.images && m.images.length > 0
                    ? {
                        images: m.images.map((img) => ({
                            url: img.url,
                            base64: !img.url ? img.base64 : undefined,
                            mimeType: img.mimeType
                        }))
                    }
                    : {}),
            }))

            // Read model/reasoning from active conversation or drafts
            const latestState = useChatStore.getState()
            const latestConv = latestState.getActiveConversation()

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: apiMessages,
                    webSearch: webSearch ?? false,
                    model: latestConv?.model || latestState.draftModel,
                    reasoning_effort: latestConv?.reasoningEffort || latestState.draftReasoningEffort,
                    reasoning_format: latestConv?.reasoningFormat || latestState.draftReasoningFormat,
                }),
                signal: abortRef.current.signal,
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Request failed" }))
                throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            const contentType = response.headers.get("Content-Type") || ""

            if (contentType.includes("text/event-stream")) {
                // Streaming response
                const reader = response.body?.getReader()
                if (!reader) throw new Error("No response body")

                const decoder = new TextDecoder()

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value, { stream: true })
                    const lines = chunk.split("\n")

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const data = line.slice(6)
                            if (data === "[DONE]") break

                            try {
                                const parsed = JSON.parse(data)
                                if (parsed.error) {
                                    throw new Error(parsed.error)
                                }
                                if (parsed.content) {
                                    accumulated += parsed.content
                                    if (assistantId) {
                                        updateMessage(currentId, assistantId, {
                                            content: accumulated,
                                        })
                                    }
                                }
                            } catch (parseErr) {
                                if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
                                    if (!data.startsWith("{")) continue
                                    throw parseErr
                                }
                            }
                        }
                    }
                }

                if (assistantId) {
                    updateMessage(currentId, assistantId, {
                        isStreaming: false,
                    })
                }

                // Persist both messages to DB
                const finalState = useChatStore.getState().getActiveConversation()
                const userMsg = finalState?.messages.find(m => m.role === "user" && finalState.messages.indexOf(m) === assistantIdx - 1)
                const assistantMsg = finalState?.messages.find(m => m.id === assistantId)

                let persistedId = currentId
                if (userMsg && !retryAssistantId) {
                    const hasUnpersistedImages = userMsg.images?.some(img => !img.url)
                    if (hasUnpersistedImages) {
                        console.warn("Some images could not be persisted (no URL)")
                        toast.warning("Images from this message were not saved.")
                    }
                    isActualizingRef.current = true
                    const newId = await persistMessage(currentId, userMsg, !!editingMessageId)
                    if (newId) persistedId = newId
                }
                if (assistantMsg) {
                    isActualizingRef.current = true
                    await persistMessage(persistedId, { ...assistantMsg, isStreaming: false }, !!editingMessageId || !!retryAssistantId)
                }
            } else {
                // JSON response (web search)
                const data = await response.json()
                accumulated = data.content ?? ""
                const searchResults: SearchResult[] = data.searchResults ?? []

                if (assistantId) {
                    updateMessage(currentId, assistantId, {
                        content: accumulated,
                        isStreaming: false,
                        searchResults: searchResults.length > 0 ? searchResults : undefined,
                    })
                }

                // Persist both messages to DB
                const finalState2 = useChatStore.getState().getActiveConversation()
                const assistantIdx2 = finalState2?.messages.findIndex(m => m.id === assistantId) ?? -1
                const userMsg2 = finalState2?.messages.find(m => m.role === "user" && finalState2.messages.indexOf(m) === assistantIdx2 - 1)
                const assistantMsg2 = finalState2?.messages.find(m => m.id === assistantId)

                let persistedId2 = currentId
                if (userMsg2 && !retryAssistantId) {
                    const hasUnpersistedImages = userMsg2.images?.some(img => !img.url)
                    if (hasUnpersistedImages) {
                        console.warn("Some images could not be persisted (no URL)")
                        toast.warning("Images from this message were not saved.")
                    }
                    isActualizingRef.current = true
                    const newId2 = await persistMessage(currentId, userMsg2, !!editingMessageId)
                    if (newId2) persistedId2 = newId2
                }
                if (assistantMsg2) {
                    isActualizingRef.current = true
                    await persistMessage(persistedId2, { ...assistantMsg2, isStreaming: false }, !!editingMessageId || !!retryAssistantId)
                }
            }
        } catch (err) {
            if (assistantId) {
                if (err instanceof Error && err.name === "AbortError") {
                    updateMessage(currentId, assistantId, {
                        content: accumulated,
                        error: "The request was interrupted. ⏹️",
                        isStreaming: false,
                    })
                } else {
                    let errorMessage = err instanceof Error ? err.message : "Something went wrong"

                    if (!navigator.onLine || errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
                        errorMessage = "The connection was lost. Please check your internet. 🌐"
                    }

                    updateMessage(currentId, assistantId, {
                        content: accumulated,
                        error: errorMessage,
                        isStreaming: false,
                    })
                }
            }
        } finally {
            setIsLoading(false)
            abortRef.current = null
        }
    }, [])

    return { handleSendMessage, isLoading, abortRef, onConversationChange }
}
