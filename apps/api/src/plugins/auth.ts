import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma";
import { getSessionUser, SESSION_COOKIE } from "../lib/session";

declare module "fastify" {
  interface FastifyRequest {
    user?: { id: string; role: string; verified: boolean };
  }
}

export async function requireUser(req: FastifyRequest, reply: FastifyReply) {
  const sid = req.cookies[SESSION_COOKIE];
  const userId = sid ? await getSessionUser(sid) : null;
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, emailVerifiedAt: true },
      })
    : null;
  if (!user) return reply.code(401).send({ error: "Not signed in" });
  req.user = { id: user.id, role: user.role, verified: !!user.emailVerifiedAt };
}

export async function requireVerified(req: FastifyRequest, reply: FastifyReply) {
  await requireUser(req, reply);
  if (reply.sent) return;
  if (!req.user!.verified) return reply.code(403).send({ error: "EMAIL_NOT_VERIFIED" });
}