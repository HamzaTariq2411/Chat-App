import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const botPassword = await bcrypt.hash('bot-account-no-login', 10);

  const bot = await prisma.user.upsert({
    where: { email: 'bot@pennchat.ai' },
    update: {},
    create: {
      name: 'PennBot',
      email: 'bot@pennchat.ai',
      password: botPassword,
      isBot: true,
      isOnline: true,
      avatar: null,
    },
  });

  console.log('✅ Bot user seeded:', bot.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });