import { describe, it, expect } from "vitest";
import { signupSchema } from "@harbor/shared";

describe("signup validation", () => {
  it("rejects non-.edu emails", () => {
    const r = signupSchema.safeParse({ email: "a@gmail.com", password: "longenoughpass", displayName: "Al" });
    expect(r.success).toBe(false);
  });
  it("accepts .edu emails", () => {
    const r = signupSchema.safeParse({ email: "a@bu.edu", password: "longenoughpass", displayName: "Al" });
    expect(r.success).toBe(true);
  });
});