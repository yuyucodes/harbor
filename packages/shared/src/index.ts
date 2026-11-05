import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email().toLowerCase().refine((e) => e.endsWith(".edu"), "Use your .edu email"),
  password: z.string().min(10).max(128),
  displayName: z.string().trim().min(2).max(40),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(128),
});