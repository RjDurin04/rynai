"use client";
import * as React from "react";
import { useState } from "react";
import { signUp, sendVerificationEmail } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { checkUnverifiedUser } from "@/app/actions/auth";
import { AnimatePresence } from "framer-motion";

interface SignUpFormProps {
    onSignInClick?: () => void;
}

export function SignUpForm({ onSignInClick }: SignUpFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const [errors, setErrors] = useState<{
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
    }>({});
    const [showResend, setShowResend] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const validateField = (name: string, value: string) => {
        const newErrors = { ...errors };

        switch (name) {
            case "firstName":
                if (!value.trim()) newErrors.firstName = "First name is required";
                else delete newErrors.firstName;
                break;
            case "lastName":
                if (!value.trim()) newErrors.lastName = "Last name is required";
                else delete newErrors.lastName;
                break;
            case "email":
                const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) newErrors.email = "Email is required";
                else if (!emailRe.test(value)) newErrors.email = "Invalid email address";
                else delete newErrors.email;
                break;
            case "password":
                if (value.length < 8) newErrors.password = "Min. 8 characters required";
                else delete newErrors.password;
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateForm = () => {
        const newErrors: typeof errors = {};
        if (!firstName.trim()) newErrors.firstName = "Required";
        if (!lastName.trim()) newErrors.lastName = "Required";
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) newErrors.email = "Required";
        else if (!emailRe.test(email)) newErrors.email = "Invalid";
        if (password.length < 8) newErrors.password = "Min. 8 chars";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            await signUp.email({
                email,
                password,
                name: `${firstName} ${lastName}`,
                callbackURL: window.location.origin + "/",
            }, {
                onSuccess: () => {
                    router.push(`/auth/check-email?type=signup&email=${encodeURIComponent(email)}`);
                },
                onError: (ctx: { error: { code?: string, message: string } }) => {
                    const isDuplicate = ctx.error.code?.includes("USER_ALREADY_EXISTS") ||
                        ctx.error.message.toLowerCase().includes("already exists");

                    if (isDuplicate) {
                        setErrors(prev => ({
                            ...prev,
                            email: "This email is already registered."
                        }));
                        // Check if the user is unverified to show the resend link
                        checkUnverifiedUser(email).then(isUnverified => {
                            if (isUnverified) {
                                setShowResend(true);
                            }
                        });
                    } else {
                        toast.error(ctx.error.message || "Failed to create account. Please try again.");
                    }
                    setIsLoading(false);
                }
            });
        } catch {
            toast.error("Something went wrong. Please try again.");
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
                            CREATE AN ACCOUNT
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-[12px] sm:text-[13px] text-white/50 font-normal tracking-wide px-2"
                        >
                            Get started with RynAI today
                        </motion.p>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-5">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="space-y-2 sm:space-y-3"
                                >
                                    <Label htmlFor="first-name" className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 ml-2">
                                        First name
                                    </Label>
                                    <Input
                                        id="first-name"
                                        placeholder="Max"
                                        required
                                        value={firstName}
                                        onChange={(e) => {
                                            setFirstName(e.target.value);
                                            if (errors.firstName) setErrors(prev => ({ ...prev, firstName: undefined }));
                                        }}
                                        onBlur={() => validateField("firstName", firstName)}
                                        disabled={isLoading || isResending}
                                        className={cn(
                                            "h-12 bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10 rounded-full transition-all duration-300 placeholder:text-white/30 text-white/80 px-4 text-[15px]",
                                            errors.firstName && "border-red-500/50 focus:border-red-500/50",
                                            (isLoading || isResending) && "opacity-50 pointer-events-none"
                                        )}
                                    />
                                    {errors.firstName && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-red-500/80 mt-1 ml-2 uppercase tracking-wider">{errors.firstName}</motion.p>
                                    )}
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="space-y-2 sm:space-y-3"
                                >
                                    <Label htmlFor="last-name" className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 ml-2">
                                        Last name
                                    </Label>
                                    <Input
                                        id="last-name"
                                        placeholder="Robinson"
                                        required
                                        value={lastName}
                                        onChange={(e) => {
                                            setLastName(e.target.value);
                                            if (errors.lastName) setErrors(prev => ({ ...prev, lastName: undefined }));
                                        }}
                                        onBlur={() => validateField("lastName", lastName)}
                                        disabled={isLoading || isResending}
                                        className={cn(
                                            "h-12 bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10 rounded-full transition-all duration-300 placeholder:text-white/30 text-white/80 px-4 text-[15px]",
                                            errors.lastName && "border-red-500/50 focus:border-red-500/50",
                                            (isLoading || isResending) && "opacity-50 pointer-events-none"
                                        )}
                                    />
                                    {errors.lastName && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-red-500/80 mt-1 ml-2 uppercase tracking-wider">{errors.lastName}</motion.p>
                                    )}
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-2 sm:space-y-3 pt-2 sm:pt-0"
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
                                            if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                                        }}
                                        onBlur={() => validateField("email", email)}
                                        disabled={isLoading}
                                        className={cn(
                                            "pl-12 h-12 bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10 rounded-full transition-all duration-300 placeholder:text-white/30 text-white/80 text-[15px]",
                                            errors.email && "border-red-500/50 focus:border-red-500/50",
                                            (isLoading || isResending) && "opacity-50 pointer-events-none"
                                        )}
                                    />
                                </div>
                                <AnimatePresence>
                                    {errors.email && (
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
                                                <span>{errors.email}</span>
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
                                transition={{ delay: 0.5 }}
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
                                            if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                                        }}
                                        onBlur={() => validateField("password", password)}
                                        disabled={isLoading}
                                        className={cn(
                                            "pl-12 h-12 bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10 rounded-full transition-all duration-300 placeholder:text-white/30 text-white/80 text-[15px]",
                                            errors.password && "border-red-500/50 focus:border-red-500/50",
                                            (isLoading || isResending) && "opacity-50 pointer-events-none"
                                        )}
                                    />
                                </div>
                                <AnimatePresence>
                                    {errors.password && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-[10px] text-red-500/80 mt-1.5 ml-1 flex items-start gap-1.5 uppercase tracking-wider overflow-hidden"
                                        >
                                            <div className="h-1 w-1 rounded-full bg-red-500/50 flex-shrink-0 mt-1" />
                                            <span>{errors.password}</span>
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="pt-6"
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
                                        Create Account
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </form>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-center text-[13px] text-white/50 font-normal pt-2"
                    >
                        Already have an account?{" "}
                        <button
                            onClick={onSignInClick}
                            className="text-white hover:text-white/80 font-medium transition-colors"
                        >
                            Sign in
                        </button>
                    </motion.p>
                </div>
            </div>
        </motion.div>
    );
}
