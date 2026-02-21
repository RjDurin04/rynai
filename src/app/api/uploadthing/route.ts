import { createRouteHandler } from "uploadthing/next"

import { ourFileRouter } from "./core"

export const { GET, POST } = createRouteHandler({
    router: ourFileRouter,
    config: {
        isDev: false, // Prevents noisy debug logs like presigned URLs
        logLevel: "Error", // Explicitly suppress INFO logs in UploadThing 7.x
    }
})
