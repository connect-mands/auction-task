import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("demo12345", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: hash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "mia@example.com" },
    update: {},
    create: {
      email: "mia@example.com",
      passwordHash: hash,
      name: "Mia",
      role: "USER",
    },
  });

  const item1 = await prisma.item.create({
    data: {
      title: "Vintage film camera",
      description: "Fully working 35mm body, lens included. Minor brassing on top plate.",
      imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
      startingPrice: 120,
      createdById: admin.id,
    },
  });

  const item2 = await prisma.item.create({
    data: {
      title: "Mechanical keyboard",
      description: "Hot-swap, tactile switches, comes with coiled cable.",
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
      startingPrice: 85,
      createdById: admin.id,
    },
  });

  const now = new Date();
  const hour = 60 * 60 * 1000;

  await prisma.auction.create({
    data: {
      itemId: item1.id,
      status: "LIVE",
      startsAt: new Date(now.getTime() - hour),
      endsAt: new Date(now.getTime() + 2 * hour),
    },
  });

  await prisma.auction.create({
    data: {
      itemId: item2.id,
      status: "SCHEDULED",
      startsAt: new Date(now.getTime() + 3 * hour),
      endsAt: new Date(now.getTime() + 5 * hour),
    },
  });

  await prisma.auction.create({
    data: {
      itemId: item1.id,
      status: "ENDED",
      startsAt: new Date(now.getTime() - 48 * hour),
      endsAt: new Date(now.getTime() - 24 * hour),
    },
  });

  console.log("Seed done.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
