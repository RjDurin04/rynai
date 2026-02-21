/* eslint-disable @next/next/no-img-element */
"use client"

import * as React from "react"
import {
    MessageSquarePlus,
    MessageSquare,
    Settings,
    User,
    PanelLeftClose,
    PanelLeftOpen,
    Trash2,
    LogOut,
    LogIn,
    Loader2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/lib/store/chat-store"
import { SettingsDialog } from "./settings-dialog"
import { useSession, signOut } from "@/lib/auth-client"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    isCollapsed: boolean
    setIsCollapsed: (collapsed: boolean) => void
}

export function Sidebar({ className, isCollapsed, setIsCollapsed }: SidebarProps) {
    const conversations = useChatStore((s) => s.conversations)
    const activeConversationId = useChatStore((s) => s.activeConversationId)
    const createConversation = useChatStore((s) => s.createConversation)
    const setActiveConversation = useChatStore((s) => s.setActiveConversation)
    const deleteConversation = useChatStore((s) => s.deleteConversation)
    const updateConversationTitle = useChatStore((s) => s.updateConversationTitle)

    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [editValue, setEditValue] = React.useState("")
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const [conversationToDelete, setConversationToDelete] = React.useState<string | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const { data: session } = useSession()

    const sortedConversations = conversations
        .filter((c) => (c.messageCount || 0) > 0 || c.messages.length > 0)
        .sort((a, b) => b.updatedAt - a.updatedAt)

    const groups = React.useMemo(() => {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        const yesterday = today - 86400000

        return {
            today: sortedConversations.filter(c => c.updatedAt >= today),
            yesterday: sortedConversations.filter(c => c.updatedAt >= yesterday && c.updatedAt < today),
            previous: sortedConversations.filter(c => c.updatedAt < yesterday)
        }
    }, [sortedConversations])

    const handleStartEdit = (id: string, title: string) => {
        setEditingId(id)
        setEditValue(title)
    }

    const handleSaveEdit = (id: string) => {
        if (editValue.trim()) {
            updateConversationTitle(id, editValue.trim())
        }
        setEditingId(null)
    }

    return (
        <motion.div
            initial={{ width: isCollapsed ? 72 : 280 }}
            animate={{ width: isCollapsed ? 72 : 280 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "relative flex flex-col h-full bg-background border-r border-foreground/[0.05] z-20 group selection:bg-primary/10 overflow-hidden",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-10">
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            className="flex items-center gap-3"
                        >
                            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-black/[0.05] to-transparent border border-foreground/[0.1] flex items-center justify-center shadow-sm overflow-hidden p-1.5">
                                <img src="/logo.png" alt="RynAI" className="h-full w-full object-contain invert opacity-80" />
                            </div>
                            <span className="font-bold text-[17px] tracking-[-0.03em] text-foreground/90">RynAI</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-8 w-8 rounded-md hover:bg-foreground/[0.05] text-foreground/20 hover:text-foreground/60 transition-all duration-300 active:scale-95"
                >
                    {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </Button>
            </div>

            {/* Main Action */}
            <div className={cn("px-5 mb-8", isCollapsed && "px-0 flex justify-center")}>
                <Button
                    onClick={() => createConversation()}
                    className={cn(
                        "w-full gap-3 justify-start transition-all duration-300 bg-foreground/[0.03] hover:bg-foreground/[0.06] text-foreground border border-foreground/[0.05] shadow-sm active:scale-[0.98]",
                        isCollapsed ? "h-11 w-11 rounded-lg p-0 flex items-center justify-center shrink-0" : "h-11 rounded-lg px-4"
                    )}
                >
                    <MessageSquarePlus className={cn("shrink-0 h-4 w-4 text-foreground/40", isCollapsed && "block")} />
                    {!isCollapsed && <span className="font-normal text-[13px] tracking-tight">New Chat</span>}
                </Button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-7 scrollbar-hover pb-4">
                {(Object.entries(groups) as [keyof typeof groups, typeof sortedConversations][]).map(([key, items]) => {
                    if (items.length === 0 || isCollapsed) return null;
                    return (
                        <div key={key} className="space-y-1">
                            <div className="px-3 text-[10px] font-normal text-foreground/40 uppercase tracking-[0.12em] mb-3">
                                {key === 'today' ? 'Today' : key === 'yesterday' ? 'Yesterday' : 'Previous'}
                            </div>
                            <div className="space-y-0.5">
                                {items.map((conv) => {
                                    const isActive = conv.id === activeConversationId
                                    const isEditing = editingId === conv.id

                                    return (
                                        <motion.div
                                            key={conv.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="relative group/item"
                                        >
                                            <div className={cn(
                                                "w-full flex items-center gap-3 transition-all duration-200 h-9 px-3 rounded-md cursor-pointer group/nav border border-transparent",
                                                isActive
                                                    ? "bg-foreground/[0.05] text-foreground border-foreground/[0.05] shadow-sm"
                                                    : "text-foreground/40 hover:text-foreground/80 hover:bg-foreground/[0.02]"
                                            )}
                                                onClick={() => !isEditing && setActiveConversation(conv.id)}
                                            >
                                                <MessageSquare
                                                    className={cn(
                                                        "shrink-0 h-3.5 w-3.5 transition-colors",
                                                        isActive ? "text-primary" : "text-foreground/10 group-hover/nav:text-foreground/20"
                                                    )}
                                                />
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    {isEditing ? (
                                                        <input
                                                            autoFocus
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={() => handleSaveEdit(conv.id)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveEdit(conv.id)
                                                                if (e.key === 'Escape') setEditingId(null)
                                                            }}
                                                            className="bg-transparent border-none outline-none text-[13px] w-full p-0 font-medium text-foreground focus:ring-0"
                                                        />
                                                    ) : (
                                                        <span className={cn(
                                                            "truncate text-[13px] flex-1 tracking-tight",
                                                            isActive ? "font-normal" : "font-normal"
                                                        )}>
                                                            {conv.title}
                                                        </span>
                                                    )}

                                                    {/* Background Streaming Indicator */}
                                                    {conv.messages?.some(m => m.isStreaming) && (
                                                        <div className="shrink-0 flex items-center justify-center -translate-y-px mr-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                                                    {!isEditing && (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleStartEdit(conv.id, conv.title)
                                                                }}
                                                                className="p-1 hover:bg-white/10 rounded-md transition-colors"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/20 hover:text-foreground/40"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setConversationToDelete(conv.id)
                                                                }}
                                                                className="p-1 hover:bg-red-500/10 rounded-md transition-colors"
                                                            >
                                                                <Trash2 size={11} className="text-foreground/20 hover:text-red-400" strokeWidth={2} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

                {/* History icons removed when collapsed per user request */}
            </div>

            {/* Footer */}
            <div className="p-3 mt-auto border-t border-foreground/[0.03] bg-foreground/[0.005]">
                <div className={cn(
                    "flex flex-col gap-1 p-1.5 rounded-2xl bg-foreground/[0.05] border border-foreground/[0.03] shadow-sm transition-all duration-500",
                    isCollapsed ? "items-center" : "w-full"
                )}>
                    {/* User Profile Card */}
                    <div className={cn(
                        "flex items-center gap-3 p-1.5 rounded-xl transition-all duration-300",
                        isCollapsed ? "justify-center" : "px-2"
                    )}>
                        <div className="relative group/avatar">
                            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-black/[0.05] to-transparent border border-foreground/[0.08] flex items-center justify-center overflow-hidden shrink-0 shadow-inner transition-transform duration-500 group-hover/avatar:scale-105">
                                {session?.user?.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || "User"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-4 w-4 text-foreground/30" />
                                )}
                            </div>
                            {session && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm"
                                />
                            )}
                        </div>

                        {!isCollapsed && (
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[13px] font-bold text-foreground/90 truncate tracking-tight leading-tight mb-1">
                                    {session?.user?.name || (session ? "User" : "Guest Mode")}
                                </span>
                                <span className="text-[10px] font-medium text-foreground/40 truncate tracking-tight leading-tight">
                                    {session?.user?.email || "Sign in to save chat"}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className={cn(
                        "flex flex-col gap-0.5 mt-1 pt-1 border-t border-foreground/[0.02]",
                        isCollapsed ? "items-center" : "w-full"
                    )}>
                        {session ? (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsSettingsOpen(true)}
                                    className={cn(
                                        "w-full justify-start gap-3 h-8 text-foreground/40 hover:text-foreground/80 hover:bg-foreground/[0.04] transition-all duration-300",
                                        isCollapsed ? "px-0 justify-center w-8 rounded-lg" : "px-2 rounded-lg"
                                    )}
                                >
                                    <Settings className="shrink-0 h-3.5 w-3.5" />
                                    {!isCollapsed && <span className="text-[12px] font-medium">Settings</span>}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={async () => {
                                        await signOut({
                                            fetchOptions: {
                                                onSuccess: () => {
                                                    window.location.href = "/login"
                                                }
                                            }
                                        })
                                    }}
                                    className={cn(
                                        "w-full justify-start gap-3 h-8 text-foreground/40 hover:text-red-500 hover:bg-red-500/[0.04] transition-all duration-300",
                                        isCollapsed ? "px-0 justify-center w-8 rounded-lg" : "px-2 rounded-lg"
                                    )}
                                >
                                    <LogOut className="shrink-0 h-3.5 w-3.5" />
                                    {!isCollapsed && <span className="text-[12px] font-medium">Sign Out</span>}
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="ghost"
                                onClick={() => window.location.href = "/login"}
                                className={cn(
                                    "w-full justify-start gap-3 h-9 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-all duration-300",
                                    isCollapsed ? "px-0 justify-center w-9 rounded-lg" : "px-2 rounded-lg"
                                )}
                            >
                                <LogIn className="shrink-0 h-4 w-4" />
                                {!isCollapsed && (
                                    <div className="flex flex-col items-start leading-none gap-0.5">
                                        <span className="text-[12px] font-bold">Sign In</span>
                                    </div>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* Deletion Confirmation Modal */}
            <AnimatePresence>
                {conversationToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConversationToDelete(null)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-[2px]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-sm bg-card border border-foreground/[0.05] rounded-2xl p-6 shadow-2xl overflow-hidden"
                        >
                            {/* Decorative background flare */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 blur-[100px] rounded-full pointer-events-none" />

                            <div className="flex items-start gap-4 mb-6">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <Trash2 className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[15px] font-semibold text-foreground tracking-tight">Delete conversation?</h3>
                                    <p className="text-[13px] text-foreground/40 leading-relaxed font-medium">
                                        This will permanently remove this chat from your history. This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end items-center">
                                <button
                                    onClick={() => setConversationToDelete(null)}
                                    className="h-9 px-4 text-[13px] font-semibold text-foreground/30 hover:text-foreground/60 transition-colors uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <Button
                                    disabled={isDeleting}
                                    onClick={async () => {
                                        if (conversationToDelete) {
                                            setIsDeleting(true)
                                            try {
                                                await deleteConversation(conversationToDelete)
                                            } finally {
                                                setIsDeleting(false)
                                                setConversationToDelete(null)
                                            }
                                        }
                                    }}
                                    className="h-9 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold uppercase tracking-[0.15em] transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        "Delete Chat"
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
