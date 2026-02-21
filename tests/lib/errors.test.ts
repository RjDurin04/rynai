import { describe, it, expect } from "vitest"
import { isConnectionError } from "@/lib/errors"

describe("isConnectionError", () => {
    it("returns false for non-Error values", () => {
        expect(isConnectionError("string")).toBe(false)
        expect(isConnectionError(null)).toBe(false)
        expect(isConnectionError(undefined)).toBe(false)
        expect(isConnectionError(42)).toBe(false)
    })

    it("returns true for Connection error message", () => {
        expect(isConnectionError(new Error("Connection error"))).toBe(true)
    })

    it("returns true for ENOTFOUND message", () => {
        expect(isConnectionError(new Error("ENOTFOUND"))).toBe(true)
    })

    it("returns true for ECONNRESET message", () => {
        expect(isConnectionError(new Error("ECONNRESET"))).toBe(true)
    })

    it("returns true for ETIMEDOUT message", () => {
        expect(isConnectionError(new Error("ETIMEDOUT"))).toBe(true)
    })

    it("returns true for cause.code ENOTFOUND", () => {
        const err = new Error("some error")
            ; (err as Error & { cause?: unknown }).cause = { code: "ENOTFOUND" }
        expect(isConnectionError(err)).toBe(true)
    })

    it("returns true for cause.code ECONNRESET", () => {
        const err = new Error("some error")
            ; (err as Error & { cause?: unknown }).cause = { code: "ECONNRESET" }
        expect(isConnectionError(err)).toBe(true)
    })

    it("returns false for generic errors", () => {
        expect(isConnectionError(new Error("Something went wrong"))).toBe(false)
    })
})
