"use client";

import { SignInForm } from "@/components/auth/sign-in-form";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    return (
        <SignInForm onSignUpClick={() => router.push("/signup")} />
    );
}
