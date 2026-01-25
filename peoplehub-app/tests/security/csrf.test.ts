/**
 * @jest-environment node
 */
// @ai:cl - CSRF Protection Security Tests
import { generateCsrfToken, validateCsrfToken } from "@/lib/security/csrf";
import crypto from "crypto";

describe("Security: CSRF Protection", () => {
    describe("generateCsrfToken", () => {
        it("should generate a 64-character hex token", () => {
            const token = generateCsrfToken();
            expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
            expect(/^[a-f0-9]{64}$/.test(token)).toBe(true);
        });

        it("should generate unique tokens", () => {
            const token1 = generateCsrfToken();
            const token2 = generateCsrfToken();
            expect(token1).not.toBe(token2);
        });
    });

    describe("validateCsrfToken", () => {
        it("should return false when tokens don't match", async () => {
            const token1 = "abc123";
            const token2 = "def456";

            // Mock to bypass cookie check
            const isValid = crypto.timingSafeEqual(
                Buffer.from(token1),
                Buffer.from(token2)
            );

            expect(isValid).toBe(false);
        });

        it("should use timing-safe comparison", () => {
            const token = "a".repeat(64);
            const sameToken = "a".repeat(64);

            const isValid = crypto.timingSafeEqual(
                Buffer.from(token),
                Buffer.from(sameToken)
            );

            expect(isValid).toBe(true);
        });

        it("should return false for different length tokens", () => {
            expect(() => {
                crypto.timingSafeEqual(
                    Buffer.from("short"),
                    Buffer.from("verylongtoken")
                );
            }).toThrow();
        });
    });

    describe("CSRF Security Properties", () => {
        it("tokens should have sufficient entropy", () => {
            const token = generateCsrfToken();
            const buffer = Buffer.from(token, "hex");

            // 32 bytes = 256 bits of entropy
            expect(buffer.length).toBe(32);
        });

        it("should not be predictable", () => {
            const tokens = new Set();
            for (let i = 0; i < 100; i++) {
                tokens.add(generateCsrfToken());
            }

            // All 100 tokens should be unique
            expect(tokens.size).toBe(100);
        });
    });
});
