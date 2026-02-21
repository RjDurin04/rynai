import * as React from "react"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Standardized Ambient Background (The "Login Design") */}
            <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-foreground/[0.03] blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-foreground/[0.03] blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {children}
            </div>
        </div>
    )
}
