import { randomBytes } from "node:crypto";
import { redis } from "./redis";

const TTL = 60 * 60 * 24 * 7;
export async function createSession(userId: string) {
  const id = randomBytes(32).toString("base64url");
  await redis.set(`session:${id}`, userId, "EX", TTL);
  return id;
}
export const getSessionUser = (id: string) => redis.get(`session:${id}`);
export const destroySession = (id: string) => redis.del(`session:${id}`);
export const SESSION_COOKIE = "sid";
export const SESSION_TTL = TTL;