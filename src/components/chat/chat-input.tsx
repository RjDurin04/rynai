"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ModelSelector, MODELS } from "@/components/chat/model-selector"
import { Send, Plus, Globe, Sparkles, X, Mic, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { ImageAttachment, ChatModel } from "@/types/chat"
import { useSession } from "@/lib/auth-client"

const MAX_IMAGE_SIZE = 4 * 1024 * 1024 // 4MB
const MAX_IMAGES = 4
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]

interface ChatInputProps {
    onSendMessage: (content: string, options: { images?: ImageAttachment[], webSearch?: boolean, editingMessageId?: string }) => void
    isLoading?: boolean
    isLoadingMessages?: boolean
    currentModel: ChatModel
    onModelSelect: (model: ChatModel) => void
}

export function ChatInput({
    onSendMessage,
    isLoading,
    isLoadingMessages,
    currentModel,
    onModelSelect
}: ChatInputProps) {
    const [input, setInput] = React.useState("")
    const [images, setImages] = React.useState<ImageAttachment[]>([])
    const [webSearch, setWebSearch] = React.useState(false)
    const [imageError, setImageError] = React.useState<string | null>(null)
    const [isRecording, setIsRecording] = React.useState(false)
    const [isTranscribing, setIsTranscribing] = React.useState(false)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [mediaRecorderRef, setMediaRecorderRef] = React.useState<MediaRecorder | null>(null)
    const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null)
    const { data: session } = useSession()
    const router = useRouter()

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        }
    }

    // Handle external input setting (e.g. from Edit button)
    React.useEffect(() => {
        const handleExternalInput = (e: Event) => {
            const customEvent = e as CustomEvent<{ value: string, id: string, images?: ImageAttachment[] }>;
            if (customEvent.detail?.value !== undefined) {
                setInput(customEvent.detail.value);
                setEditingMessageId(customEvent.detail.id || null);
                if (customEvent.detail.images) {
                    setImages([...customEvent.detail.images]);
                }

                if (textareaRef.current) {
                    textareaRef.current.style.height = "auto"
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
                }
            }
        };

        const currentArea = textareaRef.current;
        if (currentArea) {
            currentArea.addEventListener('chatbot:set-input', handleExternalInput);
        }
        return () => {
            if (currentArea) {
                currentArea.removeEventListener('chatbot:set-input', handleExternalInput);
            }
        }
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleSend = async () => {
        if (!session) {
            router.push("/login")
            return
        }

        if ((input.trim() || images.length > 0) && !isLoading) {

            // Capture state before resetting
            const currentInput = input
            const currentImages = [...images]
            const currentEditingMessageId = editingMessageId
            const currentWebSearch = webSearch

            // Reset UI immediately for optimistic feeling
            setInput("")
            setImages([])
            setEditingMessageId(null)
            setImageError(null)
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto"
            }

            try {
                // Call onSendMessage with captured state
                onSendMessage(currentInput, {
                    images: currentImages.length > 0 ? currentImages : undefined,
                    webSearch: currentWebSearch,
                    editingMessageId: currentEditingMessageId || undefined
                })
            } catch (err) {
                console.error("Failed to send message:", err instanceof Error ? err.message : "Unknown error")
                setImageError("Failed to start message. Please try again.")
                // Revert UI state on immediate synchronous failure
                setInput(currentInput)
                setImages(currentImages)
                setEditingMessageId(currentEditingMessageId)
            }
        }
    }

    const processFile = (file: File) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setImageError("Unsupported image format. Use PNG, JPEG, WebP, or GIF.")
            return
        }
        if (file.size > MAX_IMAGE_SIZE) {
            setImageError("Image must be under 4MB.")
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            const base64 = reader.result as string
            const attachment: ImageAttachment = {
                base64,
                mimeType: file.type,
                fileName: file.name,
                file: file // Store the file locally for deferred upload
            }
            setImages((prev) => {
                if (prev.length >= MAX_IMAGES) return prev
                return [...prev, attachment]
            })
        }
        reader.readAsDataURL(file)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageError(null)
        const files = Array.from(e.target.files || [])

        const remainingSlots = Math.max(0, MAX_IMAGES - images.length)
        const allowedFiles = files.slice(0, remainingSlots)

        allowedFiles.forEach(processFile)

        if (files.length > remainingSlots) {
            setImageError(`Maximum ${MAX_IMAGES} images per message. Extra images were ignored.`)
        }

        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = Array.from(e.clipboardData.items)
        const imageItems = items.filter(item => item.type.indexOf("image") !== -1)

        if (imageItems.length === 0) return

        setImageError(null)

        const remainingSlots = Math.max(0, MAX_IMAGES - images.length)
        const allowedItems = imageItems.slice(0, remainingSlots)

        allowedItems.forEach((item) => {
            const file = item.getAsFile()
            if (file) processFile(file)
        })

        if (imageItems.length > remainingSlots) {
            setImageError(`Maximum ${MAX_IMAGES} images per message. Extra images were ignored.`)
        }
    }

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index))
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            const chunks: BlobPart[] = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data)
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: "audio/webm" })
                await handleTranscribe(audioBlob)

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setMediaRecorderRef(mediaRecorder)
            setIsRecording(true)
        } catch (error) {
            console.error("Error accessing microphone:", error instanceof Error ? error.message : "Unknown error")
            setImageError("Microphone access denied.")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef && isRecording) {
            mediaRecorderRef.stop()
            setIsRecording(false)
        }
    }

    const handleTranscribe = async (audioBlob: Blob) => {
        setIsTranscribing(true)
        try {
            const formData = new FormData()
            formData.append("file", audioBlob, "recording.webm")

            const response = await fetch("/api/audio/transcription", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()
            if (response.ok && data.text) {
                // ... rest of success logic ...
                setInput((prev) => prev ? `${prev} ${data.text}` : data.text)
                if (textareaRef.current) {
                    setTimeout(() => {
                        if (textareaRef.current) {
                            textareaRef.current.style.height = "auto"
                            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
                        }
                    }, 0)
                }
            } else {
                console.error("Transcription failed:", data.error)
                const errorMsg = data.error || "Transcription failed. Please try again."
                setImageError(errorMsg)
            }
        } catch (error) {
            console.error("Transcription error:", error instanceof Error ? error.message : "Unknown error")
            let errorMessage = "Failed to send audio."
            if (!navigator.onLine || (error instanceof Error && (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")))) {
                errorMessage = "Connection lost. Please check your internet and try again."
            }
            setImageError(errorMessage)
        } finally {
            setIsTranscribing(false)
        }
    }

    if (isLoadingMessages) {
        return (
            <motion.div
                layout
                className="group/input relative flex items-center justify-center min-h-[56px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-lg transition-all duration-300 pointer-events-none"
            >
                <div className="flex items-center gap-3 text-muted-foreground/60">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-[13px] font-medium tracking-tight">Loading conversation...</span>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            layout
            className="group/input relative flex flex-col gap-0 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-lg transition-all duration-300"
        >
            {/* Editing indicator */}
            <AnimatePresence>
                {editingMessageId && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 py-2 flex items-center justify-between bg-white/[0.05] border-b border-foreground/5 rounded-t-[2.5rem]"
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-white/60 animate-pulse" />
                            <span className="text-[10px] font-medium text-foreground/40 uppercase tracking-widest">
                                Editing Message
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                setInput("")
                                setImages([])
                                setEditingMessageId(null)
                                if (textareaRef.current) textareaRef.current.style.height = "auto"
                            }}
                            className="text-[10px] font-medium text-muted-foreground/60 hover:text-foreground uppercase tracking-widest transition-colors"
                        >
                            Cancel
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image previews */}
            <AnimatePresence>
                {images.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 px-6 pt-4 pb-0"
                    >
                        {images.map((img, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative group/img"
                            >
                                <img
                                    src={img.base64 || img.url || ""}
                                    alt={img.fileName}
                                    className="h-20 w-20 object-cover rounded-xl border border-white/10 ring-1 ring-black/20 shadow-sm transition-all duration-300 group-hover/img:ring-primary/30"
                                />
                                <button
                                    onClick={() => removeImage(i)}
                                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500/90 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg"
                                >
                                    <X size={10} className="text-white" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
                {imageError && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                            "px-6 py-2.5 text-[10px] text-red-500/90 font-bold uppercase tracking-[0.15em] bg-red-500/[0.08] border-b border-red-500/10 flex items-center gap-2",
                            !editingMessageId && images.length === 0 && "rounded-t-[2.5rem]"
                        )}
                    >
                        <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                        {imageError}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-2 px-6 py-4">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES.join(",")}
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        if (!session) {
                            router.push("/login")
                            return
                        }
                        fileInputRef.current?.click()
                    }}
                    className="h-8 w-8 shrink-0 rounded-full text-muted-foreground/40 hover:text-foreground hover:bg-transparent transition-all"
                    title="Attach image"
                >
                    <Plus className="h-5 w-5" />
                </Button>

                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="Message RynAI..."
                    className="flex-1 max-h-[300px] py-1.5 px-2 bg-transparent border-0 focus:ring-0 resize-none outline-none text-[15px] placeholder:text-muted-foreground/40 text-foreground scrollbar-none font-medium leading-relaxed"
                    rows={1}
                />

                <div className="flex items-center gap-1 shrink-0">
                    {input.trim() || images.length > 0 ? (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                            <Button
                                onClick={handleSend}
                                disabled={isLoading || (() => {
                                    const filteredModels = MODELS.filter(m => {
                                        if (webSearch && !m.capabilities.search) return false;
                                        if (images.length > 0 && !m.capabilities.vision) return false;
                                        if (!webSearch && images.length === 0 && !m.capabilities.text) return false;
                                        return true;
                                    });
                                    return filteredModels.length === 0;
                                })()}
                                size="icon"
                                className="h-8 w-8 rounded-full bg-white text-black hover:bg-white/90 active:scale-95 transition-all"
                                title={(() => {
                                    const filteredModels = MODELS.filter(m => {
                                        if (webSearch && !m.capabilities.search) return false;
                                        if (images.length > 0 && !m.capabilities.vision) return false;
                                        if (!webSearch && images.length === 0 && !m.capabilities.text) return false;
                                        return true;
                                    });
                                    return filteredModels.length === 0 ? "No compatible model for current mode" : "Send message";
                                })()}
                            >
                                <Send className="h-4 w-4 mr-0.5" />
                            </Button>
                        </motion.div>
                    ) : session ? (
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isTranscribing}
                            type="button"
                            className={`h-8 w-8 inline-flex items-center justify-center rounded-full transition-all ${isRecording
                                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                : "text-muted-foreground/40 hover:text-foreground hover:bg-transparent"
                                }`}
                            title={isRecording ? "Stop recording" : "Record audio"}
                        >
                            {isTranscribing ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                            ) : isRecording ? (
                                <Square className="h-3.5 w-3.5 fill-current animate-pulse" />
                            ) : (
                                <Mic className="h-5 w-5" />
                            )}
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Bottom utility bar */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-transparent border-t border-white/5">
                <div className="flex items-center gap-2">
                    <ModelSelector
                        currentModel={currentModel}
                        onModelSelect={onModelSelect}
                        disabled={isLoading}
                        hasImages={images.length > 0}
                        isWebSearch={webSearch}
                        onModelButtonClick={() => {
                            if (textareaRef.current) {
                                // Close other things if needed
                            }
                        }}
                    />

                    <div className="h-3 w-px bg-white/10 mx-1" />
                    <button
                        onClick={() => setWebSearch(!webSearch)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm cursor-pointer transition-all duration-300 group relative overflow-hidden ${webSearch
                            ? "bg-white/5"
                            : "hover:bg-white/5 bg-transparent"
                            }`}
                    >
                        <Globe className={`h-3 w-3 transition-all duration-300 ${webSearch ? "text-foreground" : "text-muted-foreground/40 group-hover:text-muted-foreground/60"
                            }`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${webSearch ? "text-foreground" : "text-muted-foreground/50 group-hover:text-foreground/80"
                            }`}>
                            Web Context
                        </span>
                    </button>
                </div>

                <div className="flex items-center gap-4 px-2">
                    <div className="text-[10px] font-bold text-muted-foreground/40 hidden sm:block uppercase tracking-widest transition-opacity group-focus-within/input:opacity-0 pointer-events-none">
                        Shift + Enter for new line
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground/40 hidden sm:block uppercase tracking-widest transition-opacity opacity-0 group-focus-within/input:opacity-100 pointer-events-none">
                        Enter to Send
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
