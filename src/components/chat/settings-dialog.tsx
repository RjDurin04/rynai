/* eslint-disable @next/next/no-img-element */
"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Settings, UserCircle, AlertTriangle, Camera, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authClient, updateUser, deleteUser, signOut } from "@/lib/auth-client"
import { useChatStore } from "@/lib/store/chat-store"
import { useUploadThing } from "@/lib/uploadthing"

interface SettingsDialogProps {
    isOpen: boolean
    onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
    const [activeTab, setActiveTab] = React.useState("profile")
    const { data: session } = authClient.useSession()
    const clearAllConversations = useChatStore((s) => s.clearAllConversations)

    // Profile state
    const [name, setName] = React.useState("")
    const [profileSaving, setProfileSaving] = React.useState(false)
    const [profileMessage, setProfileMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

    // Image upload state
    const [uploadingImage, setUploadingImage] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Delete chat history state
    const [showDeleteChats, setShowDeleteChats] = React.useState(false)
    const [deleteChatsConfirm, setDeleteChatsConfirm] = React.useState("")
    const [deletingChats, setDeletingChats] = React.useState(false)
    const [deletionProgress, setDeletionProgress] = React.useState(0)

    // Delete account state
    const [showDeleteAccount, setShowDeleteAccount] = React.useState(false)
    const [deleteAccountConfirm, setDeleteAccountConfirm] = React.useState("")
    const [deletingAccount, setDeletingAccount] = React.useState(false)

    const { startUpload } = useUploadThing("profileImageUploader")

    // Sync name from session
    React.useEffect(() => {
        if (session?.user?.name) {
            setName(session.user.name)
        }
    }, [session?.user?.name])

    // Reset state when dialog opens
    React.useEffect(() => {
        if (isOpen) {
            setProfileMessage(null)
            setShowDeleteChats(false)
            setShowDeleteAccount(false)
            setDeleteChatsConfirm("")
            setDeleteAccountConfirm("")
        }
    }, [isOpen])

    async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1000): Promise<T> {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await fn()
            } catch (err) {
                if (attempt === retries) throw err
                await new Promise((r) => setTimeout(r, delayMs))
            }
        }
        throw new Error("Unreachable")
    }

    const handleSaveProfile = async () => {
        if (!name.trim()) return
        setProfileSaving(true)
        setProfileMessage(null)
        try {
            await withRetry(() => updateUser({ name: name.trim() }))
            setProfileMessage({ type: "success", text: "Profile updated" })
        } catch {
            setProfileMessage({ type: "error", text: "Failed to update profile. Check your connection." })
        } finally {
            setProfileSaving(false)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingImage(true)
        setProfileMessage(null)
        try {
            const res = await withRetry(() => startUpload([file]))
            if (res?.[0]?.url) {
                await withRetry(() => updateUser({ image: res[0].url }))
                setProfileMessage({ type: "success", text: "Profile image updated" })
            }
        } catch {
            setProfileMessage({ type: "error", text: "Failed to upload image. Check your connection." })
        } finally {
            setUploadingImage(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleDeleteAllChats = async () => {
        setDeletingChats(true)
        setDeletionProgress(0)

        // Simulate progress
        const interval = setInterval(() => {
            setDeletionProgress((prev) => {
                if (prev >= 95) return prev
                return prev + Math.random() * 5
            })
        }, 200)

        try {
            await withRetry(async () => {
                const r = await fetch("/api/account/conversations", { method: "DELETE" })
                if (!r.ok) throw new Error("Failed")
                return r
            })
            setDeletionProgress(100)
            await new Promise((r) => setTimeout(r, 400)) // Let user see 100%
            clearAllConversations()
            setShowDeleteChats(false)
            setDeleteChatsConfirm("")
        } catch {
            setProfileMessage({ type: "error", text: "Failed to delete chat history. Check your connection." })
        } finally {
            clearInterval(interval)
            setDeletingChats(false)
            setDeletionProgress(0)
        }
    }

    const handleDeleteAccount = async () => {
        setDeletingAccount(true)
        try {
            await deleteUser()
            clearAllConversations()
            await signOut({
                fetchOptions: {
                    onSuccess: () => {
                        window.location.href = "/login"
                    }
                }
            })
        } catch {
            setProfileMessage({ type: "error", text: "Failed to delete account" })
            setDeletingAccount(false)
        }
    }

    const tabs = [
        { id: "profile", label: "Profile", icon: UserCircle },
        { id: "general", label: "General", icon: Settings },
    ]

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-[2px] z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] sm:w-full max-w-2xl bg-card border border-foreground/[0.08] rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] z-[101] overflow-hidden flex flex-col sm:flex-row h-[85vh] sm:h-[520px]"
                    >
                        {/* Global Close Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="absolute right-4 top-4 h-8 w-8 rounded-xl hover:bg-foreground/[0.05] text-foreground/20 hover:text-foreground/60 z-[102]"
                        >
                            <X size={18} />
                        </Button>

                        {/* Sidebar */}
                        <div className="w-full sm:w-48 bg-foreground/[0.02] border-b sm:border-b-0 sm:border-r border-foreground/[0.05] p-3 sm:p-6 flex flex-row sm:flex-col gap-1.5 overflow-x-auto shrink-0">
                            <div className="hidden sm:block text-[10px] font-medium text-foreground/40 uppercase tracking-[0.12em] mb-4 px-3">Settings</div>
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center justify-center sm:justify-start gap-2 sm:gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                            ? "bg-foreground/[0.04] text-foreground ring-1 ring-foreground/[0.05]"
                                            : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/[0.02]"
                                            }`}
                                    >
                                        <Icon size={16} strokeWidth={2} />
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-foreground/[0.05] shrink-0">
                                <h3 className="text-[17px] font-semibold tracking-tight capitalize text-foreground/90">{activeTab}</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                                {/* Profile Tab */}
                                {activeTab === "profile" && (
                                    <div className="space-y-6">
                                        {/* Avatar */}
                                        <div className="flex items-center gap-5">
                                            <div className="relative group/avatar">
                                                <div className="h-16 w-16 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.08] flex items-center justify-center overflow-hidden">
                                                    {session?.user?.image ? (
                                                        <img
                                                            src={session.user.image}
                                                            alt={session.user.name || "User"}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <UserCircle className="h-8 w-8 text-foreground/20" />
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploadingImage}
                                                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-2xl cursor-pointer"
                                                >
                                                    {uploadingImage ? (
                                                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                                                    ) : (
                                                        <Camera className="h-5 w-5 text-white" />
                                                    )}
                                                </button>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-medium text-foreground/30 mb-1">Profile Photo</p>
                                                <p className="text-[12px] text-foreground/40">Click the image to upload a new photo</p>
                                            </div>
                                        </div>

                                        {/* Name */}
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-medium text-foreground/40">Name</label>
                                            <input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full p-3 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl text-[13px] text-foreground/80 outline-none focus:border-foreground/[0.1] focus:ring-1 focus:ring-foreground/[0.05] transition-all"
                                                placeholder="Your name"
                                            />
                                        </div>

                                        {/* Email (read-only) */}
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-medium text-foreground/40">Email</label>
                                            <div className="p-3 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl text-[13px] text-foreground/40">
                                                {session?.user?.email || "—"}
                                            </div>
                                        </div>

                                        {/* Profile feedback */}
                                        {profileMessage && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`text-[12px] font-medium ${profileMessage.type === "success" ? "text-emerald-500" : "text-red-400"}`}
                                            >
                                                {profileMessage.text}
                                            </motion.div>
                                        )}

                                        {/* Save button */}
                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={profileSaving || !name.trim() || name.trim() === session?.user?.name}
                                            className="rounded-xl px-6 h-9 bg-foreground text-background font-semibold text-[13px] transition-all hover:bg-foreground/80 active:scale-[0.98] disabled:opacity-30"
                                        >
                                            {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                                        </Button>
                                    </div>
                                )}

                                {/* General Tab (Danger Zone) */}
                                {activeTab === "general" && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-medium text-foreground/40">Language</label>
                                            <div className="p-3 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl text-[13px] text-foreground/60">English (United States)</div>
                                        </div>

                                        {/* Danger Zone */}
                                        <div className="mt-8 pt-6 border-t border-red-500/10">
                                            <div className="flex items-center gap-2 mb-4">
                                                <AlertTriangle size={14} className="text-red-400" />
                                                <span className="text-[12px] font-semibold text-red-400 uppercase tracking-[0.1em]">Danger Zone</span>
                                            </div>

                                            {/* Delete All Chat History */}
                                            <div className="space-y-3 mb-4">
                                                <div className="flex items-center justify-between p-4 border border-red-500/10 rounded-xl bg-red-500/[0.02]">
                                                    <div>
                                                        <p className="text-[13px] font-medium text-foreground/80">Delete all chat history</p>
                                                        <p className="text-[11px] text-foreground/30 mt-0.5">Permanently remove all conversations and attached images</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => setShowDeleteChats(true)}
                                                        className="h-8 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold uppercase tracking-[0.1em] rounded-lg shrink-0"
                                                    >
                                                        Delete All
                                                    </Button>
                                                </div>

                                                {/* Delete chats confirmation */}
                                                <AnimatePresence>
                                                    {showDeleteChats && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="p-4 border border-red-500/20 rounded-xl bg-red-500/[0.03] space-y-3">
                                                                <p className="text-[12px] text-foreground/50">
                                                                    Type <span className="font-bold text-red-400">DELETE</span> to confirm
                                                                </p>
                                                                <input
                                                                    value={deleteChatsConfirm}
                                                                    onChange={(e) => setDeleteChatsConfirm(e.target.value)}
                                                                    placeholder="Type DELETE"
                                                                    className="w-full p-2.5 bg-background border border-red-500/20 rounded-lg text-[13px] text-foreground outline-none focus:border-red-500/40 transition-all"
                                                                />
                                                                <div className="flex gap-2 justify-end">
                                                                    <Button
                                                                        variant="ghost"
                                                                        onClick={() => { setShowDeleteChats(false); setDeleteChatsConfirm("") }}
                                                                        className="h-8 px-3 text-[12px] text-foreground/40 rounded-lg"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        onClick={handleDeleteAllChats}
                                                                        disabled={deleteChatsConfirm !== "DELETE" || deletingChats}
                                                                        className="h-8 px-4 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold uppercase tracking-[0.1em] rounded-lg disabled:opacity-30"
                                                                    >
                                                                        {deletingChats ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm Delete"}
                                                                    </Button>
                                                                </div>

                                                                {/* Progress Bar */}
                                                                {deletingChats && (
                                                                    <div className="mt-2 space-y-1.5">
                                                                        <div className="flex items-center justify-between text-[10px] font-medium text-foreground/40">
                                                                            <span>Deleting Conversations...</span>
                                                                            <span>{Math.round(deletionProgress)}%</span>
                                                                        </div>
                                                                        <div className="h-1 w-full bg-foreground/[0.03] rounded-full overflow-hidden border border-foreground/[0.05]">
                                                                            <motion.div
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${deletionProgress}%` }}
                                                                                className="h-full bg-red-400"
                                                                                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Delete Account */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-4 border border-red-500/10 rounded-xl bg-red-500/[0.02]">
                                                    <div>
                                                        <p className="text-[13px] font-medium text-foreground/80">Delete account</p>
                                                        <p className="text-[11px] text-foreground/30 mt-0.5">Permanently delete your account and all associated data</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => setShowDeleteAccount(true)}
                                                        className="h-8 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold uppercase tracking-[0.1em] rounded-lg shrink-0"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>

                                                {/* Delete account confirmation */}
                                                <AnimatePresence>
                                                    {showDeleteAccount && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="p-4 border border-red-500/20 rounded-xl bg-red-500/[0.03] space-y-3">
                                                                <p className="text-[12px] text-foreground/50">
                                                                    Type <span className="font-bold text-red-400">DELETE MY ACCOUNT</span> to confirm. This action is <span className="font-bold text-red-400">irreversible</span>.
                                                                </p>
                                                                <input
                                                                    value={deleteAccountConfirm}
                                                                    onChange={(e) => setDeleteAccountConfirm(e.target.value)}
                                                                    placeholder="Type DELETE MY ACCOUNT"
                                                                    className="w-full p-2.5 bg-background border border-red-500/20 rounded-lg text-[13px] text-foreground outline-none focus:border-red-500/40 transition-all"
                                                                />
                                                                <div className="flex gap-2 justify-end">
                                                                    <Button
                                                                        variant="ghost"
                                                                        onClick={() => { setShowDeleteAccount(false); setDeleteAccountConfirm("") }}
                                                                        className="h-8 px-3 text-[12px] text-foreground/40 rounded-lg"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        onClick={handleDeleteAccount}
                                                                        disabled={deleteAccountConfirm !== "DELETE MY ACCOUNT" || deletingAccount}
                                                                        className="h-8 px-4 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold uppercase tracking-[0.1em] rounded-lg disabled:opacity-30"
                                                                    >
                                                                        {deletingAccount ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete Account Forever"}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
