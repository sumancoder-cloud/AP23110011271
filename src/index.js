import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectMongo } from './config/database.js';

dotenv.config();

const port = process.env.PORT || 3000;
const app = createApp();

async function bootstrap() {
  await connectMongo();

  app.listen(port);
}

bootstrap().catch((error) => {
  process.exit(1);
});
