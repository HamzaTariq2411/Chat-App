import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({ where: { username: null } });

  for (const user of users) {
    let base = user.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let candidate = base;
    let counter = 1;

    while (await prisma.user.findUnique({ where: { username: candidate } })) {
      candidate = `${base}${counter}`;
      counter++;
    }

    await prisma.user.update({ where: { id: user.id }, data: { username: candidate } });
    console.log(`✅ ${user.name} -> @${candidate}`);
  }
}

main().finally(() => prisma.$disconnect());