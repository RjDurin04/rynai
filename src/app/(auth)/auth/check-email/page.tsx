"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, CheckCircle2, RotateCw } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Suspense, useState, useEffect } from "react";
import { sendVerificationEmail } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function CheckEmailContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get("type") || "signup";
    const email = searchParams.get("email") || "";

    const isSignup = type === "signup";
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => setCountdown(c => c - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [countdown]);

    const handleResend = async () => {
        if (!email || countdown > 0) return;

        setResendLoading(true);
        try {
            await sendVerificationEmail({
                email,
                callbackURL: window.location.origin + "/",
            });
            toast.success("Verification email resent!");
            setCountdown(60); // 60s cooldown
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to resend email. Please try again later.";
            toast.error(message);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[420px] mx-auto relative z-10"
        >
            <div className="bg-[#1f1f1f] rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 relative overflow-hidden group shadow-2xl text-center">
                <div className="relative space-y-6 sm:space-y-8">
                    {/* Icon Container */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                        className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-[1.25rem] sm:rounded-3xl flex items-center justify-center text-white/50 relative mb-2"
                    >
                        <Mail size={40} className="sm:w-12 sm:h-12" strokeWidth={1.5} />
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: "spring" }}
                            className="absolute top-[-4px] right-[-4px] sm:top-[-6px] sm:right-[-6px] bg-[#1f1f1f] border-4 border-[#1f1f1f] rounded-full shadow-lg"
                        >
                            <CheckCircle2 size={20} className="sm:w-6 sm:h-6 text-white fill-black" />
                        </motion.div>
                    </motion.div>

                    <div className="space-y-3 sm:space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-[24px] sm:text-[28px] font-bold tracking-tight text-white/80 uppercase"
                        >
                            {isSignup ? "Verify Your Email" : "Reset Link Sent"}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-[12px] sm:text-[13px] text-white/50 font-normal tracking-wide leading-relaxed px-2 sm:px-4"
                        >
                            {isSignup
                                ? "We've sent a verification link to your email address. Please follow the instructions to activate your account."
                                : "If that email is in our system, you will receive a password reset link shortly."
                            }
                        </motion.p>
                    </div>

                    <div className="pt-2 sm:pt-4 space-y-5 sm:space-y-6">
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 sm:p-5 text-[11px] sm:text-[12px] text-white/40 font-normal leading-relaxed">
                            <p>Didn&apos;t receive the email? Check your spam folder or wait a few minutes before trying again.</p>
                            {isSignup && email && (
                                <button
                                    onClick={handleResend}
                                    disabled={resendLoading || countdown > 0}
                                    className={cn(
                                        "mt-3 text-white/80 font-medium hover:text-white flex items-center gap-1.5 mx-auto transition-all duration-300",
                                        (resendLoading || countdown > 0) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {resendLoading ? (
                                        <RotateCw size={12} className="animate-spin" />
                                    ) : countdown > 0 ? (
                                        `Resend in ${countdown}s`
                                    ) : (
                                        "Resend verification email"
                                    )}
                                </button>
                            )}
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Link href="/login" className="block w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-[52px] bg-white/[0.15] border-transparent hover:bg-white/[0.25] text-white/90 font-medium rounded-full transition-all duration-300 group flex items-center justify-center gap-2 text-[14px] sm:text-[15px]"
                                >
                                    <ArrowLeft className="h-4 w-4 opacity-70 group-hover:-translate-x-1 transition-transform" />
                                    Back to Login
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function CheckEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground/20 border-t-foreground" />
            </div>
        }>
            <CheckEmailContent />
        </Suspense>
    );
}
