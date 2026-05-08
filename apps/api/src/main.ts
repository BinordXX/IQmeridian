import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('API configuration loaded');
  console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL);
  console.log('REDIS_URL configured:', !!process.env.REDIS_URL);
  console.log('S3_ENDPOINT configured:', !!process.env.S3_ENDPOINT);
  console.log('AUTH_SECRET configured:', !!process.env.AUTH_SECRET);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();