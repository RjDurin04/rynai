"use client";
import { useState, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function ResetPasswordContent() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        const token = searchParams.get("token");
        if (!token) {
            toast.error("Invalid or expired reset link. Please request a new one.");
            return;
        }

        setIsLoading(true);
        try {
            await authClient.resetPassword({
                newPassword: password,
                token,
            });
            toast.success("Password reset successfully!");
            router.push("/login");
        } catch {
            toast.error("Failed to reset password. The link may have expired.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[380px] mx-auto z-10"
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
                            RESET PASSWORD
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-[12px] sm:text-[13px] text-white/50 font-normal tracking-wide px-2"
                        >
                            Enter your new password below
                        </motion.p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2 sm:space-y-3">
                                <Label htmlFor="password" title="New Password" className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 ml-2">
                                    New Password
                                </Label>
                                <div className="relative group/input">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within/input:text-white/80">
                                        <Lock size={16} strokeWidth={2} />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="pl-12 h-12 bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10 rounded-full transition-all duration-300 placeholder:text-white/30 text-white/80 text-[15px]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-0">
                                <Label htmlFor="confirm-password" title="Confirm Password" className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 ml-2">
                                    Confirm Password
                                </Label>
                                <div className="relative group/input">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within/input:text-white/80">
                                        <Lock size={16} strokeWidth={2} />
                                    </div>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="pl-12 h-12 bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10 rounded-full transition-all duration-300 placeholder:text-white/30 text-white/80 text-[15px]"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || !password || !confirmPassword}
                            className="w-full h-[52px] bg-[#d9d9d9] text-black hover:bg-white font-medium text-[15px] rounded-full transition-all duration-300 active:scale-[0.98] group flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Reset Password
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </motion.div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-white/50" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
