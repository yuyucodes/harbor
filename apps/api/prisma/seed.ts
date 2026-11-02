import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const categories = ["Electronics", "Collectibles", "Computers", "Audio", "Gaming", "Books", "Clothing", "Home", "Other"];

for (const name of categories) {
  const slug = name.toLowerCase();
  await prisma.category.upsert({ where: { slug }, update: {}, create: { slug, name } });
}
await prisma.$disconnect();