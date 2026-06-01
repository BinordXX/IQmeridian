'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.serverEnv = void 0;
const zod_1 = require('zod');
const serverEnvSchema = zod_1.z.object({
  NODE_ENV: zod_1.z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_URL: zod_1.z.string().url(),
  DATABASE_URL: zod_1.z.string().min(1),
  REDIS_URL: zod_1.z.string().min(1),
  S3_ENDPOINT: zod_1.z.string().min(1),
  S3_REGION: zod_1.z.string().min(1),
  S3_BUCKET: zod_1.z.string().min(1),
  S3_ACCESS_KEY: zod_1.z.string().min(1),
  S3_SECRET_KEY: zod_1.z.string().min(1),
  AUTH_SECRET: zod_1.z.string().min(1),
});
exports.serverEnv = serverEnvSchema.parse(process.env);
//# sourceMappingURL=server.js.map
