import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { serverEnv } from '@iqmeridian/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('API configuration loaded successfully');
  console.log('API_URL:', serverEnv.API_URL);
  console.log('DATABASE_URL configured:', !!serverEnv.DATABASE_URL);
  console.log('REDIS_URL configured:', !!serverEnv.REDIS_URL);
  console.log('S3_ENDPOINT:', serverEnv.S3_ENDPOINT);
  console.log('S3_REGION:', serverEnv.S3_REGION);
  console.log('S3_BUCKET:', serverEnv.S3_BUCKET);
  console.log('S3_ACCESS_KEY configured:', !!serverEnv.S3_ACCESS_KEY);
  console.log('S3_SECRET_KEY configured:', !!serverEnv.S3_SECRET_KEY);
  console.log('AUTH_SECRET configured:', !!serverEnv.AUTH_SECRET);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();