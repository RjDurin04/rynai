import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

async function sendEmailJS(templateId: string, templateParams: Record<string, string>) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    service_id: process.env.EMAILJS_SERVICE_ID,
                    template_id: templateId,
                    user_id: process.env.EMAILJS_PUBLIC_KEY,
                    accessToken: process.env.EMAILJS_PRIVATE_KEY,
                    template_params: templateParams,
                }),
            });

            if (response.ok) return;

            const text = await response.text();

            // Don't retry client errors (4xx) — they won't succeed on retry
            if (response.status >= 400 && response.status < 500) {
                throw new Error(`EmailJS error ${response.status}: ${text}`);
            }

            if (attempt === maxAttempts) {
                throw new Error(`EmailJS error ${response.status}: ${text}`);
            }
        } catch (error) {
            if (
                attempt === maxAttempts ||
                (error instanceof Error && error.message.includes("EmailJS error 4"))
            ) {
                throw error;
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET_KEY!,
        },
    },
    user: {
        deleteUser: {
            enabled: true,
            beforeDelete: async (user) => {
                // Delete all UploadThing images attached to user's conversations
                const imageAttachments = await prisma.imageAttachment.findMany({
                    where: {
                        message: {
                            conversation: {
                                userId: user.id,
                            },
                        },
                    },
                    select: { key: true },
                });

                const keys = imageAttachments
                    .map((img) => img.key)
                    .filter((key): key is string => typeof key === "string" && key.length > 0);

                if (keys.length > 0) {
                    const { UTApi } = await import("uploadthing/server");
                    const utapi = new UTApi();
                    try {
                        await utapi.deleteFiles(keys);
                    } catch (error) {
                        console.error("Failed to delete UploadThing images during account deletion:", error instanceof Error ? error.message : "Unknown error");
                    }
                }
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
            await sendEmailJS(process.env.EMAILJS_TEMPLATE_ID_RESET!, {
                email: user.email,
                name: user.name || "User",
                url: url,
            });
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            await sendEmailJS(process.env.EMAILJS_TEMPLATE_ID_VERIFY!, {
                email: user.email,
                name: user.name || "User",
                url: url,
            });
        },
    },
    accountLinking: {
        enabled: true,
    },
});

