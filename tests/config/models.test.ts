import { describe, it, expect } from "vitest"
import {
    DEFAULT_MODEL,
    DEFAULT_REASONING_EFFORT,
    DEFAULT_REASONING_FORMAT,
    MODEL_CHAT,
    MODEL_VISION,
    MODEL_SEARCH,
    VISION_MODELS,
    MAX_HISTORY_MESSAGES,
} from "@/config/models"

describe("model constants", () => {
    it("DEFAULT_MODEL is a non-empty string", () => {
        expect(typeof DEFAULT_MODEL).toBe("string")
        expect(DEFAULT_MODEL.length).toBeGreaterThan(0)
    })

    it("DEFAULT_REASONING_EFFORT is a valid effort level", () => {
        expect(["low", "medium", "high"]).toContain(DEFAULT_REASONING_EFFORT)
    })

    it("DEFAULT_REASONING_FORMAT is a valid format", () => {
        expect(["raw", "parsed", "hidden", "step-by-step"]).toContain(DEFAULT_REASONING_FORMAT)
    })

    it("MODEL_CHAT matches DEFAULT_MODEL", () => {
        expect(MODEL_CHAT).toBe(DEFAULT_MODEL)
    })

    it("MODEL_VISION is a non-empty string", () => {
        expect(typeof MODEL_VISION).toBe("string")
        expect(MODEL_VISION.length).toBeGreaterThan(0)
    })

    it("MODEL_SEARCH is a non-empty string", () => {
        expect(typeof MODEL_SEARCH).toBe("string")
        expect(MODEL_SEARCH.length).toBeGreaterThan(0)
    })

    it("VISION_MODELS is a non-empty array that includes MODEL_VISION", () => {
        expect(VISION_MODELS.length).toBeGreaterThan(0)
        expect(VISION_MODELS).toContain(MODEL_VISION)
    })

    it("MAX_HISTORY_MESSAGES is a positive number", () => {
        expect(MAX_HISTORY_MESSAGES).toBeGreaterThan(0)
    })
})
