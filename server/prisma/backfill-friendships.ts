import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const privateChats = await prisma.chat.findMany({
    where: { type: 'PRIVATE' },
    include: { members: { include: { user: true } } },
  });

  for (const chat of privateChats) {
    const [a, b] = chat.members;
    if (!a || !b) continue;
    if (a.user.isBot || b.user.isBot) continue; // don't create friendships with the bot

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: a.userId, recipientId: b.userId },
          { requesterId: b.userId, recipientId: a.userId },
        ],
      },
    });

    if (existing) {
      if (existing.status !== 'ACCEPTED') {
        await prisma.friendship.update({ where: { id: existing.id }, data: { status: 'ACCEPTED' } });
        console.log(`🔄 Updated existing friendship to ACCEPTED: ${a.user.name} <-> ${b.user.name}`);
      }
      continue;
    }

    await prisma.friendship.create({
      data: { requesterId: a.userId, recipientId: b.userId, status: 'ACCEPTED' },
    });
    console.log(`✅ Backfilled friendship: ${a.user.name} <-> ${b.user.name}`);
  }
}

main().finally(() => prisma.$disconnect());