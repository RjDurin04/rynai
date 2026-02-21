"use client";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
    const router = useRouter();

    return (
        <SignUpForm onSignInClick={() => router.push("/login")} />
    );
}
