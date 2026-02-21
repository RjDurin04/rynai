"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";
import { motion, AnimatePresence } from "framer-motion";

interface AuthModalProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultView?: "signin" | "signup";
    trigger?: React.ReactNode;
}

export function AuthModal({ open, onOpenChange, defaultView = "signin", trigger }: AuthModalProps) {
    const [view, setView] = useState<"signin" | "signup">(defaultView);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent
                className="p-0 bg-transparent border-none shadow-none sm:max-w-[440px] overflow-visible"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogTitle className="sr-only">Authentication</DialogTitle>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {view === "signin" ? (
                            <SignInForm onSignUpClick={() => setView("signup")} />
                        ) : (
                            <SignUpForm onSignInClick={() => setView("signin")} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
