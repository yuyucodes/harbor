import "dotenv/config";
import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { authRoutes } from "./modules/auth/routes";
import { redis } from "./lib/redis";
import { listingRoutes } from "./modules/listings/routes";

export function buildServer() {
  const app = Fastify({ logger: true, trustProxy: true });
  app.register(rateLimit, { global: false, redis });
  app.register(authRoutes, { prefix: "/api" });
  app.register(listingRoutes, { prefix: "/api" });
  app.register(helmet);
  app.register(cookie);
  app.get("/health", async () => ({ ok: true }));
  return app;
}

if (process.env.NODE_ENV !== "test") {
  buildServer().listen({ port: Number(process.env.PORT ?? 4000), host: "127.0.0.1" });
}