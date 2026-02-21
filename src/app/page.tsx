"use client"

import * as React from "react"
import { ChatLayout } from "@/components/chat/chat-layout"
import { ChatInput } from "@/components/chat/chat-input"
import { MarkdownRenderer } from "@/components/chat/markdown-renderer"
import { ErrorBanner } from "@/components/chat/error-banner"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Bot, User as UserIcon, Sparkles, Globe, ExternalLink, AlertCircle, Volume2, Square, Loader2, Copy, RotateCcw, Pencil } from "lucide-react"
import { useChatStore } from "@/lib/store/chat-store"
import { useSendMessage } from "@/hooks/use-send-message"
import { authClient } from "@/lib/auth-client"
import type { ImageAttachment, Message, SearchResult, ChatModel } from "@/types/chat"

export default function ChatPage() {
  const { data: session, isPending: isSessionLoading } = authClient.useSession()
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const activeConversation = useChatStore((s) =>
    s.conversations.find((c) => c.id === s.activeConversationId)
  )
  const setConversationModel = useChatStore((s) => s.setConversationModel)
  const setDraftModel = useChatStore((s) => s.setDraftModel)
  const draftModel = useChatStore((s) => s.draftModel)
  const loadConversations = useChatStore((s) => s.loadConversations)
  const isLoaded = useChatStore((s) => s.isLoaded)
  const conversations = useChatStore((s) => s.conversations)
  const { handleSendMessage, isLoading, abortRef, onConversationChange } = useSendMessage()
  const [speakingId, setSpeakingId] = React.useState<string | null>(null)
  const [isSpeakingLoading, setIsSpeakingLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const messages = activeConversation?.messages ?? []

  // Load conversations from DB on mount
  React.useEffect(() => {
    if (!isLoaded && session) {
      loadConversations()
    }
  }, [isLoaded, loadConversations, session])

  // Track scroll position
  const isAtBottomRef = React.useRef(true)
  const handleScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      // If we are within 150px of the bottom, we consider it "at bottom"
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 150
    }
  }, [])

  // Auto-scroll to bottom
  const prevMessagesLengthRef = React.useRef(0)
  React.useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      // Skip scroll when going from 0 to first messages (they're already at the top)
      if (prevMessagesLengthRef.current === 0) {
        prevMessagesLengthRef.current = messages.length
        return
      }

      // We scroll if:
      // 1. We were already at the bottom (user wants to follow the conversation)
      // 2. A new USER message was added (user just sent something)
      const isNewUserMessage = messages.length > prevMessagesLengthRef.current &&
        messages[messages.length - 1]?.role === "user"

      if (isAtBottomRef.current || isNewUserMessage) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "auto",
          })
        })
      }
      prevMessagesLengthRef.current = messages.length
    } else {
      prevMessagesLengthRef.current = 0
    }
  }, [messages.length, messages[messages.length - 1]?.content])

  // Cancel streaming on conversation switch
  React.useEffect(() => {
    onConversationChange(activeConversationId)

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        setSpeakingId(null)
      }
    }
  }, [activeConversationId, onConversationChange])

  const handleSpeak = async (text: string, messageId: string) => {
    if (speakingId === messageId) {
      audioRef.current?.pause()
      setSpeakingId(null)
      setIsSpeakingLoading(false)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
      setSpeakingId(null)
    }

    try {
      setSpeakingId(messageId)
      setIsSpeakingLoading(true)

      const response = await fetch("/api/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.replace(/[#*`_]/g, "") }), // Strip markdown for cleaner speech
      })

      if (!response.ok) throw new Error("TTS failed")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)

      audio.onended = () => {
        setSpeakingId(null)
        setIsSpeakingLoading(false)
        URL.revokeObjectURL(url)
      }

      audio.onplay = () => setIsSpeakingLoading(false)

      audioRef.current = audio
      await audio.play()
    } catch (error) {
      console.error(error)
      setSpeakingId(null)
      setIsSpeakingLoading(false)
    }
  }


  const showInitialLoading = isSessionLoading || (!isLoaded && session)

  return (
    <ChatLayout loading={!!showInitialLoading}>
      <AnimatePresence>
        {showInitialLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background selection:bg-primary/10"
          >
            {/* Animated Background Mesh */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-foreground/[0.03] blur-[120px] rounded-full animate-pulse opacity-20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-foreground/[0.02] blur-[100px] rounded-full animate-pulse delay-700 opacity-20" />
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-foreground/5 blur-3xl group-hover:bg-foreground/10 transition-all duration-1000 rounded-full" />
                <div className="relative h-20 w-20 items-center justify-center rounded-2xl bg-card border border-foreground/[0.1] shadow-2xl flex backdrop-blur-xl overflow-hidden p-3 transition-transform duration-700 hover:scale-110">
                  <img src="/logo.png" alt="RynAI" className="h-full w-full object-contain invert opacity-80" />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex flex-col items-center gap-2"
              >
                <h1 className="text-2xl font-bold tracking-tighter text-foreground/90">RynAI</h1>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-1 w-1 rounded-full bg-primary animate-bounce" />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto px-4 md:px-8 pt-4 md:pt-8 space-y-6 scrollbar-hover"
      >
        <div className="max-w-4xl mx-auto pb-35">
          {/* Empty state */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center justify-center min-h-[60vh] md:min-h-[40vh] text-center mb-8"
            >
              <div className="h-16 w-16 mb-8 items-center justify-center rounded-2xl bg-foreground/5 border border-foreground/10 shadow-xl shadow-black/5 flex overflow-hidden p-3 transition-transform duration-500 hover:scale-110">
                <img src="/logo.png" alt="RynAI" className="h-full w-full object-contain invert opacity-80" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {session?.user?.name ? `Hello, ${session.user.name.split(' ')[0]}!` : "RynAI"}
              </h2>
              <p className="text-3xl text-muted-foreground/60 max-w-xl font-normal leading-relaxed">
                {session?.user?.name
                  ? "What can I help you with today?"
                  : "How can I help you today?"}
              </p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message, index) => {
              const isLastUser = message.role === "user" &&
                messages.findLastIndex(m => m.role === "user") === index
              const isLastAssistant = message.role === "assistant" &&
                messages.findLastIndex(m => m.role === "assistant") === index

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "group relative mb-5 flex items-start gap-0 md:gap-7 px-0 md:px-4 transition-all duration-500",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  {message.role === "assistant" && message.error && message.content.length === 0 ? (
                    <div className="w-10 h-10 shrink-0 hidden md:block" />
                  ) : (
                    <div className={cn(
                      "relative hidden md:flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl border transition-all duration-500 overflow-hidden",
                      message.role === "user"
                        ? "bg-secondary border-border group-hover:border-primary/20"
                        : "bg-foreground/5 border-foreground/10 shadow-sm p-1.5"
                    )}>
                      {message.role === "user" ? (
                        session?.user?.image ? (
                          <img src={session.user.image} alt={session.user.name || "User"} className="h-full w-full object-cover" />
                        ) : (
                          <UserIcon size={18} className="text-muted-foreground/60" />
                        )
                      ) : (
                        <img src="/logo.png" alt="RynAI" className="h-full w-full object-contain invert opacity-80" />
                      )}

                      {message.role === "assistant" && (
                        <div className={cn(
                          "absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background z-10",
                          message.isStreaming
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-emerald-500"
                        )} />
                      )}
                    </div>
                  )}

                  {/* Content container */}
                  <div className={cn(
                    "flex flex-col flex-1 min-w-0 max-w-full md:max-w-[85%] lg:max-w-[75%]",
                    message.role === "user" ? "items-end" : "items-start"
                  )}>
                    {/* User image attachments (keep above text for user for flow) */}
                    {message.role === "user" && message.images && message.images.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-3 justify-end">
                        {message.images.map((img, i) => (
                          <div key={i} className="relative group/att">
                            <img
                              src={img.url || img.base64 || ""}
                              alt={img.fileName}
                              className="h-28 w-28 object-cover rounded-2xl border border-border group-hover/att:border-primary/30 transition-all duration-300 shadow-lg shadow-black/5"
                            />                 </div>
                        ))}
                      </div>
                    )}

                    <div className={cn(
                      "text-[16px] leading-[1.7] font-normal",
                      message.role === "user"
                        ? "text-right text-foreground bg-card px-5 py-3.5 rounded-2xl rounded-tr-none border border-border shadow-sm shadow-black/5"
                        : "text-left text-foreground/90 px-0.5 overflow-x-hidden w-full"
                    )}>
                      {message.role === "assistant" && message.isStreaming && (
                        <div className="flex items-center gap-1.5 py-1 mb-2">
                          <span className="text-[8px] font-black text-primary/80 uppercase animate-pulse">
                            Generating
                          </span>
                          <div className="flex gap-0.5">
                            <span className="w-0.5 h-0.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-0.5 h-0.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-0.5 h-0.5 bg-primary/60 rounded-full animate-bounce" />
                          </div>
                        </div>
                      )}

                      {message.role === "assistant" ? (
                        <>
                          {/* Unified Error UI (System-only or with content) */}
                          {message.error && message.content.length === 0 && (
                            <ErrorBanner error={message.error} variant="standalone" />
                          )}

                          {message.content.length > 0 ? (
                            <MarkdownRenderer content={message.content} />
                          ) : message.isStreaming && message.content === "" ? (
                            <div className="flex flex-col gap-3 py-2">
                              <div className="h-4 w-[60%] bg-muted/60 rounded-md animate-pulse" />
                              <div className="h-4 w-[40%] bg-muted/40 rounded-md animate-pulse" />
                            </div>
                          ) : null}

                          {message.error && message.content.length > 0 && (
                            <ErrorBanner error={message.error} />
                          )}
                        </>
                      ) : (
                        message.content
                      )}

                      {/* Streaming cursor */}
                      {message.isStreaming && message.content.length > 0 && (
                        <span className="inline-block w-1 h-4 ml-1.5 bg-primary/30 animate-pulse rounded-full align-middle" />
                      )}
                    </div>

                    {/* Footer Row: Label, Thinking indicator, and Action buttons */}
                    {!(message.role === "assistant" && message.error && message.content.length === 0) && (
                      <div className={cn(
                        "flex flex-col mt-2 w-full",
                        message.role === "user" ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "flex items-center gap-3",
                          message.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}>
                          {/* Action buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {message.role === "assistant" && !message.isStreaming && (
                              <>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(message.content);
                                  }}
                                  className="p-1.5 hover:bg-muted rounded-md text-muted-foreground/40 hover:text-foreground transition-all"
                                  title="Copy message"
                                >
                                  <Copy size={14} />
                                </button>
                                {isLastAssistant && (
                                  <button
                                    onClick={() => {
                                      const lastUserIdx = messages.findLastIndex(m => m.role === "user" && messages.indexOf(m) < messages.indexOf(message));
                                      if (lastUserIdx !== -1) {
                                        const lastUserMsg = messages[lastUserIdx];
                                        handleSendMessage(lastUserMsg.content, {
                                          images: lastUserMsg.images,
                                          retryAssistantId: message.id
                                        });
                                      }
                                    }}
                                    className="p-1.5 hover:bg-muted rounded-md text-muted-foreground/40 hover:text-foreground transition-all"
                                    title="Retry"
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleSpeak(message.content, message.id)}
                                  className="p-1.5 hover:bg-muted rounded-md text-muted-foreground/40 hover:text-primary transition-all"
                                  title={speakingId === message.id ? "Stop reading" : "Read aloud"}
                                >
                                  {speakingId === message.id && isSpeakingLoading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : speakingId === message.id ? (
                                    <Square size={14} className="fill-current" />
                                  ) : (
                                    <Volume2 size={14} />
                                  )}
                                </button>
                              </>
                            )}
                            {message.role === "user" && (
                              <>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(message.content);
                                  }}
                                  className="p-1.5 hover:bg-muted rounded-md text-muted-foreground/40 hover:text-foreground transition-all"
                                  title="Copy message"
                                >
                                  <Copy size={14} />
                                </button>
                                {isLastUser && (
                                  <button
                                    onClick={() => {
                                      const inputElement = document.querySelector('textarea') as HTMLTextAreaElement;
                                      if (inputElement) {
                                        const event = new CustomEvent('chatbot:set-input', {
                                          detail: {
                                            value: message.content,
                                            id: message.id,
                                            images: message.images
                                          },
                                          bubbles: true
                                        });
                                        inputElement.dispatchEvent(event);
                                        inputElement.focus();
                                      }
                                    }}
                                    className="p-1.5 hover:bg-muted rounded-md text-muted-foreground/40 hover:text-foreground transition-all"
                                    title="Edit"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Search results */}
                    {message.searchResults && message.searchResults.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-border space-y-4 w-full">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                            <Globe size={11} className="text-primary" />
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">
                            Research Sources
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {message.searchResults.map((result, i) => (
                            <a
                              key={i}
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-muted/40 border border-border hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-300 group/link max-w-sm h-10"
                            >
                              <ExternalLink size={10} className="text-muted-foreground/40 group-hover/link:text-primary shrink-0" />
                              <span className="text-[12px] text-muted-foreground/60 group-hover/link:text-foreground/80 truncate">
                                {result.title || result.url}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error indicator */}
                    {message.role === "assistant" && message.content.startsWith("⚠️") && (
                      <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
                        <AlertCircle size={12} className="text-red-400/60" />
                        <span className="text-[10px] font-bold text-red-400/60 uppercase">
                          System Interruption
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

        </div>
      </div>

      <motion.div
        layout
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "absolute left-0 right-0 z-20 pointer-events-none flex justify-center p-4 pb-10 md:p-8 bottom-0 items-end",
          messages.length === 0 && "md:inset-0 md:items-center md:bg-transparent md:pt-32"
        )}
      >
        {/* Bottom Fade Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-[-1]" />

        <motion.div
          layout
          className="w-full max-w-4xl"
        >
          <div className="pointer-events-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isLoadingMessages={activeConversation?.isLoadingMessages}
              currentModel={activeConversation?.model || draftModel}
              onModelSelect={React.useCallback((model: ChatModel) => {
                setConversationModel(activeConversationId, model)
              }, [activeConversationId, setConversationModel])}
            />
          </div>
        </motion.div>
      </motion.div>
    </ChatLayout >
  )
}
