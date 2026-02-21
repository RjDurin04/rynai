"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Cpu, Zap, BrainCircuit, Code2, Shield, Globe, Bot, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatModel } from "@/types/chat"

export const MODELS = [
    {
        id: "openai/gpt-oss-120b" as const,
        name: "GPT-OSS 120B",
        description: "Massive intelligence for complex reasoning",
        icon: BrainCircuit,
        color: "text-foreground/50",
        capabilities: { text: true, vision: false, search: false },
    },
    {
        id: "llama-3.3-70b-versatile" as const,
        name: "Llama 3.3 70B",
        description: "Most powerful model for complex tasks",
        icon: Cpu,
        color: "text-foreground/50",
        capabilities: { text: true, vision: false, search: false },
    },
    {
        id: "meta-llama/llama-4-scout-17b-16e-instruct" as const,
        name: "Llama 4 Scout",
        description: "Advanced model with image understanding",
        icon: Cpu,
        color: "text-foreground/50",
        capabilities: { text: true, vision: true, search: false },
    },
    {
        id: "groq/compound" as const,
        name: "Compound Pro",
        description: "Large model with deep web search",
        icon: Globe,
        color: "text-foreground/50",
        capabilities: { text: false, vision: false, search: true },
    },
    {
        id: "qwen/qwen3-32b" as const,
        name: "Qwen 3 32B",
        description: "Specialized for coding and mathematics",
        icon: Code2,
        color: "text-foreground/50",
        capabilities: { text: true, vision: false, search: false },
    },
    {
        id: "openai/gpt-oss-20b" as const,
        name: "GPT-OSS 20B",
        description: "Specialized for deep reasoning logic",
        icon: BrainCircuit,
        color: "text-foreground/50",
        capabilities: { text: true, vision: false, search: false },
    },
    {
        id: "llama-3.1-8b-instant" as const,
        name: "Llama 3.1 8B",
        description: "Fastest response time for simple queries",
        icon: Zap,
        color: "text-foreground/50",
        capabilities: { text: true, vision: false, search: false },
    },
    {
        id: "groq/compound-mini" as const,
        name: "Compound Mini",
        description: "Optimized for real-time web search",
        icon: Globe,
        color: "text-foreground/50",
        capabilities: { text: false, vision: false, search: true },
    },
    {
        id: "openai/gpt-oss-safeguard-20b" as const,
        name: "GPT-OSS Safeguard",
        description: "Reasoning model with safety focus",
        icon: Shield,
        color: "text-foreground/50",
        capabilities: { text: true, vision: false, search: false },
    },
    {
        id: "meta-llama/llama-4-maverick-17b-128e-instruct" as const,
        name: "Llama 4 Maverick",
        description: "Next-gen instructor with 128K context",
        icon: Bot,
        color: "text-foreground/50",
        capabilities: { text: true, vision: false, search: false },
    },
    {
        id: "moonshotai/kimi-k2-instruct" as const,
        name: "Kimi K2",
        description: "Instruction master from Moonshot AI",
        icon: Bot,
        color: "text-foreground/50",
        capabilities: { text: true, vision: false, search: false },
    },
    {
        id: "allam-2-7b" as const,
        name: "Allam 2 7B",
        description: "Optimized for Arabic language tasks",
        icon: Bot,
        color: "text-foreground/50",
        capabilities: { text: true, vision: false, search: false },
    },
    {
        id: "canopylabs/orpheus-arabic-saudi" as const,
        name: "Orpheus Arabic",
        description: "Sovereign intelligence for Arabic language",
        icon: Globe,
        color: "text-foreground/50",
        capabilities: { text: true, vision: false, search: false },
    },
    {
        id: "canopylabs/orpheus-v1-english" as const,
        name: "Orpheus English",
        description: "High-precision model for English tasks",
        icon: Globe,
        color: "text-foreground/50",
        capabilities: { text: true, vision: false, search: false },
    },
    {
        id: "moonshotai/kimi-k2-instruct-0905" as const,
        name: "Kimi K2 (Sept)",
        description: "Updated instruction model from Moonshot",
        icon: Bot,
        color: "text-foreground/50",
        capabilities: { text: true, vision: false, search: false },
    },
]

interface ModelSelectorProps {
    currentModel: ChatModel
    onModelSelect: (model: ChatModel) => void
    disabled?: boolean
    hasImages?: boolean
    isWebSearch?: boolean
    onModelButtonClick?: (isOpen: boolean) => void
}

