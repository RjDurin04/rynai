"use client"

import * as React from "react"
import { Sidebar } from "@/components/chat/sidebar"
import { AnimatePresence, motion } from "framer-motion"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ChatLayout({ children, loading }: { children: React.ReactNode, loading?: boolean }) {
    const [isCollapsed, setIsCollapsed] = React.useState(true)
    const [isMobileOpen, setIsMobileOpen] = React.useState(false)

    return (
        <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground selection:bg-primary/20">
            {/* Desktop Sidebar */}
            <AnimatePresence>
                {!loading && (
                    <Sidebar
                        isCollapsed={isCollapsed}
                        setIsCollapsed={setIsCollapsed}
                        className="hidden md:flex"
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {!loading && isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-background border-r border-foreground/[0.05] shadow-2xl md:hidden overflow-hidden"
                        >
                            <Sidebar
                                isCollapsed={false}
                                setIsCollapsed={() => setIsMobileOpen(false)}
                                className="w-full flex"
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300">
                {/* Precise noise texture overlay */}
                <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.015] grayscale contrast-125 noise-bg" />

                {/* Ambient glow orbs that track the high-contrast palette */}
                <div className="absolute top-1/4 -right-48 w-[600px] h-[600px] bg-primary/5 blur-[160px] rounded-full z-0 opacity-40 animate-pulse [animation-duration:8s]" />
                <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-primary/5 blur-[160px] rounded-full z-0 opacity-40 animate-pulse [animation-duration:12s]" />

                <div className="relative z-10 flex flex-col h-full bg-background">
                    {/* Floating Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileOpen(true)}
                        className="md:hidden fixed top-4 left-4 z-[40] h-10 w-10 text-foreground/60 transition-all hover:bg-foreground/[0.05] bg-background/50 backdrop-blur-md border border-foreground/[0.05] rounded-xl shadow-lg"
                    >
                        <Menu size={20} />
                    </Button>

                    {children}
                </div>
            </main>
        </div>
    )
}
