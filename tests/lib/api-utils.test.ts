import { describe, it, expect } from "vitest"
import { ApiError, isApiError } from "@/lib/api-utils"

describe("ApiError", () => {
    it("is an instance of Error", () => {
        const err = new ApiError("Not found", 404)
        expect(err).toBeInstanceOf(Error)
    })

    it("has correct message and statusCode", () => {
        const err = new ApiError("Forbidden", 403)
        expect(err.message).toBe("Forbidden")
        expect(err.statusCode).toBe(403)
    })

    it("has name set to ApiError", () => {
        const err = new ApiError("Unauthorized", 401)
        expect(err.name).toBe("ApiError")
    })
})

describe("isApiError", () => {
    it("returns true for ApiError instances", () => {
        expect(isApiError(new ApiError("test", 400))).toBe(true)
    })

    it("returns false for regular errors", () => {
        expect(isApiError(new Error("test"))).toBe(false)
    })

    it("returns false for non-error values", () => {
        expect(isApiError("string")).toBe(false)
        expect(isApiError(null)).toBe(false)
        expect(isApiError(undefined)).toBe(false)
    })
})