export function ModelSelector({
    currentModel,
    onModelSelect,
    disabled,
    hasImages,
    isWebSearch,
    onModelButtonClick
}: ModelSelectorProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Filter models based on state - Strict Intersection logic
    const filteredModels = React.useMemo(() => {
        return MODELS.filter(m => {
            if (isWebSearch && !m.capabilities.search) return false;
            if (hasImages && !m.capabilities.vision) return false;
            // Only strictly filter for text if nothing else is selected
            if (!isWebSearch && !hasImages && !m.capabilities.text) return false;
            return true;
        });
    }, [hasImages, isWebSearch])

    const selectedModel = filteredModels.find((m) => m.id === currentModel) || filteredModels[0] || null

    const autoRevertModelRef = React.useRef<ChatModel | null>(null)
    const prevConstraintsRef = React.useRef({ hasImages, isWebSearch })

    // Auto-switch logic
    React.useEffect(() => {
        const isValid = filteredModels.some(m => m.id === currentModel)
        const becameUnconstrained = (!hasImages && prevConstraintsRef.current.hasImages) || (!isWebSearch && prevConstraintsRef.current.isWebSearch)

        if (!isValid && filteredModels.length > 0) {
            if (!autoRevertModelRef.current) {
                autoRevertModelRef.current = currentModel
            }
            onModelSelect(filteredModels[0].id)
        } else if (becameUnconstrained && !hasImages && !isWebSearch && autoRevertModelRef.current) {
            if (filteredModels.some(m => m.id === autoRevertModelRef.current)) {
                onModelSelect(autoRevertModelRef.current)
            }
            autoRevertModelRef.current = null
        }

        prevConstraintsRef.current = { hasImages, isWebSearch }
    }, [filteredModels, currentModel, onModelSelect, hasImages, isWebSearch])

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => {
                    if (!disabled) {
                        const newState = !isOpen
                        setIsOpen(newState)
                        onModelButtonClick?.(newState)
                    }
                }}
                disabled={disabled}
                className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-sm transition-all duration-300 group",
                    isOpen
                        ? "bg-white/5 shadow-sm"
                        : "bg-transparent hover:bg-white/5",
                    !selectedModel && "bg-red-500/5",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                {selectedModel ? (
                    <>
                        <selectedModel.icon className={cn("h-3 w-3", selectedModel.color)} strokeWidth={2} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground/80 transition-colors">
                            {selectedModel.name}
                        </span>
                    </>
                ) : (
                    <>
                        <AlertCircle className="h-3 w-3 text-red-400" strokeWidth={2} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400/80">
                            No compatible engine
                        </span>
                    </>
                )}
                <ChevronDown
                    size={10}
                    className={cn(
                        "text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-transform duration-300",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 8, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                        className="absolute bottom-full left-0 mb-3 w-80 bg-popover/80 backdrop-blur-3xl border border-white/10 dark:border-white/5 rounded-3xl overflow-hidden shadow-[0_24px_50px_-12px_rgba(0,0,0,0.3)] z-50 p-2.5 ring-1 ring-black/5 max-h-[85vh] flex flex-col"
                    >
                        <div className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground/30 uppercase tracking-widest mb-1 shrink-0">
                            Available Models
                        </div>
                        <div className="max-h-[256px] overflow-y-auto pr-1 scrollbar-modern space-y-0.5 min-h-0">
                            {filteredModels.length > 0 ? (
                                filteredModels.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => {
                                            autoRevertModelRef.current = null
                                            onModelSelect(model.id)
                                            setIsOpen(false)
                                        }}
                                        className={cn(
                                            "w-full flex items-start gap-3.5 p-2.5 rounded-2xl transition-all duration-400 group/item",
                                            currentModel === model.id
                                                ? "bg-primary/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] border border-primary/20"
                                                : "hover:bg-accent/60 border border-transparent"
                                        )}
                                    >
                                        <div className={cn(
                                            "mt-1 h-9 w-9 rounded-xl flex items-center justify-center bg-background/40 shrink-0 border border-white/5 group-hover/item:border-primary/20 transition-all duration-400 shadow-sm",
                                            currentModel === model.id && "bg-primary/10 border-primary/30"
                                        )}>
                                            <model.icon className={cn("h-4.5 w-4.5", currentModel === model.id ? "text-primary" : "text-muted-foreground/40 group-hover/item:text-muted-foreground/60 transition-colors duration-400")} />
                                        </div>
                                        <div className="flex flex-col items-start min-w-0 flex-1 py-0.5">
                                            <div className="flex items-center gap-2 w-full">
                                                <span className={cn(
                                                    "text-[14px] tracking-tight transition-colors duration-400",
                                                    currentModel === model.id ? "text-foreground font-medium" : "text-muted-foreground/60 font-normal group-hover/item:text-foreground/80"
                                                )}>
                                                    {model.name}
                                                </span>
                                                {currentModel === model.id && (
                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--primary),0.5)] ml-auto" />
                                                )}
                                            </div>
                                            <span className="text-[11px] text-muted-foreground/40 leading-relaxed transition-colors duration-400 group-hover/item:text-muted-foreground/60">
                                                {model.description}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center bg-background/20 rounded-2xl border border-dashed border-white/10 flex flex-col items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <AlertCircle className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[12px] font-medium text-foreground/80">No compatible models</p>
                                        <p className="text-[10px] text-muted-foreground/40 leading-relaxed px-4">
                                            Try disabling {isWebSearch && hasImages ? "Web Search or Image" : isWebSearch ? "Web Search" : "Image"} to see more options.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
