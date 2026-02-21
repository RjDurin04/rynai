"use client";
import { useState } from "react";
import { requestPasswordReset } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState("");
    const router = useRouter();

    const validateEmail = (val: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!val) {
            setEmailError("Email is required");
            return false;
        }
        if (!re.test(val)) {
            setEmailError("Please enter a valid email address");
            return false;
        }
        setEmailError("");
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(email)) return;
        setIsLoading(true);

        try {
            await requestPasswordReset({
                email,
                redirectTo: "/reset-password",
            });
            router.push("/auth/check-email?type=forgot-password");
        } catch {
            toast.error("Failed to send reset link. Please try again.");
        } finally {
            setIsLoading(false);
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
                            FORGOT PASSWORD
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-[12px] sm:text-[13px] text-white/50 font-normal tracking-wide px-2"
                        >
                            Enter your email to receive a password reset link
                        </motion.p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        <div className="space-y-2 sm:space-y-3">
                            <Label htmlFor="email" title="Email" className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 ml-2">
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
                                    disabled={isLoading}
                                    className={cn(
                                        "pl-12 h-12 bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10 rounded-full transition-all duration-300 placeholder:text-white/30 text-white/80 text-[15px]",
                                        emailError && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/5"
                                    )}
                                />
                            </div>
                            {emailError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[10px] text-red-500/80 font-normal mt-1.5 ml-1 flex items-start gap-1.5 uppercase tracking-wider"
                                >
                                    <div className="h-1 w-1 rounded-full bg-red-500/50 flex-shrink-0 mt-1" />
                                    <span>{emailError}</span>
                                </motion.div>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || !email}
                            className="w-full h-[52px] bg-[#d9d9d9] text-black hover:bg-white font-medium text-[15px] rounded-full transition-all duration-300 active:scale-[0.98] group flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Send Reset Link
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="border-t border-white/10 pt-6 text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.15em] group"
                        >
                            <ArrowLeft className="h-3 w-3 opacity-50 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
