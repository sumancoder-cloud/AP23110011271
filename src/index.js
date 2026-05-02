import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectMongo } from './config/database.js';

dotenv.config();

const port = process.env.PORT || 3000;
const app = createApp();

async function bootstrap() {
  await connectMongo();

  app.listen(port, () => {
    process.stdout.write(`Server listening on port ${port}\n`);
  });
}

bootstrap().catch((error) => {
  process.stderr.write(`Failed to start server: ${error.message}\n`);
  process.exit(1);
});
