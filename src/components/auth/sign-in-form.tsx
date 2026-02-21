"use client";
import * as React from "react";
import { useState } from "react";
import { signIn, sendVerificationEmail } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SignInFormProps {
    onSignUpClick?: () => void;
}

export function SignInForm({ onSignUpClick }: SignInFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState("");
    const [showResend, setShowResend] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const router = useRouter();

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError("Email is required");
            return false;
        }
        if (!re.test(email)) {
            setEmailError("Please enter a valid email address");
            return false;
        }
        setEmailError("");
        return true;
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signIn.social({
                provider: "google",
                callbackURL: window.location.origin + "/", // Redirect to home page
            });
        } catch {
            toast.error("Failed to sign in with Google");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(email)) return;
        setIsLoading(true);
        try {
            await signIn.email({
                email,
                password,
                callbackURL: window.location.origin + "/",
            }, {
                onSuccess: () => {
                    // Redirect handled by callbackURL
                },
                onError: (ctx: { error: { message: string, status?: number } }) => {
                    const isUnverified = ctx.error.status === 403 ||
                        ctx.error.message.toLowerCase().includes("verify") ||
                        ctx.error.message.toLowerCase().includes("verified");

                    if (isUnverified) {
                        setEmailError("Email not verified. Please check your inbox.");
                        setShowResend(true);
                    } else {
                        toast.error(ctx.error.message);
                    }
                    setIsLoading(false);
                }
            });
        } catch {
            // error handled in onError
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[380px] mx-auto"
        >
            <div className="bg-[#1f1f1f] rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 relative overflow-hidden group shadow-2xl">
                <div className="space-y-6 sm:space-y-8 relative">
                    <div className="space-y-1.5 text-center mt-2">
                        <motion.h1
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-[24px] sm:text-[28px] font-bold tracking-tight text-white/80 uppercase"
                        >
                            WELCOME BACK
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-[12px] sm:text-[13px] text-white/50 font-normal tracking-wide px-2"
                        >
                            Enter your credentials to access your account
                        </motion.p>
                    </div>

                    <form onSubmit={handleEmailSignIn} className="space-y-4 sm:space-y-5">
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-2 sm:space-y-3"
                            >
                                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 ml-2">
                                    Email address
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white/80">
                                        <Mail size={16} strokeWidth={2} />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        required
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (emailError) setEmailError("");
                                        }}
                                        onBlur={() => validateEmail(email)}
                                        disabled={isLoading || isResending}
                                        className={cn(
                                            "pl-12 h-12 bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10 rounded-full transition-all duration-300 placeholder:text-white/30 text-white/80 text-[15px]",
                                            emailError && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/5",
                                            (isLoading || isResending) && "opacity-50 pointer-events-none"
                                        )}
                                    />
                                </div>
                                <AnimatePresence>
                                    {emailError && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-2 overflow-hidden"
                                        >
                                            <div
                                                className="text-[10px] text-red-500/80 mt-1.5 ml-1 flex items-start gap-1.5 uppercase tracking-wider leading-tight"
                                            >
                                                <div className="h-1 w-1 rounded-full bg-red-500/50 flex-shrink-0 mt-1" />
                                                <span>{emailError}</span>
                                            </div>
                                            {showResend && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex flex-col gap-1"
                                                >
                                                    <p className="text-[10px] text-foreground/40 uppercase tracking-wider ml-1">
                                                        If you haven&apos;t received your confirmation email, click below to resend.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (isResending) return;
                                                            setIsResending(true);
                                                            try {
                                                                await sendVerificationEmail({
                                                                    email,
                                                                    callbackURL: window.location.origin + "/",
                                                                });
                                                                toast.success("Verification email resent!");
                                                                router.push(`/auth/check-email?type=signup&email=${encodeURIComponent(email)}`);
                                                            } catch (error) {
                                                                const message = error instanceof Error ? error.message : "Failed to resend. Please try again later.";
                                                                toast.error(message);
                                                            } finally {
                                                                setIsResending(false);
                                                            }
                                                        }}
                                                        disabled={isResending}
                                                        className={cn(
                                                            "text-[10px] text-foreground font-medium underline uppercase tracking-wider ml-1 hover:text-foreground/80 transition-all duration-300 flex items-center gap-2",
                                                            isResending && "opacity-50 cursor-not-allowed no-underline"
                                                        )}
                                                    >
                                                        {isResending ? (
                                                            <>
                                                                <Loader2 size={10} className="animate-spin" />
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            "Resend Verification Email"
                                                        )}
                                                    </button>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-2 sm:space-y-3 pt-2 sm:pt-0"
                            >
                                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 ml-2">
                                    Password
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white/80">
                                        <Lock size={16} strokeWidth={2} />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (emailError) setEmailError("");
                                        }}
                                        disabled={isLoading || isResending}
                                        className={cn(
                                            "pl-12 h-12 bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10 rounded-full transition-all duration-300 placeholder:text-white/30 text-white/80 text-[15px]",
                                            (isLoading || isResending) && "opacity-50 pointer-events-none"
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end px-2 pt-1">
                                    <Link
                                        href="/forgot-password"
                                        className="text-[11px] font-normal text-white/50 hover:text-white transition-colors"
                                    >
                                        forgot password?
                                    </Link>
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-6 pt-4"
                        >
                            <Button
                                type="submit"
                                disabled={isLoading || isResending}
                                className="w-full h-[52px] bg-[#d9d9d9] text-black hover:bg-white font-medium text-[15px] rounded-full transition-all duration-300 active:scale-[0.98] group flex items-center justify-center gap-2"
                            >
                                {isLoading || isResending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/[0.08]" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-[#1f1f1f] text-white/40 tracking-[0.2em] font-medium px-4">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="w-full h-[52px] bg-white text-black/60 border-transparent hover:bg-[#f0f0f0] hover:text-black/80 font-medium text-[15px] rounded-full transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Icons.google className="h-5 w-5 opacity-40 grayscale" />
                                        Google
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </form>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-center text-[13px] text-white/50 font-normal pt-2"
                    >
                        New here?{" "}
                        <button
                            onClick={onSignUpClick}
                            className="text-white hover:text-white/80 font-medium transition-colors"
                        >
                            Create an account
                        </button>
                    </motion.p>
                </div>
            </div>
        </motion.div>
    );
}
