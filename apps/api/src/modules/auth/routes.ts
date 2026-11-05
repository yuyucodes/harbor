import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { signupSchema, loginSchema } from "@harbor/shared";
import { prisma } from "../../lib/prisma";
import { createSession, destroySession, getSessionUser, SESSION_COOKIE, SESSION_TTL } from "../../lib/session";
import { z } from "zod";
import { sendVerificationEmail } from "../../lib/mail";

const DUMMY_HASH = await argon2.hash("timing-placeholder");

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL,
};

export async function authRoutes(app: FastifyInstance) {
  // Same response whether or not the email exists, so signup cannot be used to probe accounts
  app.post("/auth/signup", { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } }, async (req, reply) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: z.flattenError(parsed.error).fieldErrors });
    const { email, password, displayName } = parsed.data;

    const passwordHash = await argon2.hash(password); // always, so timing is the same
    const existing = await prisma.user.findUnique({ where: { email } });

    let userId: string | null = null;
    if (!existing) {
        const user = await prisma.user.create({
        data: { email, displayName, passwordHash, school: email.split("@")[1] },
        });
        userId = user.id;
    } else if (!existing.emailVerifiedAt) {
        await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, displayName } });
        await prisma.emailVerificationToken.deleteMany({ where: { userId: existing.id } });
        userId = existing.id;
    }

    if (userId) {
        const token = randomBytes(32).toString("base64url");
        await prisma.emailVerificationToken.create({
        data: {
            userId,
            tokenHash: createHash("sha256").update(token).digest("hex"),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
        });
        try {
            await sendVerificationEmail(email, token);
        } catch (err) {
            req.log.error({ err }, "verification email failed");
        }
    }
    return reply.code(202).send({ message: "Check your email to verify your account." });
  });

  app.post("/auth/verify-email", { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } }, async (req, reply) => {
    const parsed = z.object({ token: z.string().min(20).max(100) }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Link is invalid or expired" });

    const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
    const row = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
        return reply.code(400).send({ error: "Link is invalid or expired" });
    }
    await prisma.$transaction([
        prisma.emailVerificationToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
        prisma.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
    ]);
    return { ok: true };
  });

  app.post("/auth/login", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    const ok = await argon2.verify(user?.passwordHash ?? DUMMY_HASH, parsed.data.password);
    if (!user || !ok) return reply.code(401).send({ error: "Incorrect email or password" });
    if (!user.emailVerifiedAt) return reply.code(403).send({ error: "Verify your email first" });

    const oldSid = req.cookies[SESSION_COOKIE];
    if (oldSid) await destroySession(oldSid);

    const sid = await createSession(user.id);
    reply.setCookie(SESSION_COOKIE, sid, cookieOpts);
    return { id: user.id, displayName: user.displayName };
  });

  app.post("/auth/logout", async (req, reply) => {
    const sid = req.cookies[SESSION_COOKIE];
    if (sid) await destroySession(sid);
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  });

  app.get("/auth/me", async (req, reply) => {
    const sid = req.cookies[SESSION_COOKIE];
    const userId = sid ? await getSessionUser(sid) : null;
    if (!userId) return reply.code(401).send({ error: "Not signed in" });

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, displayName: true, email: true, emailVerifiedAt: true },
    });
    if (!user) return reply.code(401).send({ error: "Not signed in" });
    return user;
  });
}