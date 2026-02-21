"use client"

import { motion } from "framer-motion"
import { AlertCircle, Square } from "lucide-react"

interface ErrorBannerProps {
    error: string
    /** Whether to wrap in a centered container (for full-width error-only messages) */
    variant?: "standalone" | "inline"
}

export function ErrorBanner({ error, variant = "inline" }: ErrorBannerProps) {
    const content = (
        <motion.div
            initial={variant === "standalone" ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: 10 }}
            animate={variant === "standalone" ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 }}
            className={`${variant === "standalone" ? "w-full max-w-2xl" : ""} ${variant === "inline" ? "mt-4" : ""} px-6 py-5 rounded-3xl bg-destructive/[0.03] border border-destructive/10 shadow-sm shadow-destructive/5`}
        >
            <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-2xl bg-destructive/10 border border-destructive/20 shrink-0">
                    <AlertCircle size={18} className="text-destructive" />
                </div>
                <div className="flex-1 pt-1">
                    <p className="text-[17px] font-bold text-destructive mb-1.5 tracking-tight">Something went wrong</p>
                    <div className="flex items-center gap-2 text-destructive/70 text-[14px] font-medium leading-relaxed">
                        {error.includes("interrupted") ? (
                            <>
                                <span>The request was interrupted</span>
                                <Square size={10} className="fill-destructive/40 text-destructive/40" />
                            </>
                        ) : (
                            <span>{error}</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )

    if (variant === "standalone") {
        return (
            <div className="w-full flex justify-center py-4 mb-4">
                {content}
            </div>
        )
    }

    return content
}
