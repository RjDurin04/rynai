"use client"

import { create } from "zustand"
import type { Conversation, Message, ChatModel } from "@/types/chat"
import { DEFAULT_MODEL } from "@/config/models"
import * as api from "@/lib/api/conversations"

type ChatStore = {
    conversations: Conversation[]
    activeConversationId: string | null
    isLoaded: boolean
    draftModel: ChatModel

    persistingIds: Set<string>

    loadConversations: () => Promise<void>
    createConversation: () => Promise<string>
    deleteConversation: (id: string) => Promise<void>
    setActiveConversation: (id: string | null) => void
    setConversationModel: (id: string | null, model: ChatModel) => void
    addMessage: (conversationId: string | null, message: Message) => void
    updateMessage: (conversationId: string | null, messageId: string, updates: Partial<Message>) => void
    updateConversationTitle: (id: string | null, title: string) => void
    getActiveConversation: () => Conversation | undefined
    persistMessage: (conversationId: string | null, message: Message, isEdit?: boolean) => Promise<string | undefined>
    loadMessagesForConversation: (id: string | null) => Promise<void>
    setDraftModel: (model: ChatModel) => void
    clearAllConversations: () => void
}

export function generateId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID()
    }
    // Fallback for insecure contexts (HTTP)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

function createNewConversationLocally(): Conversation {
    const id = generateId()
    const now = Date.now()
    return {
        id,
        title: "New Chat",
        model: DEFAULT_MODEL,
        messages: [],
        isPersisted: false,
        createdAt: now,
        updatedAt: now,
    }
}

