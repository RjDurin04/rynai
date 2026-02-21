/**
 * Shared error classification utilities.
 */

/**
 * Checks if an error is a network/connection error.
 * Covers common Node.js and browser error codes.
 */
export function isConnectionError(error: unknown): boolean {
    if (!(error instanceof Error)) return false

    return (
        error.message.includes("Connection error") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("ECONNRESET") ||
        error.message.includes("ETIMEDOUT") ||
        (error as Error & { cause?: { code?: string } }).cause?.code === "ENOTFOUND" ||
        (error as Error & { cause?: { code?: string } }).cause?.code === "ECONNRESET"
    )
}
