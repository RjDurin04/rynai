import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const f = createUploadthing()

export const ourFileRouter = {
    chatImageUploader: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 4,
        },
    })
        .middleware(async () => {
            const session = await auth.api.getSession({ headers: await headers() })
            if (!session) throw new UploadThingError("Unauthorized")
            return { userId: session.user.id }
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return { url: file.ufsUrl, name: file.name, key: file.key }
        }),
    profileImageUploader: f({
        image: {
            maxFileSize: "2MB",
            maxFileCount: 1,
        },
    })
        .middleware(async () => {
            const session = await auth.api.getSession({ headers: await headers() })
            if (!session) throw new UploadThingError("Unauthorized")
            return { userId: session.user.id }
        })
        .onUploadComplete(async ({ file }) => {
            return { url: file.ufsUrl, key: file.key }
        }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
