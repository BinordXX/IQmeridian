import { z } from 'zod';
declare const serverEnvSchema: z.ZodObject<
  {
    NODE_ENV: z.ZodDefault<
      z.ZodEnum<{
        development: 'development';
        test: 'test';
        production: 'production';
      }>
    >;
    API_URL: z.ZodString;
    DATABASE_URL: z.ZodString;
    REDIS_URL: z.ZodString;
    S3_ENDPOINT: z.ZodString;
    S3_REGION: z.ZodString;
    S3_BUCKET: z.ZodString;
    S3_ACCESS_KEY: z.ZodString;
    S3_SECRET_KEY: z.ZodString;
    AUTH_SECRET: z.ZodString;
  },
  z.core.$strip
>;
export declare const serverEnv: {
  NODE_ENV: 'development' | 'test' | 'production';
  API_URL: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  S3_ENDPOINT: string;
  S3_REGION: string;
  S3_BUCKET: string;
  S3_ACCESS_KEY: string;
  S3_SECRET_KEY: string;
  AUTH_SECRET: string;
};
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export {};
