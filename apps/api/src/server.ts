import "dotenv/config";
import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";

export function buildServer() {
  const app = Fastify({ logger: true, trustProxy: true });
  app.register(helmet);
  app.register(cookie);
  app.get("/health", async () => ({ ok: true }));
  return app;
}

if (process.env.NODE_ENV !== "test") {
  buildServer().listen({ port: Number(process.env.PORT ?? 4000), host: "0.0.0.0" });
}