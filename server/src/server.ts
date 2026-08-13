import { createServer } from 'http';
import app from '@/app';
import { env } from '@/config/env';
import { initSocket } from '@/sockets';

const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`✅ Server running on http://localhost:${env.PORT}`);
  console.log(`🌱 Environment: ${env.NODE_ENV}`);
});