export const useChatStore = create<ChatStore>((set, get) => {
    return {
        conversations: [],
        activeConversationId: null,
        isLoaded: false,
        draftModel: DEFAULT_MODEL,
        persistingIds: new Set<string>(),

        loadConversations: async () => {
            try {
                const res = await api.fetchConversations()

                if (res.status === 401) {
                    set({ isLoaded: true })
                    return
                }

                if (!res.ok) throw new Error("Failed to load conversations")
                const dbConversations = await res.json()

                // Map simple conversation data without messages (lazy-load later)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedConversations: Conversation[] = dbConversations.map((conv: Record<string, any>) => ({
                    id: conv.id as string,
                    title: conv.title as string,
                    model: (conv.model as ChatModel) || DEFAULT_MODEL,
                    messages: [], // Initialize empty
                    messageCount: conv._count?.messages || 0,
                    isPersisted: true,
                    createdAt: new Date(conv.createdAt as string).getTime(),
                    updatedAt: new Date(conv.updatedAt as string).getTime(),
                }))

                const storedId = sessionStorage.getItem('active-conversation-id')

                // If we have a stored ID and it exists in DB, use it.
                // Otherwise, stick with null (New Chat)
                const finalActiveId = (storedId && mappedConversations.some(c => c.id === storedId))
                    ? storedId
                    : null

                set({
                    conversations: mappedConversations,
                    activeConversationId: finalActiveId,
                    isLoaded: true,
                })

                // Load messages for the initial active conversation if it's persisted
                if (finalActiveId && mappedConversations.some(c => c.id === finalActiveId)) {
                    get().loadMessagesForConversation(finalActiveId)
                }

            } catch (error) {
                console.error("Failed to load conversations:", error)
                set({ isLoaded: true })
            }
        },

        createConversation: async () => {
            set({
                activeConversationId: null, // Set active to null to indicate a new, unsaved chat
                // Reset draft settings for a completely fresh start
                draftModel: DEFAULT_MODEL,
            })
            sessionStorage.removeItem('active-conversation-id') // Clear stored active ID
            return "new" // Return a dummy string since it's now nullable
        },

        deleteConversation: async (id) => {
            try {
                await api.deleteConversation(id)
                const { activeConversationId } = get()
                set((state) => ({
                    conversations: state.conversations.filter((c) => c.id !== id),
                    activeConversationId: activeConversationId === id ? null : activeConversationId,
                }))
                if (activeConversationId === id) {
                    sessionStorage.removeItem('active-conversation-id')
                }
            } catch (error) {
                console.error(`Failed to delete conversation ${id}:`, error)
                // Optionally: show a toast error to the user
            }
        },

        setActiveConversation: (id) => {
            set({ activeConversationId: id })
            if (id) {
                sessionStorage.setItem('active-conversation-id', id)
            } else {
                sessionStorage.removeItem('active-conversation-id')
            }

            // Trigger message load if not already loaded and is persisted
            if (id) {
                const conv = get().conversations.find(c => c.id === id)
                if (conv?.isPersisted && conv.messages.length === 0) {
                    get().loadMessagesForConversation(id)
                }
            }
        },


        setConversationModel: (id, model) => {
            if (!id) {
                set({ draftModel: model })
                return
            }
            const conv = get().conversations.find(c => c.id === id)
            set((state) => ({
                conversations: state.conversations.map((c) =>
                    c.id === id ? { ...c, model, updatedAt: Date.now() } : c
                ),
            }))

            if (conv?.isPersisted) {
                api.updateConversation(id, { model }).catch(() => { })
            }
        },

        addMessage: (conversationId, message) => {
            let conv = conversationId ? get().conversations.find(c => c.id === conversationId) : undefined

            // If no conversation exists (New Chat flow), create it locally
            if (!conv) {
                const { draftModel } = get()
                conv = {
                    ...createNewConversationLocally(),
                    model: draftModel,
                    messages: [message],
                    messageCount: 1,
                    title: message.role === "user"
                        ? message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "")
                        : "New Chat"
                }
                set(state => ({
                    conversations: [conv!, ...state.conversations],
                    activeConversationId: conv!.id
                }))
                return
            }

            set((state) => ({
                conversations: state.conversations.map((c) => {
                    if (c.id !== conversationId) return c

                    const isFirstUserMessage =
                        message.role === "user" &&
                        conv!.messages.filter((m) => m.role === "user").length === 0 // Use conv! as it's guaranteed to exist here

                    const newTitle = isFirstUserMessage
                        ? message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "")
                        : conv!.title // Use conv!

                    // Update title in DB if changed AND persisted
                    if (isFirstUserMessage && conv!.isPersisted) { // Use conv!
                        api.updateConversation(conversationId!, { title: newTitle }).catch(() => { })
                    }

                    return {
                        ...conv!, // Use conv!
                        messages: [...conv!.messages, message], // Use conv!
                        messageCount: (conv!.messageCount || 0) + 1, // Use conv!
                        title: newTitle,
                        updatedAt: Date.now(),
                    }
                }),
            }))
        },

        persistMessage: async (conversationId, message, isEdit = false) => {
            if (conversationId && get().persistingIds.has(conversationId)) {
                return conversationId
            }
            if (conversationId) {
                set(state => ({ persistingIds: new Set([...state.persistingIds, conversationId!]) }))
            }
            try {
                let conv = conversationId ? get().conversations.find(c => c.id === conversationId) : undefined

                // If no conversation exists (New Chat), create it locally first
                if (!conv && !isEdit) {
                    const { draftModel } = get()
                    conv = {
                        ...createNewConversationLocally(),
                        model: draftModel,
                    }
                    set(state => ({
                        conversations: [conv!, ...state.conversations],
                        activeConversationId: conv!.id
                    }))
                    conversationId = conv.id
                    // Also add the new conversationId to persistingIds
                    set(state => ({ persistingIds: new Set([...state.persistingIds, conversationId!]) }))
                }

                if (!conv) return undefined

                // 1. Create conversation in DB if not persisted yet
                if (!conv.isPersisted) {
                    try {
                        const res = await api.createConversation({
                            title: conv.title,
                            model: conv.model,
                        })

                        if (res.ok) {
                            const dbConv = await res.json()
                            const actualDbId = dbConv.id

                            // Update local state to map local ID to DB ID
                            set((state) => ({
                                conversations: state.conversations.map((c) =>
                                    c.id === conversationId
                                        ? { ...c, id: actualDbId, isPersisted: true }
                                        : c
                                ),
                                activeConversationId:
                                    state.activeConversationId === conversationId
                                        ? actualDbId
                                        : state.activeConversationId
                            }))
                            sessionStorage.setItem('active-conversation-id', actualDbId)
                            // Update our local reference to the conversation
                            conv = { ...conv, id: actualDbId, isPersisted: true }
                        } else {
                            throw new Error("Failed to persist conversation")
                        }
                    } catch (error) {
                        console.error("Conversation persistence failed:", error)
                        return undefined
                    }
                }

                const actualConversationId = conv.id

                // 2. Persist the message
                try {
                    const imageUrls = api.prepareImageUrls(message)

                    if (isEdit) {
                        const res = await api.updateMessage(actualConversationId, {
                            messageId: message.id,
                            content: message.content,
                            imageUrls,
                        })

                        if (res.status === 404) {
                            // If the message was never saved during a previous stream creation failure, fallback to POST
                            await api.createMessage(actualConversationId, {
                                role: message.role,
                                content: message.content,
                                imageUrls,
                            })
                        }
                    } else {
                        await api.createMessage(actualConversationId, {
                            role: message.role,
                            content: message.content,
                            imageUrls,
                        })
                    }
                    return actualConversationId
                } catch (error) {
                    console.error("Failed to persist message:", error)
                    return actualConversationId
                }
            } finally {
                if (conversationId) {
                    set(state => {
                        const next = new Set(state.persistingIds)
                        next.delete(conversationId!)
                        return { persistingIds: next }
                    })
                }
            }
        },

        updateMessage: (conversationId, messageId, updates) => {
            if (!conversationId) return
            set((state) => ({
                conversations: state.conversations.map((conv) => {
                    if (conv.id !== conversationId) return conv
                    return {
                        ...conv,
                        messages: conv.messages.map((msg) =>
                            msg.id === messageId ? { ...msg, ...updates } : msg
                        ),
                        updatedAt: Date.now(),
                    }
                }),
            }))
        },

        updateConversationTitle: (id, title) => {
            if (!id) return
            const conv = get().conversations.find(c => c.id === id)
            set((state) => ({
                conversations: state.conversations.map((c) =>
                    c.id === id ? { ...c, title, updatedAt: Date.now() } : c
                ),
            }))

            if (conv?.isPersisted) {
                api.updateConversation(id, { title }).catch(() => { })
            }
        },

        getActiveConversation: () => {
            const { conversations, activeConversationId } = get()
            if (!activeConversationId) return undefined
            return conversations.find((c) => c.id === activeConversationId)
        },

        loadMessagesForConversation: async (id) => {
            if (!id) return
            const conv = get().conversations.find(c => c.id === id)
            if (!conv || !conv.isPersisted) return

            // Set loading state
            set((state) => ({
                conversations: state.conversations.map((c) =>
                    c.id === id ? { ...c, isLoadingMessages: true } : c
                )
            }))

            try {
                const msgsRes = await api.fetchMessages(id)
                if (!msgsRes.ok) {
                    set((state) => ({
                        conversations: state.conversations.map((c) =>
                            c.id === id ? { ...c, isLoadingMessages: false } : c
                        )
                    }))
                    return
                }
                const msgs = await msgsRes.json()

                const mappedMessages: Message[] = msgs.map((m: Record<string, unknown>) => ({
                    id: m.id as string,
                    role: m.role as Message["role"],
                    content: m.content as string,
                    images: Array.isArray(m.imageAttachments) && (m.imageAttachments as Array<Record<string, string>>).length > 0
                        ? (m.imageAttachments as Array<Record<string, string>>).map((img) => ({
                            url: img.url,
                            mimeType: img.mimeType,
                            fileName: img.fileName,
                        }))
                        : undefined,
                    createdAt: new Date(m.createdAt as string).getTime(),
                }))

                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c.id === id ? { ...c, messages: mappedMessages, isLoadingMessages: false } : c
                    )
                }))
            } catch (error) {
                console.error(`Failed to load messages for conversation ${id}:`, error)
                // Reset loading state on error
                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c.id === id ? { ...c, isLoadingMessages: false } : c
                    )
                }))
            }
        },
        setDraftModel: (model) => set({ draftModel: model }),
        clearAllConversations: () => set({ conversations: [], activeConversationId: null }),
    }
})

