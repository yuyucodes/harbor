import { randomBytes } from "node:crypto";
import { redis } from "./redis";

export const SESSION_COOKIE = "sid";
export const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days, in seconds

export async function createSession(userId: string) {
  const id = randomBytes(32).toString("base64url");
  await redis
    .multi()
    .set(`session:${id}`, userId, "EX", SESSION_TTL)
    .sadd(`user:${userId}:sessions`, id)
    .expire(`user:${userId}:sessions`, SESSION_TTL)
    .exec();
  return id;
}

export const getSessionUser = (id: string) => redis.get(`session:${id}`);

export async function destroySession(id: string) {
  const userId = await redis.get(`session:${id}`);
  await redis.del(`session:${id}`);
  if (userId) await redis.srem(`user:${userId}:sessions`, id);
}

// For later: call this when a user changes their password
export async function destroyAllSessions(userId: string) {
  const ids = await redis.smembers(`user:${userId}:sessions`);
  if (ids.length) await redis.del(...ids.map((i) => `session:${i}`));
  await redis.del(`user:${userId}:sessions`);
}